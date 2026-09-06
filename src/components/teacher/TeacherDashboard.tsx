import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  BookOpen, 
  ChevronRight,
  Plus
} from 'lucide-react';

interface TeacherDashboardProps {
  onSelectStudent: (studentId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectStudent, onNavigateTab }) => {
  const { 
    currentUser, 
    studentProfiles, 
    users, 
    classes, 
    dailyTasks, 
    studyRecords, 
    resources, 
    subjects,
    teacherProfiles,
    teacherStudentRelations,
    canTeacherAccessTask
  } = useApp();

  const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);

  // Get students related to this teacher
  const myRelationStudentIds = teacherStudentRelations
    .filter((tsr) => tsr.teacherId === (currentTeacherProfile?.id || 'tp-ahmet') && tsr.isActive)
    .map((tsr) => tsr.studentId);

  const myStudents = studentProfiles.filter((sp) => myRelationStudentIds.includes(sp.id));

  // Today's date simulation
  const todayStr = '2026-08-31'; // Matches seeded week start
  const todaysTasks = dailyTasks.filter(
    (t) => (t.teacherId === (currentTeacherProfile?.id || 'tp-ahmet') || myRelationStudentIds.includes(t.studentId)) && 
           t.taskDate === todayStr &&
           (currentUser.role !== 'TEACHER' || canTeacherAccessTask(currentUser.id, t.id))
  );

  const completedTodaysTasks = todaysTasks.filter((t) => t.isCompleted);
  const completionRate = todaysTasks.length > 0 
    ? Math.round((completedTodaysTasks.length / todaysTasks.length) * 100) 
    : 0;

  // Overdue tasks count: past date and !isCompleted
  const overdueTasks = dailyTasks.filter(
    (t) => (t.teacherId === (currentTeacherProfile?.id || 'tp-ahmet')) && 
           !t.isCompleted && 
           t.taskDate < '2026-09-02' &&
           (currentUser.role !== 'TEACHER' || canTeacherAccessTask(currentUser.id, t.id))
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hoş Geldiniz, {currentUser.fullName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Matematik Öğretmeni
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Bugün sorumluluğunuzdaki {myStudents.length} öğrencinin çalışma ve ödev takip paneli.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('teacher-planner')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Haftalık Programı Aç
          </button>
          <button
            onClick={() => onNavigateTab('teacher-students')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Öğrenci
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Takip Edilen Öğrenci</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{myStudents.length}</span>
            <span className="text-xs text-slate-500 font-medium">aktif öğrenci</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">Kurum & Özel Ders</span> toplamı
          </div>
        </div>

        {/* Tasks Assigned Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bugünkü Görevler</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{todaysTasks.length}</span>
            <span className="text-xs text-slate-500 font-medium">verilen görev</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-indigo-600">{myStudents.length} öğrenciye</span> dağıtıldı
          </div>
        </div>

        {/* Completion Rate Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamamlanma Oranı</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">%{completionRate}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({completedTodaysTasks.length}/{todaysTasks.length})
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Geciken / Bekleyen</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{overdueTasks.length}</span>
            <span className="text-xs text-slate-500 font-medium">görev</span>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium">
            {overdueTasks.length > 0 ? 'Kayıt girilmemiş görevler var' : 'Tüm görevler güncel'}
          </div>
        </div>
      </div>

      {/* Main Grid: Student Daily Status & Recent Records Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Students Today's Status Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Öğrenci Günlük Çalışma Durumu</h2>
              <p className="text-xs text-slate-500 mt-0.5">Planlanan ve gerçekleşen çalışma karşılaştırması</p>
            </div>
            <button
              onClick={() => onNavigateTab('teacher-students')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Tümünü Gör <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myStudents.map((student) => {
              const studentUser = users.find((u) => u.id === student.userId);
              const studentClass = classes.find((c) => c.id === student.classId);

              // Find today's tasks for this student
              const sTasks = dailyTasks.filter(
                (t) => t.studentId === student.id && 
                       t.taskDate === todayStr &&
                       (currentUser.role !== 'TEACHER' || canTeacherAccessTask(currentUser.id, t.id))
              );
              const completedCount = sTasks.filter((t) => t.isCompleted).length;

              // Find study records of this student
              const studentRecords = studyRecords.filter((r) => r.studentId === student.id && r.recordDate === todayStr);
              const totalActualQuestions = studentRecords.reduce((s, r) => s + r.actualQuestionCount, 0);
              const totalPlannedQuestions = sTasks.reduce((s, t) => s + (t.targetQuestionCount || 0), 0);

              const successPercent = totalPlannedQuestions > 0 
                ? Math.round((totalActualQuestions / totalPlannedQuestions) * 100) 
                : (completedCount > 0 ? 100 : 0);

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={studentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={studentUser?.fullName}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        {studentUser?.fullName}
                        {studentClass ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {studentClass.name} Sınıfı
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Özel Ders
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Görev: {completedCount}/{sTasks.length} Tamamlandı</span>
                        <span>•</span>
                        <span>Soru: {totalActualQuestions} / {totalPlannedQuestions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Performance Progress */}
                    <div className="text-right min-w-[90px]">
                      <div className="text-xs font-bold text-slate-800">%{successPercent} Başarı</div>
                      <div className="w-24 bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            successPercent >= 80 ? 'bg-emerald-500' : successPercent >= 50 ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(100, successPercent)}%` }}
                        />
                      </div>
                    </div>

                    <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Recent Study Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Son Çalışma Kayıtları
            </h2>
            <span className="text-xs font-medium text-slate-400">Canlı Güncelleme</span>
          </div>

          <div className="mt-4 space-y-3.5 flex-1 overflow-y-auto">
            {studyRecords.map((record) => {
              const student = studentProfiles.find((s) => s.id === record.studentId);
              const studentUser = users.find((u) => u.id === student?.userId);
              const subject = subjects.find((s) => s.id === record.subjectId);
              const resource = resources.find((r) => r.id === record.resourceId);

              return (
                <div key={record.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{studentUser?.fullName}</span>
                    <span className="text-[10px] font-medium text-slate-400">Pazartesi</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="font-medium text-blue-700">{subject?.name}:</span>
                    <span className="text-slate-800">{resource?.title || 'Ödev Görevi'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {record.actualQuestionCount} Soru
                    </span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {record.actualDurationMinutes} Dakika
                    </span>
                    {record.completedStartPage && record.completedEndPage && (
                      <span className="text-slate-500 text-[11px]">
                        Sayfa {record.completedStartPage}-{record.completedEndPage}
                      </span>
                    )}
                  </div>
                  {record.studentNotes && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100 mt-1">
                      "{record.studentNotes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('teacher-reports')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center"
            >
              Detaylı Analiz & Raporlara Git
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
