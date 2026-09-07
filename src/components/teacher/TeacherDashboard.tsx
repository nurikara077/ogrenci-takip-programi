import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  Plus,
  BookOpen,
  Check,
  XCircle
} from 'lucide-react';
import { TaskModal } from './TaskModal';

interface TeacherDashboardProps {
  onSelectStudent: (studentId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectStudent, onNavigateTab }) => {
  const { 
    currentUser, 
    studentProfiles, 
    users, 
    resources, 
    getTeacherDashboardMetrics,
    getTaskRealization,
    verifyDailyTask,
    rejectDailyTask,
    getTeacherStudents
  } = useApp();

  const todayStr = '2026-08-31';

  // Centralized metrics: 100% consistent across all screens
  const metrics = getTeacherDashboardMetrics(currentUser.id, todayStr);
  const myStudents = getTeacherStudents(currentUser.id);

  // Quick Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedStudentForTask, setSelectedStudentForTask] = useState<string>('');

  const handleOpenNewTask = () => {
    setSelectedStudentForTask(myStudents[0]?.id || '');
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hoş Geldiniz, {currentUser.fullName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Matematik Öğretmeni
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Öğrencilerinizin durumunu tek bakışta izleyin ve ödev takiplerini yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('teacher-tasks')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Ödevlerimi Aç
          </button>
          <button
            onClick={handleOpenNewTask}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Ödev
          </button>
        </div>
      </div>

      {/* 4 Core Simplified KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sorumlu Öğrenci */}
        <div 
          onClick={() => onNavigateTab('teacher-students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sorumlu Öğrenci</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.assignedStudentsCount}</span>
            <span className="text-xs text-slate-500 font-medium">öğrenci</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
            <span>Listeyi Gör</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Aktif Ödev */}
        <div 
          onClick={() => onNavigateTab('teacher-tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktif Ödev</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.activeTasksCount}</span>
            <span className="text-xs text-slate-500 font-medium">devam eden</span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 font-medium flex items-center gap-1">
            <span>Tüm Ödevler</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Kontrol Bekleyen */}
        <div 
          onClick={() => onNavigateTab('teacher-tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontrol Bekleyen</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.pendingVerificationCount}</span>
            <span className="text-xs text-slate-500 font-medium">onay bekliyor</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
            <span>Kontrol Et</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Gecikmiş */}
        <div 
          onClick={() => onNavigateTab('teacher-tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gecikmiş</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.overdueTasksCount}</span>
            <span className="text-xs text-slate-500 font-medium">geciken ödev</span>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
            <span>İncele</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* ÖĞRENCİLERİN DURUMU (Single Scannable Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Öğrencilerin Durumu</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sorumluluğunuzdaki öğrencilerin güncel ödev ve teslim durumları.</p>
          </div>
          <button
            onClick={() => onNavigateTab('teacher-tasks')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Tümünü Gör ({metrics.myTasks.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Öğrenci</th>
                <th className="px-5 py-3">Ödev & Kaynak</th>
                <th className="px-5 py-3">Durum</th>
                <th className="px-5 py-3">Son Tarih</th>
                <th className="px-5 py-3 text-right">Hızlı İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.myTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    Henüz atanmış bir ödev bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                metrics.myTasks.slice(0, 8).map((task) => {
                  const studentProfile = studentProfiles.find((s) => s.id === task.studentId);
                  const studentUser = users.find((u) => u.id === studentProfile?.userId);
                  const res = resources.find((r) => r.id === task.resourceId);
                  const calc = getTaskRealization(task.id);
                  const dueDate = task.dueDate || task.taskDate;
                  const isOverdue = dueDate < todayStr && !task.isCompleted && calc.verificationStatus !== 'VERIFIED';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Öğrenci */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={studentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={studentUser?.fullName || 'Öğrenci'}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <button
                              onClick={() => onSelectStudent(task.studentId)}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {studentUser?.fullName || 'Öğrenci'}
                            </button>
                            <div className="text-[11px] text-slate-500">8-A Şubesi</div>
                          </div>
                        </div>
                      </td>

                      {/* Ödev & Kaynak */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {task.description || (task.startPage ? `Sayfa ${task.startPage}-${task.endPage}` : 'Ödev')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {res?.title || 'Serbest Görev'} • {task.targetQuestionCount || 0} soru
                        </div>
                      </td>

                      {/* Durum */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {calc.verificationStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3" />
                            Doğrulandı
                          </span>
                        ) : calc.verificationStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3" />
                            Yapılmadı
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Gecikmiş
                          </span>
                        ) : task.isCompleted || calc.actualQuestions > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            Kontrol Bekliyor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Planlandı
                          </span>
                        )}
                      </td>

                      {/* Son Tarih */}
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                          {dueDate}
                        </span>
                      </td>

                      {/* Hızlı İşlem */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {calc.verificationStatus !== 'VERIFIED' && (
                            <button
                              onClick={() => verifyDailyTask(task.id, currentUser.id)}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Doğrula
                            </button>
                          )}
                          <button
                            onClick={() => onNavigateTab('teacher-tasks')}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Detay
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          selectedStudentId={selectedStudentForTask}
        />
      )}
    </div>
  );
};
