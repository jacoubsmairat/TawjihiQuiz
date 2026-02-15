
import React, { useState } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { StoreItem, User } from '../../types';

const VirtualStore: React.FC<{ user: User }> = ({ user }) => {
  const { convertXpToCoins, buyItem, users, storeItems, updateUserTheme } = useDatabase();
  const [isConverting, setIsConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'theme' | 'hint' | 'badge'>('all');
  const [purchaseStatus, setPurchaseStatus] = useState<{id: string, msg: string, type: 'success' | 'error'} | null>(null);
  
  const currentUser = users.find(u => u.id === user.id) || user;

  // إضافة المظهر الافتراضي للقائمة ليتمكن المستخدم من العودة إليه
  const defaultTheme: StoreItem = {
    id: 'theme_default',
    name: 'المظهر الافتراضي 💠',
    description: 'الألوان الأصلية للمنصة، بسيطة ومريحة.',
    price: 0,
    type: 'theme',
    value: 'default'
  };

  const allItems = [defaultTheme, ...storeItems];
  const filteredItems = allItems.filter(item => activeTab === 'all' || item.type === activeTab);

  const handleConvert = () => {
    if (currentUser.xp < 100) {
      showStatus('conv', 'نقص في نقاط الخبرة (تحتاج 100 XP)', 'error');
      return;
    }
    setIsConverting(true);
    setTimeout(() => {
      convertXpToCoins(currentUser.id, 100);
      setIsConverting(false);
      showStatus('conv', 'تم تحويل 100 XP بنجاح! 🎉', 'success');
    }, 1000);
  };

  const showStatus = (id: string, msg: string, type: 'success' | 'error') => {
    setPurchaseStatus({ id, msg, type });
    setTimeout(() => setPurchaseStatus(null), 3000);
  };

  const handlePurchase = (item: StoreItem) => {
    const isOwned = currentUser.inventory.includes(item.id) || item.id === 'theme_default';
    
    if (isOwned) {
      if (item.type === 'theme') {
        if (currentUser.selectedTheme === item.value) {
          showStatus(item.id, 'هذا المظهر مفعّل بالفعل!', 'success');
          return;
        }
        updateUserTheme(currentUser.id, item.value);
        showStatus(item.id, 'تم تبديل المظهر بنجاح! ✨', 'success');
      } else {
        showStatus(item.id, 'تمتلك هذا العنصر بالفعل!', 'error');
      }
      return;
    }
    
    const success = buyItem(currentUser.id, item);
    if (success) {
      showStatus(item.id, `تم شراء ${item.name} بنجاح! 🛍️`, 'success');
    } else {
      showStatus(item.id, 'عذراً، رصيدك من العملات غير كافٍ.', 'error');
    }
  };

  const getPreviewColors = (value: string) => {
    switch(value) {
      case 'dark': return ['bg-gray-900', 'bg-gray-700', 'bg-blue-500'];
      case 'gold': return ['bg-[#FFF8E1]', 'bg-[#FFC107]', 'bg-[#795548]'];
      case 'nature': return ['bg-[#F1F8E9]', 'bg-[#8BC34A]', 'bg-[#2E7D32]'];
      default: return ['bg-primary', 'bg-white', 'bg-gray-100'];
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header & XP Conversion */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FF9966] to-[#FF5E62] p-1 shadow-2xl rounded-[3.5rem]">
        <div className="bg-white/10 backdrop-blur-md rounded-[3.4rem] p-8 md:p-12 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="text-center lg:text-right text-white space-y-3">
            <h2 className="text-5xl font-black drop-shadow-lg">متجر التميز 🪙</h2>
            <p className="text-xl font-bold opacity-90 max-w-md">كافئ نفسك على اجتهادك الدراسي بمظاهر وأدوات حصرية.</p>
            <div className="flex justify-center lg:justify-start gap-3 mt-4">
              <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-black border border-white/30">✨ رصيد XP: {currentUser.xp}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-orange-100 flex flex-col items-center min-w-[280px] group transition-transform hover:scale-105">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">رصيد عملاتك الحالي</p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-5xl font-black text-orange-500">{currentUser.coins || 0}</span>
              <span className="text-xl font-black text-orange-300">TQC</span>
            </div>
            
            <div className="w-full relative">
              <button 
                onClick={handleConvert}
                disabled={isConverting || currentUser.xp < 100}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all relative z-10 overflow-hidden ${
                  isConverting ? 'bg-gray-100 text-gray-400' : 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:shadow-orange-300'
                }`}
              >
                <span className="relative z-10">{isConverting ? 'جاري التحويل...' : 'تحويل 100 XP ➔ 10 TQC'}</span>
                {isConverting && <div className="absolute inset-0 bg-orange-400 animate-pulse"></div>}
              </button>
              
              {purchaseStatus?.id === 'conv' && (
                <div className={`absolute -bottom-10 left-0 right-0 text-center text-[10px] font-black animate-bounce ${purchaseStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {purchaseStatus.msg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap justify-center gap-3">
        {(['all', 'theme', 'hint', 'badge'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${
              activeTab === tab 
              ? 'bg-gray-900 text-white shadow-xl scale-105' 
              : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200 hover:text-gray-600'
            }`}
          >
            {tab === 'all' ? 'الكل' : tab === 'theme' ? 'المظاهر 🎨' : tab === 'hint' ? 'تلميحات 💡' : 'شارات 🎖️'}
          </button>
        ))}
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {filteredItems.map(item => {
          const isOwned = currentUser.inventory.includes(item.id) || item.id === 'theme_default';
          const isActive = item.type === 'theme' && currentUser.selectedTheme === item.value;

          return (
            <div 
              key={item.id} 
              className={`relative bg-white p-8 rounded-[3rem] border-2 transition-all duration-500 group flex flex-col overflow-hidden ${
                isActive ? 'border-primary shadow-2xl scale-[1.02]' : 'border-gray-100 shadow-sm hover:shadow-xl'
              }`}
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-colors ${
                isActive ? 'bg-primary/10' : 'bg-gray-50 group-hover:bg-primary/5'
              }`}></div>
              
              <div className="relative z-10 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:rotate-12 duration-500 ${
                    item.type === 'theme' ? 'bg-blue-50' : item.type === 'hint' ? 'bg-amber-50' : 'bg-purple-50'
                  }`}>
                    {item.type === 'theme' ? '🎨' : item.type === 'hint' ? '💡' : '✨'}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isActive && (
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">نشط الآن</span>
                    )}
                    {isOwned && !isActive && (
                      <span className="bg-green-50 text-green-500 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-green-100">مملوك</span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-800 mb-3">{item.name}</h3>
                <p className="text-sm text-gray-400 font-bold leading-relaxed mb-6">{item.description}</p>
                
                {/* Theme Preview */}
                {item.type === 'theme' && (
                  <div className="flex gap-2 mb-8">
                    {getPreviewColors(item.value).map((c, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-white shadow-sm ${c}`}></div>
                    ))}
                    <span className="text-[10px] font-black text-gray-300 mr-2 self-center">معاينة الألوان</span>
                  </div>
                )}
              </div>
              
              <div className="relative z-10 mt-auto pt-6 border-t border-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-orange-500">{item.price}</span>
                    <span className="text-xs font-black text-orange-300">TQC</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {item.type === 'theme' ? 'مظهر الحساب' : 'تحسين الحساب'}
                  </span>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => handlePurchase(item)}
                    disabled={isActive}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                      isActive
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isOwned && item.type === 'theme'
                      ? 'bg-gray-800 text-white hover:bg-black shadow-lg shadow-gray-200'
                      : isOwned
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    {isActive 
                      ? 'مفعّل حالياً ✅' 
                      : isOwned 
                      ? (item.type === 'theme' ? 'تبديل إلى هذا المظهر' : 'تم الشراء مسبقاً') 
                      : 'شراء العنصر 🛒'}
                  </button>

                  {/* Status Message Overlay */}
                  {purchaseStatus?.id === item.id && (
                    <div className={`absolute -top-12 left-0 right-0 p-2 rounded-xl text-[10px] font-black text-center animate-in slide-in-from-bottom duration-300 shadow-xl ${
                      purchaseStatus.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {purchaseStatus.msg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto p-10 bg-white rounded-[3rem] border border-gray-100 text-center space-y-4 shadow-sm">
        <h4 className="text-lg font-black text-gray-800">كيف تفعّل المظاهر المشتراة؟ 🎨</h4>
        <p className="text-sm text-gray-500 font-bold leading-relaxed">
          جميع المظاهر التي تشتريها تبقى في "حقيبتك". يمكنك التبديل بينها في أي وقت من هذه الصفحة بالضغط على زر "تبديل إلى هذا المظهر". المظهر النشط سيظهر دائماً بحدود زرقاء وشارة "نشط الآن".
        </p>
      </div>
    </div>
  );
};

export default VirtualStore;
