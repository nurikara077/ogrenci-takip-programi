import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  ArrowUpRight,
  Plus,
  Database
} from 'lucide-react';
import { DatabaseStatusModal } from '../common/DatabaseStatusModal';

interface InstituteDashboardProps {
  onSelectClass: (classId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const InstituteDashboard: React.FC<InstituteDashboardProps> = ({ onSelectClass, onNavigateTab }) => {
  const { 
    currentUser, 
    organizations, 
    classes, 
    studentProfiles, 
    teacherProfiles, 
    users, 
    dailyTasks, 
    studyRecords 
  } = useApp();

  const currentOrg = organizations[0];
  const institutionStudents = studentProfiles.filter((s) => s.organizationId === currentOrg?.id);
  const institutionTeachers = teacherProfiles.filter((t) => t.organizationId === currentOrg?.id);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Overall statistics
  const totalTasks = dailyTasks.length;
  const completedTasks = dailyTasks.filter((t) => t.isCompleted).length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Kurum Yöneticisi Paneli
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{currentOrg?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Kurum Akademik Takip ve İzleme Merkezi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tüm sınıfların, branş öğretmenlerinin ve öğrencilerin haftalık performans ve ödev grafikleri
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            title="PostgreSQL / Supabase Durumu, Migration ve Multi-Tenant Yönetimi"
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Sistem & DB Yönetimi</span>
          </button>
          <button
            onClick={() => onNavigateTab('admin-classes')}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Sınıfları Yönet
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Toplam Öğrenci</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{institutionStudents.length}</span>
            <span className="text-xs text-slate-500 font-medium">kayıtlı öğrenci</span>
          </div>
          <div className="text-xs text-slate-400">2 aktif şube</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Öğretmen Kadrosu</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{institutionTeachers.length}</span>
            <span className="text-xs text-slate-500 font-medium">branş öğretmeni</span>
          </div>
          <div className="text-xs text-slate-400">Matematik, Türkçe, Fen</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Okul Geneli Ödev Tamamlama</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">%{overallRate}</span>
            <span className="text-xs text-slate-500 font-medium">başarı</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Aktif Sınıf Sayısı</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{classes.length}</span>
            <span className="text-xs text-slate-500 font-medium">şube</span>
          </div>
          <div className="text-xs text-purple-700 font-medium">8-A ve 8-B</div>
        </div>
      </div>

      {/* Sınıflar Karşılaştırma Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Şube & Sınıf Başarı Karşılaştırması</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sınıfların ödev tamamlama ve performans metrikleri</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-6">Sınıf</th>
                <th className="py-3.5 px-4">Öğrenci Sayısı</th>
                <th className="py-3.5 px-4">Görev Verilen Dersler</th>
                <th className="py-3.5 px-4">Tamamlanma Oranı</th>
                <th className="py-3.5 px-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => {
                const sInClass = studentProfiles.filter((s) => s.classId === cls.id);
                const sIds = sInClass.map((s) => s.id);
                const classTasks = dailyTasks.filter((t) => sIds.includes(t.studentId));
                const classCompleted = classTasks.filter((t) => t.isCompleted).length;
                const rate = classTasks.length > 0 ? Math.round((classCompleted / classTasks.length) * 100) : 0;

                return (
                  <tr
                    key={cls.id}
                    onClick={() => onSelectClass(cls.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          {cls.name}
                        </span>
                        <span>{cls.name} Sınıfı</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{sInClass.length} Öğrenci</td>
                    <td className="py-4 px-4 text-xs text-slate-600">Matematik, Türkçe, Fen Bilimleri</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">%{rate}</span>
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${rate >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg inline-flex items-center gap-1 transition-colors">
                        Sınıf Detayı <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database & Multi-Tenant Status Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};
