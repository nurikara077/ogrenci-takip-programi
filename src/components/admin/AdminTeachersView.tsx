import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Plus, 
  Search, 
  BookOpen, 
  Mail, 
  Phone, 
  GraduationCap, 
  CheckCircle2, 
  X, 
  Building2,
  ChevronRight
} from 'lucide-react';

interface AdminTeachersViewProps {
  onSelectTeacher?: (teacherId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminTeachersView: React.FC<AdminTeachersViewProps> = ({ onSelectTeacher, onNavigateTab }) => {
  const { 
    currentUser, 
    teacherProfiles, 
    users, 
    subjects, 
    classes, 
    teacherClassRelations, 
    addTeacher,
    assignTeacherToClass,
    getTeacherStudents
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState<string | null>(null);
  const [assignClassId, setAssignClassId] = useState('class-8a');
  const [assignSubjectId, setAssignSubjectId] = useState('sub-mat');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('Matematik');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Kurum öğretmenleri
  const institutionTeachers = teacherProfiles.filter((tp) => {
    const u = users.find((user) => user.id === tp.userId);
    if (!u) return false;
    return (u.organizationId || 'org-1') === (currentUser.organizationId || 'org-1');
  });

  const filteredTeachers = institutionTeachers.filter((tp) => {
    const u = users.find((user) => user.id === tp.userId);
    if (!u) return false;

    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tp.branch && tp.branch.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedBranchFilter !== 'ALL') {
      const sub = subjects.find((s) => s.id === tp.branchSubjectId);
      if (sub?.name !== selectedBranchFilter && tp.branch !== selectedBranchFilter) {
        return false;
      }
    }

    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Lütfen ad ve soyad alanlarını doldurun.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (!branch.trim()) {
      setFormError('Lütfen bir branş belirleyin.');
      return;
    }

    try {
      addTeacher({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        branch: branch.trim(),
        status,
        phone: phone.trim() || undefined,
      });

      setShowAddModal(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setStatus('ACTIVE');
      setSuccessToast('Yeni öğretmen başarıyla oluşturuldu ve kuruma eklendi!');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Öğretmen eklenirken bir hata oluştu.');
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForAssign) return;

    try {
      assignTeacherToClass(selectedTeacherForAssign, assignClassId, assignSubjectId);
      setShowAssignModal(false);
      setSelectedTeacherForAssign(null);
      setSuccessToast('Öğretmen başarıyla sınıfa atandı!');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Atama sırasında bir hata oluştu.');
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
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Öğretmenler</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kurum bünyesindeki branş öğretmenlerini yönetin, yeni öğretmen ekleyin ve sınıf atamalarını düzenleyin.
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
          <span>Yeni Öğretmen Ekle</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Öğretmen</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{institutionTeachers.length}</div>
          <p className="text-xs text-slate-500 mt-1">Kurumda kayıtlı branş eğiticisi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktif Branşlar</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {new Set(institutionTeachers.map((tp) => tp.branch || tp.branchSubjectId)).size}
          </div>
          <p className="text-xs text-slate-500 mt-1">Farklı uzmanlık alanı</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sınıf Eşleşmeleri</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{teacherClassRelations.length}</div>
          <p className="text-xs text-slate-500 mt-1">Öğretmen-şube ataması</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Öğretmen adı, e-posta veya branş ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Branş:</span>
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Tüm Branşlar</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Öğretmen</th>
                <th className="py-3.5 px-4">Branş</th>
                <th className="py-3.5 px-4">Atandığı Şubeler</th>
                <th className="py-3.5 px-4">Öğrenci Sayısı</th>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Aranan kriterlere uygun öğretmen bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((tp) => {
                  const user = users.find((u) => u.id === tp.userId);
                  if (!user) return null;

                  const assignedClassRelations = teacherClassRelations.filter((tcr) => tcr.teacherId === tp.id);
                  const assignedClasses = classes.filter((c) => 
                    assignedClassRelations.some((tcr) => tcr.classId === c.id)
                  );
                  const studentCount = getTeacherStudents(user.id).length;
                  const subject = subjects.find((s) => s.id === tp.branchSubjectId);
                  const branchName = tp.branch || subject?.name || 'Branş Belirtilmemiş';

                  return (
                    <tr key={tp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={user.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{user.fullName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          {branchName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {assignedClasses.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Şube atanmadı</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedClasses.map((c) => (
                              <span key={c.id} className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {studentCount} öğrenci
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTeacherForAssign(tp.id);
                            setShowAssignModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 border border-purple-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Şube Ata</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Yeni Öğretmen Ekle */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Yeni Öğretmen Oluştur</h3>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Serdar"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Soyad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Yılmaz"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-posta Adresi *</label>
                <input
                  type="email"
                  required
                  placeholder="serdar.yilmaz@tarhankoleji.k12.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branş *</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="Matematik">Matematik</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="Fen Bilimleri">Fen Bilimleri</option>
                  <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Din Kültürü">Din Kültürü</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="0555 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hesap Durumu</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Pasif</option>
                  </select>
                </div>
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
                  Öğretmeni Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Şube Ata */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Öğretmeni Şubeye Ata</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Şube Seçin</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ders / Branş</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  Atamayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
