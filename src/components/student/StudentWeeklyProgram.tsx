import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { StudyRecordModal } from './StudyRecordModal';
import { DailyTask } from '../../types';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'] as const;

export const StudentWeeklyProgram: React.FC = () => {
  const { currentUser, studentProfiles, dailyTasks, studyRecords, subjects, resources, getTaskRealization } = useApp();

  const currentStudent = studentProfiles.find((sp) => sp.userId === currentUser.id);
  const studentId = currentStudent?.id || 'sp-mehmet';

  const [selectedWeek, setSelectedWeek] = useState<'PREV' | 'CURRENT' | 'NEXT'>('CURRENT');
  const [activeDay, setActiveDay] = useState<typeof DAYS[number]>('Pazartesi');
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<DailyTask | null>(null);

  const studentTasks = dailyTasks.filter((t) => t.studentId === studentId);
  const dayTasks = studentTasks.filter((t) => t.dayOfWeek === activeDay);

  const datesMap: Record<string, string> = selectedWeek === 'CURRENT' ? {
    Pazartesi: '31 Ağustos',
    Salı: '1 Eylül',
    Çarşamba: '2 Eylül',
    Perşembe: '3 Eylül',
    Cuma: '4 Eylül',
    Cumartesi: '5 Eylül',
    Pazar: '6 Eylül',
  } : selectedWeek === 'PREV' ? {
    Pazartesi: '24 Ağustos',
    Salı: '25 Ağustos',
    Çarşamba: '26 Ağustos',
    Perşembe: '27 Ağustos',
    Cuma: '28 Ağustos',
    Cumartesi: '29 Ağustos',
    Pazar: '30 Ağustos',
  } : {
    Pazartesi: '7 Eylül',
    Salı: '8 Eylül',
    Çarşamba: '9 Eylül',
    Perşembe: '10 Eylül',
    Cuma: '11 Eylül',
    Cumartesi: '12 Eylül',
    Pazar: '13 Eylül',
  };

  const handleJumpToToday = () => {
    setSelectedWeek('CURRENT');
    setActiveDay('Pazartesi');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Week Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Haftalık Ders ve Ödev Programım</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Haftanın günlerine göre düzenlenmiş çalışma programınızı takip edin.
          </p>
        </div>

        {/* 4 Simple Controls: Önceki Hafta, Bu Hafta, Sonraki Hafta, Bugün */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedWeek('PREV')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedWeek === 'PREV' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Önceki Hafta
          </button>
          <button
            onClick={() => setSelectedWeek('CURRENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedWeek === 'CURRENT' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bu Hafta
          </button>
          <button
            onClick={() => setSelectedWeek('NEXT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedWeek === 'NEXT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sonraki Hafta
          </button>
          <button
            onClick={handleJumpToToday}
            className="ml-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            Bugün
          </button>
        </div>
      </div>

      {/* Days Horizontal Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((day) => {
          const count = studentTasks.filter((t) => t.dayOfWeek === day).length;
          const completedCount = studentTasks.filter((t) => t.dayOfWeek === day && t.isCompleted).length;
          const isActive = activeDay === day;

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`p-3 rounded-2xl text-left border transition-all shrink-0 min-w-[105px] ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`text-[11px] font-medium ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                {datesMap[day]}
              </div>
              <div className="font-bold text-sm mt-0.5">{day}</div>
              <div className={`text-[10px] mt-1 font-semibold ${isActive ? 'text-emerald-200' : 'text-slate-500'}`}>
                {completedCount}/{count} Görev
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Day Task Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">
            {activeDay} ({datesMap[activeDay]}) Görevleri
          </h2>
          <span className="text-xs text-slate-400 font-medium">Toplam {dayTasks.length} Görev</span>
        </div>

        <div className="divide-y divide-slate-100">
          {dayTasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Bu gün için atanmış herhangi bir ödev görevi bulunmamaktadır. Dinlenebilir veya serbest soru çözebilirsin.
            </div>
          ) : (
            dayTasks.map((task) => {
              const sub = subjects.find((s) => s.id === task.subjectId);
              const res = resources.find((r) => r.id === task.resourceId);
              const record = studyRecords.find((r) => r.dailyTaskId === task.id);
              const realization = getTaskRealization(task.id);

              return (
                <div
                  key={task.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    realization.status === 'COMPLETED'
                      ? 'bg-emerald-50/20'
                      : realization.status === 'LATE_COMPLETED'
                      ? 'bg-amber-50/20 border border-amber-200'
                      : realization.status === 'OVERDUE'
                      ? 'bg-rose-50/30 border border-rose-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sub?.colorHex || '#10B981' }}
                      />
                      <span className="text-xs font-bold text-slate-800">{sub?.name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">{res?.publisher || 'Ödev'}</span>
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${realization.statusColor.badgeBg} ${realization.statusColor.badgeText} ${realization.statusColor.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${realization.statusColor.dotColor}`} />
                        {realization.statusLabel}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{res?.title || 'Ödev Görevi'}</h3>

                    {task.startPage && task.endPage && (
                      <div className="text-xs text-slate-500">
                        Sayfa: {task.startPage} - {task.endPage}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        Hedef: {task.targetQuestionCount} Soru
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        Süre: {task.targetDurationMinutes} dk
                      </span>
                    </div>

                    {record && (
                      <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div>
                            <span className="font-bold">Gerçekleşen:</span> {record.actualQuestionCount}/{task.targetQuestionCount || 0} Soru • {record.actualDurationMinutes} dk
                          </div>
                          <span className="font-extrabold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">
                            {realization.questionDisplayText}
                          </span>
                          {realization.isQuestionOverTarget && (
                            <span className="font-bold text-emerald-900 bg-emerald-300/90 px-2 py-0.5 rounded border border-emerald-400">
                              {realization.questionExtraBadgeText}
                            </span>
                          )}
                          {realization.isTimeOverTarget && (
                            <span className="font-bold text-emerald-900 bg-emerald-300/90 px-2 py-0.5 rounded border border-emerald-400">
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

                  <div className="shrink-0 flex items-center gap-2">
                    {task.isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tamamlandı
                        </span>
                        <button
                          onClick={() => setSelectedTaskForRecord(task)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
                        >
                          Düzenle
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedTaskForRecord(task)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                      >
                        Kaydet
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Record Modal */}
      <StudyRecordModal
        isOpen={Boolean(selectedTaskForRecord)}
        onClose={() => setSelectedTaskForRecord(null)}
        task={selectedTaskForRecord}
      />
    </div>
  );
};
