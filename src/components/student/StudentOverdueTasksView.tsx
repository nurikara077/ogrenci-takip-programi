import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTask } from '../../types';
import { 
  AlertTriangle, 
  Clock, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Search, 
  PlusCircle, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StudyRecordModal } from './StudyRecordModal';
import { DEFAULT_SIMULATION_DATE } from '../../utils/dateUtils';

interface StudentOverdueTasksViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const StudentOverdueTasksView: React.FC<StudentOverdueTasksViewProps> = ({ onNavigateTab }) => {
  const { 
    currentUser, 
    studentProfiles, 
    dailyTasks, 
    resources, 
    subjects,
    getTaskRealization,
    isTaskOverdue
  } = useApp();

  const currentStudent = studentProfiles.find((sp) => sp.userId === currentUser.id);
  const studentId = currentStudent?.id || 'sp-mehmet';
  const todayStr = DEFAULT_SIMULATION_DATE;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<DailyTask | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Student's tasks
  const myTasks = dailyTasks.filter((t) => t.studentId === studentId && !t.isDeleted);

  // Filter strictly overdue tasks: dueDate < today and NOT fully completed / verified
  const overdueTasks = myTasks.filter((task) => {
    return isTaskOverdue(task, todayStr);
  });

  const filteredTasks = overdueTasks.filter((task) => {
    if (selectedSubjectFilter !== 'ALL' && task.subjectId !== selectedSubjectFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const res = resources.find((r) => r.id === task.resourceId);
      const title = res?.title?.toLowerCase() || '';
      const desc = task.description?.toLowerCase() || '';
      const sub = subjects.find((s) => s.id === task.subjectId)?.name.toLowerCase() || '';
      if (!title.includes(q) && !desc.includes(q) && !sub.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const handleOpenRecordModal = (task: DailyTask) => {
    setSelectedTaskForRecord(task);
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmitSuccess = () => {
    setSuccessToast('Geciken ödev çalışması başarıyla kaydedildi ve öğretmenin onayına gönderildi!');
    setIsRecordModalOpen(false);
    setSelectedTaskForRecord(null);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Geciken Ödevler</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Teslim tarihi geçmiş veya tamamlanmamış görevlerinizi buradan inceleyebilir ve sonradan çalışma kaydı girerek tamamlayabilirsiniz.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold shrink-0">
          <Clock className="w-4 h-4" />
          <span>{overdueTasks.length} Gecikmiş Görev</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ders veya kaynak ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Ders:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="ALL">Tüm Dersler</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Harika! Geciken Ödeviniz Bulunmuyor</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Teslim tarihi geçmiş hiçbir ödeviniz yok. Haftalık programınızı veya bugünün ödevlerini takip etmeye devam edebilirsiniz.
          </p>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('student-tasks')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <span>Tüm Ödevlerime Dön</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const subject = subjects.find((s) => s.id === task.subjectId);
            const resource = resources.find((r) => r.id === task.resourceId);
            const calc = getTaskRealization(task.id);
            const targetQuestions = task.targetQuestionCount || 0;
            const targetDuration = task.targetDurationMinutes || 0;
            const dueDateStr = task.dueDate || task.taskDate;

            return (
              <div 
                key={task.id}
                className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {subject?.name || 'Ders'}
                        </span>
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Gecikmiş
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1.5">
                        {resource?.title || 'Ödev Görevi'}
                      </h3>
                      {task.startPage !== undefined && task.endPage !== undefined && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Sayfa {task.startPage} - {task.endPage}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Son Tarih</span>
                      <span className="text-xs font-bold text-rose-700">{dueDateStr}</span>
                    </div>
                  </div>

                  {/* Progress & Target Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block">Hedef:</span>
                      <span className="font-bold text-slate-800">
                        {targetQuestions > 0 ? `${targetQuestions} soru` : '-'}
                        {targetDuration > 0 ? ` (${targetDuration} dk)` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gerçekleşme:</span>
                      <span className="font-bold text-slate-800">
                        {calc.actualQuestions} / {targetQuestions || 0} soru
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="mt-3 text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Orijinal tarih: <span className="font-medium text-slate-600">{task.taskDate}</span>
                  </div>
                  <button
                    onClick={() => handleOpenRecordModal(task)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Çalışma Kaydı Gir / Tamamla</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Study Record Modal */}
      {selectedTaskForRecord && (
        <StudyRecordModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setSelectedTaskForRecord(null);
          }}
          task={selectedTaskForRecord}
          onSuccess={handleRecordSubmitSuccess}
        />
      )}
    </div>
  );
};
