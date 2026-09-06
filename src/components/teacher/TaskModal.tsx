import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, BookOpen, Clock, Target, FileText } from 'lucide-react';
import { DailyTask, TaskType } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentId: string;
  defaultDayOfWeek?: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';
  defaultDate?: string;
  editTask?: DailyTask | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  selectedStudentId,
  defaultDayOfWeek = 'Pazartesi',
  defaultDate = '2026-08-31',
  editTask = null,
}) => {
  const { 
    subjects, 
    resources, 
    resourceTopics, 
    studentProfiles, 
    users, 
    teacherProfiles, 
    teacherClassRelations,
    currentUser,
    addDailyTask,
    updateDailyTask,
    studentResources,
    updateStudentResource,
    assignResourceToStudent,
    canTeacherAccessResource
  } = useApp();

  const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);

  // Compute allowed subjects for this teacher
  const teacherSubjectIds = teacherClassRelations
    .filter((tcr) => tcr.teacherId === currentTeacherProfile?.id)
    .map((tcr) => tcr.subjectId);

  const allowedSubjects = currentUser.role === 'TEACHER' && currentTeacherProfile
    ? subjects.filter((s) => 
        teacherSubjectIds.includes(s.id) || 
        (currentTeacherProfile.branch && s.name.toLowerCase().includes(currentTeacherProfile.branch.toLowerCase()))
      )
    : subjects;

  const defaultSubjectId = allowedSubjects[0]?.id || 'sub-mat';

  // Only show resources authorized for this teacher
  const allowedTeacherResources = currentUser.role === 'TEACHER'
    ? resources.filter((r) => canTeacherAccessResource(currentUser.id, r.id))
    : resources.filter((r) => !r.isArchived && r.status !== 'ARCHIVED');

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState(defaultDayOfWeek);
  const [taskDate, setTaskDate] = useState(defaultDate);
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [resourceId, setResourceId] = useState<string>(() => allowedTeacherResources[0]?.id || '');
  const [resourceTopicId, setResourceTopicId] = useState<string>('');
  const [taskType, setTaskType] = useState<TaskType>('QUESTION_TARGET');
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(12);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(45);
  const [startPage, setStartPage] = useState<number>(60);
  const [endPage, setEndPage] = useState<number>(64);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [autoExpandScope, setAutoExpandScope] = useState<boolean>(true);

  // Auto-fill when editing or opening
  useEffect(() => {
    if (editTask) {
      setDayOfWeek(editTask.dayOfWeek);
      setTaskDate(editTask.taskDate);
      setSubjectId(editTask.subjectId);
      setResourceId(editTask.resourceId || '');
      setResourceTopicId(editTask.resourceTopicId || '');
      setTaskType(editTask.taskType);
      setTargetQuestionCount(editTask.targetQuestionCount || 0);
      setTargetDurationMinutes(editTask.targetDurationMinutes || 0);
      setStartPage(editTask.startPage || 1);
      setEndPage(editTask.endPage || 1);
      setDescription(editTask.description || '');
    } else {
      setDayOfWeek(defaultDayOfWeek);
      setTaskDate(defaultDate);
      // Pick first assigned resource for student if accessible by teacher
      const studentAssigned = studentResources.filter(
        (sr) => sr.studentId === selectedStudentId && sr.status === 'ACTIVE' &&
          (currentUser.role !== 'TEACHER' || canTeacherAccessResource(currentUser.id, sr.resourceId))
      );
      if (studentAssigned.length > 0) {
        const firstSr = studentAssigned[0];
        const matchRes = allowedTeacherResources.find((r) => r.id === firstSr.resourceId);
        if (matchRes) {
          setSubjectId(matchRes.subjectId);
          setResourceId(matchRes.id);
          setStartPage(firstSr.assignedStartPage);
          setEndPage(Math.min(firstSr.assignedStartPage + 4, firstSr.assignedEndPage));
        }
      } else if (allowedTeacherResources.length > 0) {
        const firstMatch = allowedTeacherResources.find((r) => r.subjectId === defaultSubjectId) || allowedTeacherResources[0];
        setSubjectId(firstMatch.subjectId);
        setResourceId(firstMatch.id);
        setStartPage(firstMatch.startPage || 1);
        setEndPage(Math.min((firstMatch.startPage || 1) + 4, firstMatch.endPage || 100));
      } else {
        setResourceId('');
      }
    }
  }, [editTask, defaultDayOfWeek, defaultDate, isOpen, selectedStudentId]);

  if (!isOpen) return null;

  const filteredResources = allowedTeacherResources.filter((r) => r.subjectId === subjectId);
  const filteredTopics = resourceTopics.filter((t) => t.resourceId === resourceId);

  const handleResourceChange = (newResId: string) => {
    setResourceId(newResId);
    setResourceTopicId('');
    if (!newResId) return;

    const assigned = studentResources.find(
      (sr) => sr.studentId === selectedStudentId && sr.resourceId === newResId
    );
    if (assigned) {
      setStartPage(assigned.assignedStartPage);
      setEndPage(Math.min(assigned.assignedStartPage + 4, assigned.assignedEndPage));
    } else {
      const res = resources.find((r) => r.id === newResId);
      if (res) {
        setStartPage(res.startPage || 1);
        setEndPage(Math.min((res.startPage || 1) + 4, res.endPage || res.totalPages || 100));
      }
    }
  };

  const handleTopicChange = (tId: string) => {
    setResourceTopicId(tId);
    const selectedTopic = resourceTopics.find((t) => t.id === tId);
    if (selectedTopic) {
      setStartPage(selectedTopic.startPage);
      setEndPage(Math.min(selectedTopic.startPage + 4, selectedTopic.endPage));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (startPage > endPage) {
      setErrorMessage('Bitiş sayfası başlangıç sayfasından küçük olamaz.');
      return;
    }

    const selectedRes = resources.find((r) => r.id === resourceId);
    if (selectedRes?.isArchived) {
      setErrorMessage(`İşlem Reddedildi: Arşivlenmiş bir kaynak ("${selectedRes.title}") ile yeni ödev görevi oluşturulamaz.`);
      return;
    }

    if (targetQuestionCount <= 0 && targetDurationMinutes <= 0) {
      setErrorMessage('Lütfen en az bir hedef soru sayısı veya çalışma süresi belirleyin.');
      return;
    }

    try {
      if (resourceId) {
        const assignedSr = studentResources.find(
          (sr) => sr.studentId === selectedStudentId && sr.resourceId === resourceId
        );
        if (!assignedSr) {
          assignResourceToStudent(
            resourceId,
            selectedStudentId,
            Number(startPage),
            Number(endPage),
            taskDate,
            Number(targetQuestionCount),
            'Görev oluşturulurken atandı'
          );
        } else if (
          autoExpandScope &&
          (Number(startPage) < assignedSr.assignedStartPage || Number(endPage) > assignedSr.assignedEndPage)
        ) {
          updateStudentResource(assignedSr.id, {
            assignedStartPage: Math.min(assignedSr.assignedStartPage, Number(startPage)),
            assignedEndPage: Math.max(assignedSr.assignedEndPage, Number(endPage)),
          });
        }
      }

      if (editTask) {
        updateDailyTask(editTask.id, {
          subjectId,
          resourceId: resourceId || undefined,
          resourceTopicId: resourceTopicId || undefined,
          dayOfWeek,
          taskDate,
          taskType,
          targetQuestionCount: Number(targetQuestionCount),
          targetDurationMinutes: Number(targetDurationMinutes),
          startPage: Number(startPage),
          endPage: Number(endPage),
          description: description.trim() || undefined,
          autoExpandScope: true,
        });
      } else {
        addDailyTask({
          weeklyPlanId: `wp-${selectedStudentId}-week1`,
          studentId: selectedStudentId,
          teacherId: currentTeacherProfile?.id || 'tp-ahmet',
          subjectId,
          resourceId: resourceId || undefined,
          resourceTopicId: resourceTopicId || undefined,
          dayOfWeek,
          taskDate,
          taskType,
          targetQuestionCount: Number(targetQuestionCount),
          targetDurationMinutes: Number(targetDurationMinutes),
          startPage: Number(startPage),
          endPage: Number(endPage),
          description: description.trim() || undefined,
          autoExpandScope: true,
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Görev kaydedilirken bir hata oluştu.');
    }
  };

  const student = studentProfiles.find((s) => s.id === selectedStudentId);
  const studentUser = users.find((u) => u.id === student?.userId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {editTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Öğrenci: <span className="font-semibold text-slate-700">{studentUser?.fullName}</span> • {dayOfWeek}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Day & Date Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Haftanın Günü</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Pazartesi">Pazartesi</option>
                <option value="Salı">Salı</option>
                <option value="Çarşamba">Çarşamba</option>
                <option value="Perşembe">Perşembe</option>
                <option value="Cuma">Cuma</option>
                <option value="Cumartesi">Cumartesi</option>
                <option value="Pazar">Pazar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tarih</label>
              <input
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subject & Resource */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ders</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  const newRes = allowedTeacherResources.find((r) => r.subjectId === e.target.value);
                  setResourceId(newRes?.id || '');
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {allowedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kaynak Kitap</label>
              <select
                value={resourceId}
                onChange={(e) => handleResourceChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">(Serbest Görev / Kaynaksız)</option>
                {filteredResources.map((r) => {
                  const isAssigned = studentResources.some(
                    (sr) => sr.studentId === selectedStudentId && sr.resourceId === r.id && sr.status === 'ACTIVE'
                  );
                  return (
                    <option key={r.id} value={r.id}>
                      {isAssigned ? '✓ ' : ''}{r.title} {r.isArchived ? '⚠️ (Arşivlenmiş Kaynak)' : ''}
                    </option>
                  );
                })}
              </select>
              {currentUser.role === 'TEACHER' && filteredResources.length === 0 && (
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  Bu branşta size yetkilendirilmiş kaynak bulunmuyor.
                </p>
              )}
              {resources.find((r) => r.id === resourceId)?.isArchived && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  ⚠️ Bu kaynak arşivlenmiştir. Arşivli kaynaklarla görev oluşturulamaz!
                </p>
              )}
            </div>
          </div>

          {/* Topic & Page Range */}
          {resourceId && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              {/* Student Scope Info */}
              {(() => {
                const assigned = studentResources.find(
                  (sr) => sr.studentId === selectedStudentId && sr.resourceId === resourceId
                );
                if (assigned) {
                  const isOutOfScope = Number(startPage) < assigned.assignedStartPage || Number(endPage) > assigned.assignedEndPage;
                  return (
                    <div className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${isOutOfScope ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          Öğrenci Kapsamı: Sayfa {assigned.assignedStartPage} - {assigned.assignedEndPage}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStartPage(assigned.assignedStartPage);
                            setEndPage(Math.min(assigned.assignedStartPage + 4, assigned.assignedEndPage));
                          }}
                          className="font-bold underline text-indigo-700 hover:text-indigo-900 text-[11px] cursor-pointer"
                        >
                          Kapsama Eşitle
                        </button>
                      </div>
                      {isOutOfScope && (
                        <label className="flex items-center gap-2 cursor-pointer pt-1 font-medium text-amber-900 text-[11px] border-t border-amber-200/60">
                          <input
                            type="checkbox"
                            checked={autoExpandScope}
                            onChange={(e) => setAutoExpandScope(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Öğrencinin kaynak kapsamını ({Math.min(assigned.assignedStartPage, Number(startPage))} - {Math.max(assigned.assignedEndPage, Number(endPage))}) olarak genişlet</span>
                        </label>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-xs">
                      ℹ️ Bu kaynak bu öğrenciye henüz atanmamış. Görev kaydedildiğinde kaynak öğrenciye ({startPage}-{endPage}) sayfasıyla otomatik atanacaktır.
                    </div>
                  );
                }
              })()}

              {filteredTopics.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Konu Seçimi (Opsiyonel)</label>
                  <select
                    value={resourceTopicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Konu Seçin...</option>
                    {filteredTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} (Sayfa {t.startPage}-{t.endPage})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sayfa Aralığı</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Başlangıç</span>
                    <input
                      type="number"
                      value={startPage}
                      onChange={(e) => setStartPage(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center"
                    />
                  </div>
                  <span className="text-slate-400 font-bold mt-4">-</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Bitiş</span>
                    <input
                      type="number"
                      value={endPage}
                      onChange={(e) => setEndPage(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Targets: Soru & Süre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Günlük Soru Hedefi
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={targetQuestionCount}
                  onChange={(e) => setTargetQuestionCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">Soru</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hedef Çalışma Süresi
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={targetDurationMinutes}
                  onChange={(e) => setTargetDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">Dakika</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Öğretmen Açıklaması / Yönerge</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: 3. ve 4. sorular yeni nesil sorulardır, video çözümünü izle."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              {editTask ? 'Değişiklikleri Kaydet' : 'Görevi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
