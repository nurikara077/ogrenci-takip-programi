import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  Calendar,
  BookOpen
} from 'lucide-react';

export const StudentPerformanceView: React.FC = () => {
  const { 
    currentUser, 
    studentProfiles, 
    studyRecords, 
    dailyTasks, 
    subjects, 
    resources,
    getStudentSummary 
  } = useApp();

  const currentStudent = studentProfiles.find((sp) => sp.userId === currentUser.id);
  const studentId = currentStudent?.id || 'sp-mehmet';

  const summary = getStudentSummary(studentId);
  const myRecords = studyRecords.filter((r) => r.studentId === studentId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Performansım & Gelişimim</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Haftalık çalışma hedeflerine ulaşma oranın ve geçmiş çalışma kayıtların
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-900">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>4 Günlük Çalışma Serisi!</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Toplam Soru */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Bu Hafta Çözülen Soru
          </div>
          <div className="flex items-baseline justify-between flex-wrap gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {summary.actualQuestions} <span className="text-sm font-normal text-slate-400">/ {summary.plannedQuestions}</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {summary.questionDisplayText}
              </span>
              {summary.isQuestionOverTarget && (
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {summary.questionExtraBadgeText}
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.displayQuestionSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Çalışma Süresi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Toplam Çalışma Süresi
          </div>
          <div className="flex items-baseline justify-between flex-wrap gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {Math.round(summary.actualMinutes / 60)} sa {summary.actualMinutes % 60} dk
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {summary.timeDisplayText}
              </span>
              {summary.isTimeOverTarget && (
                <span className="text-xs font-bold text-indigo-900 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                  {summary.timeExtraBadgeText}
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.displayTimeSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Tamamlanan Görevler */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tamamlanan Görev
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {summary.completedTasksCount} <span className="text-sm font-normal text-slate-400">/ {summary.totalTasksCount}</span>
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              %{summary.taskSuccessRate}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.taskSuccessRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Study Records History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Geçmiş Çalışma Kayıtlarım
          </h2>
          <span className="text-xs text-slate-400 font-medium">Toplam {myRecords.length} kayıt</span>
        </div>

        <div className="divide-y divide-slate-100">
          {myRecords.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Henüz bir çalışma kaydı girmedin. Görevlerini tamamladıkça kayıtların burada birikecek.
            </div>
          ) : (
            myRecords.map((rec) => {
              const sub = subjects.find((s) => s.id === rec.subjectId);
              const res = resources.find((r) => r.id === rec.resourceId);

              return (
                <div key={rec.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sub?.colorHex || '#10B981' }}
                      />
                      <span className="text-xs font-bold text-slate-900">{sub?.name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">{res?.title || 'Ödev'}</span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>{new Date(rec.recordDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      {rec.completedStartPage && (
                        <span>• Sayfa {rec.completedStartPage}-{rec.completedEndPage}</span>
                      )}
                    </div>

                    {rec.studentNotes && (
                      <div className="text-xs italic text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{rec.studentNotes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs">
                      {rec.actualQuestionCount} Soru
                    </span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs">
                      {rec.actualDurationMinutes} Dakika
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
