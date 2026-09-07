import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Users } from 'lucide-react';

interface TeacherDashboardProps {
  onSelectStudent: (studentId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    teacherProfiles,
    subjects,
    studentProfiles,
    users,
    resources,
    getTeacherStudents,
    getTeacherAssignedResources,
    getTeacherDashboardMetrics,
    getTaskRealization,
  } = useApp();

  const teacherProfile = teacherProfiles.find((profile) => profile.userId === currentUser.id);
  const subject = subjects.find((item) => item.id === teacherProfile?.branchSubjectId);
  const myStudents = getTeacherStudents(currentUser.id);
  const myResources = getTeacherAssignedResources(currentUser.id);
  const metrics = getTeacherDashboardMetrics(currentUser.id, '2026-08-31');
  const pendingTasks = metrics.myTasks.filter((task) => getTaskRealization(task.id).verificationStatus === 'PENDING' && task.isCompleted);

  const actions = [
    {
      title: 'Öğrencilerim',
      detail: `${myStudents.length} öğrenci`,
      description: 'Sadece sorumlu olduğunuz öğrenciler.',
      tab: 'teacher-students',
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Kaynaklarım',
      detail: `${myResources.length} kaynak`,
      description: `${subject?.name || 'Branş'} için size atanan kitaplar.`,
      tab: 'teacher-resources',
      icon: BookOpen,
      color: 'bg-violet-50 text-violet-700',
    },
    {
      title: 'Ödev Planla',
      detail: 'Haftalık plan',
      description: 'Ödevleri gelecek günlere dağıtın.',
      tab: 'teacher-planner',
      icon: CalendarDays,
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{subject?.name || 'Branş'} Öğretmeni</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Hoş geldiniz, {currentUser.fullName.split(' ')[0]}</h1>
          <p className="mt-2 text-sm text-slate-600">Atandığınız kaynaklardan öğrencilerinize ileri tarihli ödev planı oluşturun.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('teacher-planner')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <CalendarDays className="w-4 h-4" />
          Ödev planla
        </button>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              type="button"
              onClick={() => onNavigateTab(action.tab)}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <Icon className="w-5 h-5" />
              </span>
              <h2 className="mt-4 font-bold text-slate-900">{action.title}</h2>
              <p className="mt-1 text-lg font-bold text-slate-800">{action.detail}</p>
              <p className="mt-1 text-xs text-slate-500">{action.description}</p>
            </button>
          );
        })}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-5 flex items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Kontrol bekleyen kayıtlar</h2>
            <p className="mt-0.5 text-xs text-slate-500">Öğrenci kaydı girdikten sonra buradan inceleme ekranına geçin.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('teacher-tasks')}
            className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            Kontrole git ({pendingTasks.length})
          </button>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="mt-2 text-sm font-semibold text-slate-800">Şu an bekleyen kayıt yok</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingTasks.slice(0, 5).map((task) => {
              const studentProfile = studentProfiles.find((student) => student.id === task.studentId);
              const studentUser = users.find((user) => user.id === studentProfile?.userId);
              const resource = resources.find((item) => item.id === task.resourceId);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onNavigateTab('teacher-tasks')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 truncate">{studentUser?.fullName || 'Öğrenci'}</span>
                    <span className="block mt-0.5 text-xs text-slate-500 truncate">{resource?.title || task.description || 'Çalışma görevi'}</span>
                  </span>
                  <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
