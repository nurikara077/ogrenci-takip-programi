import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, CheckCircle, Sparkles, BookMarked, Layers, Calendar, Target } from 'lucide-react';
import { PageMatrixModal } from '../common/PageMatrixModal';
import { ResourceTopic } from '../../types';
import { DEFAULT_SIMULATION_DATE } from '../../utils/dateUtils';

export const StudentResourcesView: React.FC = () => {
  const { 
    currentUser, 
    studentProfiles, 
    studentResources, 
    resources, 
    resourceTopics, 
    subjects, 
    dailyTasks,
    studyRecords,
    getResourceProgress 
  } = useApp();

  const currentStudent = studentProfiles.find((sp) => sp.userId === currentUser.id);
  const studentId = currentStudent?.id || 'sp-mehmet';

  const institutionResources = resources.filter((r) => !r.isArchived && r.status !== 'ARCHIVED');
  const myAssignedBooks = studentResources.filter((sr) => sr.studentId === studentId);
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    myAssignedBooks[0]?.resourceId || institutionResources[0]?.id || ''
  );

  const [selectedMatrixPage, setSelectedMatrixPage] = useState<{
    pageNum: number;
    topic?: ResourceTopic;
  } | null>(null);

  const activeResource = resources.find((r) => r.id === (selectedResourceId || institutionResources[0]?.id));
  const activeAssignment = myAssignedBooks.find((sr) => sr.resourceId === activeResource?.id);
  const activeSubject = subjects.find((s) => s.id === activeResource?.subjectId);
  const activeTopics = resourceTopics.filter((t) => t.resourceId === activeResource?.id);

  const progress = activeResource
    ? getResourceProgress(studentId, activeResource.id)
    : { totalCount: 0, completedCount: 0, percentage: 0, completedPages: [] };

  // Generate page numbers in scope (assigned range if assigned, else total resource range)
  const pages: number[] = [];
  if (activeAssignment) {
    for (let p = activeAssignment.assignedStartPage; p <= activeAssignment.assignedEndPage; p++) {
      pages.push(p);
    }
  } else if (activeResource) {
    const sPage = activeResource.startPage || 1;
    const ePage = activeResource.endPage || activeResource.totalPages || 100;
    for (let p = sPage; p <= ePage; p++) {
      pages.push(p);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kaynak Kitaplarım</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Öğretmeninin sana atadığı fasikül ve soru bankalarının sayfa çözülme matrisi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Kitap Seç:</span>
          <select
            value={activeResource?.id}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 max-w-[240px]"
          >
            {institutionResources.map((res) => {
              const isAssigned = myAssignedBooks.some((sr) => sr.resourceId === res.id);
              return (
                <option key={res.id} value={res.id}>
                  {isAssigned ? '✓ ' : ''}{res.title}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {activeResource && activeAssignment ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Book Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeSubject?.colorHex || '#10B981' }}
                />
                <span className="text-xs font-bold text-slate-700">{activeSubject?.name}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{activeResource.publisher}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{activeResource.title}</h2>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Atanan Aralık: <strong>Sayfa {activeAssignment.assignedStartPage} - {activeAssignment.assignedEndPage}</strong> ({progress.totalCount} Sayfa)</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{progress.completedCount} Çözüldü</span>
                <span>•</span>
                <span className="text-slate-500 font-medium">{progress.remainingCount} Kalan</span>
                {activeAssignment.targetDate && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Hedef: {new Date(activeAssignment.targetDate).toLocaleDateString('tr-TR')}
                    </span>
                  </>
                )}
                {activeAssignment.dailyQuestionTarget && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-700 font-medium flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Günlük {activeAssignment.dailyQuestionTarget} Soru
                    </span>
                  </>
                )}
              </div>
              {activeAssignment.description && (
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                  Öğretmen Notu: "{activeAssignment.description}"
                </p>
              )}
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-2xl font-bold text-emerald-700">%{progress.percentage}</span>
              <div className="text-xs text-slate-500 font-medium">
                {progress.completedCount} / {progress.totalCount} tekil sayfa tamamlandı
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Interactive Page Matrix with 6-Color Standard */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-emerald-600" />
                Sayfa Matrisi ve Doğrulama Durumu (Tıklanabilir)
              </h3>
              {/* 6-Color Legend */}
              <div className="flex items-center gap-2.5 text-[10px] text-slate-600 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Doğrulandı (Yeşil)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-500" /> Öğrenci Beyanı (Sarı)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Yapılmadı/Gecikmiş (Kırmızı)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Gecikmeli Tamamlandı (Mavi)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300" /> Planlanmış / Boş (Beyaz)
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex flex-wrap gap-2">
                {pages.map((pNum) => {
                  const matchingTasks = dailyTasks.filter(
                    (t) =>
                      t.studentId === studentId &&
                      t.resourceId === activeResource?.id &&
                      t.startPage !== undefined &&
                      t.endPage !== undefined &&
                      pNum >= t.startPage &&
                      pNum <= t.endPage
                  );

                  const matchingRecords = studyRecords.filter(
                    (sr) =>
                      sr.studentId === studentId &&
                      sr.resourceId === activeResource?.id &&
                      sr.completedStartPage !== undefined &&
                      sr.completedEndPage !== undefined &&
                      pNum >= sr.completedStartPage &&
                      pNum <= sr.completedEndPage
                  );

                  const isVerified = matchingTasks.some((t) => t.verificationStatus === 'VERIFIED');
                  const isRejected = matchingTasks.some((t) => t.verificationStatus === 'REJECTED');
                  const isLateCompleted = matchingTasks.some((t) => t.status === 'LATE_COMPLETED');
                  const isOverdue = matchingTasks.some((t) => !t.isCompleted && t.taskDate < DEFAULT_SIMULATION_DATE);
                  const isStudentDone = matchingRecords.length > 0 || matchingTasks.some((t) => t.isCompleted);

                  let cellClass = 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400';
                  let statusText = 'Henüz Çözülmedi';

                  if (isVerified) {
                    cellClass = 'bg-emerald-500 text-white shadow-2xs hover:bg-emerald-600';
                    statusText = 'Öğretmen Doğruladı (Yeşil)';
                  } else if (isRejected) {
                    cellClass = 'bg-rose-500 text-white shadow-2xs hover:bg-rose-600';
                    statusText = 'Yapılmadı / Reddedildi (Kırmızı)';
                  } else if (isLateCompleted) {
                    cellClass = 'bg-indigo-500 text-white shadow-2xs hover:bg-indigo-600';
                    statusText = 'Gecikmeli Tamamlandı (Mavi)';
                  } else if (isStudentDone) {
                    cellClass = 'bg-amber-400 text-amber-950 border border-amber-500 shadow-2xs hover:bg-amber-500';
                    statusText = 'Öğrenci Beyanı / Onay Bekliyor (Sarı)';
                  } else if (isOverdue) {
                    cellClass = 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200';
                    statusText = 'Gecikmiş Ödev (Kırmızı)';
                  }

                  const matchingTopic = activeTopics.find(
                    (tp) => pNum >= tp.startPage && pNum <= tp.endPage
                  );

                  return (
                    <button
                      type="button"
                      key={pNum}
                      onClick={() => {
                        setSelectedMatrixPage({
                          pageNum: pNum,
                          topic: matchingTopic,
                        });
                      }}
                      className={`w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${cellClass}`}
                      title={`Sayfa ${pNum}: ${statusText} • Detay görmek için tıkla`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Sayfaların üzerine tıklayarak çalışma kayıtlarını ve öğretmenin doğrulama durumunu inceleyebilirsin.
                  </span>
                </div>
                <span className="font-semibold text-slate-700 shrink-0">
                  Toplam {pages.length} Sayfa
                </span>
              </div>
            </div>
          </div>

          {/* Topics Breakdown */}
          {activeTopics.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Kitap İçi Konu ve Bölümler
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTopics.map((topic) => (
                  <div key={topic.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900">{topic.title}</span>
                    <div className="text-slate-500 mt-1">
                      Sayfa: {topic.startPage} - {topic.endPage} ({topic.endPage - topic.startPage + 1} Sayfa)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 font-semibold text-sm">Henüz atanmış bir kitap bulunmamaktadır.</p>
        </div>
      )}

      {/* Page Inspection Modal */}
      {selectedMatrixPage && activeResource && (
        <PageMatrixModal
          isOpen={true}
          onClose={() => setSelectedMatrixPage(null)}
          pageNum={selectedMatrixPage.pageNum}
          resource={activeResource}
          studentId={studentId}
          studentName={currentUser.fullName}
          topic={selectedMatrixPage.topic}
          isTeacherOrAdmin={false}
        />
      )}
    </div>
  );
};
