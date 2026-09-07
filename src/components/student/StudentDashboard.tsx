import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Flame, 
  ArrowRight, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { StudyRecordModal } from './StudyRecordModal';
import { DailyTask } from '../../types';

interface StudentDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateTab }) => {
  const { 
    currentUser, 
    studentProfiles, 
    dailyTasks, 
    studyRecords, 
    subjects, 
    resources,
    studentResources,
    getResourceProgress,
    getTaskRealization,
    isTaskActiveOnDate
  } = useApp();

  const currentStudent = studentProfiles.find((sp) => sp.userId === currentUser.id);
  const studentId = currentStudent?.id || 'sp-mehmet';

  // Modal state
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<DailyTask | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Today is Pazartesi in current simulation week: 2026-08-31
  const todayDateStr = '2026-08-31';

  // Today's tasks (active on today)
  const todaysTasks = dailyTasks.filter(
    (t) => t.studentId === studentId && !t.isDeleted && isTaskActiveOnDate(t, todayDateStr)
  );

  // Today's study records
  const todaysRecords = studyRecords.filter(
    (r) => r.studentId === studentId && r.recordDate === todayDateStr
  );

  const totalPlannedQuestionsToday = todaysTasks.reduce((s, t) => s + (t.targetQuestionCount || 0), 0);
  const totalActualQuestionsToday = todaysRecords.reduce((s, r) => s + r.actualQuestionCount, 0);
  const todayQuestionProgress = totalPlannedQuestionsToday > 0 
    ? Math.round((totalActualQuestionsToday / totalPlannedQuestionsToday) * 100)
    : (todaysRecords.length > 0 ? 100 : 0);

  const totalPlannedMinutesToday = todaysTasks.reduce((s, t) => s + (t.targetDurationMinutes || 0), 0);
  const totalActualMinutesToday = todaysRecords.reduce((s, r) => s + r.actualDurationMinutes, 0);

  const completedCount = todaysTasks.filter((t) => t.isCompleted).length;

  const handleOpenRecordModal = (task: DailyTask) => {
    setSelectedTaskForRecord(task);
    setIsRecordModalOpen(true);
  };

