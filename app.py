
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import json

app = Flask(__name__)
CORS(app)

DB_PATH = os.environ.get('DATABASE_URL', 'tawjihi_quiz.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Users
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, email TEXT, password_hash TEXT, role TEXT, xp INTEGER DEFAULT 0, coins INTEGER DEFAULT 50, streak INTEGER DEFAULT 0, hints_count INTEGER DEFAULT 3, selected_theme TEXT DEFAULT 'default', inventory TEXT DEFAULT '["theme_default"]', last_active TEXT)''')
    # Subjects Hierarchy
    cursor.execute('CREATE TABLE IF NOT EXISTS subjects (id TEXT PRIMARY KEY, name TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS semesters (id TEXT PRIMARY KEY, subject_id TEXT, name TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, semester_id TEXT, name TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS lessons (id TEXT PRIMARY KEY, unit_id TEXT, name TEXT)')
    # Questions
    cursor.execute('CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, lesson_id TEXT, text TEXT, options TEXT, correct_answer INTEGER, difficulty TEXT)')
    # Results
    cursor.execute('CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, user_id TEXT, subject_name TEXT, unit_name TEXT, score INTEGER, total_points INTEGER, percentage REAL, date TEXT, difficulty TEXT, earned_xp INTEGER)')
    # Store & Global Settings
    cursor.execute('CREATE TABLE IF NOT EXISTS store_items (id TEXT PRIMARY KEY, name TEXT, description TEXT, price INTEGER, type TEXT, value TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)')
    
    # Insert default settings if not exists
    cursor.execute('INSERT OR IGNORE INTO settings (key, value) VALUES ("announcement", "أهلاً بكم في منصة توجيحي كويز!")')
    
    conn.commit()
    conn.close()

# --- Auth Endpoints ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
                     (data['id'], data['username'], data['email'], data['passwordHash'], data['role']))
        conn.commit()
        return jsonify({"status": "success"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    finally: conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE (username = ? OR email = ?) AND password_hash = ?',
                        (data['username'], data['username'], data['password'])).fetchone()
    conn.close()
    if user: return jsonify(dict(user)), 200
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

# --- Global Data Endpoints ---
@app.route('/api/data', methods=['GET'])
def get_all_data():
    conn = get_db_connection()
    data = {
        "subjects": [dict(r) for r in conn.execute('SELECT * FROM subjects').fetchall()],
        "semesters": [dict(r) for r in conn.execute('SELECT * FROM semesters').fetchall()],
        "units": [dict(r) for r in conn.execute('SELECT * FROM units').fetchall()],
        "lessons": [dict(r) for r in conn.execute('SELECT * FROM lessons').fetchall()],
        "questions": [],
        "store_items": [dict(r) for r in conn.execute('SELECT * FROM store_items').fetchall()],
        "announcement": conn.execute('SELECT value FROM settings WHERE key="announcement"').fetchone()['value']
    }
    # Parse questions options from JSON string
    qs = conn.execute('SELECT * FROM questions').fetchall()
    for q in qs:
        qd = dict(q)
        qd['options'] = json.loads(qd['options'])
        data['questions'].append(qd)
    
    conn.close()
    return jsonify(data)

# --- Admin Operations (Syncing Hierarchy) ---
@app.route('/api/admin/sync', methods=['POST'])
def sync_data():
    data = request.json # Contains the whole state
    conn = get_db_connection()
    # This is a simple way to sync: Clear and re-insert (for small/medium datasets)
    conn.execute('DELETE FROM subjects')
    conn.execute('DELETE FROM semesters')
    conn.execute('DELETE FROM units')
    conn.execute('DELETE FROM lessons')
    conn.execute('DELETE FROM questions')
    conn.execute('DELETE FROM store_items')
    
    for s in data['subjects']: conn.execute('INSERT INTO subjects VALUES (?, ?)', (s['id'], s['name']))
    for sem in data['semesters']: conn.execute('INSERT INTO semesters VALUES (?, ?, ?)', (sem['id'], sem['subjectId'], sem['name']))
    for u in data['units']: conn.execute('INSERT INTO units VALUES (?, ?, ?)', (u['id'], u['semesterId'], u['name']))
    for l in data['lessons']: conn.execute('INSERT INTO lessons VALUES (?, ?, ?)', (l['id'], l['unitId'], l['name']))
    for q in data['questions']: conn.execute('INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?)', (q['id'], q['lessonId'], q['text'], json.dumps(q['options']), q['correctAnswer'], q['difficulty']))
    for si in data['store_items']: conn.execute('INSERT INTO store_items VALUES (?, ?, ?, ?, ?, ?)', (si['id'], si['name'], si['description'], si['price'], si['type'], si['value']))
    
    conn.execute('UPDATE settings SET value = ? WHERE key = "announcement"', (data['announcement'],))
    
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/user/<user_id>/sync', methods=['POST'])
def sync_user(user_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE users SET xp=?, coins=?, streak=?, hints_count=?, selected_theme=?, inventory=?, last_active=? WHERE id=?',
                 (data['xp'], data['coins'], data['streak'], data['hintsCount'], data['selectedTheme'], json.dumps(data['inventory']), data['lastActive'], user_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/results/<user_id>', methods=['GET', 'POST'])
def manage_results(user_id):
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        conn.execute('INSERT INTO results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                     (data['id'], user_id, data['subjectName'], data['unitName'], data['score'], data['totalPoints'], data['percentage'], data['date'], data['difficulty'], data['earnedXp']))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    res = conn.execute('SELECT * FROM results WHERE user_id = ?', (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in res])

init_db()
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
