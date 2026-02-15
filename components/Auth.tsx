
import React, { useState } from 'react';
import { useDatabase } from '../store/DatabaseContext';
import { UserRole } from '../types';
import { apiClient } from '../api';

interface Props {
  mode: 'login' | 'register';
  onToggleMode: () => void;
  onSuccess: (user: any) => void;
  onBack: () => void;
}

const Auth: React.FC<Props> = ({ mode, onToggleMode, onSuccess, onBack }) => {
  const { addUser } = useDatabase();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('كلمات المرور غير متطابقة');
          return;
        }
        await addUser({
          username: formData.username,
          email: formData.email,
          passwordHash: formData.password
        });
        setError('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.');
        onToggleMode();
      } else {
        const user = await apiClient.login({
          username: formData.username,
          password: formData.password
        });
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء العملية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
          <span>&larr;</span> العودة للرئيسية
        </button>
        
        <h2 className="text-3xl font-bold text-center mb-8">
          {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </h2>

        {error && (
          <div className={`p-3 rounded-lg text-sm mb-4 text-center ${error.includes('بنجاح') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم أو البريد</label>
            <input 
              type="text" 
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
              <input 
                type="password" 
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all mt-4 flex items-center justify-center ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'جاري التحميل...' : (mode === 'login' ? 'دخول' : 'تسجيل')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={onToggleMode}
            className="text-primary font-semibold hover:underline"
          >
            {mode === 'login' ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
