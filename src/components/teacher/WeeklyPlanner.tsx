import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Trash2, 
  Edit2, 
  BookOpen,
  Wand2,
  X,
  Check,
  Copy,
  AlertCircle
} from 'lucide-react';
import { TaskModal } from './TaskModal';
import { DailyTask } from '../../types';
import { 
  DEFAULT_SIMULATION_DATE, 
  DEFAULT_SIMULATION_WEEK_START, 
  getWeekDates, 
  formatDateTR, 
  formatDateRange, 
  shiftDate 
} from '../../utils/dateUtils';

interface WeeklyPlannerProps {
  initialStudentId?: string;
}

const DAYS_OF_WEEK = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'] as const;

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ initialStudentId }) => {
  const { 
    studentProfiles, 
    users, 
    classes,
    dailyTasks, 
    subjects, 
    resources, 
    teacherProfiles, 
    currentUser,
    deleteDailyTask,
    addDailyTask,
    copyDailyTask,
    getTaskRealization,
    getTeacherStudents,
    studentResources,
    updateStudentResource,
    assignResourceToStudent,
    verifyDailyTask,
    rejectDailyTask,
    canTeacherAccessTask,
    canTeacherAccessResource
  } = useApp();

  const accessibleStudents = currentUser.role === 'TEACHER'
    ? getTeacherStudents(currentUser.id)
    : studentProfiles;

  // Only show resources authorized for this teacher
  const allowedWizardResources = currentUser.role === 'TEACHER'
    ? resources.filter((r) => canTeacherAccessResource(currentUser.id, r.id))
    : resources.filter((r) => !r.isArchived && r.status !== 'ARCHIVED');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId && accessibleStudents.some(s => s.id === initialStudentId)) {
      return initialStudentId;
    }
    return accessibleStudents[0]?.id || '';
  });

  // Week navigation state (defaults to simulation week 2026-08-31)
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(DEFAULT_SIMULATION_WEEK_START);
  const [showPastTasksBanner, setShowPastTasksBanner] = useState<boolean>(true);

  // Rejection note modal state
  const [rejectModalTaskId, setRejectModalTaskId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');

  // Sync if accessibleStudents change
  React.useEffect(() => {
    if (!accessibleStudents.some((s) => s.id === selectedStudentId)) {
      if (accessibleStudents.length > 0) {
        setSelectedStudentId(accessibleStudents[0].id);
      }
    }
  }, [accessibleStudents, selectedStudentId]);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<typeof DAYS_OF_WEEK[number]>('Pazartesi');
  const [selectedDate, setSelectedDate] = useState('2026-08-31');
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  // Smart Distribution Wizard Modal state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardResource, setWizardResource] = useState('res-fenomen-f3');
  const [wizardStartPage, setWizardStartPage] = useState(60);
  const [wizardEndPage, setWizardEndPage] = useState(91);
  const [wizardDailyQuestions, setWizardDailyQuestions] = useState(12);
  const [wizardDailyMinutes, setWizardDailyMinutes] = useState(45);
  const [wizardError, setWizardError] = useState('');
  const [autoExpandScope, setAutoExpandScope] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Handle opening wizard with auto-detected student scope
  const handleOpenWizard = () => {
    setWizardError('');
    const studentAssigned = studentResources.filter(
      (sr) => sr.studentId === selectedStudentId && 
             sr.status === 'ACTIVE' &&
             (currentUser.role !== 'TEACHER' || canTeacherAccessResource(currentUser.id, sr.resourceId))
    );

    let targetResId = allowedWizardResources.some((r) => r.id === wizardResource)
      ? wizardResource
      : (allowedWizardResources[0]?.id || '');
    let targetStart = 60;
    let targetEnd = 91;

    if (studentAssigned.length > 0) {
      const match = studentAssigned.find((sr) => sr.resourceId === targetResId);
      if (match) {
        targetStart = match.assignedStartPage;
        targetEnd = match.assignedEndPage;
      } else {
        targetResId = studentAssigned[0].resourceId;
        targetStart = studentAssigned[0].assignedStartPage;
        targetEnd = studentAssigned[0].assignedEndPage;
      }
    } else {
      const res = allowedWizardResources.find((r) => r.id === targetResId);
      if (res) {
        targetStart = res.startPage || 1;
        targetEnd = res.endPage || res.totalPages || 100;
      }
    }

    setWizardResource(targetResId);
    setWizardStartPage(targetStart);
    setWizardEndPage(targetEnd);
    setShowWizard(true);
  };

  const handleWizardResourceChange = (resId: string) => {
    setWizardResource(resId);
    setWizardError('');
    const assigned = studentResources.find(
      (sr) => sr.studentId === selectedStudentId && sr.resourceId === resId
    );
    if (assigned) {
      setWizardStartPage(assigned.assignedStartPage);
      setWizardEndPage(assigned.assignedEndPage);
    } else {
      const res = resources.find((r) => r.id === resId);
      if (res) {
        setWizardStartPage(res.startPage || 1);
        setWizardEndPage(res.endPage || res.totalPages || 100);
      }
    }
  };

  // Copy Task Modal state
  const [copyModalTask, setCopyModalTask] = useState<DailyTask | null>(null);
  const [copyTargetDay, setCopyTargetDay] = useState<typeof DAYS_OF_WEEK[number]>('Cuma');
  const [copyTargetDate, setCopyTargetDate] = useState('2026-09-04');
  const [copyTargetStudentId, setCopyTargetStudentId] = useState<string>(selectedStudentId);
  const [copyError, setCopyError] = useState('');

  const handleOpenCopyModal = (task: DailyTask) => {
    setCopyModalTask(task);
    setCopyTargetDay('Cuma');
    setCopyTargetDate(weekDatesMap['Cuma']);
    setCopyTargetStudentId(task.studentId);
    setCopyError('');
  };

  const handleConfirmCopy = () => {
    if (!copyModalTask) return;
    setCopyError('');
    try {
      copyDailyTask(copyModalTask.id, copyTargetDate, copyTargetDay, copyTargetStudentId);
      setToastMessage(`Görev başarıyla ${copyTargetDay} gününe kopyalandı ve bağımsız yeni görev oluşturuldu!`);
      setCopyModalTask(null);
    } catch (err: any) {
      setCopyError(err.message || 'Görev kopyalanırken bir hata oluştu.');
    }
  };

  const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);

  // Dynamic week days based on currentWeekStart
  const weekDays = React.useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  const weekDatesMap: Record<string, string> = React.useMemo(() => {
    const map: Record<string, string> = {};
    weekDays.forEach((d) => {
      map[d.dayOfWeek] = d.dateStr;
    });
    return map;
  }, [weekDays]);

  const isCurrentWeek = currentWeekStart === DEFAULT_SIMULATION_WEEK_START;
  const isPastWeek = currentWeekStart < DEFAULT_SIMULATION_WEEK_START;
  const currentWeekEnd = shiftDate(currentWeekStart, 6);
  const weekRangeFormatted = formatDateRange(currentWeekStart, currentWeekEnd);

  // Active week's dates list
  const activeWeekDateStrings = React.useMemo(() => Object.values(weekDatesMap), [weekDatesMap]);

  // Tasks for this student in the currently selected week (Teacher sees only authorized tasks)
  const studentTasks = dailyTasks.filter(
    (t) => t.studentId === selectedStudentId && 
           activeWeekDateStrings.includes(t.taskDate) &&
           (currentUser.role !== 'TEACHER' || canTeacherAccessTask(currentUser.id, t.id))
  );

  // Incomplete / overdue past tasks (before simulation date 2026-09-03)
  const pastIncompleteTasks = dailyTasks.filter(
    (t) => t.studentId === selectedStudentId && 
           !t.isCompleted && 
           t.taskDate < DEFAULT_SIMULATION_DATE &&
           (currentUser.role !== 'TEACHER' || canTeacherAccessTask(currentUser.id, t.id))
  );

  const handleOpenAddTask = (day: typeof DAYS_OF_WEEK[number]) => {
    setSelectedDay(day);
    setSelectedDate(weekDatesMap[day]);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Smart Distribution: splits pages across 5 days (Pazartesi - Cuma)
  const handleRunSmartDistribution = () => {
    setWizardError('');

    if (wizardStartPage > wizardEndPage) {
      setWizardError('Başlangıç sayfası bitiş sayfasından büyük olamaz.');
      return;
    }

    if (wizardDailyQuestions <= 0 && wizardDailyMinutes <= 0) {
      setWizardError('Lütfen en az bir hedef soru sayısı veya çalışma süresi belirleyin.');
      return;
    }

    try {
      const res = resources.find((r) => r.id === wizardResource);
      const studentRes = studentResources.find(
        (sr) => sr.studentId === selectedStudentId && sr.resourceId === wizardResource
      );

      // If resource is not assigned to student yet, assign it
      if (!studentRes) {
        assignResourceToStudent(
          wizardResource,
          selectedStudentId,
          wizardStartPage,
          wizardEndPage,
          weekDatesMap['Cuma'],
          wizardDailyQuestions,
          'Haftalık akıllı dağıtım ile atandı'
        );
      } else if (
        autoExpandScope &&
        (wizardStartPage < studentRes.assignedStartPage || wizardEndPage > studentRes.assignedEndPage)
      ) {
        // Auto-expand scope if requested
        updateStudentResource(studentRes.id, {
          assignedStartPage: Math.min(studentRes.assignedStartPage, wizardStartPage),
          assignedEndPage: Math.max(studentRes.assignedEndPage, wizardEndPage),
        });
      }

      const totalPages = wizardEndPage - wizardStartPage + 1;
      const pagesPerDay = Math.max(1, Math.ceil(totalPages / 5));

      const daysList = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'] as const;
      let currentP = wizardStartPage;

      const subId = res?.subjectId || currentTeacherProfile?.branchSubjectId || 'sub-mat';

      daysList.forEach((day) => {
        if (currentP > wizardEndPage) return;
        const pStart = currentP;
        const pEnd = Math.min(wizardEndPage, currentP + pagesPerDay - 1);
        currentP = pEnd + 1;

        addDailyTask({
          weeklyPlanId: `wp-${selectedStudentId}-week1`,
          studentId: selectedStudentId,
          teacherId: currentTeacherProfile?.id || 'tp-ahmet',
          subjectId: subId,
          resourceId: wizardResource,
          taskDate: weekDatesMap[day],
          dayOfWeek: day,
          taskType: 'QUESTION_TARGET',
          targetQuestionCount: wizardDailyQuestions,
          targetDurationMinutes: wizardDailyMinutes,
          startPage: pStart,
          endPage: pEnd,
          description: `${res?.title || 'Kaynak'} otomatik dağıtılan ödev (Sayfa ${pStart}-${pEnd}).`,
          autoExpandScope: true,
        });
      });

      setShowWizard(false);
      setToastMessage('Sayfalar haftanın günlerine otomatik olarak başarıyla dağıtıldı!');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setWizardError(err.message || 'Sayfalar dağıtılırken bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Haftalık Çalışma Programlayıcı</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Pazartesi - Pazar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Öğrenciye gün bazlı ders, kaynak, sayfa ve soru hedefleri atayın
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Student Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Öğrenci:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {accessibleStudents.map((sp) => {
                const u = users.find((user) => user.id === sp.userId);
                const cls = classes.find((c) => c.id === sp.classId);
                return (
                  <option key={sp.id} value={sp.id}>
                    {u?.fullName} ({cls ? cls.name : 'Özel Ders'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Smart Distribution Helper Wizard Button */}
          <button
            onClick={handleOpenWizard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            title="Aynı kaynağın sayfalarını günlere otomatik böler"
          >
            <Wand2 className="w-4 h-4 text-indigo-600" />
            Akıllı Dağıtıcı
          </button>
        </div>
      </div>

      {/* Week Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100/90 px-4 py-3 rounded-2xl border border-slate-200 text-xs gap-3 shadow-2xs">
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCurrentWeekStart((prev) => shiftDate(prev, -7))}
            className="p-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-2xs flex items-center gap-1 font-semibold"
            title="Önceki Hafta"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Önceki Hafta</span>
          </button>

          <div className="flex items-center gap-2 font-bold text-slate-800 px-2 py-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{weekRangeFormatted}</span>
            {isCurrentWeek ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Bu Hafta (Aktif)
              </span>
            ) : isPastWeek ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Geçmiş Hafta
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Gelecek Hafta
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCurrentWeekStart((prev) => shiftDate(prev, 7))}
            className="p-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-2xs flex items-center gap-1 font-semibold"
            title="Sonraki Hafta"
          >
            <span className="hidden sm:inline">Sonraki Hafta</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => setCurrentWeekStart(DEFAULT_SIMULATION_WEEK_START)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
            >
              Bugüne Dön
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-3 text-slate-600 font-medium">
          <span>Bu Haftada: <strong className="text-slate-900 font-bold">{studentTasks.length}</strong> Görev</span>
          {pastIncompleteTasks.length > 0 && (
            <span className="text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5" />
              {pastIncompleteTasks.length} Gecikmiş / Geçmiş Görev
            </span>
          )}
        </div>
      </div>

      {/* Past Incomplete Tasks Notification / Action Drawer */}
      {pastIncompleteTasks.length > 0 && showPastTasksBanner && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-950">
                Geçmiş Tarihli Tamamlanmamış / Gecikmiş Görevler ({pastIncompleteTasks.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowPastTasksBanner(false)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
            >
              Gizle
            </button>
          </div>
          <p className="text-[11px] text-rose-800 leading-relaxed">
            Geçmiş tarihlerde kalan görevler, öğrenci kendi hesabından gecikmeli olarak tamamlandığında orijinal tarihi korunarak <strong>LATE_COMPLETED</strong> durumuna geçer. Öğretmen yalnızca görevi yeni bir güne kopyalayabilir.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {pastIncompleteTasks.map((pt) => {
              const sub = subjects.find((s) => s.id === pt.subjectId);
              const res = resources.find((r) => r.id === pt.resourceId);
              return (
                <div key={pt.id} className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: sub?.colorHex || '#dc2626' }}>
                      {sub?.name}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600">
                      {pt.taskDate} ({pt.dayOfWeek})
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs line-clamp-1">
                    {res?.title || 'Ödev'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Hedef: {pt.targetQuestionCount || 0} Soru • {pt.targetDurationMinutes || 0} dk
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <span className="flex-1 py-1.5 px-2 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold rounded-lg text-center">
                      Öğrencinin tamamlaması bekleniyor
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCopyModal(pt)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg transition-colors"
                      title="Bugüne veya yeni güne kopyala"
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-DAY PAZARTESİ - PAZAR GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
        {DAYS_OF_WEEK.map((day) => {
          const dayDate = weekDatesMap[day];
          const tasksForDay = studentTasks.filter((t) => t.dayOfWeek === day);

          const totalQuestionsPlanned = tasksForDay.reduce((s, t) => s + (t.targetQuestionCount || 0), 0);
          const totalMinutesPlanned = tasksForDay.reduce((s, t) => s + (t.targetDurationMinutes || 0), 0);

          return (
            <div
              key={day}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[420px]"
            >
              {/* Day Column Header */}
              <div className="p-3 bg-slate-50/90 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{day}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {dayDate.split('-')[2]} Eyl
                  </span>
                </div>

                {/* Daily Total Summary Badge */}
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span>{totalQuestionsPlanned} Soru</span>
                  <span>{totalMinutesPlanned} dk</span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                {tasksForDay.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-3 border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-[11px] text-slate-400">Görev yok</p>
                  </div>
                ) : (
                  tasksForDay.map((task) => {
                    const subject = subjects.find((s) => s.id === task.subjectId);
                    const resource = resources.find((r) => r.id === task.resourceId);
                    const isMyTask = task.teacherId === (currentTeacherProfile?.id || 'tp-ahmet');
                    const realization = getTaskRealization(task.id);

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border transition-all text-xs relative group ${
                          realization.status === 'COMPLETED'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : realization.status === 'LATE_COMPLETED'
                            ? 'bg-amber-50/40 border-amber-200'
                            : realization.status === 'OVERDUE'
                            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* Subject Badge, Status Badge & Action Controls */}
                        <div className="flex items-center justify-between mb-1.5 gap-1">
                          <span
                            className="font-bold text-[10px] px-2 py-0.5 rounded text-white shrink-0"
                            style={{ backgroundColor: subject?.colorHex || '#2563EB' }}
                          >
                            {subject?.name}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${realization.statusColor.badgeBg} ${realization.statusColor.badgeText} ${realization.statusColor.badgeBorder}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${realization.statusColor.dotColor}`} />
                              {realization.statusLabel}
                            </span>

                            {/* Actions on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/90 rounded px-1 shadow-2xs">
                              <button
                                onClick={() => handleOpenCopyModal(task)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                title="Başka Güne Kopyala"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {isMyTask && (
                                <>
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                    title="Düzenle"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteDailyTask(task.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              {!isMyTask && (
                                <span
                                  className="text-slate-400 p-0.5"
                                  title="Bu görev başka bir öğretmen tarafından atanmıştır."
                                >
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Title & Resource */}
                        <div className="font-bold text-slate-900 text-xs line-clamp-1">
                          {resource?.title || 'Ödev Görevi'}
                        </div>

                        {/* Page Range if any */}
                        {task.startPage && task.endPage && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Sayfa: {task.startPage} - {task.endPage}
                          </div>
                        )}

                        {/* Targets Badge */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-800">{task.targetQuestionCount || 0} Soru</span>
                          <span className="text-slate-500">{task.targetDurationMinutes || 0} dk</span>
                        </div>

                        {/* Overdue alert badge if overdue and not done */}
                        {realization.status === 'OVERDUE' && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded border border-rose-200">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Gecikmiş (Teslim Edilmedi)
                          </div>
                        )}

                        {/* Realization Progress Details (Capped at 100% with extra badge) */}
                        {(realization.actualQuestions > 0 || realization.actualMinutes > 0 || task.isCompleted) && (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-1">
                            <div className="flex items-center justify-between text-[10px] gap-1">
                              <span className="text-slate-500 font-medium">Gerçekleşme:</span>
                              <span className="font-bold text-slate-800">
                                {realization.actualQuestions}/{task.targetQuestionCount || 0} Soru ({realization.questionDisplayText})
                              </span>
                            </div>
                            {realization.isQuestionOverTarget && (
                              <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                {realization.questionExtraBadgeText}
                              </div>
                            )}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  realization.questionPercent >= 100
                                    ? 'bg-emerald-500'
                                    : realization.questionPercent >= 70
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${realization.displayQuestionPercent}%` }}
                              />
                            </div>
                            {realization.actualMinutes > 0 && (
                              <div className="text-[10px] text-slate-500 flex flex-wrap justify-between gap-1">
                                <span>
                                  {realization.actualMinutes}
                                  {task.targetDurationMinutes ? `/${task.targetDurationMinutes}` : ''} dk çalışıldı
                                  {realization.isTimeOverTarget && (
                                    <span className="ml-1 text-emerald-600 font-bold">({realization.timeExtraBadgeText})</span>
                                  )}
                                </span>
                                {realization.solvedPagesCount > 0 && <span>{realization.solvedPagesCount} sayfa çözüldü</span>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* FAZ 4: Verification Status & Teacher Actions on Weekly Card */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="text-[10px] space-y-0.5">
                            <div className="text-slate-500 font-medium truncate" title={realization.studentDeclarationText}>
                              {realization.studentDeclarationText}
                            </div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full ${realization.statusColor.dotColor}`} />
                              <span>{realization.teacherVerificationText}</span>
                            </div>
                          </div>

                          {/* Controls for Teacher / Admin */}
                          {(currentUser.role === 'TEACHER' || currentUser.role === 'INSTITUTE_ADMIN') && (
                            <div className="flex items-center gap-1 pt-1">
                              {task.verificationStatus !== 'VERIFIED' ? (
                                <button
                                  type="button"
                                  onClick={() => verifyDailyTask(task.id, currentUser.id)}
                                  className="flex-1 py-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors text-center shadow-2xs"
                                  title="Doğrula"
                                >
                                  ✓ Doğrula
                                </button>
                              ) : (
                                <span className="flex-1 py-0.5 px-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded text-[10px] font-semibold text-center">
                                  ✓ Doğrulandı
                                </span>
                              )}

                              {task.verificationStatus !== 'REJECTED' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectModalTaskId(task.id);
                                    setRejectNote('');
                                  }}
                                  className="py-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold transition-colors"
                                  title="Yapılmadı olarak işaretle"
                                >
                                  ✕
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => verifyDailyTask(task.id, currentUser.id)}
                                  className="py-1 px-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-semibold"
                                  title="Yeniden Doğrula"
                                >
                                  Düzelt
                                </button>
                              )}

                              {/* Late completion button if task is past and not completed */}
                              {!task.isCompleted && task.taskDate < DEFAULT_SIMULATION_DATE && (
                                <span className="py-1 px-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-semibold" title="Öğrenci hesabından gecikmeli tamamlama bekleniyor">
                                  Öğrenci Bekliyor
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Task Button for this day */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => handleOpenAddTask(day)}
                  className="w-full py-1.5 px-2 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Görev Ekle
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Add/Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        selectedStudentId={selectedStudentId}
        defaultDayOfWeek={selectedDay}
        defaultDate={selectedDate}
        editTask={editingTask}
      />

      {/* SMART DISTRIBUTION WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Akıllı Sayfa Dağıtıcı</h3>
                  <p className="text-xs text-slate-500">Sayfaları Pazartesi - Cuma arasına otomatik böler</p>
                </div>
              </div>
              <button onClick={() => setShowWizard(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {wizardError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{wizardError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Kaynak Kitap</label>
                  {(() => {
                    const assigned = studentResources.find(
                      (sr) => sr.studentId === selectedStudentId && sr.resourceId === wizardResource
                    );
                    if (assigned) {
                      return (
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          Öğrenci Kapsamı: {assigned.assignedStartPage}-{assigned.assignedEndPage}
                        </span>
                      );
                    }
                    return (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        Atanmamış (Otomatik Eklenecek)
                      </span>
                    );
                  })()}
                </div>
                <select
                  value={wizardResource}
                  onChange={(e) => handleWizardResourceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {allowedWizardResources.map((r) => {
                    const isAssigned = studentResources.some(
                      (sr) => sr.studentId === selectedStudentId && sr.resourceId === r.id && sr.status === 'ACTIVE'
                    );
                    return (
                      <option key={r.id} value={r.id}>
                        {isAssigned ? '✓ ' : ''}{r.title} ({r.publisher})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Scope helper / Auto-expand options */}
              {(() => {
                const assigned = studentResources.find(
                  (sr) => sr.studentId === selectedStudentId && sr.resourceId === wizardResource
                );
                if (assigned) {
                  const isOutOfScope = wizardStartPage < assigned.assignedStartPage || wizardEndPage > assigned.assignedEndPage;
                  return (
                    <div className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 ${isOutOfScope ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {isOutOfScope ? '⚠️ Seçilen sayfalar mevcut kapsam dışındadır' : '✓ Seçilen sayfalar öğrenci kapsamı içerisindedir'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setWizardStartPage(assigned.assignedStartPage);
                            setWizardEndPage(assigned.assignedEndPage);
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Kapsama Eşitle ({assigned.assignedStartPage}-{assigned.assignedEndPage})
                        </button>
                      </div>
                      {isOutOfScope && (
                        <label className="flex items-center gap-2 cursor-pointer font-medium pt-1 border-t border-amber-200/60">
                          <input
                            type="checkbox"
                            checked={autoExpandScope}
                            onChange={(e) => setAutoExpandScope(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Öğrencinin kaynak kapsamını ({Math.min(assigned.assignedStartPage, wizardStartPage)} - {Math.max(assigned.assignedEndPage, wizardEndPage)}) olarak genişlet</span>
                        </label>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                      ℹ️ Bu kaynak bu öğrenciye henüz atanmamış. Program dağıtıldığında kaynak ({wizardStartPage}-{wizardEndPage}) sayfasıyla öğrenciye atanacaktır.
                    </div>
                  );
                }
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Başlangıç Sayfası</label>
                  <input
                    type="number"
                    value={wizardStartPage}
                    onChange={(e) => setWizardStartPage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bitiş Sayfası</label>
                  <input
                    type="number"
                    value={wizardEndPage}
                    onChange={(e) => setWizardEndPage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Günlük Soru Hedefi</label>
                  <input
                    type="number"
                    value={wizardDailyQuestions}
                    onChange={(e) => setWizardDailyQuestions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Günlük Süre (dk)</label>
                  <input
                    type="number"
                    value={wizardDailyMinutes}
                    onChange={(e) => setWizardDailyMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 space-y-1">
                <span className="font-bold">Önizleme:</span>
                <div>
                  Toplam {wizardEndPage - wizardStartPage + 1} sayfa, 5 iş gününe bölünerek günde ortalama{' '}
                  {Math.ceil((wizardEndPage - wizardStartPage + 1) / 5)} sayfa ve {wizardDailyQuestions} soru olarak
                  dağıtılacaktır.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleRunSmartDistribution}
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Programı Otomatik Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* COPY TASK MODAL */}
      {copyModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Görevi Başka Güne Kopyala</h3>
                  <p className="text-xs text-slate-500">Hedef günde yeni bağımsız bir görev oluşturulur</p>
                </div>
              </div>
              <button
                onClick={() => setCopyModalTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {copyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {copyError}
                </div>
              )}

              {/* Source Task Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Kaynak Görev:</span>
                <div className="font-bold text-slate-900">
                  {subjects.find((s) => s.id === copyModalTask.subjectId)?.name} •{' '}
                  {resources.find((r) => r.id === copyModalTask.resourceId)?.title || 'Ödev'}
                </div>
                <div className="text-slate-600">
                  {copyModalTask.targetQuestionCount || 0} Soru • {copyModalTask.targetDurationMinutes || 0} dk
                  {copyModalTask.startPage && copyModalTask.endPage && (
                    <span> • Sayfa {copyModalTask.startPage}-{copyModalTask.endPage}</span>
                  )}
                </div>
              </div>

              {/* Target Day */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Gün
                </label>
                <select
                  value={copyTargetDay}
                  onChange={(e) => {
                    const day = e.target.value as typeof DAYS_OF_WEEK[number];
                    setCopyTargetDay(day);
                    setCopyTargetDate(weekDatesMap[day]);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d} ({weekDatesMap[d]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Tarih
                </label>
                <input
                  type="date"
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Target Student */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Öğrenci
                </label>
                <select
                  value={copyTargetStudentId}
                  onChange={(e) => setCopyTargetStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {accessibleStudents.map((s) => {
                    const u = users.find((user) => user.id === s.userId);
                    return (
                      <option key={s.id} value={s.id}>
                        {u?.fullName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCopyModalTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCopy}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Kopyala ve Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAZ 4: Rejection Note Modal */}
      {rejectModalTaskId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Görevi "Yapılmadı" Olarak İşaretle
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalTaskId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Öğrencinin beyan ettiği çalışma kaydı korunacaktır. Ancak görev "Yapılmadı" (REJECTED) olarak işaretlenir ve doğrulanmamış sayılır.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Açıklama / Sebep Notu (İsteğe bağlı)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Örn: Ödev teslim edilmedi veya eksik çözülmüş..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden resize-none h-24"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTaskId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectDailyTask(rejectModalTaskId, currentUser.id, rejectNote);
                  setRejectModalTaskId(null);
                  setToastMessage('Görev "Yapılmadı" olarak işaretlendi.');
                  setTimeout(() => setToastMessage(''), 3000);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Yapılmadı Olarak Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
