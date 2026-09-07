import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTask } from '../../types';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Lock, PlusCircle } from 'lucide-react';
import { StudyRecordModal } from './StudyRecordModal';
import { DEFAULT_SIMULATION_DATE } from '../../utils/dateUtils';

type TaskSection = {
  id: 'overdue' | 'current' | 'upcoming';
  title: string;
  description: string;
  tasks: DailyTask[];
  tone: 'rose' | 'blue' | 'slate';
};

export const StudentTasksView: React.FC = () => {
  const {
    currentUser,
    studentProfiles,
    dailyTasks,
    resources,
    subjects,
    getTaskRealization,
    isTaskOverdue,
  } = useApp();

  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const currentStudent = studentProfiles.find((student) => student.userId === currentUser.id);
  const studentId = currentStudent?.id;
  const today = DEFAULT_SIMULATION_DATE;

  const myTasks = useMemo(
    () => dailyTasks
      .filter((task) => task.studentId === studentId && !task.isDeleted)
      .sort((left, right) => (left.startDate || left.taskDate).localeCompare(right.startDate || right.taskDate)),
    [dailyTasks, studentId]
  );

  const sections = useMemo<TaskSection[]>(() => {
    const openTasks = myTasks.filter((task) => {
      const realization = getTaskRealization(task.id);
      return realization.verificationStatus !== 'VERIFIED';
    });

    const overdue = openTasks.filter((task) => isTaskOverdue(task, today));
    const upcoming = openTasks.filter((task) => (task.startDate || task.taskDate) > today);
    const current = openTasks.filter((task) => !overdue.includes(task) && !upcoming.includes(task));

    return [
      {
        id: 'overdue',
        title: 'Eksik kalan ödevler',
        description: 'Geçmiş haftalardan kalan görevler. İstersen şimdi tamamlayabilirsin.',
        tasks: overdue,
        tone: 'rose',
      },
      {
        id: 'current',
        title: 'Şimdi yapabileceklerin',
        description: 'Başlangıç tarihi gelmiş, açık görevlerin.',
        tasks: current,
        tone: 'blue',
      },
      {
        id: 'upcoming',
        title: 'Yaklaşan ödevler',
        description: 'Öğretmeninin gelecek günler için dağıttığı plan.',
        tasks: upcoming,
        tone: 'slate',
      },
    ];
  }, [getTaskRealization, isTaskOverdue, myTasks, today]);

  const openTaskCount = sections.reduce((total, section) => total + section.tasks.length, 0);

  const sectionStyle = {
    rose: 'border-rose-200 bg-rose-50/40 text-rose-800',
    blue: 'border-blue-200 bg-blue-50/40 text-blue-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ödev Takibim</p>
        <div className="mt-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Merhaba, {currentUser.fullName.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-slate-600">Geçmişten kalanları, bugünün görevlerini ve gelecek planını tek yerde gör.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-700">
            {openTaskCount} açık ödev
          </span>
        </div>
      </section>

      {openTaskCount === 0 ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-11 h-11 text-emerald-500 mx-auto" />
          <h2 className="mt-3 font-bold text-slate-900">Açık ödevin yok</h2>
          <p className="mt-1 text-sm text-slate-500">Öğretmenin yeni bir plan oluşturduğunda burada görünecek.</p>
        </section>
      ) : (
        sections.map((section) => section.tasks.length > 0 && (
          <section key={section.id} className="space-y-3">
            <div className={`rounded-xl border px-4 py-3 ${sectionStyle[section.tone]}`}>
              <div className="flex items-center gap-2">
                {section.id === 'overdue' ? <AlertTriangle className="w-4 h-4" /> : section.id === 'upcoming' ? <CalendarDays className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
                <h2 className="font-bold text-sm">{section.title}</h2>
              </div>
              <p className="mt-0.5 text-xs opacity-80">{section.description}</p>
            </div>

            <div className="space-y-3">
              {section.tasks.map((task) => {
                const resource = resources.find((item) => item.id === task.resourceId);
                const subject = subjects.find((item) => item.id === task.subjectId);
                const realization = getTaskRealization(task.id);
                const startDate = task.startDate || task.taskDate;
                const dueDate = task.dueDate || task.taskDate;
                const isOverdue = isTaskOverdue(task, today);
                const isFuture = startDate > today;
                const isVerified = realization.verificationStatus === 'VERIFIED';
                const isRejected = realization.verificationStatus === 'REJECTED';
                const hasRecord = realization.actualQuestions > 0 || realization.actualMinutes > 0;

                let actionLabel = 'Çalışmayı kaydet';
                if (isOverdue) actionLabel = 'Geç tamamla';
                if (isRejected) actionLabel = 'Tekrar kaydet';
                if (hasRecord && !isRejected) actionLabel = 'Kaydı güncelle';

                return (
                  <article key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
                          style={{ backgroundColor: subject?.colorHex || '#2563EB' }}
                        >
                          {subject?.name || 'Genel'}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm truncate">{resource?.title || 'Serbest çalışma'}</span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <Lock className="w-3 h-3" /> Onaylandı
                          </span>
                        ) : isRejected ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">Düzeltme istendi</span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">Gecikmiş</span>
                        ) : hasRecord ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Kontrol bekliyor</span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {task.description || (task.startPage ? `Sayfa ${task.startPage} - ${task.endPage}` : 'Çalışma görevi')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Başlangıç: <strong className="text-slate-700">{startDate}</strong></span>
                        <span>Son teslim: <strong className={isOverdue ? 'text-rose-700' : 'text-slate-700'}>{dueDate}</strong></span>
                        {task.targetQuestionCount ? <span>{task.targetQuestionCount} soru</span> : null}
                        {task.targetDurationMinutes ? <span>{task.targetDurationMinutes} dk</span> : null}
                        {task.startPage && task.endPage ? <span>Sayfa {task.startPage}-{task.endPage}</span> : null}
                      </div>
                      {isRejected && task.verificationNote && (
                        <p className="mt-2 text-xs text-rose-700">Öğretmen notu: {task.verificationNote}</p>
                      )}
                    </div>

                    {isFuture ? (
                      <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600">
                        {startDate} tarihinde başlar
                      </span>
                    ) : isVerified ? (
                      <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700">
                        Kayıt kilitlendi
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        {actionLabel}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      {selectedTask && (
        <StudyRecordModal
          isOpen={true}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
