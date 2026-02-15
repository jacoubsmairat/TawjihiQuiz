import React, { useState } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { UserRole, StoreItem } from '../../types';

interface Props {
  tab: string;
}

interface DeleteConfirmState {
  isOpen: boolean;
  type: 'subject' | 'semester' | 'unit' | 'lesson' | 'store-item';
  id: string;
  name: string;
}

interface EditModalState {
  isOpen: boolean;
  type: 'subject' | 'semester' | 'unit' | 'lesson';
  mode: 'add' | 'edit';
  id?: string;
  parentId?: string;
  name: string;
}

const SuperAdminView: React.FC<Props> = ({ tab }) => {
  const { 
    subjects, semesters, units, lessons, users, storeItems,
    updateUserRole, addSubject, deleteSubject, renameSubject,
    addSemester, deleteSemester, renameSemester,
    addUnit, deleteUnit, renameUnit,
    addLesson, deleteLesson, renameLesson,
    addStoreItem, updateStoreItem, deleteStoreItem
  } = useDatabase();

  const [activeSubj, setActiveSubj] = useState('');
  const [activeSem, setActiveSem] = useState('');
  const [activeUnit, setActiveUnit] = useState('');
  
  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Store Management State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStoreItem, setEditingStoreItem] = useState<StoreItem | null>(null);
  const [storeFormData, setStoreFormData] = useState<Omit<StoreItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    type: 'theme',
    value: ''
  });

  // Hierarchy Edit Modal State
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    type: 'subject',
    mode: 'add',
    name: ''
  });

  // Confirmation Modal State
  const [confirmDelete, setConfirmDelete] = useState<DeleteConfirmState>({
    isOpen: false,
    type: 'subject',
    id: '',
    name: ''
  });

  const openDeleteModal = (type: DeleteConfirmState['type'], id: string, name: string) => {
    setConfirmDelete({ isOpen: true, type, id, name });
  };

  const handleConfirmDelete = () => {
    const { type, id } = confirmDelete;
    
    switch (type) {
      case 'subject':
        deleteSubject(id);
        if (activeSubj === id) { setActiveSubj(''); setActiveSem(''); setActiveUnit(''); }
        break;
      case 'semester':
        deleteSemester(id);
        if (activeSem === id) { setActiveSem(''); setActiveUnit(''); }
        break;
      case 'unit':
        deleteUnit(id);
        if (activeUnit === id) { setActiveUnit(''); }
        break;
      case 'lesson':
        deleteLesson(id);
        break;
      case 'store-item':
        deleteStoreItem(id);
        break;
    }
    
    setConfirmDelete({ ...confirmDelete, isOpen: false });
  };

  const openEditModal = (type: EditModalState['type'], mode: 'add' | 'edit', id?: string, parentId?: string, name: string = '') => {
    setEditModal({ isOpen: true, type, mode, id, parentId, name });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, mode, id, parentId, name } = editModal;
    if (!name.trim()) return;

    if (mode === 'add') {
      if (type === 'subject') addSubject(name);
      if (type === 'semester' && parentId) addSemester(parentId, name);
      if (type === 'unit' && parentId) addUnit(parentId, name);
      if (type === 'lesson' && parentId) addLesson(parentId, name);
    } else if (id) {
      if (type === 'subject') renameSubject(id, name);
      if (type === 'semester') renameSemester(id, name);
      if (type === 'unit') renameUnit(id, name);
      if (type === 'lesson') renameLesson(id, name);
    }

    setEditModal({ ...editModal, isOpen: false });
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStoreItem) {
      updateStoreItem({ ...storeFormData, id: editingStoreItem.id });
    } else {
      addStoreItem(storeFormData);
    }
    setIsStoreModalOpen(false);
    setEditingStoreItem(null);
    setStoreFormData({ name: '', description: '', price: 0, type: 'theme', value: '' });
  };

  if (tab === 'store-mgmt') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">إدارة المتجر الافتراضي 🏪</h2>
          <button 
            onClick={() => {
              setEditingStoreItem(null);
              setStoreFormData({ name: '', description: '', price: 0, type: 'theme', value: '' });
              setIsStoreModalOpen(true);
            }}
            className="bg-primary text-white px-6 py-2 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            + إضافة عنصر جديد
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-gray-600 text-sm font-bold">العنصر</th>
                <th className="p-4 text-gray-600 text-sm font-bold">النوع</th>
                <th className="p-4 text-gray-600 text-sm font-bold">السعر (TQC)</th>
                <th className="p-4 text-gray-600 text-sm font-bold">القيمة/المعرف</th>
                <th className="p-4 text-gray-600 text-sm font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {storeItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold truncate max-w-[200px]">{item.description}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase">
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 font-black text-orange-500">{item.price}</td>
                  <td className="p-4 font-mono text-xs">{item.value}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingStoreItem(item);
                          setStoreFormData({
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            type: item.type,
                            value: item.value
                          });
                          setIsStoreModalOpen(true);
                        }}
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                      >✏️</button>
                      <button 
                        onClick={() => openDeleteModal('store-item', item.id, item.name)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isStoreModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-gray-800 mb-6">{editingStoreItem ? 'تعديل عنصر' : 'إضافة عنصر للمتجر'}</h3>
              <form onSubmit={handleStoreSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2">اسم العنصر (مع إيموجي)</label>
                  <input 
                    type="text" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                    value={storeFormData.name}
                    onChange={e => setStoreFormData({...storeFormData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2">الوصف</label>
                  <textarea 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold h-20"
                    value={storeFormData.description}
                    onChange={e => setStoreFormData({...storeFormData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2">السعر (عملات)</label>
                    <input 
                      type="number" required min="0"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                      value={storeFormData.price}
                      onChange={e => setStoreFormData({...storeFormData, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2">النوع</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                      value={storeFormData.type}
                      onChange={e => setStoreFormData({...storeFormData, type: e.target.value as any})}
                    >
                      <option value="theme">مظهر (Theme)</option>
                      <option value="hint">تلميح (Hint)</option>
                      <option value="badge">شارة (Badge)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2">القيمة (مثلاً: dark, nature, 5, super_student)</label>
                  <input 
                    type="text" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                    value={storeFormData.value}
                    onChange={e => setStoreFormData({...storeFormData, value: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-primary text-white font-black py-4 rounded-2xl hover:bg-opacity-90 shadow-xl shadow-primary/20">حفظ</button>
                  <button type="button" onClick={() => setIsStoreModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tab === 'users') {
    const filteredUsers = users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                           u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    const stats = {
      total: users.length,
      students: users.filter(u => u.role === UserRole.STUDENT).length,
      admins: users.filter(u => u.role === UserRole.ADMIN).length,
      superAdmins: users.filter(u => u.role === UserRole.SUPER_ADMIN).length,
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm mb-1 font-bold">إجمالي المستخدمين</p>
            <p className="text-2xl font-black text-primary">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm mb-1 font-bold">الطلاب</p>
            <p className="text-2xl font-black text-gray-700">{stats.students}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm mb-1 font-bold">المشرفين</p>
            <p className="text-2xl font-black text-blue-600">{stats.admins}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm mb-1 font-bold">المدراء</p>
            <p className="text-2xl font-black text-purple-600">{stats.superAdmins}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b space-y-4">
            <h2 className="text-xl font-bold">إدارة المستخدمين والأدوار</h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                <input 
                  type="text"
                  placeholder="ابحث باسم المستخدم أو البريد الإلكتروني..."
                  className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {['all', UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      roleFilter === role 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {role === 'all' ? 'الكل' : role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-gray-600 text-sm font-bold">المستخدم</th>
                  <th className="p-4 text-gray-600 text-sm font-bold">البريد الإلكتروني</th>
                  <th className="p-4 text-gray-600 text-sm font-bold">الدور الحالي</th>
                  <th className="p-4 text-gray-600 text-sm font-bold">تغيير الصلاحيات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm font-bold">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide ${
                        u.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' :
                        u.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={u.role}
                        onChange={(e) => {
                          if (confirm(`هل أنت متأكد من تغيير دور المستخدم ${u.username} إلى ${e.target.value}؟`)) {
                            updateUserRole(u.id, e.target.value as UserRole);
                          }
                        }}
                        className="p-2 border border-gray-200 rounded-lg text-[10px] bg-white focus:ring-2 focus:ring-primary outline-none cursor-pointer font-bold"
                      >
                        <option value={UserRole.STUDENT}>طالب (Student)</option>
                        <option value={UserRole.ADMIN}>مشرف (Admin)</option>
                        <option value={UserRole.SUPER_ADMIN}>مدير نظام (Super Admin)</option>
                      </select>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400">
                      <div className="text-3xl mb-2">👤</div>
                      <p className="font-bold">لم يتم العثور على مستخدمين يطابقون بحثك</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const filteredSemesters = semesters.filter(s => s.subjectId === activeSubj);
  const filteredUnits = units.filter(u => u.semesterId === activeSem);
  const filteredLessons = lessons.filter(l => l.unitId === activeUnit);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6">إدارة هيكلية المواد التعليمية</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Subjects */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/30">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-700">المواد</h3>
              <button 
                onClick={() => openEditModal('subject', 'add')} 
                className="text-[10px] bg-primary text-white px-2 py-1 rounded-md shadow-sm"
              >+ إضافة</button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[400px]">
              {subjects.map(s => (
                <div key={s.id} className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition-all ${activeSubj === s.id ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-white border border-transparent hover:border-gray-200 group'}`}>
                  <span onClick={() => { setActiveSubj(s.id); setActiveSem(''); setActiveUnit(''); }} className="flex-1 font-semibold truncate text-xs">{s.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => openEditModal('subject', 'edit', s.id, undefined, s.name)} className="p-1 hover:bg-gray-100 rounded">✏️</button>
                    <button onClick={() => openDeleteModal('subject', s.id, s.name)} className="p-1 hover:bg-red-50 rounded">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semesters */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/30">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-700">الفصول</h3>
              <button 
                disabled={!activeSubj}
                onClick={() => openEditModal('semester', 'add', undefined, activeSubj)} 
                className="text-[10px] bg-primary text-white px-2 py-1 rounded-md shadow-sm disabled:bg-gray-300"
              >+ إضافة</button>
            </div>
            <div className="space-y-2">
              {filteredSemesters.map(s => (
                <div key={s.id} className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition-all ${activeSem === s.id ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-white border border-transparent hover:border-gray-200 group'}`}>
                  <span onClick={() => { setActiveSem(s.id); setActiveUnit(''); }} className="flex-1 font-semibold truncate text-xs">{s.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => openEditModal('semester', 'edit', s.id, undefined, s.name)} className="p-1 hover:bg-gray-100 rounded">✏️</button>
                    <button onClick={() => openDeleteModal('semester', s.id, s.name)} className="p-1 hover:bg-red-50 rounded">🗑️</button>
                  </div>
                </div>
              ))}
              {!activeSubj && <p className="text-[10px] text-gray-400 text-center py-4">اختر مادة أولاً</p>}
            </div>
          </div>

          {/* Units */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/30">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-700">الوحدات</h3>
              <button 
                disabled={!activeSem}
                onClick={() => openEditModal('unit', 'add', undefined, activeSem)} 
                className="text-[10px] bg-primary text-white px-2 py-1 rounded-md shadow-sm disabled:bg-gray-300"
              >+ إضافة</button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[400px]">
              {filteredUnits.map(u => (
                <div key={u.id} className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition-all ${activeUnit === u.id ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-white border border-transparent hover:border-gray-200 group'}`}>
                  <span onClick={() => setActiveUnit(u.id)} className="flex-1 font-semibold truncate text-xs">{u.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => openEditModal('unit', 'edit', u.id, undefined, u.name)} className="p-1 hover:bg-gray-100 rounded">✏️</button>
                    <button onClick={() => openDeleteModal('unit', u.id, u.name)} className="p-1 hover:bg-red-50 rounded">🗑️</button>
                  </div>
                </div>
              ))}
              {!activeSem && <p className="text-[10px] text-gray-400 text-center py-4">اختر فصلاً أولاً</p>}
            </div>
          </div>

          {/* Lessons */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/30">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-700">الدروس</h3>
              <button 
                disabled={!activeUnit}
                onClick={() => openEditModal('lesson', 'add', undefined, activeUnit)} 
                className="text-[10px] bg-primary text-white px-2 py-1 rounded-md shadow-sm disabled:bg-gray-300"
              >+ إضافة</button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[400px]">
              {filteredLessons.map(l => (
                <div key={l.id} className="p-2 bg-white border border-transparent hover:border-gray-200 rounded-lg flex justify-between items-center transition-all group">
                  <span className="flex-1 font-medium truncate text-[11px]">{l.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => openEditModal('lesson', 'edit', l.id, undefined, l.name)} className="p-1 hover:bg-gray-100 rounded text-[10px]">✏️</button>
                    <button onClick={() => openDeleteModal('lesson', l.id, l.name)} className="p-1 hover:bg-red-50 rounded text-[10px]">🗑️</button>
                  </div>
                </div>
              ))}
              {!activeUnit && <p className="text-[10px] text-gray-400 text-center py-4">اختر وحدة أولاً</p>}
            </div>
          </div>
        </div>

        {/* Hierarchy Edit Modal */}
        {editModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-gray-800 mb-6">
                {editModal.mode === 'add' ? 'إضافة' : 'تعديل'} {
                  editModal.type === 'subject' ? 'مادة' :
                  editModal.type === 'semester' ? 'فصل دراسي' :
                  editModal.type === 'unit' ? 'وحدة' : 'درس'
                }
              </h3>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wide">الاسم</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                    value={editModal.name}
                    onChange={e => setEditModal({ ...editModal, name: e.target.value })}
                    placeholder="اكتب الاسم هنا..."
                  />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 bg-primary text-white font-black py-4 rounded-2xl hover:bg-opacity-90 shadow-xl shadow-primary/20">حفظ</button>
                  <button type="button" onClick={() => setEditModal({ ...editModal, isOpen: false })} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmDelete.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
              <h3 className="text-2xl font-black text-gray-800 mb-4">تأكيد الحذف النهائي</h3>
              <p className="text-gray-500 font-bold mb-8 leading-relaxed">
                أنت على وشك حذف <span className="text-red-600 font-black">"{confirmDelete.name}"</span>. 
                {confirmDelete.type === 'subject' && ' سيتم حذف كافة الفصول والوحدات والدروس والأسئلة المرتبطة بهذه المادة نهائياً!'}
                {confirmDelete.type === 'semester' && ' سيتم حذف كافة الوحدات والدروس والأسئلة المرتبطة بهذا الفصل.'}
                {confirmDelete.type === 'unit' && ' سيتم حذف كافة الدروس والأسئلة المرتبطة بهذه الوحدة.'}
                {confirmDelete.type === 'lesson' && ' سيتم حذف كافة الأسئلة المرتبطة بهذا الدرس.'}
                {confirmDelete.type === 'store-item' && ' سيتم حذف هذا العنصر من المتجر نهائياً.'}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-500 text-white font-black py-4 rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                >نعم، احذف</button>
                <button 
                  onClick={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                  className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all"
                >إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-700 font-bold">
        💡 تنبيه: حذف أي قسم سيؤدي إلى مسح كافة البيانات المتفرعة عنه بشكل نهائي لضمان نظافة قاعدة البيانات.
      </div>
    </div>
  );
};

export default SuperAdminView;
