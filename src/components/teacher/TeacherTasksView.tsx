import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTask } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Edit3, 
  Check, 
  Search, 
  Plus, 
  BookOpen, 
  Calendar, 
  User,
  Filter
} from 'lucide-react';
import { TaskModal } from './TaskModal';

interface TeacherTasksViewProps {
  onSelectStudent?: (studentId: string) => void;
}

export const TeacherTasksView: React.FC<TeacherTasksViewProps> = ({ onSelectStudent }) => {
  const { 
    currentUser, 
    dailyTasks, 
    studentProfiles, 
    users, 
    resources, 
    subjects,
    teacherProfiles,
    getTeacherAssignedResources,
    getTaskRealization,
    verifyDailyTask,
    rejectDailyTask,
    getTeacherStudents
  } = useApp();

  const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);

  // Filters state
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'IN_PROGRESS' | 'DUE_TODAY' | 'UPCOMING' | 'OVERDUE' | 'PENDING_VERIFICATION' | 'REJECTED'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');

  // Modal states for Add & Edit
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [targetStudentId, setTargetStudentId] = useState<string>('');

  // Today reference date (matching mock platform timeline)
  const todayStr = '2026-08-31';

  // Allowed students for this teacher
  const myStudents = getTeacherStudents(currentUser.id);

  // Strictly isolated tasks: only tasks created by this teacher
  const myTasks = useMemo(() => {
    return dailyTasks.filter(
      (t) => t.teacherId === (currentTeacherProfile?.id || 'tp-ahmet') && !t.isDeleted
    );
  }, [dailyTasks, currentTeacherProfile]);

  // Tab counts
  const counts = useMemo(() => {
    let inProgress = 0;
    let dueToday = 0;
    let upcoming = 0;
    let overdue = 0;
    let pendingVerification = 0;
    let rejected = 0;

    myTasks.forEach((task) => {
      const calc = getTaskRealization(task.id);
      const start = task.startDate || task.taskDate;
      const due = task.dueDate || task.taskDate;

      if (calc.verificationStatus === 'REJECTED') {
        rejected++;
      } else if (calc.verificationStatus === 'PENDING' && (task.isCompleted || calc.actualQuestions > 0 || calc.actualMinutes > 0)) {
        pendingVerification++;
      }

      if (!task.isCompleted && calc.verificationStatus !== 'VERIFIED') {
        if (due < todayStr) {
          overdue++;
        } else if (due === todayStr) {
          dueToday++;
        } else if (due > todayStr && start <= todayStr) {
          inProgress++;
        } else if (start > todayStr) {
          upcoming++;
        }
      }
    });

    return {
      all: myTasks.length,
      inProgress,
      dueToday,
      upcoming,
      overdue,
      pendingVerification,
      rejected,
    };
  }, [myTasks, getTaskRealization, todayStr]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return myTasks.filter((task) => {
      const calc = getTaskRealization(task.id);
      const start = task.startDate || task.taskDate;
      const due = task.dueDate || task.taskDate;

      // Filter by status tab
      if (activeFilter === 'IN_PROGRESS') {
        if (task.isCompleted || calc.verificationStatus === 'VERIFIED') return false;
        if (start > todayStr || due < todayStr) return false;
      } else if (activeFilter === 'DUE_TODAY') {
        if (due !== todayStr) return false;
      } else if (activeFilter === 'UPCOMING') {
        if (start <= todayStr || due < todayStr) return false;
      } else if (activeFilter === 'OVERDUE') {
        if (task.isCompleted || calc.verificationStatus === 'VERIFIED') return false;
        if (due >= todayStr) return false;
      } else if (activeFilter === 'PENDING_VERIFICATION') {
        if (calc.verificationStatus !== 'PENDING' || (!task.isCompleted && calc.actualQuestions === 0 && calc.actualMinutes === 0)) {
          return false;
        }
      } else if (activeFilter === 'REJECTED') {
        if (calc.verificationStatus !== 'REJECTED') return false;
      }

      // Filter by selected student
      if (selectedStudentFilter !== 'ALL' && task.studentId !== selectedStudentFilter) {
        return false;
      }

      // Filter by search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentProfile = studentProfiles.find((s) => s.id === task.studentId);
        const studentUser = users.find((u) => u.id === studentProfile?.userId);
        const res = resources.find((r) => r.id === task.resourceId);
        const studentName = studentUser?.fullName?.toLowerCase() || '';
        const bookTitle = res?.title?.toLowerCase() || '';
        const desc = task.description?.toLowerCase() || '';

        if (!studentName.includes(q) && !bookTitle.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [myTasks, activeFilter, selectedStudentFilter, searchQuery, getTaskRealization, studentProfiles, users, resources, todayStr]);

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setTargetStudentId(myStudents[0]?.id || '');
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setTargetStudentId(task.studentId);
    setIsTaskModalOpen(true);
  };

  const handleVerify = (taskId: string) => {
    verifyDailyTask(taskId, currentUser.id);
  };

  const handleReject = (taskId: string) => {
    rejectDailyTask(taskId, currentUser.id, 'Ödev eksik veya yapılmadı.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
            Ödevlerim / Takip
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Öğrencilerinize verdiğiniz tüm ödevleri tek ekranda izleyin, düzenleyin ve çalışmalarını doğrulayın.
          </p>
        </div>

        <button
          onClick={handleOpenNewTask}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ödev Ver
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'ALL', label: 'Tümü', count: counts.all },
          { id: 'IN_PROGRESS', label: 'Devam Eden', count: counts.inProgress },
          { id: 'DUE_TODAY', label: 'Bugün Teslim', count: counts.dueToday },
          { id: 'UPCOMING', label: 'Yaklaşan', count: counts.upcoming },
          { id: 'OVERDUE', label: 'Gecikenler', count: counts.overdue, alert: counts.overdue > 0 },
          { id: 'PENDING_VERIFICATION', label: 'Kontrol Bekleyenler', count: counts.pendingVerification, highlight: counts.pendingVerification > 0 },
          { id: 'REJECTED', label: 'Yapılmayanlar', count: counts.rejected },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                activeFilter === tab.id
                  ? 'bg-blue-500 text-white'
                  : tab.alert
                  ? 'bg-rose-100 text-rose-700'
                  : tab.highlight
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Student Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Öğrenci adı, kitap adı veya ödev içeriği ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Tüm Öğrenciler ({myStudents.length})</option>
            {myStudents.map((s) => {
              const u = users.find((usr) => usr.id === s.userId);
              return (
                <option key={s.id} value={s.id}>
                  {u?.fullName || s.id}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Öğrenci</th>
                <th className="px-5 py-3.5">Kaynak</th>
                <th className="px-5 py-3.5">Ödev / Kapsam</th>
                <th className="px-5 py-3.5">Veriliş</th>
                <th className="px-5 py-3.5">Son Tarih</th>
                <th className="px-5 py-3.5">Gerçekleşme</th>
                <th className="px-5 py-3.5">Durum</th>
                <th className="px-5 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">Seçilen kriterlere uygun ödev bulunamadı.</p>
                    <p className="text-xs text-slate-500 mt-1">Farklı bir filtre seçebilir veya "Yeni Ödev Ver" butonunu kullanabilirsiniz.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const studentProfile = studentProfiles.find((s) => s.id === task.studentId);
                  const studentUser = users.find((u) => u.id === studentProfile?.userId);
                  const res = resources.find((r) => r.id === task.resourceId);
                  const calc = getTaskRealization(task.id);
                  const startDate = task.startDate || task.taskDate;
                  const dueDate = task.dueDate || task.taskDate;
                  const isOverdue = dueDate < todayStr && !task.isCompleted && calc.verificationStatus !== 'VERIFIED';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Öğrenci */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={studentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={studentUser?.fullName || 'Öğrenci'}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <button
                              onClick={() => onSelectStudent && onSelectStudent(task.studentId)}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {studentUser?.fullName || 'Öğrenci'}
                            </button>
                            <div className="text-[11px] text-slate-500">8-A Şubesi</div>
                          </div>
                        </div>
                      </td>

                      {/* Kaynak */}
                      <td className="px-5 py-4">
                        {res ? (
                          <div className="font-medium text-slate-800 line-clamp-1 max-w-[180px]" title={res.title}>
                            {res.title}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Serbest Görev</span>
                        )}
                      </td>

                      {/* Ödev / Kapsam */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {task.description || (task.startPage ? `Sayfa ${task.startPage}-${task.endPage}` : 'Ödev')}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          {task.targetQuestionCount ? <span>🎯 {task.targetQuestionCount} soru</span> : null}
                          {task.targetDurationMinutes ? <span>⏱️ {task.targetDurationMinutes} dk</span> : null}
                        </div>
                      </td>

                      {/* Veriliş */}
                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {startDate}
                      </td>

                      {/* Son Tarih */}
                      <td className="px-5 py-4 text-xs whitespace-nowrap">
                        <span className={isOverdue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-700 font-medium'}>
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                          {dueDate}
                        </span>
                      </td>

                      {/* Gerçekleşme */}
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {calc.actualQuestions} / {task.targetQuestionCount || 0} soru
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              calc.actualQuestions >= (task.targetQuestionCount || 1)
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((calc.actualQuestions / (task.targetQuestionCount || 1)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{calc.actualMinutes} dk çalışma</div>
                      </td>

                      {/* Durum */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {calc.verificationStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3" />
                            Doğrulandı
                          </span>
                        ) : calc.verificationStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3" />
                            Yapılmadı
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Gecikmiş
                          </span>
                        ) : task.isCompleted || calc.actualQuestions > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            Kontrol Bekliyor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Planlandı
                          </span>
                        )}
                      </td>

                      {/* İşlemler: Düzenle / Doğrula / Yapılmadı */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {calc.verificationStatus !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerify(task.id)}
                              title="Çalışmayı Doğrula"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 text-xs font-medium"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Doğrula</span>
                            </button>
                          )}

                          {calc.verificationStatus !== 'REJECTED' && (
                            <button
                              onClick={() => handleReject(task.id)}
                              title="Yapılmadı Olarak İşaretle"
                              className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 text-xs font-medium"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Yapılmadı</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleEditTask(task)}
                            title="Ödevi Düzenle / Revize Et"
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 text-xs font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Düzenle</span>
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

      {/* Task Creation & Revision Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          selectedStudentId={targetStudentId}
          editTask={editingTask}
        />
      )}
    </div>
  );
};
