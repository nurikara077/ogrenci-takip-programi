import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  LogIn, 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Building2, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { users, login, switchUser } = useApp();
  const [email, setEmail] = useState('ahmet.yilmaz@tarhankoleji.k12.tr');
  const [password, setPassword] = useState('123456');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Geçersiz e-posta adresi veya şifre.');
      } else if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 250);
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('123456');
    setErrorMessage('');
    const res = login(userEmail, '123456');
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const demoAccounts = [
    {
      id: 'user-teacher-ahmet',
      name: 'Ahmet Yılmaz',
      role: 'TEACHER',
      roleLabel: 'Öğretmen (Matematik)',
      email: 'ahmet.yilmaz@tarhankoleji.k12.tr',
      desc: '8-A Şubesi Matematik Öğretmeni ve Bireysel Özel Ders Eğitmeni',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: BookOpen,
    },
    {
      id: 'user-teacher-ayse',
      name: 'Ayşe Demir',
      role: 'TEACHER',
      roleLabel: 'Öğretmen (Türkçe)',
      email: 'ayse.demir@tarhankoleji.k12.tr',
      desc: '8-A Şubesi Türkçe ve Paragraf Öğretmeni',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: BookOpen,
    },
    {
      id: 'user-teacher-mehmet',
      name: 'Mehmet Kaya',
      role: 'TEACHER',
      roleLabel: 'Öğretmen (Fen Bilimleri)',
      email: 'mehmet.kaya@tarhankoleji.k12.tr',
      desc: '8-A ve 8-B Şubeleri Fen Bilimleri Öğretmeni',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: BookOpen,
    },
    {
      id: 'user-student-mehmet',
      name: 'Mehmet Demir',
      role: 'STUDENT',
      roleLabel: 'Öğrenci (8-A Sınıfı)',
      email: 'mehmet.ogrenci@okul.k12.tr',
      desc: '8-A Kurum Öğrencisi (Ahmet, Ayşe ve Mehmet Hoca dersine girer)',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: Sparkles,
    },
    {
      id: 'user-student-can',
      name: 'Can Berk',
      role: 'STUDENT',
      roleLabel: 'Öğrenci (Özel Ders)',
      email: 'can.berk@gmail.com',
      desc: 'Bireysel Özel Ders Öğrencisi (Yalnızca Ahmet Hoca ile ilişkili)',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Sparkles,
    },
    {
      id: 'user-admin-kurum',
      name: 'Nuri Kara',
      role: 'INSTITUTE_ADMIN',
      roleLabel: 'Kurum Yöneticisi',
      email: 'nuri.kara@tarhankoleji.k12.tr',
      desc: 'Kurum Yöneticisi (Tarhan Koleji Şube ve Öğretmen Atama Yetkilisi)',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Building2,
    },
    {
      id: 'user-teacher-izmir',
      name: 'Selim Akın',
      role: 'TEACHER',
      roleLabel: 'İzmir Şubesi Öğretmeni (Org 2)',
      email: 'selim.izmir@izmirders.k12.tr',
      desc: 'Farklı Kurum (İzmir Fen Akademi) - Multi-tenant izolasyon testi için',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Card */}
        <div className="lg:col-span-6 bg-white p-7 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Giriş Yap</h1>
                <p className="text-xs text-slate-500">Öğrenci Takip Platformu • FAZ 1</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 pt-1">
              Platforma erişmek için e-posta ve şifrenizle giriş yapın veya yandaki test hesaplarını seçin.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@tarhankoleji.k12.tr"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Şifre</label>
                <span className="text-[11px] text-slate-400">Demo şifresi: 123456</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Giriş Yapılıyor...' : 'Oturum Aç'}
            </button>
          </form>

          {/* Security & Scope info */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>FAZ 1 Yetkilendirme Kuralları Aktif</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Öğretmenler yalnızca yetkili oldukları öğrencileri ve kendi atadıkları görevleri yönetebilir. 
              Öğrenciler yalnızca kendi çalışma kayıtlarını görebilir ve düzenleyebilir.
            </p>
          </div>
        </div>

        {/* Right Column: Quick Demo Switcher Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <h2 className="font-bold text-slate-900 text-sm">Hızlı Test / Demo Hesapları</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Tek tıkla giriş</span>
            </div>
            <p className="text-xs text-slate-500">
              FAZ 1 gereksinimlerini hemen test etmek için istediğiniz role tıklayın:
            </p>

            <div className="space-y-2.5 pt-1">
              {demoAccounts.map((account) => {
                const IconComponent = account.icon;
                const isSelected = email === account.email;

                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleQuickLogin(account.email)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{account.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] border font-medium ${account.badgeColor}`}>
                          {account.roleLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{account.desc}</p>
                      <div className="text-[10px] text-slate-400 font-mono">{account.email}</div>
                    </div>
                    <div className="shrink-0 pt-1 text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
