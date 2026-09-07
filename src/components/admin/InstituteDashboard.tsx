import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, ChevronRight, GraduationCap, Users } from 'lucide-react';

interface InstituteDashboardProps {
  onSelectClass: (classId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const InstituteDashboard: React.FC<InstituteDashboardProps> = ({ onSelectClass, onNavigateTab }) => {
  const {
    organizations,
    classes,
    studentProfiles,
    teacherProfiles,
    teacherClassRelations,
    resources,
  } = useApp();

  const organization = organizations[0];
  const activeResources = resources.filter((resource) => !resource.isArchived && resource.status !== 'ARCHIVED');

  const actions = [
    {
      title: 'Öğrenciler',
      description: 'Öğrenciyi ekleyin ve sınıfına atayın.',
      count: studentProfiles.length,
      label: 'Öğrencileri yönet',
      tab: 'admin-students',
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Öğretmenler',
      description: 'Branşı belirleyin ve sınıflara bağlayın.',
      count: teacherProfiles.length,
      label: 'Öğretmenleri yönet',
      tab: 'admin-teachers',
      icon: GraduationCap,
      color: 'bg-violet-50 text-violet-700',
    },
    {
      title: 'Sınıflar',
      description: 'Sınıfı ve öğretmen eşleşmelerini düzenleyin.',
      count: classes.length,
      label: 'Sınıfları yönet',
      tab: 'admin-classes',
      icon: GraduationCap,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Kaynaklar',
      description: 'Kitabı ekleyin, ilgili branş öğretmenine verin.',
      count: activeResources.length,
      label: 'Kaynakları yönet',
      tab: 'admin-resources',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Kurum Yönetimi</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{organization?.name || 'Kurum'} kurulumu</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Önce öğrencileri ve öğretmenleri sınıflara yerleştirin. Ardından kaynakları ilgili branş öğretmenlerine atayın.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              type="button"
              onClick={() => onNavigateTab(action.tab)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-2xl font-bold text-slate-900">{action.count}</span>
              </div>
              <h2 className="mt-4 font-bold text-slate-900">{action.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{action.description}</p>
              <span className="mt-4 text-xs font-semibold text-blue-700 inline-flex items-center gap-1">
                {action.label} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          );
        })}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Sınıf atamaları</h2>
          <p className="mt-0.5 text-xs text-slate-500">Bir sınıfa tıklayarak öğrenci ve öğretmen eşleşmelerini görün.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {classes.map((classroom) => {
            const studentCount = studentProfiles.filter((student) => student.classId === classroom.id).length;
            const teacherCount = teacherClassRelations.filter((relation) => relation.classId === classroom.id).length;
            return (
              <button
                key={classroom.id}
                type="button"
                onClick={() => onSelectClass(classroom.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <span>
                  <span className="block font-semibold text-slate-900">{classroom.name} Şubesi</span>
                  <span className="block mt-0.5 text-xs text-slate-500">
                    {studentCount} öğrenci · {teacherCount} öğretmen ataması
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
