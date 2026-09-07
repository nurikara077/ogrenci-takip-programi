import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTask } from '../../types';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  Check, 
  PlusCircle, 
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { StudyRecordModal } from './StudyRecordModal';

export const StudentTasksView: React.FC = () => {
  const { 
    currentUser, 
    studentProfiles, 
    dailyTasks, 
    resources, 
    subjects,
    getTaskRealization,
    isTaskActiveOnDate,
    isTaskOverdue
  } = useApp();

  const currentStudent = studentProfiles.find((sp) => sp.userId === currentUser.id);
  const studentId = currentStudent?.id || 'sp-mehmet';
  const todayStr = '2026-08-31';

  // Filters: 'ALL' | 'TODAY' | 'OVERDUE' | 'COMPLETED'
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  // Study record modal state
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<DailyTask | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Student's tasks
  const myTasks = useMemo(() => {
    return dailyTasks.filter((t) => t.studentId === studentId && !t.isDeleted);
  }, [dailyTasks, studentId]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let today = 0;
    let overdue = 0;
    let completed = 0;

    myTasks.forEach((task) => {
      const calc = getTaskRealization(task.id);
      const isComp = task.isCompleted || calc.verificationStatus === 'VERIFIED';
      
      if (isComp) {
        completed++;
      } else {
        if (isTaskOverdue(task, todayStr)) {
          overdue++;
        }
        if (isTaskActiveOnDate(task, todayStr)) {
          today++;
        }
      }
    });

    return {
      all: myTasks.length,
      today,
      overdue,
      completed,
    };
  }, [myTasks, getTaskRealization, isTaskActiveOnDate, isTaskOverdue, todayStr]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return myTasks.filter((task) => {
      const calc = getTaskRealization(task.id);
      const isComp = task.isCompleted || calc.verificationStatus === 'VERIFIED';

      if (activeFilter === 'TODAY') {
        if (!isTaskActiveOnDate(task, todayStr)) return false;
      } else if (activeFilter === 'OVERDUE') {
        if (isComp || !isTaskOverdue(task, todayStr)) return false;
      } else if (activeFilter === 'COMPLETED') {
        if (!isComp) return false;
      }

      if (selectedSubjectFilter !== 'ALL' && task.subjectId !== selectedSubjectFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const res = resources.find((r) => r.id === task.resourceId);
        const title = res?.title?.toLowerCase() || '';
        const desc = task.description?.toLowerCase() || '';
        if (!title.includes(q) && !desc.includes(q)) return false;
      }

      return true;
    });
  }, [myTasks, activeFilter, selectedSubjectFilter, searchQuery, resources, getTaskRealization, isTaskActiveOnDate, isTaskOverdue, todayStr]);

  const handleOpenRecordModal = (task: DailyTask) => {
    setSelectedTaskForRecord(task);
    setIsRecordModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ödevlerim</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Öğretmenlerinizin size atadığı tüm çalışma görevlerini inceleyin ve çalışma kayıtlarınızı girin.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Bugün: <strong className="text-slate-800">31 Ağustos 2026</strong></span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'ALL', label: 'Tümü', count: counts.all },
          { id: 'TODAY', label: 'Bugün', count: counts.today },
          { id: 'OVERDUE', label: 'Gecikmiş', count: counts.overdue, alert: counts.overdue > 0 },
          { id: 'COMPLETED', label: 'Tamamlanan', count: counts.completed },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeFilter === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeFilter === tab.id
                  ? 'bg-emerald-500 text-white'
                  : tab.alert
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Subject Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ödev açıklaması veya kitap adı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">Tüm Dersler</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Cards Grid / List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Seçili filtrede ödev bulunamadı.</p>
            <p className="text-xs text-slate-400 mt-1">Farklı bir filtre seçerek diğer ödevlerinizi kontrol edebilirsiniz.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const res = resources.find((r) => r.id === task.resourceId);
            const sub = subjects.find((s) => s.id === task.subjectId);
            const calc = getTaskRealization(task.id);
            const startDate = task.startDate || task.taskDate;
            const dueDate = task.dueDate || task.taskDate;
            const isOverdue = isTaskOverdue(task, todayStr);
            const isCompleted = task.isCompleted || calc.verificationStatus === 'VERIFIED';
            const progressPercent = task.targetQuestionCount && task.targetQuestionCount > 0
              ? Math.min(100, Math.round((calc.actualQuestions / task.targetQuestionCount) * 100))
              : (calc.actualMinutes > 0 ? 100 : 0);

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/50'
                    : isOverdue
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Left: Book & Scope Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white"
                      style={{ backgroundColor: sub?.colorHex || '#10B981' }}
                    >
                      {sub?.name || 'Genel'}
                    </span>

                    <span className="font-bold text-slate-900 text-sm truncate">
                      {res?.title || 'Serbest Çalışma'}
                    </span>

                    {/* Status Badge */}
                    {calc.verificationStatus === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3 h-3" />
                        Doğrulandı
                      </span>
                    ) : calc.verificationStatus === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                        Yapılmadı
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        Gecikmiş
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Tamamlandı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Devam Ediyor
                      </span>
                    )}
                  </div>

                  {/* Task Description / Pages */}
                  <div className="text-sm font-medium text-slate-800">
                    {task.description || (task.startPage ? `Sayfa ${task.startPage} - ${task.endPage}` : 'Ödev')}
                  </div>

                  {/* Date Range & Target Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {startDate} - <strong className={isOverdue ? 'text-rose-600' : 'text-slate-900'}>{dueDate}</strong>
                    </span>

                    {task.targetQuestionCount ? (
                      <span className="flex items-center gap-1 font-medium">
                        🎯 Hedef: <strong>{task.targetQuestionCount} soru</strong>
                      </span>
                    ) : null}

                    {task.targetDurationMinutes ? (
                      <span className="flex items-center gap-1 font-medium">
                        ⏱️ Süre: <strong>{task.targetDurationMinutes} dk</strong>
                      </span>
                    ) : null}

                    {task.startPage && task.endPage ? (
                      <span className="flex items-center gap-1 font-medium">
                        📖 Sayfa: <strong>{task.startPage} - {task.endPage}</strong>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right: Progress & Action Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-bold text-slate-800">
                      {calc.actualQuestions} / {task.targetQuestionCount || 0} soru
                    </div>
                    <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {calc.actualMinutes} dk kaydedildi
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRecordModal(task)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Çalışmayı Kaydet</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Study Record Modal */}
      {isRecordModalOpen && selectedTaskForRecord && (
        <StudyRecordModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          task={selectedTaskForRecord}
        />
      )}
    </div>
  );
};
