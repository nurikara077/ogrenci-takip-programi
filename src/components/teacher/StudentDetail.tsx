import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  ChevronRight, 
  Lock, 
  FileText, 
  BarChart2, 
  User, 
  Plus,
  TrendingUp,
  Bookmark,
  Edit2,
  Trash2,
  Target,
  X,
  History
} from 'lucide-react';
import { StudentResource, Resource, ResourceTopic } from '../../types';
import { PageMatrixModal } from '../common/PageMatrixModal';
import { AuditLogModal } from '../common/AuditLogModal';
import { DEFAULT_SIMULATION_DATE } from '../../utils/dateUtils';

interface StudentDetailProps {
  studentId: string;
  onBack: () => void;
  onOpenPlanner: (studentId: string) => void;
  onOpenAssignResource: (studentId: string) => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({
  studentId,
  onBack,
  onOpenPlanner,
  onOpenAssignResource,
}) => {
  const { 
    studentProfiles, 
    users, 
    classes, 
    dailyTasks, 
    studyRecords, 
    resources, 
    resourceTopics,
    subjects, 
    studentResources,
    teacherProfiles,
    getResourceProgress,
    getStudentSummary,
    getTaskRealization,
    updateStudentResource,
    removeStudentResource,
    verifyDailyTask,
    rejectDailyTask,
    currentUser,
    auditLogs,
    canTeacherAccessTask,
    canTeacherAccessResource
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tasks' | 'subjects' | 'resources' | 'reports' | 'audit'>('tasks');

  // Matrix cell detail modal state
  const [selectedMatrixPage, setSelectedMatrixPage] = useState<{
    pageNum: number;
    resource: Resource;
    topic?: ResourceTopic;
  } | null>(null);

  // Global audit modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Rejection note modal state
  const [rejectModalTaskId, setRejectModalTaskId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');

  // Edit scope modal state
  const [editingSr, setEditingSr] = useState<StudentResource | null>(null);
  const [editSrStart, setEditSrStart] = useState<number>(1);
  const [editSrEnd, setEditSrEnd] = useState<number>(100);
  const [editSrTargetDate, setEditSrTargetDate] = useState<string>('');
  const [editSrDailyTarget, setEditSrDailyTarget] = useState<number | ''>('');
  const [editSrDesc, setEditSrDesc] = useState<string>('');
  const [srError, setSrError] = useState<string>('');

  const student = studentProfiles.find((s) => s.id === studentId);
  const studentUser = users.find((u) => u.id === student?.userId);
  const studentClass = classes.find((c) => c.id === student?.classId);

  if (!student || !studentUser) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600">Öğrenci bulunamadı.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Geri Dön
        </button>
      </div>
    );
  }

  // Summary calculations
  const summary = getStudentSummary(student.id);

  // Student tasks & records (Teacher sees only authorized tasks)
  const myTasks = dailyTasks.filter(
    (t) => t.studentId === student.id &&
           (currentUser.role !== 'TEACHER' || canTeacherAccessTask(currentUser.id, t.id))
  );
  const myRecords = studyRecords.filter((r) => r.studentId === student.id);

  // Assigned resources (Teacher sees only authorized resources)
  const myStudentResources = studentResources.filter(
    (sr) => sr.studentId === student.id &&
           (currentUser.role !== 'TEACHER' || canTeacherAccessResource(currentUser.id, sr.resourceId))
  );

  // Multi-teacher check
  const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Profile Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Öğrenci Listesine Dön
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4">
            <img
              src={studentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={studentUser.fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-200"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{studentUser.fullName}</h1>
                {studentClass ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {studentClass.name} Sınıfı
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Bireysel Özel Ders
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>No: {student.studentNumber || '—'}</span>
                <span>•</span>
                <span>Tel: {studentUser.phone || '05xx xxx xx xx'}</span>
                {student.notes && (
                  <>
                    <span>•</span>
                    <span className="italic text-slate-600">"{student.notes}"</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenAssignResource(student.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Kaynak Ata
            </button>
            <button
              onClick={() => onOpenPlanner(student.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Haftalık Programını Aç
            </button>
          </div>
        </div>
      </div>

      {/* KPI Comparison Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Soru Hedefi / Gerçekleşen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Haftalık Soru</div>
          <div className="mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {summary.actualQuestions} <span className="text-sm font-normal text-slate-500">/ {summary.plannedQuestions}</span>
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  summary.questionSuccessRate >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {summary.questionDisplayText}
              </span>
              {summary.isQuestionOverTarget && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {summary.questionExtraBadgeText}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.questionSuccessRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${summary.displayQuestionSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Çalışma Süresi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Çalışma Süresi</div>
          <div className="mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {summary.actualMinutes} <span className="text-sm font-normal text-slate-500">/ {summary.plannedMinutes} dk</span>
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  summary.timeSuccessRate >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {summary.timeDisplayText}
              </span>
              {summary.isTimeOverTarget && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {summary.timeExtraBadgeText}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.timeSuccessRate >= 80 ? 'bg-indigo-500' : 'bg-amber-500'
              }`}
              style={{ width: `${summary.displayTimeSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Görev Tamamlama */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Görev Tamamlama</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {summary.completedTasksCount} <span className="text-sm font-normal text-slate-500">/ {summary.totalTasksCount}</span>
            </span>
            <span className="text-xs font-bold text-slate-700">
              %{summary.taskSuccessRate}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${summary.taskSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Öğretmen Doğrulaması */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğretmen Doğrulaması</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">
              {summary.verifiedTasksCount} <span className="text-sm font-normal text-slate-500">/ {summary.completedTasksCount}</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Doğrulandı
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-amber-700 font-semibold">{summary.pendingVerificationTasksCount} Bekleyen</span>
            {summary.rejectedTasksCount > 0 && (
              <span className="text-rose-600 font-semibold">• {summary.rejectedTasksCount} Yapılmadı</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6 flex-wrap">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Günlük Görevler & Çalışma Kayıtları
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'resources'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Kaynak İlerlemesi & Sayfa Matrisi
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'subjects'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Ders & Branş Dağılımı (Çoklu Öğretmen)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          İşlem Geçmişi & Denetim İzleri (Audit)
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {auditLogs.filter((l) => myTasks.some((t) => t.id === l.targetId)).length}
          </span>
        </button>
      </div>

      {/* TAB 1: Tasks & Records */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Haftalık Görev Listesi ve Öğrencinin Kayıtları</h3>
            <span className="text-xs text-slate-500 font-medium">Toplam {myTasks.length} planlanmış görev</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTasks.map((task) => {
              const subject = subjects.find((s) => s.id === task.subjectId);
              const resource = resources.find((r) => r.id === task.resourceId);
              const record = myRecords.find((r) => r.dailyTaskId === task.id);
              const isMySubject = task.teacherId === (currentTeacherProfile?.id || 'tp-ahmet');
              const realization = getTaskRealization(task.id);

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    realization.status === 'COMPLETED'
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : realization.status === 'OVERDUE'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50/70 border-dashed border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: subject?.colorHex || '#2563EB' }}
                      />
                      <span className="text-xs font-bold text-slate-900">{subject?.name}</span>
                      <span className="text-xs font-medium text-slate-400">• {task.dayOfWeek} ({task.taskDate})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isMySubject && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1"
                          title="Bu görev başka bir branş öğretmeni tarafından atanmıştır; düzenlenemez."
                        >
                          <Lock className="w-3 h-3" />
                          Diğer Öğretmen
                        </span>
                      )}
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${realization.statusColor.badgeBg} ${realization.statusColor.badgeText} ${realization.statusColor.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${realization.statusColor.dotColor}`} />
                        {realization.statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-semibold text-slate-800 text-sm">{resource?.title || 'Ödev Görevi'}</h4>
                    {task.startPage && task.endPage && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Sayfa: <span className="font-semibold text-slate-700">{task.startPage} - {task.endPage}</span>
                      </div>
                    )}
                    {task.description && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Plan vs Actual Stats Box */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-semibold text-blue-600 uppercase">Planlanan</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {task.targetQuestionCount || 0} Soru • {task.targetDurationMinutes || 0} dk
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${record ? 'bg-emerald-50/60 border-emerald-100' : realization.status === 'OVERDUE' ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-100 border-slate-200'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Gerçekleşen</span>
                        {realization.questionPercent > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                              {realization.questionDisplayText}
                            </span>
                            {realization.isQuestionOverTarget && (
                              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200 px-1.5 py-0.5 rounded">
                                {realization.questionExtraBadgeText}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {record ? `${record.actualQuestionCount} Soru • ${record.actualDurationMinutes} dk` : realization.status === 'OVERDUE' ? 'Gecikmiş (Teslim Edilmedi)' : 'Henüz girilmedi'}
                      </div>
                    </div>
                  </div>

                  {/* Student note if any */}
                  {record?.studentNotes && (
                    <div className="mt-3 text-xs bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl text-amber-900">
                      <span className="font-semibold">Öğrenci Notu:</span> "{record.studentNotes}"
                    </div>
                  )}

                  {/* FAZ 4: Verification Status & Teacher Controls */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Öğrenci Beyanı:</span>
                        <span>{realization.studentDeclarationText}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${realization.statusColor.dotColor}`} />
                        <span>{realization.teacherVerificationText}</span>
                      </div>
                    </div>

                    {/* Teacher Actions (Only for Teachers / Admins) */}
                    {(currentUser.role === 'TEACHER' || currentUser.role === 'INSTITUTE_ADMIN') && (
                      <div className="flex items-center gap-2 shrink-0">
                        {task.verificationStatus !== 'VERIFIED' ? (
                          <button
                            type="button"
                            onClick={() => verifyDailyTask(task.id, currentUser.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                            title="Öğrencinin çalışmasını doğrula ve onayla"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Doğrula
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Doğrulandı
                          </span>
                        )}

                        {task.verificationStatus !== 'REJECTED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalTaskId(task.id);
                              setRejectNote('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
                            title="Ödev yapılmadı veya geçersiz olarak işaretle"
                          >
                            <X className="w-3.5 h-3.5" />
                            Yapılmadı
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => verifyDailyTask(task.id, currentUser.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold transition-colors"
                            title="Tekrar doğrula"
                          >
                            Yeniden Doğrula
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Kaynak İlerlemesi & Sayfa Matrisi */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {myStudentResources.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Henüz Kaynak Atanmadı</p>
              <button
                onClick={() => onOpenAssignResource(student.id)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Kaynak Ata
              </button>
            </div>
          ) : (
            myStudentResources.map((sr) => {
              const res = resources.find((r) => r.id === sr.resourceId);
              const subject = subjects.find((s) => s.id === res?.subjectId);
              const progress = getResourceProgress(student.id, sr.resourceId);

              // Generate array of pages in the assigned scope
              const pages: number[] = [];
              for (let p = sr.assignedStartPage; p <= sr.assignedEndPage; p++) {
                pages.push(p);
              }

              return (
                <div key={sr.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: subject?.colorHex || '#2563EB' }}
                        />
                        <h4 className="font-bold text-slate-900 text-base">{res?.title}</h4>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {res?.publisher}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Atanan Kapsam: <strong>Sayfa {sr.assignedStartPage} - {sr.assignedEndPage}</strong> ({progress.totalCount} sayfa)</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{progress.completedCount} çözüldü</span>
                        <span>•</span>
                        <span className="text-slate-500 font-medium">{progress.remainingCount} kalan</span>
                        {sr.targetDate && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Hedef: {new Date(sr.targetDate).toLocaleDateString('tr-TR')}
                            </span>
                          </>
                        )}
                        {sr.dailyQuestionTarget && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-700 font-medium flex items-center gap-1">
                              <Target className="w-3 h-3" /> {sr.dailyQuestionTarget} Soru/Gün
                            </span>
                          </>
                        )}
                      </p>
                      {sr.description && (
                        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                          "{sr.description}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900">%{progress.percentage} Tamamlandı</span>
                        <div className="text-xs text-slate-500">
                          {progress.completedCount} / {progress.totalCount} tekil sayfa
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSr(sr);
                            setEditSrStart(sr.assignedStartPage);
                            setEditSrEnd(sr.assignedEndPage);
                            setEditSrTargetDate(sr.targetDate || '');
                            setEditSrDailyTarget(sr.dailyQuestionTarget || '');
                            setEditSrDesc(sr.description || '');
                            setSrError('');
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                          title="Atanan Kapsamı Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Bu kaynak atamasını kaldırmak istediğinizden emin misiniz?`)) {
                              removeStudentResource(sr.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                          title="Atamayı Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  {/* Interactive 6-Color Page Matrix Grid */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Sayfa Tamamlama & Doğrulama Matrisi (Tıklanabilir):
                      </span>
                      {/* 6-Color Legend */}
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-600 font-medium flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Doğrulandı (Yeşil)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-500" /> Öğrenci Beyanı (Sarı)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Yapılmadı/Gecikmiş (Kırmızı)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Gecikmeli Bitirildi (Mavi)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300" /> Planlanmış/Boş (Beyaz)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 max-h-56 overflow-y-auto">
                      {pages.map((pageNum) => {
                        // Find matching tasks for this page
                        const matchingPageTasks = dailyTasks.filter(
                          (t) =>
                            t.studentId === student.id &&
                            t.resourceId === sr.resourceId &&
                            t.startPage !== undefined &&
                            t.endPage !== undefined &&
                            pageNum >= t.startPage &&
                            pageNum <= t.endPage
                        );

                        // Find matching study records
                        const matchingPageRecords = studyRecords.filter(
                          (rec) =>
                            rec.studentId === student.id &&
                            rec.resourceId === sr.resourceId &&
                            rec.completedStartPage !== undefined &&
                            rec.completedEndPage !== undefined &&
                            pageNum >= rec.completedStartPage &&
                            pageNum <= rec.completedEndPage
                        );

                        const isVerified = matchingPageTasks.some((t) => t.verificationStatus === 'VERIFIED');
                        const isRejected = matchingPageTasks.some((t) => t.verificationStatus === 'REJECTED');
                        const isLateCompleted = matchingPageTasks.some((t) => t.status === 'LATE_COMPLETED');
                        const isOverdue = matchingPageTasks.some((t) => !t.isCompleted && t.taskDate < DEFAULT_SIMULATION_DATE);
                        const isStudentDone = matchingPageRecords.length > 0 || matchingPageTasks.some((t) => t.isCompleted);

                        let cellClass = 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400';
                        let statusText = 'Henüz Çözülmedi';

                        if (isVerified) {
                          cellClass = 'bg-emerald-500 text-white shadow-2xs hover:bg-emerald-600';
                          statusText = 'Öğretmen Doğruladı (Yeşil)';
                        } else if (isRejected) {
                          cellClass = 'bg-rose-500 text-white shadow-2xs hover:bg-rose-600';
                          statusText = 'Yapılmadı / Reddedildi (Kırmızı)';
                        } else if (isLateCompleted) {
                          cellClass = 'bg-indigo-500 text-white shadow-2xs hover:bg-indigo-600';
                          statusText = 'Gecikmeli Tamamlandı (Mavi)';
                        } else if (isStudentDone) {
                          cellClass = 'bg-amber-400 text-amber-950 border border-amber-500 shadow-2xs hover:bg-amber-500';
                          statusText = 'Öğrenci Beyanı / Onay Bekliyor (Sarı)';
                        } else if (isOverdue) {
                          cellClass = 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200';
                          statusText = 'Gecikmiş Ödev (Kırmızı)';
                        }

                        // Matching topic
                        const matchingTopic = resourceTopics.find(
                          (tp) => tp.resourceId === sr.resourceId && pageNum >= tp.startPage && pageNum <= tp.endPage
                        );

                        return (
                          <button
                            type="button"
                            key={pageNum}
                            onClick={() => {
                              if (res) {
                                setSelectedMatrixPage({
                                  pageNum,
                                  resource: res,
                                  topic: matchingTopic,
                                });
                              }
                            }}
                            className={`w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${cellClass}`}
                            title={`Sayfa ${pageNum}: ${statusText} • İncelemek için tıklayın`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                      <span>* Sayfaya tıklayarak ödev/çalışma kaydı detayını görebilir ve hızlı doğrulama yapabilirsiniz.</span>
                      <span className="font-semibold text-slate-700">Toplam {pages.length} Sayfa</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Çoklu Öğretmen & Branş Dağılımı */}
      {activeTab === 'subjects' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">8-A Sınıfı Branş Dağılımı & Öğretmenler</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mehmet Demir'i takip eden tüm branş öğretmenleri ve ders bazlı ödev performansı
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Matematik */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">Matematik</span>
                <span className="text-xs font-semibold text-blue-900">Ahmet Öğretmen (Siz)</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Planlanan: 72 Soru / Hafta</div>
                <div>Gerçekleşen: 60 Soru (%83)</div>
                <div>Kaynak: Fenomen Fasikül 3</div>
              </div>
            </div>

            {/* Türkçe */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white">Türkçe</span>
                <span className="text-xs font-semibold text-slate-700">Ayşe Öğretmen</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Planlanan: 40 Soru / Hafta</div>
                <div>Gerçekleşen: 40 Soru (%100)</div>
                <div>Kaynak: MEB Örnek Sorular</div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Ayşe Öğretmen tarafından yönetiliyor
              </div>
            </div>

            {/* Fen Bilimleri */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">Fen Bilimleri</span>
                <span className="text-xs font-semibold text-slate-700">Mehmet Kaya Öğretmen</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Planlanan: 50 Soru / Hafta</div>
                <div>Gerçekleşen: 0 Soru (Bekliyor)</div>
                <div>Kaynak: Fenomen Fen SB</div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mehmet Öğretmen tarafından yönetiliyor
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Denetim ve İşlem Geçmişi (Audit Logs) */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                {studentUser.fullName} İçin İşlem ve Değişiklik Geçmişi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bu öğrencinin görevleri üzerinde yapılan doğrulama, yapılmadı işaretleme, telafi ve kopyalama kayıtları
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors border border-blue-200"
            >
              Tüm Sistem Kayıtlarını Aç
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {auditLogs.filter((l) => myTasks.some((t) => t.id === l.targetId)).length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Henüz Denetim Kaydı Yok</h4>
                <p className="text-xs text-slate-500">
                  Öğretmen bir görevi doğruladığında veya "Yapılmadı" olarak işaretlediğinde burada detaylı kayıt listelenecektir.
                </p>
              </div>
            ) : (
              auditLogs
                .filter((l) => myTasks.some((t) => t.id === l.targetId))
                .map((log) => {
                  const task = myTasks.find((t) => t.id === log.targetId);
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              log.action === 'VERIFY_TASK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'REJECT_TASK'
                                ? 'bg-rose-100 text-rose-800'
                                : log.action === 'COMPLETE_LATE_TASK'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.action === 'VERIFY_TASK'
                              ? '✓ Doğrulama (VERIFY_TASK)'
                              : log.action === 'REJECT_TASK'
                              ? '✕ Yapılmadı (REJECT_TASK)'
                              : log.action === 'COMPLETE_LATE_TASK'
                              ? '⏰ Geç Bitirme (COMPLETE_LATE_TASK)'
                              : log.action}
                          </span>
                          {task && (
                            <span className="text-[11px] font-semibold text-slate-600">
                              {task.dayOfWeek} ({task.taskDate}) Görevi
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(log.timestamp).toLocaleString('tr-TR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-600">
                        <span>
                          İşlemi Yapan: <strong>{log.actorName || log.actorId}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Önceki Durum: <span className="line-through text-slate-400">{log.previousValue}</span>
                        </span>
                        <span>➔</span>
                        <span>
                          Yeni Durum: <strong className="text-slate-900">{log.newValue}</strong>
                        </span>
                      </div>

                      {log.note && (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 italic">
                          "{log.note}"
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Edit Assigned Resource Scope Modal */}
      {editingSr && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Atanan Kapsamı Güncelle</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {resources.find((r) => r.id === editingSr.resourceId)?.title}
                </p>
              </div>
              <button onClick={() => setEditingSr(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSrError('');
                const res = resources.find((r) => r.id === editingSr.resourceId);
                if (res && (editSrStart < res.startPage || editSrEnd > res.endPage)) {
                  setSrError(`Sayfa aralığı kitap sınırları (${res.startPage} - ${res.endPage}) içinde olmalıdır.`);
                  return;
                }
                if (editSrStart > editSrEnd) {
                  setSrError('Başlangıç sayfası bitiş sayfasından büyük olamaz.');
                  return;
                }

                try {
                  updateStudentResource(editingSr.id, {
                    assignedStartPage: Number(editSrStart),
                    assignedEndPage: Number(editSrEnd),
                    targetDate: editSrTargetDate || undefined,
                    dailyQuestionTarget: editSrDailyTarget ? Number(editSrDailyTarget) : undefined,
                    description: editSrDesc.trim() || undefined,
                  });
                  setEditingSr(null);
                } catch (err: any) {
                  setSrError(err.message || 'Güncelleme yapılırken hata oluştu.');
                }
              }}
              className="p-5 space-y-4"
            >
              {srError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {srError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Sayfası</label>
                  <input
                    type="number"
                    value={editSrStart}
                    onChange={(e) => setEditSrStart(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş Sayfası</label>
                  <input
                    type="number"
                    value={editSrEnd}
                    onChange={(e) => setEditSrEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Tarih</label>
                  <input
                    type="date"
                    value={editSrTargetDate}
                    onChange={(e) => setEditSrTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Günlük Soru Hedefi</label>
                  <input
                    type="number"
                    value={editSrDailyTarget}
                    onChange={(e) => setEditSrDailyTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Örn: 20"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci Notu / Açıklama</label>
                <textarea
                  rows={2}
                  value={editSrDesc}
                  onChange={(e) => setEditSrDesc(e.target.value)}
                  placeholder="Kapsam hakkında açıklama..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSr(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Kapsamı Güncelle
                </button>
              </div>
            </form>
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
              Öğrencinin beyan ettiği çalışma kaydı sistemde saklanmaya devam eder, ancak görev durumu "Öğretmen Kontrolü: Yapılmadı" olarak işaretlenir ve onaylanmamış sayılır.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Açıklama / Sebep Notu (İsteğe bağlı)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Örn: Ödev kontrolünde soruların çözülmediği görüldü..."
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
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Yapılmadı Olarak İşaretle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAZ 4: Interactive Page Matrix Inspection Modal */}
      {selectedMatrixPage && (
        <PageMatrixModal
          isOpen={true}
          onClose={() => setSelectedMatrixPage(null)}
          pageNum={selectedMatrixPage.pageNum}
          resource={selectedMatrixPage.resource}
          studentId={student.id}
          studentName={studentUser.fullName}
          topic={selectedMatrixPage.topic}
          isTeacherOrAdmin={currentUser.role === 'TEACHER' || currentUser.role === 'INSTITUTE_ADMIN'}
        />
      )}

      {/* FAZ 4: System Audit Log Modal */}
      {isAuditModalOpen && (
        <AuditLogModal
          isOpen={true}
          onClose={() => setIsAuditModalOpen(false)}
          title={`${studentUser.fullName} - Tüm Denetim Kayıtları`}
        />
      )}
    </div>
  );
};
