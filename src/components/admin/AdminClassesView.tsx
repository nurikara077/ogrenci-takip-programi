import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Users, 
  BookOpen, 
  ChevronRight, 
  Calendar, 
  X, 
  CheckCircle2 
} from 'lucide-react';

interface AdminClassesViewProps {
  onSelectClass: (classId: string) => void;
}

export const AdminClassesView: React.FC<AdminClassesViewProps> = ({ onSelectClass }) => {
  const { 
    classes, 
    studentProfiles, 
    teacherProfiles, 
    users, 
    teacherClassRelations, 
    subjects, 
    addClass 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<number>(8);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const filteredClasses = classes.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.academicYear.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!className.trim()) {
      setFormError('Lütfen bir sınıf adı girin (Örn: 8-C).');
      return;
    }

    try {
      const created = addClass({
        name: className.trim(),
        gradeLevel: Number(gradeLevel),
        academicYear: academicYear.trim(),
      });

      setShowAddModal(false);
      setClassName('');
      setSuccessToast(`"${created.name}" sınıfı başarıyla oluşturuldu ve şubeler listesine eklendi!`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Sınıf oluşturulurken bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sınıflar ve Şubeler</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kurumun tüm şubelerini, öğrenci dağılımlarını ve atanan branş öğretmenlerini yönetin.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Sınıf Ekle</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktif Şube</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{classes.length}</div>
          <p className="text-xs text-slate-500 mt-1">Toplam kayıtlı sınıf</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Şube Öğrencileri</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {studentProfiles.filter((sp) => sp.classId).length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Şubelere kayıtlı öğrenci</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akademik Yıl</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">2026-2027</div>
          <p className="text-xs text-slate-500 mt-1">Geçerli öğretim dönemi</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Sınıf adı ara (Örn: 8-A, 8-C)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Toplam <span className="font-bold text-slate-800">{filteredClasses.length}</span> şube listeleniyor
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClasses.map((c) => {
          const classStudents = studentProfiles.filter((sp) => sp.classId === c.id);
          const assignedRelations = teacherClassRelations.filter((tcr) => tcr.classId === c.id);
          const assignedTeacherIds = Array.from(new Set(assignedRelations.map((tcr) => tcr.teacherId)));
          const assignedTeachers = teacherProfiles.filter((tp) => assignedTeacherIds.includes(tp.id));

          return (
            <div
              key={c.id}
              onClick={() => onSelectClass(c.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold text-base flex items-center justify-center border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {c.name}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.name} Şubesi</h3>
                      <p className="text-xs text-slate-500">{c.gradeLevel}. Sınıf • {c.academicYear}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Kayıtlı Öğrenci
                    </span>
                    <span className="font-bold text-slate-800">{classStudents.length} Öğrenci</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      Atanan Öğretmen
                    </span>
                    <span className="font-bold text-slate-800">{assignedTeachers.length} Öğretmen</span>
                  </div>

                  {assignedTeachers.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {assignedTeachers.map((tp) => {
                        const u = users.find((user) => user.id === tp.userId);
                        return (
                          <span key={tp.id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {u?.fullName || 'Öğretmen'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-purple-600 font-semibold group-hover:underline">
                  Şube Detayları ve Öğrenciler
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Aktif
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Yeni Sınıf Ekle */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Yeni Sınıf Oluştur</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf / Şube Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 8-C"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf Seviyesi *</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={5}>5. Sınıf</option>
                  <option value={6}>6. Sınıf</option>
                  <option value={7}>7. Sınıf</option>
                  <option value={8}>8. Sınıf (LGS)</option>
                  <option value={9}>9. Sınıf</option>
                  <option value={10}>10. Sınıf</option>
                  <option value={11}>11. Sınıf</option>
                  <option value={12}>12. Sınıf (YKS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Akademik Yıl *</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  Sınıfı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
