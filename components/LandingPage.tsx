
import React from 'react';

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<Props> = ({ onLogin, onRegister }) => {
  const features = [
    {
      title: 'اختبارات ذكية',
      desc: 'محرك اختبارات متطور يحاكي الامتحانات الوزارية مع مؤقت زمني دقيق.',
      icon: '📝',
      color: 'border-blue-200 bg-blue-50/30'
    },
    {
      title: 'بنك أسئلة ضخم',
      desc: 'آلاف الأسئلة المغطية لكافة الوحدات والدروس لكافة المواد الدراسية.',
      icon: '📚',
      color: 'border-green-200 bg-green-50/30'
    },
    {
      title: 'تقارير أداء',
      desc: 'رسوم بيانية تفصيلية لمتابعة تقدمك وتحديد نقاط القوة والضعف لديك.',
      icon: '📊',
      color: 'border-purple-200 bg-purple-50/30'
    },
    {
      title: 'ذكاء اصطناعي',
      desc: 'توليد أسئلة ذكية ومتنوعة لضمان شمولية المادة الدراسية بأحدث التقنيات.',
      icon: '✨',
      color: 'border-amber-200 bg-amber-50/30'
    },
    {
      title: 'لائحة الشرف',
      desc: 'نافس زملائك واحجز مكانك بين أوائل الطلبة على مستوى المنصة.',
      icon: '🏆',
      color: 'border-red-200 bg-red-50/30'
    },
    {
      title: 'تحديات يومية',
      desc: 'تحديات متجددة يومياً لتبقيك في قمة نشاطك الدراسي وتركيزك.',
      icon: '🎯',
      color: 'border-cyan-200 bg-cyan-50/30'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-[#F8F9FB] select-none">
      {/* Hero Section */}
      <div className="mb-12 w-full max-w-2xl text-center">
        <div className="relative mb-6 mx-auto w-36 h-36">
           <div className="absolute inset-0 bg-white opacity-40 blur-xl rounded-full"></div>
           <img 
            src="image.png" 
            alt="Tawjihi Quiz Logo" 
            className="relative z-10 w-32 h-32 mx-auto rounded-[2rem] shadow-2xl border-4 border-white object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3413/3413535.png';
            }}
          />
        </div>
        
        <h1 className="text-5xl font-black text-[#4A90E2] mb-6 drop-shadow-sm">Tawjihi Quiz</h1>
        
        <p className="text-xl text-[#666666] leading-relaxed mb-4">
          <span className="font-semibold text-gray-800">منصة الأسئلة الأولى</span> لطلاب التوجيهي في الأردن.
        </p>
        <p className="text-lg text-[#666666] leading-relaxed max-w-lg mx-auto">
          نساعدك في التحضير للامتحانات النهائية من خلال اختبارات تفاعلية ذكية وشاملة للمواد الدراسية.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mb-24">
        <button 
          onClick={onLogin}
          className="flex-1 bg-[#4A90E2] text-white text-xl font-bold py-4 px-8 rounded-2xl shadow-[0_8px_0_rgb(58,113,177)] hover:shadow-[0_4px_0_rgb(58,113,177)] hover:translate-y-1 transition-all duration-150 active:shadow-none active:translate-y-2"
        >
          تسجيل الدخول
        </button>
        <button 
          onClick={onRegister}
          className="flex-1 bg-[#50E3C2] text-[#333333] text-xl font-bold py-4 px-8 rounded-2xl shadow-[0_8px_0_rgb(64,181,154)] hover:shadow-[0_4px_0_rgb(64,181,154)] hover:translate-y-1 transition-all duration-150 active:shadow-none active:translate-y-2"
        >
          إنشاء حساب جديد
        </button>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl w-full px-4">
        <h2 className="text-3xl font-black text-center mb-16 text-gray-800">مميزات المنصة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`relative p-8 rounded-[2.5rem] border-2 ${feature.color} shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group overflow-hidden bg-white/80 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-end gap-3 mb-4">
                <h3 className="text-2xl font-black text-gray-800">{feature.title}</h3>
                <div className="text-4xl">{feature.icon}</div>
              </div>
              
              <div className="relative z-10 text-right">
                <p className="text-gray-500 text-base leading-relaxed font-bold">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-32 text-gray-400 text-sm dir-ltr">
        &copy; Tawjihi Quiz 2024 - جميع الحقوق محفوظة
      </footer>
    </div>
  );
};

export default LandingPage;
