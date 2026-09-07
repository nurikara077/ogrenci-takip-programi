import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Target, 
  BookOpen, 
  Plus, 
  Minus, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { DailyTask } from '../../types';
import { DEFAULT_SIMULATION_DATE } from '../../utils/dateUtils';

interface StudyRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DailyTask | null;
  onSuccess?: () => void;
}

export const StudyRecordModal: React.FC<StudyRecordModalProps> = ({ isOpen, onClose, task, onSuccess }) => {
  const {
    currentUser,
    studentProfiles,
    subjects,
    resources,
    studentResources,
    isTaskOverdue,
    saveStudyRecord,
    completeLateDailyTask,
  } = useApp();

  const [actualQuestions, setActualQuestions] = useState<number>(10);
  const [actualMinutes, setActualMinutes] = useState<number>(45);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const assignedSr = task?.resourceId
    ? studentResources.find(
        (sr) => sr.studentId === task.studentId && sr.resourceId === task.resourceId
      )
    : undefined;

  useEffect(() => {
    if (task) {
      setActualQuestions(task.targetQuestionCount || 10);
      setActualMinutes(task.targetDurationMinutes || 45);
      setStartPage(task.startPage || assignedSr?.assignedStartPage || 1);
      setEndPage(task.endPage || task.startPage || assignedSr?.assignedStartPage || 1);
      setNotes('');
      setErrorMessage('');
    }
  }, [task, assignedSr]);

  if (!isOpen || !task) return null;

  const subject = subjects.find((s) => s.id === task.subjectId);
  const resource = resources.find((r) => r.id === task.resourceId);
  const currentStudent = studentProfiles.find((profile) => profile.userId === currentUser.id);
  const isOverdueTask = isTaskOverdue(task, DEFAULT_SIMULATION_DATE);

  // Success rate preview calculations
  const questionSuccessPercent = (task.targetQuestionCount && task.targetQuestionCount > 0)
    ? Math.round((actualQuestions / task.targetQuestionCount) * 100)
    : 100;

  const durationSuccessPercent = (task.targetDurationMinutes && task.targetDurationMinutes > 0)
    ? Math.round((actualMinutes / task.targetDurationMinutes) * 100)
    : 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (actualQuestions < 0 || actualMinutes <= 0) {
      setErrorMessage('Lütfen geçerli bir soru sayısı ve çalışma süresi girin.');
      return;
    }

    if (assignedSr && startPage && endPage) {
      if (startPage < assignedSr.assignedStartPage || endPage > assignedSr.assignedEndPage) {
        setErrorMessage(
          `Girdiğiniz sayfa aralığı (${startPage} - ${endPage}), size atanan aralık olan Sayfa ${assignedSr.assignedStartPage} - ${assignedSr.assignedEndPage} dışındadır.`
        );
        return;
      }
      if (startPage > endPage) {
        setErrorMessage('Başlangıç sayfası bitiş sayfasından büyük olamaz.');
        return;
      }
    }

    try {
      if (!currentStudent || currentStudent.id !== task.studentId) {
        throw new Error('Yalnızca kendi göreviniz için çalışma kaydı girebilirsiniz.');
      }

      const actualQuestionCount = Number(actualQuestions);
      const actualDurationMinutes = Number(actualMinutes);
      const completedStartPage = startPage ? Number(startPage) : undefined;
      const completedEndPage = endPage ? Number(endPage) : undefined;
      const studentNotes = notes.trim() || undefined;

      if (isOverdueTask) {
        const result = completeLateDailyTask(
          task.id,
          currentStudent.id,
          actualQuestionCount,
          actualDurationMinutes,
          completedStartPage,
          completedEndPage,
          studentNotes,
        );
        if (!result.success) {
          throw new Error(result.error || 'Gecikmiş görev tamamlanamadı.');
        }
      } else {
        saveStudyRecord({
          dailyTaskId: task.id,
          actualQuestionCount,
          actualDurationMinutes,
          completedStartPage,
          completedEndPage,
          studentNotes,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kayıt kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: subject?.colorHex || '#10B981' }}
              />
              <span className="text-xs font-bold text-slate-900">{subject?.name}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-0.5">Çalışma Kaydı Gir</h3>
            <p className="text-xs text-slate-500">
              {resource?.title || 'Ödev Görevi'} • {task.dayOfWeek}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Quick Target vs Actual Bar */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Öğretmenin Belirlediği Hedef:</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {task.targetQuestionCount || 0} Soru • {task.targetDurationMinutes || 0} Dakika
              </div>
            </div>
            {task.startPage && task.endPage && (
              <div className="text-right">
                <span className="text-slate-500">Sayfa Aralığı:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  Sayfa {task.startPage} - {task.endPage}
                </div>
              </div>
            )}
          </div>

          {/* Soru Sayısı Ayarlayıcı (Interactive Stepper) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Kaç Soru Çözdün? <span className="text-slate-400 font-normal">(Hedef: {task.targetQuestionCount})</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActualQuestions((q) => Math.max(0, q - 5))}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setActualQuestions((q) => Math.max(0, q - 1))}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min={0}
                value={actualQuestions}
                onChange={(e) => setActualQuestions(Number(e.target.value))}
                className="flex-1 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="button"
                onClick={() => setActualQuestions((q) => q + 1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActualQuestions((q) => q + 5)}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                +5
              </button>
            </div>
          </div>

          {/* Çalışma Süresi (Quick minute chips) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Ne Kadar Süre Çalıştın? <span className="text-slate-400 font-normal">(Dakika)</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[20, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setActualMinutes(mins)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    actualMinutes === mins
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mins} dk
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min={1}
                step={1}
                value={actualMinutes}
                onChange={(e) => setActualMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">Dakika</span>
            </div>
          </div>

          {/* Çözülen Sayfalar (Enables unique page progress matrix!) */}
          {task.resourceId && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Çözdüğün Sayfa Aralığı
                </label>
                {assignedSr && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Atanan: Sayfa {assignedSr.assignedStartPage} - {assignedSr.assignedEndPage}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400">Başlangıç</span>
                  <input
                    type="number"
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Bitiş</span>
                  <input
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center"
                  />
                </div>
              </div>
              {assignedSr && (startPage < assignedSr.assignedStartPage || endPage > assignedSr.assignedEndPage) && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  ⚠️ Dikkat: Girdiğiniz sayfalar, bu kaynak için size atanan Sayfa {assignedSr.assignedStartPage} - {assignedSr.assignedEndPage} aralığının dışındadır.
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                * Bu sayfalar kitap ilerlemenize kaydedilir ve öğretmeniniz tarafından incelenebilir.
              </p>
            </div>
          )}

          {/* Notes / Feedback */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Öğretmenine Notun (Zorlandığın soru var mı?)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: 8. soruyu yapamadım, derste üzerinden geçebilir miyiz?"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Live Success Preview Banner */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Soru Başarısı: %{questionSuccessPercent}</span>
            </div>
            <div className="font-semibold text-emerald-800">
              Süre: %{durationSuccessPercent}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              Çalışmayı Tamamla & Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
