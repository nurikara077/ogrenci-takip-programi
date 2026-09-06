import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  Bell, 
  CheckCircle2, 
  ArrowRightLeft, 
  BookOpen, 
  Calendar, 
  Users, 
  BarChart3, 
  Building2, 
  Sparkles,
  Layers,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNotifications }) => {
  const { currentUser, switchUser, logout, users, notifications } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadNotifs = notifications.filter((n) => n.userId === currentUser.id && !n.isRead).length;

  const roleLabelMap = {
    TEACHER: 'Öğretmen',
    STUDENT: 'Öğrenci',
    INSTITUTE_ADMIN: 'Kurum Yöneticisi',
    COORDINATOR: 'Koordinatör',
  };

  const roleBadgeColor = {
    TEACHER: 'bg-blue-50 text-blue-700 border-blue-200',
    STUDENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INSTITUTE_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
    COORDINATOR: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">ÖğrenciTakip</span>
                <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Planla • Görevlendir • Ölç • Raporla</p>
            </div>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex items-center gap-1">
            {currentUser.role === 'TEACHER' && (
              <>
                <button
                  onClick={() => setActiveTab('teacher-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'teacher-dashboard'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Genel Bakış
                </button>
                <button
                  onClick={() => setActiveTab('teacher-tasks')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'teacher-tasks'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ödevlerim / Takibim
                </button>
                <button
                  onClick={() => setActiveTab('teacher-students')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'teacher-students'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Öğrenciler
                </button>
                <button
                  onClick={() => setActiveTab('teacher-resources')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'teacher-resources'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Kaynaklarım
                </button>
                <button
                  onClick={() => setActiveTab('teacher-reports')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'teacher-reports'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Raporlar
                </button>
                <button
                  onClick={() => setActiveTab('teacher-analytics')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'teacher-analytics'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Analitik Rapor
                </button>
              </>
            )}

            {currentUser.role === 'STUDENT' && (
              <>
                <button
                  onClick={() => setActiveTab('student-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'student-dashboard'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Bugün Ne Yapacağım?
                </button>
                <button
                  onClick={() => setActiveTab('student-weekly')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'student-weekly'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Haftalık Program
                </button>
                <button
                  onClick={() => setActiveTab('student-resources')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'student-resources'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Kaynaklarım
                </button>
                <button
                  onClick={() => setActiveTab('student-performance')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'student-performance'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Performans
                </button>
              </>
            )}

            {currentUser.role === 'INSTITUTE_ADMIN' && (
              <>
                <button
                  onClick={() => setActiveTab('admin-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'admin-dashboard'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Kurum Genel Görünüm
                </button>
                <button
                  onClick={() => setActiveTab('admin-classes')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'admin-classes'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Sınıflar & Branşlar
                </button>
              </>
            )}

            {currentUser.role === 'COORDINATOR' && (
              <>
                <button
                  onClick={() => setActiveTab('coordinator-analytics')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'coordinator-analytics'
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Akademik Analitik
                </button>
                <button
                  onClick={() => setActiveTab('coordinator-classes')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'coordinator-classes'
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Şubeler & Başarı
                </button>
                <button
                  onClick={() => setActiveTab('coordinator-reports')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'coordinator-reports'
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Raporlar
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar: Notifications & Demo User Switcher */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Quick Role & Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">{currentUser.fullName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] border ${roleBadgeColor[currentUser.role]}`}>
                      {roleLabelMap[currentUser.role]}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Hızlı Rol & Test Değiştirici</span>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="max-h-80 overflow-y-auto py-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowUserMenu(false);
                          if (u.role === 'TEACHER') setActiveTab('teacher-dashboard');
                          else if (u.role === 'STUDENT') setActiveTab('student-dashboard');
                          else if (u.role === 'INSTITUTE_ADMIN') setActiveTab('admin-dashboard');
                        }}
                        className={`w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-slate-50 transition-colors ${
                          u.id === currentUser.id ? 'bg-blue-50/70 text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={u.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500">
                            {roleLabelMap[u.role]} • {u.organizationId ? '8-A Kurum' : 'Bireysel Özel'}
                          </div>
                        </div>
                        {u.id === currentUser.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Oturumu Kapat (Giriş Ekranına Dön)</span>
                    </button>
                    <div className="text-[10px] text-slate-400 text-center">
                      Tüm rolleri test etmek için profili dilediğiniz an değiştirebilirsiniz.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-2 scrollbar-none">
          {currentUser.role === 'TEACHER' && (
            <>
              <button
                onClick={() => setActiveTab('teacher-dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'teacher-dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Genel Bakış
              </button>
              <button
                onClick={() => setActiveTab('teacher-tasks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'teacher-tasks' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Ödevlerim
              </button>
              <button
                onClick={() => setActiveTab('teacher-students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'teacher-students' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Öğrenciler
              </button>
              <button
                onClick={() => setActiveTab('teacher-resources')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'teacher-resources' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Kaynaklarım
              </button>
              <button
                onClick={() => setActiveTab('teacher-reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'teacher-reports' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Raporlar
              </button>
              <button
                onClick={() => setActiveTab('teacher-analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'teacher-analytics' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Analitik Rapor
              </button>
            </>
          )}

          {currentUser.role === 'STUDENT' && (
            <>
              <button
                onClick={() => setActiveTab('student-dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'student-dashboard' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Bugün Ne Yapacağım?
              </button>
              <button
                onClick={() => setActiveTab('student-weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'student-weekly' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Haftalık Program
              </button>
              <button
                onClick={() => setActiveTab('student-resources')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'student-resources' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Kaynaklarım
              </button>
              <button
                onClick={() => setActiveTab('student-performance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'student-performance' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Performans
              </button>
            </>
          )}

          {currentUser.role === 'INSTITUTE_ADMIN' && (
            <>
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'admin-dashboard' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Kurum Dashboard
              </button>
              <button
                onClick={() => setActiveTab('admin-classes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'admin-classes' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Sınıflar
              </button>
            </>
          )}

          {currentUser.role === 'COORDINATOR' && (
            <>
              <button
                onClick={() => setActiveTab('coordinator-analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'coordinator-analytics' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Akademik Analitik
              </button>
              <button
                onClick={() => setActiveTab('coordinator-classes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'coordinator-classes' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Şubeler & Başarı
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
