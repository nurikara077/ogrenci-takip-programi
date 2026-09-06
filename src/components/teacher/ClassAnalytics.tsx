import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Filter,
  ArrowUpRight,
  BookOpen,
  Award
} from 'lucide-react';

interface ClassAnalyticsProps {
  onSelectStudent?: (studentId: string) => void;
}

export const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({ onSelectStudent }) => {
  const {
    classes,
    studentProfiles,
    users,
    dailyTasks,
    studyRecords,
    subjects,
    teacherProfiles,
    currentUser,
    getTeacherStudents,
    getTaskRealization,
    canTeacherAccessTask
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  // Determine accessible students
  const accessibleStudents = useMemo(() => {
    if (currentUser.role === 'TEACHER') {
      return getTeacherStudents(currentUser.id);
    }
    return studentProfiles;
  }, [currentUser, getTeacherStudents, studentProfiles]);

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    if (selectedClassId === 'ALL') return accessibleStudents;
    return accessibleStudents.filter((s) => s.classId === selectedClassId);
  }, [accessibleStudents, selectedClassId]);

  // Filter tasks (Teacher only sees authorized tasks)
  const filteredTasks = useMemo(() => {
    return dailyTasks.filter((task) => {
      const isStudentMatch = filteredStudents.some((s) => s.id === task.studentId);
      if (!isStudentMatch) return false;
      if (selectedSubjectId !== 'ALL' && task.subjectId !== selectedSubjectId) return false;
      if (currentUser.role === 'TEACHER' && !canTeacherAccessTask(currentUser.id, task.id)) return false;
      return true;
    });
  }, [dailyTasks, filteredStudents, selectedSubjectId, currentUser, canTeacherAccessTask]);

  // Compute overall KPI metrics
  const kpiData = useMemo(() => {
    let totalAssigned = filteredTasks.length;
    let completedCount = 0;
    let overdueCount = 0;
    let totalTargetQuestions = 0;
    let totalActualQuestions = 0;

    filteredTasks.forEach((task) => {
      const real = getTaskRealization(task.id);
      totalTargetQuestions += task.targetQuestionCount || 0;
      totalActualQuestions += real.actualQuestions;
      if (real.status === 'COMPLETED' || real.status === 'LATE_COMPLETED') completedCount++;
      if (real.status === 'OVERDUE') overdueCount++;
    });

    const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
    const questionSuccessRate =
      totalTargetQuestions > 0
        ? Math.round((totalActualQuestions / totalTargetQuestions) * 1000) / 10
        : 0;

    return {
      totalAssigned,
      completedCount,
      overdueCount,
      completionRate,
      questionSuccessRate,
      totalTargetQuestions,
      totalActualQuestions,
    };
  }, [filteredTasks, getTaskRealization]);

  // Data for Chart 1: Homework Completion % by Class
  const classCompletionChartData = useMemo(() => {
    return classes.map((c) => {
      const classStudents = studentProfiles.filter((s) => s.classId === c.id);
      const classTasks = dailyTasks.filter((t) => {
        const matchesStudent = classStudents.some((s) => s.id === t.studentId);
        if (!matchesStudent) return false;
        if (selectedSubjectId !== 'ALL' && t.subjectId !== selectedSubjectId) return false;
        return true;
      });

      let completed = 0;
      classTasks.forEach((t) => {
        const r = getTaskRealization(t.id);
        if (r.status === 'COMPLETED' || r.status === 'LATE_COMPLETED') completed++;
      });

      const rate = classTasks.length > 0 ? Math.round((completed / classTasks.length) * 100) : 0;

      return {
        className: c.name,
        tamamlamaOrani: rate,
        toplamGorev: classTasks.length,
        tamamlanan: completed,
      };
    });
  }, [classes, studentProfiles, dailyTasks, selectedSubjectId, getTaskRealization]);

  // Data for Chart 2: Question Realization by Subject
  const subjectRealizationChartData = useMemo(() => {
    return subjects.map((sub) => {
      const subTasks = filteredTasks.filter((t) => t.subjectId === sub.id);
      let targetQ = 0;
      let actualQ = 0;

      subTasks.forEach((t) => {
        targetQ += t.targetQuestionCount || 0;
        const real = getTaskRealization(t.id);
        actualQ += real.actualQuestions;
      });

      const realizationPercent = targetQ > 0 ? Math.round((actualQ / targetQ) * 1000) / 10 : 0;

      return {
        subjectName: sub.name,
        gerceklesmeYuzdesi: realizationPercent,
        hedefSoru: targetQ,
        cozulenSoru: actualQ,
        renk: sub.colorHex || '#3B82F6',
      };
    });
  }, [subjects, filteredTasks, getTaskRealization]);

  // Student ranking data
  const studentRankingData = useMemo(() => {
    return filteredStudents.map((s) => {
      const user = users.find((u) => u.id === s.userId);
      const sTasks = filteredTasks.filter((t) => t.studentId === s.id);
      let sCompleted = 0;
      let sTargetQ = 0;
      let sActualQ = 0;
      let sOverdue = 0;

      sTasks.forEach((t) => {
        sTargetQ += t.targetQuestionCount || 0;
        const r = getTaskRealization(t.id);
        sActualQ += r.actualQuestions;
        if (r.status === 'COMPLETED' || r.status === 'LATE_COMPLETED') sCompleted++;
        if (r.status === 'OVERDUE') sOverdue++;
      });

      const compRate = sTasks.length > 0 ? Math.round((sCompleted / sTasks.length) * 100) : 0;
      const qPercent = sTargetQ > 0 ? Math.round((sActualQ / sTargetQ) * 1000) / 10 : 0;

      return {
        studentId: s.id,
        fullName: user?.fullName || 'Öğrenci',
        avatarUrl: user?.avatarUrl,
        className: classes.find((c) => c.id === s.classId)?.name || 'Bireysel',
        taskCount: sTasks.length,
        completedCount: sCompleted,
        overdueCount: sOverdue,
        completionRate: compRate,
        actualQuestions: sActualQ,
        targetQuestions: sTargetQ,
        questionRate: qPercent,
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredStudents, users, classes, filteredTasks, getTaskRealization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sınıf Analitik Raporu & Başarı Grafikleri
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recharts ile güçlendirilmiş sınıf ve branş bazlı ödev tamamlama, soru gerçekleşme ve performans analizleri.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Sınıf:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Sınıflar</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Ders:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Dersler</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ödev Tamamlama Oranı</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">%{kpiData.completionRate}</span>
            <span className="text-xs font-semibold text-emerald-700">
              {kpiData.completedCount}/{kpiData.totalAssigned} Görev
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpiData.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Soru Gerçekleşme Oranı</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              %{kpiData.questionSuccessRate.toString().replace('.', ',')}
            </span>
            <span className="text-xs font-semibold text-blue-700">
              {kpiData.totalActualQuestions}/{kpiData.totalTargetQuestions} Soru
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpiData.questionSuccessRate)}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gecikmiş / Bekleyen</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{kpiData.overdueCount}</span>
            <span className="text-xs font-medium text-slate-500">Gecikmiş Görev</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Teslim tarihi geçmiş fakat öğrenci kaydı girilmemiş</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">İzlenen Öğrenci</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{filteredStudents.length}</span>
            <span className="text-xs font-medium text-slate-500">Aktif Kayıtlı</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Seçili filtre kriterlerine uygun öğrenci sayısı</p>
        </div>
      </div>

      {/* RECHARTS GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Class Homework Completion Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Sınıflara Göre Ödev Tamamlama Yüzdeleri (%)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Sınıfların haftalık görev tamamlama performansı</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Recharts Bar Grafiği
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classCompletionChartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="className"
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <Tooltip
                  formatter={(value: any) => [`%${value}`, 'Ödev Tamamlama']}
                  labelFormatter={(label: any) => `Sınıf: ${label}`}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="tamamlamaOrani"
                  name="Tamamlama Oranı (%)"
                  fill="#4F46E5"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                >
                  {classCompletionChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.tamamlamaOrani >= 75 ? '#10B981' : entry.tamamlamaOrani >= 50 ? '#4F46E5' : '#F59E0B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> %75+ Yüksek
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" /> %50-%74 Standart
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> %50 Altı Dikkat
            </span>
          </div>
        </div>

        {/* Graph 2: Subject Realization Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Ders Bazlı Soru Gerçekleşme Oranı (%)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Hedeflenen soru sayısına karşı çözülen gerçek sorular</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              Branş Dağılımı
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectRealizationChartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="subjectName"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `%${value.toString().replace('.', ',')} (${item.payload.cozulenSoru}/${item.payload.hedefSoru} Soru)`,
                    'Gerçekleşme',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="gerceklesmeYuzdesi"
                  name="Gerçekleşme (%)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                >
                  {subjectRealizationChartData.map((entry, index) => (
                    <Cell key={`cell-sub-${index}`} fill={entry.renk} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            {subjectRealizationChartData.map((s) => (
              <span key={s.subjectName} className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.renk }} />
                {s.subjectName}: %{s.gerceklesmeYuzdesi.toString().replace('.', ',')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Student Performance Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Öğrenci Bazlı Tamamlama & Gerçekleşme Sıralaması</h3>
              <p className="text-xs text-slate-500">Öğrenci detayını açmak için satıra tıklayabilirsiniz</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {studentRankingData.length} Öğrenci
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Öğrenci</th>
                <th className="px-4 py-3">Sınıf</th>
                <th className="px-4 py-3">Ödev Tamamlama</th>
                <th className="px-4 py-3">Hedef Soru / Çözülen</th>
                <th className="px-4 py-3">Soru Gerçekleşme</th>
                <th className="px-4 py-3">Gecikmiş</th>
                <th className="px-4 py-3 text-right">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentRankingData.map((row) => (
                <tr
                  key={row.studentId}
                  onClick={() => onSelectStudent && onSelectStudent(row.studentId)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={row.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={row.fullName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-bold text-slate-900">{row.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-semibold">{row.className}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.completionRate >= 80
                              ? 'bg-emerald-500'
                              : row.completionRate >= 50
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, row.completionRate)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800">%{row.completionRate}</span>
                      <span className="text-[10px] text-slate-400">
                        ({row.completedCount}/{row.taskCount})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">
                    {row.actualQuestions} / {row.targetQuestions} Soru
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {row.targetQuestions > 0 && row.actualQuestions > row.targetQuestions
                          ? '%100 Tamamlandı'
                          : `%${row.questionRate.toString().replace('.', ',')}`}
                      </span>
                      {row.targetQuestions > 0 && row.actualQuestions > row.targetQuestions && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          +{row.actualQuestions - row.targetQuestions} ekstra
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {row.overdueCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <AlertCircle className="w-3 h-3" />
                        {row.overdueCount} Gecikmiş
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectStudent) onSelectStudent(row.studentId);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Öğrenci Profilini Aç"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
