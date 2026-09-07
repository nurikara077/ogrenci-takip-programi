import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Users,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotifications: () => void;
}

const roleLabels: Record<string, string> = {
  INSTITUTE_ADMIN: 'Kurum Yöneticisi',
  TEACHER: 'Öğretmen',
  STUDENT: 'Öğrenci',
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNotifications }) => {
  const {
    currentUser,
    switchUser,
    logout,
    users,
    notifications,
    dailyTasks,
    studentProfiles,
    isTaskOverdue,
  } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((item) => item.userId === currentUser.id && !item.isRead).length;
  const currentStudent = studentProfiles.find((student) => student.userId === currentUser.id);
  const overdueCount = currentUser.role === 'STUDENT' && currentStudent
    ? dailyTasks.filter((task) => task.studentId === currentStudent.id && !task.isDeleted && isTaskOverdue(task, '2026-08-31')).length
    : 0;

  const navigationByRole = {
    INSTITUTE_ADMIN: [
      { id: 'admin-dashboard', label: 'Kurulum', icon: Building2 },
      { id: 'admin-students', label: 'Öğrenciler', icon: Users },
      { id: 'admin-teachers', label: 'Öğretmenler', icon: GraduationCap },
      { id: 'admin-classes', label: 'Sınıflar', icon: GraduationCap },
      { id: 'admin-resources', label: 'Kaynaklar', icon: BookOpen },
    ],
    TEACHER: [
      { id: 'teacher-dashboard', label: 'Özet', icon: ClipboardCheck },
      { id: 'teacher-students', label: 'Öğrencilerim', icon: Users },
      { id: 'teacher-resources', label: 'Kaynaklarım', icon: BookOpen },
      { id: 'teacher-planner', label: 'Ödev Planla', icon: CalendarDays },
      { id: 'teacher-tasks', label: 'Kontrol', icon: CheckCircle2 },
    ],
    STUDENT: [
      { id: 'student-tasks', label: 'Ödevlerim', icon: CheckCircle2 },
    ],
  } as const;

  const navItems = navigationByRole[currentUser.role];

  const openTab = (tab: string) => {
    setActiveTab(tab);
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => openTab(navItems[0].id)}
            className="flex items-center gap-2.5 shrink-0 text-left"
            aria-label="Ana sayfaya dön"
          >
            <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="hidden sm:block">
              <span className="block font-bold text-slate-900 leading-tight">ÖğrenciTakip</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">Sade ödev ve kaynak takibi</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Ana menü">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openTab(item.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.id === 'student-tasks' && overdueCount > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-rose-100 text-rose-700 text-[10px] flex items-center justify-center">
                      {overdueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Bildirimleri aç"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu((open) => !open)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                aria-expanded={showUserMenu}
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
                <span className="hidden md:block text-left max-w-28">
                  <span className="block text-xs font-semibold text-slate-800 truncate">{currentUser.fullName}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{roleLabels[currentUser.role]}</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Demo rolüyle görüntüle
                  </p>
                  <div className="max-h-64 overflow-y-auto">
                    {users
                      .filter((user) => ['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT'].includes(user.role))
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            switchUser(user.id);
                            setShowUserMenu(false);
                          }}
                          className={`w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-slate-50 ${
                            user.id === currentUser.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-slate-800 truncate">{user.fullName}</span>
                            <span className="block text-[11px] text-slate-500">{roleLabels[user.role]}</span>
                          </span>
                        </button>
                      ))}
                  </div>
                  <div className="mt-2 pt-2 px-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 text-left inline-flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Oturumu kapat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Mobil menü">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {item.label}{item.id === 'student-tasks' && overdueCount > 0 ? ` (${overdueCount})` : ''}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
