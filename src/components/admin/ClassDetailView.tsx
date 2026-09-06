import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Check, 
  X, 
  ChevronRight,
  TrendingUp,
  UserPlus,
  Trash2
} from 'lucide-react';

interface ClassDetailViewProps {
  classId: string;
  onBack: () => void;
  onSelectStudent: (studentId: string) => void;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({ classId: initialClassId, onBack, onSelectStudent }) => {
  const { 
    classes, 
    studentProfiles, 
    teacherProfiles, 
    users, 
    subjects, 
    teacherClassRelations, 
    dailyTasks, 
    studyRecords,
    addClass,
    assignTeacherToClass,
    removeTeacherFromClass
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState(initialClassId || classes[0]?.id || 'class-8a');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState(8);
  const [assignTeacherId, setAssignTeacherId] = useState(teacherProfiles[0]?.id || '');
  const [assignSubjectId, setAssignSubjectId] = useState(subjects[0]?.id || '');
  const [toastMessage, setToastMessage] = useState('');

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Students in this class
  const classStudents = studentProfiles.filter((s) => s.classId === currentClass?.id);

  // Teachers teaching in this class
  const classTeacherRelations = teacherClassRelations.filter((tcr) => tcr.classId === currentClass?.id);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const created = addClass({
      name: newClassName.trim(),
      gradeLevel: Number(newGradeLevel),
      academicYear: '2026-2027',
      organizationId: 'org-1',
    });

    setSelectedClassId(created.id);
    setShowAddClassModal(false);
    setNewClassName('');
    setToastMessage(`"${newClassName.trim()}" şubesi başarıyla oluşturuldu!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherId || !assignSubjectId || !currentClass) return;

    assignTeacherToClass(assignTeacherId, currentClass.id, assignSubjectId);
    setShowAssignTeacherModal(false);
    setToastMessage('Öğretmen branş ataması başarıyla kaydedildi!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleRemoveTeacher = (relationId: string) => {
    removeTeacherFromClass(relationId);
    setToastMessage('Öğretmen sınıf ataması kaldırıldı.');
    setTimeout(() => setToastMessage(''), 4000);
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

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kurum Genel Görünüme Dön
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 font-bold text-base flex items-center justify-center">
              {currentClass.name}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{currentClass.name} Şube Paneli</h1>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} Şubesine Geç
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentClass.gradeLevel}. Sınıf • {classStudents.length} Öğrenci • 2026-2027 Eğitim Öğretim Yılı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssignTeacherModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Branşa Öğretmen Ata
            </button>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Şube Tanımla
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column: Teachers of the class & Class Student Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subject Teachers assigned to 8-A */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              Sınıfın Branş Öğretmenleri
            </h3>
            <span className="text-xs text-slate-400 font-medium">{classTeacherRelations.length} Branş</span>
          </div>

          <div className="space-y-3">
            {classTeacherRelations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Bu şubeye henüz atanmış branş öğretmeni bulunmuyor.
              </div>
            ) : (
              classTeacherRelations.map((rel) => {
                const teacherProfile = teacherProfiles.find((tp) => tp.id === rel.teacherId);
                const teacherUser = users.find((u) => u.id === teacherProfile?.userId);
                const subject = subjects.find((s) => s.id === rel.subjectId);

                return (
                  <div key={rel.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{teacherUser?.fullName}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: subject?.colorHex || '#2563EB' }}
                        >
                          {subject?.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeacher(rel.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                          title="Atamayı Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {teacherUser?.phone || '05xx xxx xx xx'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Student Roster & Live Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              {currentClass.name} Sınıfı Öğrenci Listesi
            </h3>
            <span className="text-xs text-slate-400 font-medium">{classStudents.length} Kayıtlı</span>
          </div>

          <div className="divide-y divide-slate-100">
            {classStudents.map((student) => {
              const user = users.find((u) => u.id === student.userId);

              // Calculate tasks for this student
              const sTasks = dailyTasks.filter((t) => t.studentId === student.id);
              const sRecords = studyRecords.filter((r) => r.studentId === student.id);
              const plannedQ = sTasks.reduce((s, t) => s + (t.targetQuestionCount || 0), 0);
              const actualQ = sRecords.reduce((s, r) => s + r.actualQuestionCount, 0);
              const rate = plannedQ > 0 ? Math.round((actualQ / plannedQ) * 100) : 0;

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={user?.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{user?.fullName}</div>
                      <div className="text-xs text-slate-500">Öğrenci No: {student.studentNumber || '—'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">%{rate} Tamamlama</div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Yeni Sınıf / Şube Ekle</h3>
              <button onClick={() => setShowAddClassModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Şube Adı</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Örn: 8-C"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kademe / Sınıf Seviyesi</label>
                <select
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value={5}>5. Sınıf</option>
                  <option value={6}>6. Sınıf</option>
                  <option value={7}>7. Sınıf</option>
                  <option value={8}>8. Sınıf (LGS)</option>
                  <option value={11}>11. Sınıf (YKS Hazırlık)</option>
                  <option value={12}>12. Sınıf (YKS)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  Şubeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher to Class Modal */}
      {showAssignTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Branş Öğretmeni Ata</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentClass?.name} Şubesi İçin</p>
              </div>
              <button onClick={() => setShowAssignTeacherModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Öğretmen Seçin</label>
                <select
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  {teacherProfiles.map((tp) => {
                    const u = users.find((user) => user.id === tp.userId);
                    return (
                      <option key={tp.id} value={tp.id}>
                        {u?.fullName} ({tp.branch})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ders / Branş</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAssignTeacherModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
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