  // Student assigned books
  const myAssignedBooks = studentResources.filter((sr) => sr.studentId === studentId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Greeting & Daily Motivational Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Bugün Ne Yapacağım?
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Merhaba, {currentUser.fullName.split(' ')[0]}! 📚
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-md">
            Bugün için planlanan <span className="font-bold text-white">{todaysTasks.length} çalışma görevin</span> var.{' '}
            {completedCount === todaysTasks.length && todaysTasks.length > 0
              ? 'Tebrikler! Bugünkü tüm görevlerini tamamladın! 🎉'
              : 'Hadi, ilk görevini tamamlayıp kaydını gir!'}
          </p>

          {/* Quick Streak & Daily Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>4 Günlük Seri</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>
                {completedCount}/{todaysTasks.length} Görev Tamamlandı
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Dual Progress Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Soru Hedefi İlerlemesi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bugünkü Soru Hedefin
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              %{todayQuestionProgress}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">
              {totalActualQuestionsToday} <span className="text-sm font-medium text-slate-400">/ {totalPlannedQuestionsToday} Soru</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {Math.max(0, totalPlannedQuestionsToday - totalActualQuestionsToday)} soru kaldı
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, todayQuestionProgress)}%` }}
            />
          </div>
        </div>

        {/* Çalışma Süresi İlerlemesi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bugünkü Çalışma Süren
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalActualMinutesToday} Dakika
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">
              {totalActualMinutesToday} <span className="text-sm font-medium text-slate-400">/ {totalPlannedMinutesToday} Dk</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Hedef çalışma süresi
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalPlannedMinutesToday > 0 ? Math.min(100, Math.round((totalActualMinutesToday / totalPlannedMinutesToday) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* TODAY'S TASK LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Bugünün Görev Listesi</h2>
            <p className="text-xs text-slate-500 mt-0.5">31 Ağustos Pazartesi</p>
          </div>

          <button
            onClick={() => onNavigateTab('student-weekly')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Tüm Haftayı Gör <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {todaysTasks.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">Bugün için görev tanımlanmamış</h3>
              <p className="text-xs text-slate-500 mt-1">Öğretmeniniz yeni görev atadığında burada görünecektir.</p>
            </div>
          ) : (
            todaysTasks.map((task) => {
              const subject = subjects.find((s) => s.id === task.subjectId);
              const resource = resources.find((r) => r.id === task.resourceId);
              const record = todaysRecords.find((r) => r.dailyTaskId === task.id);
              const realization = getTaskRealization(task.id);

              return (
                <div
                  key={task.id}
                  className={`p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    realization.status === 'COMPLETED'
                      ? 'bg-emerald-50/30'
                      : realization.status === 'LATE_COMPLETED'
                      ? 'bg-amber-50/30 border border-amber-200'
                      : realization.status === 'OVERDUE'
                      ? 'bg-rose-50/30'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: subject?.colorHex || '#10B981' }}
                      />
                      <span className="text-xs font-bold text-slate-800">{subject?.name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 font-medium">{resource?.publisher || 'Ödev'}</span>
                      
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${realization.statusColor.badgeBg} ${realization.statusColor.badgeText} ${realization.statusColor.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${realization.statusColor.dotColor}`} />
                        {realization.statusLabel}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{resource?.title || 'Ödev Görevi'}</h3>

                    {task.startPage && task.endPage && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sayfa {task.startPage} - {task.endPage} arasını çöz</span>
                      </div>
                    )}

                    {task.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        {task.description}
                      </p>
                    )}

                    {/* Targets summary chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
                        Hedef: {task.targetQuestionCount} Soru
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
                        Süre: {task.targetDurationMinutes} dk
                      </span>
                    </div>

                    {/* Actual record summary if completed / recorded */}
                    {record && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div>
                            <span className="font-bold">Çalışman Kaydedildi:</span> {record.actualQuestionCount}/{task.targetQuestionCount || 0} Soru •{' '}
                            {record.actualDurationMinutes} Dakika
                            {record.completedStartPage && (
                              <span className="ml-1 text-emerald-800">
                                (Sayfa {record.completedStartPage}-{record.completedEndPage})
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                            Gerçekleşme: {realization.questionDisplayText}
                          </span>
                          {realization.isQuestionOverTarget && (
                            <span className="font-bold text-emerald-900 bg-emerald-300/80 px-2 py-0.5 rounded border border-emerald-400">
                              {realization.questionExtraBadgeText}
                            </span>
                          )}
                          {realization.isTimeOverTarget && (
                            <span className="font-bold text-emerald-900 bg-emerald-300/80 px-2 py-0.5 rounded border border-emerald-400">
                              {realization.timeExtraBadgeText}
                            </span>
                          )}
                        </div>
                        {record.studentNotes && (
                          <span className="text-[11px] italic text-emerald-700">"{record.studentNotes}"</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button: The Fast <1min Study Log */}
                  <div className="sm:text-right shrink-0">
                    {task.isCompleted ? (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Tamamlandı
                        </div>
                        <div>
                          <button
                            onClick={() => handleOpenRecordModal(task)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                          >
                            Kaydı Düzenle
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenRecordModal(task)}
                        className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Çalışmayı Kaydet
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Assigned Books Quick Progress Widget */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">Kaynak Kitap İlerlemen</h2>
          </div>
          <button
            onClick={() => onNavigateTab('student-resources')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Sayfa Matrisini Gör <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myAssignedBooks.map((sr) => {
            const res = resources.find((r) => r.id === sr.resourceId);
            const progress = getResourceProgress(studentId, sr.resourceId);

            return (
              <div key={sr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs line-clamp-1">{res?.title}</span>
                  <span className="text-xs font-bold text-emerald-700">%{progress.percentage}</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{progress.completedCount} / {progress.totalCount} tekil sayfa çözüldü</span>
                  <span className="text-emerald-600 font-semibold">Devam Et</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Study Record Modal */}
      <StudyRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        task={selectedTaskForRecord}
      />
    </div>
  );
};
