import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User, 
  FileText, 
  Check, 
  Calendar 
} from 'lucide-react';
import { DailyTask, Resource, ResourceTopic, StudyRecord } from '../../types';
import { DEFAULT_SIMULATION_DATE, formatDateTR } from '../../utils/dateUtils';

interface PageMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageNum: number;
  resource: Resource;
  studentId: string;
  studentName?: string;
  topic?: ResourceTopic;
  isTeacherOrAdmin: boolean;
}

export const PageMatrixModal: React.FC<PageMatrixModalProps> = ({
  isOpen,
  onClose,
  pageNum,
  resource,
  studentId,
  studentName,
  topic,
  isTeacherOrAdmin,
}) => {
  const { 
    dailyTasks, 
    studyRecords, 
    currentUser, 
    verifyDailyTask, 
    rejectDailyTask 
  } = useApp();

  const [rejectNote, setRejectNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  // Find tasks that include this page for this student and resource
  const matchingTasks = dailyTasks.filter(
    (t) =>
      t.studentId === studentId &&
      t.resourceId === resource.id &&
      t.startPage !== undefined &&
      t.endPage !== undefined &&
      pageNum >= t.startPage &&
      pageNum <= t.endPage
  );

  // Find study records that include this page for this student and resource
  const matchingRecords = studyRecords.filter(
    (sr) =>
      sr.studentId === studentId &&
      sr.resourceId === resource.id &&
      sr.completedStartPage !== undefined &&
      sr.completedEndPage !== undefined &&
      pageNum >= sr.completedStartPage &&
      pageNum <= sr.completedEndPage
  );

  // Determine page status according to 6-color standard
  let pageStatus = {
    code: 'NOT_STARTED',
    title: 'Henüz Çözülmedi',
    desc: 'Bu sayfa için henüz bir çalışma kaydı girilmedi.',
    badgeClass: 'bg-white text-slate-700 border-slate-300',
    dotClass: 'bg-slate-300',
    colorHex: '#64748b',
  };

  const hasVerifiedTask = matchingTasks.some((t) => t.verificationStatus === 'VERIFIED');
  const hasRejectedTask = matchingTasks.some((t) => t.verificationStatus === 'REJECTED');
  const hasLateCompletedTask = matchingTasks.some((t) => t.status === 'LATE_COMPLETED');
  const hasOverdueTask = matchingTasks.some((t) => !t.isCompleted && t.taskDate < DEFAULT_SIMULATION_DATE);
  const hasCompletedStudy = matchingRecords.length > 0 || matchingTasks.some((t) => t.isCompleted);

  if (hasVerifiedTask) {
    pageStatus = {
      code: 'VERIFIED',
      title: 'Yeşil: Doğrulanmış (Öğretmen Onaylı)',
      desc: 'Öğrencinin çözümü öğretmen tarafından incelenip doğrulanmıştır.',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotClass: 'bg-emerald-500',
      colorHex: '#10b981',
    };
  } else if (hasRejectedTask) {
    pageStatus = {
      code: 'REJECTED',
      title: 'Kırmızı: Yapılmadı (Öğretmen Reddetmiş)',
      desc: 'Öğretmen ödevi geçersiz veya yapılmadı olarak işaretlemiştir.',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      dotClass: 'bg-rose-500',
      colorHex: '#ef4444',
    };
  } else if (hasLateCompletedTask) {
    pageStatus = {
      code: 'LATE_COMPLETED',
      title: 'Mavi: Gecikmeli Tamamlandı',
      desc: 'Görev gecikmeli olarak tamamlanmış, orijinal plan tarihi korunmuştur.',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      dotClass: 'bg-indigo-500',
      colorHex: '#6366f1',
    };
  } else if (hasCompletedStudy) {
    pageStatus = {
      code: 'PENDING',
      title: 'Sarı/Turuncu: Öğrenci Beyanı (Onay Bekliyor)',
      desc: 'Öğrenci bu sayfayı çözdüğünü beyan etmiş, öğretmen doğrulaması henüz yapılmamıştır.',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      dotClass: 'bg-amber-500',
      colorHex: '#f59e0b',
    };
  } else if (hasOverdueTask) {
    pageStatus = {
      code: 'OVERDUE',
      title: 'Kırmızı: Gecikmiş Ödev',
      desc: 'Görevin teslim tarihi geçmiş ancak öğrenci henüz teslim etmemiştir.',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      dotClass: 'bg-rose-500',
      colorHex: '#ef4444',
    };
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-2xs">
              {pageNum}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Sayfa {pageNum} İnceleme & Detay
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                {resource.title} {studentName ? `• ${studentName}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Status Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${pageStatus.badgeClass}`}>
            <span className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${pageStatus.dotClass}`} />
            <div>
              <h4 className="text-xs font-bold">{pageStatus.title}</h4>
              <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">{pageStatus.desc}</p>
            </div>
          </div>

          {/* Book & Topic Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Kaynak:</span>
              <span className="font-bold text-slate-900">{resource.title} ({resource.publisher})</span>
            </div>
            {topic && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Konu / Bölüm:</span>
                <span className="font-bold text-indigo-700">{topic.title} (Sayfa {topic.startPage}-{topic.endPage})</span>
              </div>
            )}
          </div>

          {/* Associated Tasks Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Bu Sayfayı İçeren Görevler ({matchingTasks.length})
            </h4>
            {matchingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                Bu sayfaya atanmış özel bir öğretmen görevi yok (serbest çalışma olabilir).
              </p>
            ) : (
              matchingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {t.dayOfWeek} ({t.taskDate})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Sayfa {t.startPage} - {t.endPage}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Hedef: {t.targetQuestionCount || 0} Soru • {t.targetDurationMinutes || 0} dk</span>
                    <span className="font-semibold">
                      {t.verificationStatus === 'VERIFIED'
                        ? '✓ Öğretmen Doğruladı'
                        : t.verificationStatus === 'REJECTED'
                        ? '✕ Yapılmadı'
                        : 'Onay Bekliyor'}
                    </span>
                  </div>

                  {/* Teacher actions on this task */}
                  {isTeacherOrAdmin && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {t.verificationStatus !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => {
                            verifyDailyTask(t.id, currentUser.id);
                          }}
                          className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors text-center"
                        >
                          ✓ Bu Görevi Doğrula
                        </button>
                      )}
                      {t.verificationStatus !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => setIsRejecting(true)}
                          className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          ✕ Yapılmadı İşaretle
                        </button>
                      )}
                    </div>
                  )}

                  {/* Rejection input area if toggled */}
                  {isRejecting && (
                    <div className="pt-2 space-y-2">
                      <textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Örn: Bu sayfa eksik çözülmüş veya teslim edilmemiş..."
                        className="w-full text-xs p-2 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden resize-none h-16"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(false)}
                          className="px-2.5 py-1 text-xs text-slate-500"
                        >
                          İptal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            rejectDailyTask(t.id, currentUser.id, rejectNote);
                            setIsRejecting(false);
                            setRejectNote('');
                          }}
                          className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg"
                        >
                          Yapılmadı Olarak Onayla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Associated Study Records Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Öğrenci Çalışma Kayıtları ({matchingRecords.length})
            </h4>
            {matchingRecords.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                Bu sayfayı kapsayan öğrenci çalışma kaydı henüz girilmedi.
              </p>
            ) : (
              matchingRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span>{rec.recordDate}</span>
                    <span>Sayfa {rec.completedStartPage} - {rec.completedEndPage}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] flex items-center justify-between">
                    <span>{rec.actualQuestionCount} Soru Çözüldü</span>
                    <span>{rec.actualDurationMinutes} dk Çalışıldı</span>
                  </div>
                  {rec.studentNotes && (
                    <div className="text-[11px] text-slate-700 italic pt-1 border-t border-emerald-100">
                      "{rec.studentNotes}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
