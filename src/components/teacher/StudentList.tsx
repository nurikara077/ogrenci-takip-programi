import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Calendar, 
  BookOpen, 
  Phone, 
  Check, 
  X,
  GraduationCap
} from 'lucide-react';

interface StudentListProps {
  onSelectStudent: (studentId: string) => void;
  onOpenPlannerForStudent: (studentId: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ onSelectStudent, onOpenPlannerForStudent }) => {
  const { 
    currentUser,
    studentProfiles, 
    users, 
    classes, 
    dailyTasks, 
    studyRecords, 
    studentResources,
    addStudent,
    getTeacherStudents,
    getTeacherClasses
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isIndependent, setIsIndependent] = useState(false);
  const [classId, setClassId] = useState('class-8a');
  const [studentNumber, setStudentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Scoped students & classes based on user role
  const accessibleStudents = currentUser.role === 'TEACHER' 
    ? getTeacherStudents(currentUser.id) 
    : studentProfiles;

  const availableClasses = currentUser.role === 'TEACHER'
    ? getTeacherClasses(currentUser.id)
    : classes;

  // Filtering
  const filteredStudents = accessibleStudents.filter((student) => {
    const user = users.find((u) => u.id === student.userId);
    if (!user) return false;

    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.studentNumber && student.studentNumber.includes(searchQuery));

    if (!matchesSearch) return false;

    if (selectedClassFilter === 'INDEPENDENT') {
      return !student.classId;
    }
    if (selectedClassFilter !== 'ALL') {
      return student.classId === selectedClassFilter;
    }

    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || fullName.trim().length < 3) {
      setFormError('Öğrenci adı soyadı en az 3 karakter olmalıdır.');
      return;
    }

    try {
      const newSp = addStudent({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        classId: isIndependent ? undefined : classId,
        studentNumber: studentNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        isIndependent,
      });

      setShowAddModal(false);
      setFullName('');
      setPhone('');
      setStudentNumber('');
      setNotes('');
      setSuccessToast('Yeni öğrenci başarıyla eklendi ve listenize bağlandı!');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Öğrenci eklenirken bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Öğrenci Yönetimi</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Takip ettiğiniz kurum sınıfları ve bireysel özel ders öğrencileri
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Öğrenci Ekle
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrenci adı, soyadı veya numarası ara..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tüm Sınıflar & Özel Ders</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} Sınıfı
                </option>
              ))}
              <option value="INDEPENDENT">Bireysel Özel Ders</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Öğrenci Bulunamadı</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Arama kriterinize uygun öğrenci yok. Filtreleri temizleyebilir veya yeni bir öğrenci ekleyebilirsiniz.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClassFilter('ALL');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Öğrenci</th>
                  <th className="py-3.5 px-4">Sınıf / Tür</th>
                  <th className="py-3.5 px-4">Atanan Kaynak</th>
                  <th className="py-3.5 px-4">Haftalık Soru (Plan / Gerçek)</th>
                  <th className="py-3.5 px-4">Başarı Oranı</th>
                  <th className="py-3.5 px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((student) => {
                  const user = users.find((u) => u.id === student.userId);
                  const studentClass = classes.find((c) => c.id === student.classId);

                  // Calculate stats
                  const myTasks = dailyTasks.filter((t) => t.studentId === student.id);
                  const myRecords = studyRecords.filter((r) => r.studentId === student.id);

                  const plannedQ = myTasks.reduce((s, t) => s + (t.targetQuestionCount || 0), 0);
                  const actualQ = myRecords.reduce((s, r) => s + r.actualQuestionCount, 0);
                  const successRate = plannedQ > 0 ? Math.round((actualQ / plannedQ) * 100) : 0;

                  const assignedResCount = studentResources.filter((sr) => sr.studentId === student.id).length;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectStudent(student.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={user?.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{user?.fullName}</div>
                            <div className="text-xs text-slate-500">No: {student.studentNumber || '—'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {studentClass ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {studentClass.name} Sınıfı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Bireysel Özel Ders
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {assignedResCount} Kitap
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {actualQ} / {plannedQ} Soru
                        </div>
                        <div className="text-[11px] text-slate-400">Bu haftalık hedef</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              successRate >= 80 ? 'text-emerald-600' : successRate >= 50 ? 'text-amber-600' : 'text-slate-500'
                            }`}
                          >
                            %{successRate}
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                successRate >= 80 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-amber-500' : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.min(100, successRate)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenPlannerForStudent(student.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Program
                        </button>
                        <button
                          onClick={() => onSelectStudent(student.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          Detay
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Yeni Öğrenci Ekle</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kurum sınıfına veya özel ders listenize bağlayın</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Student Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Öğrenci Tipi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIndependent(false)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      !isIndependent
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Kurum Sınıfı Öğrencisi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIndependent(true)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      isIndependent
                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bireysel Özel Ders
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ad Soyad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Örn: Mehmet Demir"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Class picker if not independent */}
                {!isIndependent ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf</label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci Kodu</label>
                    <input
                      type="text"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      placeholder="Örn: ÖZEL-02"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon (Opsiyonel)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xx xxx xx xx"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğretmen Notu</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Hedef sınav, eksik konular, çalışma alışkanlıkları vb."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
