import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  BookOpen, 
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface TeacherReportsProps {
  onSelectStudent: (studentId: string) => void;
}

export const TeacherReports: React.FC<TeacherReportsProps> = ({ onSelectStudent }) => {
  const { 
    studentProfiles, 
    users, 
    dailyTasks, 
    studyRecords, 
    subjects, 
    resources, 
    classes,
    getStudentSummary 
  } = useApp();

  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Overall calculations
  const totalPlannedQuestions = dailyTasks.reduce((s, t) => s + (t.targetQuestionCount || 0), 0);
  const totalActualQuestions = studyRecords.reduce((s, r) => s + r.actualQuestionCount, 0);
  const overallQuestionRate = totalPlannedQuestions > 0 
    ? Math.round((totalActualQuestions / totalPlannedQuestions) * 100) 
    : 0;

  const totalPlannedMinutes = dailyTasks.reduce((s, t) => s + (t.targetDurationMinutes || 0), 0);
  const totalActualMinutes = studyRecords.reduce((s, r) => s + r.actualDurationMinutes, 0);
  const overallTimeRate = totalPlannedMinutes > 0 
    ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100) 
    : 0;

  const completedTasksCount = dailyTasks.filter((t) => t.isCompleted).length;
  const overallTaskRate = dailyTasks.length > 0 
    ? Math.round((completedTasksCount / dailyTasks.length) * 100) 
    : 0;

  // Overdue incomplete tasks
  const overdueTasks = dailyTasks.filter((t) => !t.isCompleted && t.taskDate <= '2026-09-01');

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Öğretmen Analiz & Raporlar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Planlanan ve gerçekleşen çalışma karşılaştırmaları, eksik kalan görevler
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'daily' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'weekly' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Bu Hafta
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'monthly' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Bu Ay
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Soru Karşılaştırma */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Soru Başarısı</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              %{overallQuestionRate}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900">{totalActualQuestions}</span>
              <span className="text-xs text-slate-400 ml-1">çözüldü</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-500">Hedef: {totalPlannedQuestions}</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overallQuestionRate)}%` }}
            />
          </div>
        </div>

        {/* Süre Karşılaştırma */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Çalışma Süresi</span>
            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
              %{overallTimeRate}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900">{Math.round(totalActualMinutes / 60)} sa</span>
              <span className="text-xs text-slate-400 ml-1">({totalActualMinutes} dk)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-500">Hedef: {Math.round(totalPlannedMinutes / 60)} sa</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overallTimeRate)}%` }}
            />
          </div>
        </div>

        {/* Görev Oranı */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Görev Tamamlama</span>
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
              %{overallTaskRate}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900">{completedTasksCount}</span>
              <span className="text-xs text-slate-400 ml-1">tamamlanan</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-500">Toplam: {dailyTasks.length}</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallTaskRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2-Column: Student Performance Breakdown & Attention Needed Overdue List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Student Performance Ranking */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Öğrenci Bazlı Başarı Sıralaması</h2>
              <p className="text-xs text-slate-500 mt-0.5">Planlanan hedeflere ulaşma oranları</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {studentProfiles.map((student) => {
              const user = users.find((u) => u.id === student.userId);
              const summary = getStudentSummary(student.id);

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={user?.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{user?.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {summary.actualQuestions} / {summary.plannedQuestions} Soru • {summary.actualMinutes} dk
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                        <span>{summary.questionDisplayText} Soru</span>
                        {summary.isQuestionOverTarget && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                            {summary.questionExtraBadgeText}
                          </span>
                        )}
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            summary.questionSuccessRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${summary.displayQuestionSuccessRate}%` }}
                        />
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Attention Needed (Overdue or Inactive Tasks) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="font-bold text-slate-900 text-base">Dikkat Gerektiren Görevler</h2>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
            {overdueTasks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Geciken görev bulunmamaktadır. Tüm öğrenciler güncel.
              </div>
            ) : (
              overdueTasks.map((t) => {
                const student = studentProfiles.find((s) => s.id === t.studentId);
                const user = users.find((u) => u.id === student?.userId);
                const sub = subjects.find((s) => s.id === t.subjectId);

                return (
                  <div key={t.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{user?.fullName}</span>
                      <span className="text-rose-600 font-semibold text-[10px]">{t.dayOfWeek}</span>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium text-rose-700">{sub?.name}:</span> {t.description || 'Ödev'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hedef: {t.targetQuestionCount} soru • {t.targetDurationMinutes} dk (Kayıt Girilmedi)
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
