import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Users, 
  Layers, 
  Check, 
  X, 
  ChevronRight,
  Sparkles,
  BookMarked,
  Edit2,
  Trash2,
  Calendar,
  Target,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
  ChevronDown,
  Info,
  GraduationCap
} from 'lucide-react';
import { Resource, ResourceTopic, StudentResource } from '../../types';

interface ResourcesViewProps {
  initialSelectedStudentId?: string;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ initialSelectedStudentId }) => {
  const { 
    resources, 
    teacherResources,
    resourceTopics, 
    subjects, 
    classes,
    studentResources, 
    studentProfiles, 
    teacherProfiles,
    users, 
    addResource,
    updateResource,
    deleteResource,
    archiveResource,
    assignResourceToTeacher,
    unassignResourceFromTeacher,
    canTeacherAccessResource,
    addResourceTopic,
    updateResourceTopic,
    deleteResourceTopic,
    assignResourceToStudent,
    assignResourceToMultipleStudents,
    updateStudentResource,
    removeStudentResource,
    getResourceProgress,
    currentUser
  } = useApp();

  const isInstituteAdmin = currentUser.role === 'INSTITUTE_ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const userOrgId = currentUser.organizationId || 'org-1';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  // Active Tab in Right Column (Topics vs Teachers vs Assigned Students)
  const [detailTab, setDetailTab] = useState<'topics' | 'teachers' | 'assignments'>('topics');

  // Add Resource Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [subjectId, setSubjectId] = useState('sub-mat');
  const [gradeLevel, setGradeLevel] = useState(8);
  const [totalPages, setTotalPages] = useState(120);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(120);
  const [description, setDescription] = useState('');
  const [topicsInput, setTopicsInput] = useState<{ title: string; startPage: number; endPage: number }[]>([
    { title: '1. Bölüm / Konu', startPage: 1, endPage: 30 },
  ]);

  // Edit Resource Modal
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPublisher, setEditPublisher] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState(8);
  const [editTotalPages, setEditTotalPages] = useState(100);
  const [editStartPage, setEditStartPage] = useState(1);
  const [editEndPage, setEditEndPage] = useState(100);
  const [editDescription, setEditDescription] = useState('');

  // Delete Resource Confirm Modal
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  // Add / Edit Topic Modal
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ResourceTopic | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicStartPage, setTopicStartPage] = useState(1);
  const [topicEndPage, setTopicEndPage] = useState(30);

  // Assign Resource Modal (Single or Multi-Student)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignMode, setAssignMode] = useState<'single' | 'multi'>('multi');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initialSelectedStudentId ? [initialSelectedStudentId] : []
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [assignStartPage, setAssignStartPage] = useState(1);
  const [assignEndPage, setAssignEndPage] = useState(100);
  const [assignTargetDate, setAssignTargetDate] = useState('');
  const [assignDailyTarget, setAssignDailyTarget] = useState<number | ''>('');
  const [assignDescription, setAssignDescription] = useState('');
  const [selectedPresetTopicId, setSelectedPresetTopicId] = useState<string>('');

  // Edit Student Resource Scope Modal
  const [editingStudentResource, setEditingStudentResource] = useState<StudentResource | null>(null);
  const [editSrStartPage, setEditSrStartPage] = useState(1);
  const [editSrEndPage, setEditSrEndPage] = useState(100);
  const [editSrTargetDate, setEditSrTargetDate] = useState('');
  const [editSrDailyTarget, setEditSrDailyTarget] = useState<number | ''>('');
  const [editSrDescription, setEditSrDescription] = useState('');

  // Expanded student page matrix inside the assignment table
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Institutional visibility logic:
  // Institute Admin: sees all institution resources
  // Teacher: sees ONLY assigned resources
  const visibleResources = isInstituteAdmin
    ? resources.filter(r => (r.institutionId || r.organizationId || 'org-1') === userOrgId && !r.isArchived)
    : resources.filter(r => canTeacherAccessResource(currentUser.id, r.id));

  // Active Resource for detail
  const activeRes = visibleResources.find((r) => r.id === (selectedResource || visibleResources[0]?.id));
  const activeTopics = resourceTopics
    .filter((t) => t.resourceId === activeRes?.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const assignedList = studentResources.filter((sr) => sr.resourceId === activeRes?.id);

  // Active teacher assignments for this resource
  const activeTeacherAssignments = teacherResources.filter(
    (tr) => tr.resourceId === activeRes?.id && tr.isActive
  );

  // Teachers in the institution eligible for this subject/branch
  const eligibleTeachers = teacherProfiles.filter((tp) => {
    const teacherUser = users.find((u) => u.id === tp.userId);
    if (!teacherUser || (teacherUser.organizationId || 'org-1') !== userOrgId) return false;
    if (tp.branchSubjectId && activeRes?.subjectId && tp.branchSubjectId !== activeRes.subjectId) return false;
    return true;
  });

  const filteredResources = visibleResources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.publisher.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedSubjectFilter !== 'ALL' && r.subjectId !== selectedSubjectFilter) return false;
    return true;
  });

  // Handle Add Topic Row in Resource Creation Modal
  const handleAddTopicRow = () => {
    const lastTopic = topicsInput[topicsInput.length - 1];
    const nextStart = lastTopic ? lastTopic.endPage + 1 : 1;
    setTopicsInput([
      ...topicsInput,
      { title: `${topicsInput.length + 1}. Konu`, startPage: nextStart, endPage: nextStart + 20 },
    ]);
  };

  const handleRemoveTopicRow = (index: number) => {
    setTopicsInput(topicsInput.filter((_, i) => i !== index));
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Lütfen kaynak adını girin.');
      return;
    }

    if (startPage < 1 || endPage < startPage) {
      setErrorMessage('Başlangıç sayfası 1 veya üzeri olmalı ve bitiş sayfasından küçük veya eşit olmalıdır.');
      return;
    }

    try {
      const newRes = addResource({
        subjectId,
        title: title.trim(),
        publisher: publisher.trim() || 'Genel Yayın',
        gradeLevel: Number(gradeLevel),
        totalPages: Number(totalPages),
        startPage: Number(startPage),
        endPage: Number(endPage),
        description: description.trim() || undefined,
        topics: topicsInput.filter((t) => t.title.trim()),
      });

      setShowAddModal(false);
      setTitle('');
      setPublisher('');
      setDescription('');
      setSelectedResource(newRes.id);
      setToastMessage(`"${newRes.title}" kaynağı kütüphaneye başarıyla eklendi!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Kaynak eklenirken bir hata oluştu.');
    }
  };

  // Open Edit Resource Modal
  const handleOpenEditResource = (res: Resource) => {
    setEditingResource(res);
    setEditTitle(res.title);
    setEditPublisher(res.publisher);
    setEditSubjectId(res.subjectId);
    setEditGradeLevel(res.gradeLevel);
    setEditTotalPages(res.totalPages);
    setEditStartPage(res.startPage);
    setEditEndPage(res.endPage);
    setEditDescription(res.description || '');
  };

  const handleSaveEditResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setErrorMessage('');

    if (!editTitle.trim()) {
      setErrorMessage('Kaynak adı boş olamaz.');
      return;
    }

    if (editStartPage < 1 || editEndPage < editStartPage) {
      setErrorMessage('Lütfen geçerli bir sayfa aralığı girin.');
      return;
    }

    try {
      updateResource(editingResource.id, {
        title: editTitle.trim(),
        publisher: editPublisher.trim() || 'Genel Yayın',
        subjectId: editSubjectId,
        gradeLevel: Number(editGradeLevel),
        totalPages: Number(editTotalPages),
        startPage: Number(editStartPage),
        endPage: Number(editEndPage),
        description: editDescription.trim() || undefined,
      });

      setEditingResource(null);
      setToastMessage('Kaynak bilgileri başarıyla güncellendi.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Güncelleme yapılırken hata oluştu.');
    }
  };

  const handleConfirmDeleteResource = () => {
    if (!deletingResourceId) return;
    const resTitle = resources.find((r) => r.id === deletingResourceId)?.title;
    archiveResource(deletingResourceId);
    setDeletingResourceId(null);
    if (selectedResource === deletingResourceId) {
      setSelectedResource(resources.find((r) => r.id !== deletingResourceId)?.id || null);
    }
    setToastMessage(`"${resTitle}" kaynağı arşivlendi.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Teacher authorization toggling (Institute Admin only)
  const handleToggleTeacherAssignment = (teacherProfileId: string, isCurrentlyAssigned: boolean) => {
    if (!activeRes) return;
    try {
      if (isCurrentlyAssigned) {
        unassignResourceFromTeacher(activeRes.id, teacherProfileId);
        setToastMessage('Öğretmen yetkisi başarıyla kaldırıldı.');
      } else {
        assignResourceToTeacher(activeRes.id, teacherProfileId);
        setToastMessage('Öğretmen kaynağa başarıyla yetkilendirildi.');
      }
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Yetkilendirme sırasında hata oluştu.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Topic Actions
  const handleOpenAddTopic = () => {
    if (!activeRes) return;
    const lastTopic = activeTopics[activeTopics.length - 1];
    const nextStart = lastTopic ? Math.min(activeRes.endPage, lastTopic.endPage + 1) : activeRes.startPage;
    const nextEnd = Math.min(activeRes.endPage, nextStart + 15);

    setEditingTopic(null);
    setTopicTitle('');
    setTopicStartPage(nextStart);
    setTopicEndPage(nextEnd);
    setShowTopicModal(true);
  };

  const handleOpenEditTopic = (t: ResourceTopic) => {
    setEditingTopic(t);
    setTopicTitle(t.title);
    setTopicStartPage(t.startPage);
    setTopicEndPage(t.endPage);
    setShowTopicModal(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRes) return;
    setErrorMessage('');

    if (!topicTitle.trim()) {
      setErrorMessage('Konu başlığı boş bırakılamaz.');
      return;
    }

    if (topicStartPage < activeRes.startPage || topicEndPage > activeRes.endPage) {
      setErrorMessage(`Konu sayfa aralığı kitabın genel sınırları (${activeRes.startPage} - ${activeRes.endPage}) içinde olmalıdır.`);
      return;
    }

    if (topicStartPage > topicEndPage) {
      setErrorMessage('Başlangıç sayfası bitiş sayfasından büyük olamaz.');
      return;
    }

    try {
      if (editingTopic) {
        updateResourceTopic(editingTopic.id, {
          title: topicTitle.trim(),
          startPage: Number(topicStartPage),
          endPage: Number(topicEndPage),
        });
        setToastMessage('Konu başarıyla güncellendi.');
      } else {
        addResourceTopic(activeRes.id, {
          title: topicTitle.trim(),
          startPage: Number(topicStartPage),
          endPage: Number(topicEndPage),
        });
        setToastMessage('Yeni konu eklendi.');
      }

      setShowTopicModal(false);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Konu kaydedilirken bir hata oluştu.');
    }
  };

  const handleDeleteTopic = (topicId: string, tTitle: string) => {
    if (window.confirm(`"${tTitle}" konusunu silmek istediğinizden emin misiniz?`)) {
      deleteResourceTopic(topicId);
      setToastMessage('Konu silindi.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Open Assign Modal with optional preset topic
  const handleOpenAssignModal = (presetTopic?: ResourceTopic) => {
    if (!activeRes) return;
    setErrorMessage('');
    if (presetTopic) {
      setSelectedPresetTopicId(presetTopic.id);
      setAssignStartPage(presetTopic.startPage);
      setAssignEndPage(presetTopic.endPage);
    } else {
      setSelectedPresetTopicId('');
      setAssignStartPage(activeRes.startPage);
      setAssignEndPage(activeRes.endPage);
    }
    setAssignTargetDate('');
    setAssignDailyTarget('');
    setAssignDescription('');
    setSelectedStudentIds(initialSelectedStudentId ? [initialSelectedStudentId] : []);
    setShowAssignModal(true);
  };

  // Handle Preset Topic Selection inside Assign Modal
  const handleSelectPresetTopic = (topicId: string) => {
    setSelectedPresetTopicId(topicId);
    if (!topicId) {
      if (activeRes) {
        setAssignStartPage(activeRes.startPage);
        setAssignEndPage(activeRes.endPage);
      }
      return;
    }
    const found = activeTopics.find((t) => t.id === topicId);
    if (found) {
      setAssignStartPage(found.startPage);
      setAssignEndPage(found.endPage);
    }
  };

  const handleToggleSelectAllStudents = (studentListToToggle: { id: string }[]) => {
    const allIds = studentListToToggle.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...allIds])));
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRes) return;
    setErrorMessage('');

    if (selectedStudentIds.length === 0) {
      setErrorMessage('Lütfen en az bir öğrenci seçin.');
      return;
    }

    if (assignStartPage < activeRes.startPage || assignEndPage > activeRes.endPage) {
      setErrorMessage(`Atanan aralık kitabın genel sınırları (${activeRes.startPage} - ${activeRes.endPage}) dahilinde olmalıdır.`);
      return;
    }

    if (assignStartPage > assignEndPage) {
      setErrorMessage('Başlangıç sayfası bitiş sayfasından büyük olamaz.');
      return;
    }

    try {
      assignResourceToMultipleStudents(activeRes.id, selectedStudentIds, {
        startPage: Number(assignStartPage),
        endPage: Number(assignEndPage),
        targetDate: assignTargetDate || undefined,
        dailyQuestionTarget: assignDailyTarget ? Number(assignDailyTarget) : undefined,
        description: assignDescription.trim() || undefined,
      });

      setShowAssignModal(false);
      setDetailTab('assignments');
      setToastMessage(`"${activeRes.title}" kaynağı ${selectedStudentIds.length} öğrenciye başarıyla atandı!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Atama yapılırken bir hata oluştu.');
    }
  };

  // Open Edit Student Resource Scope
  const handleOpenEditSr = (sr: StudentResource) => {
    setEditingStudentResource(sr);
    setEditSrStartPage(sr.assignedStartPage);
    setEditSrEndPage(sr.assignedEndPage);
    setEditSrTargetDate(sr.targetDate || '');
    setEditSrDailyTarget(sr.dailyQuestionTarget || '');
    setEditSrDescription(sr.description || '');
  };

  const handleSaveEditSr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentResource || !activeRes) return;
    setErrorMessage('');

    if (editSrStartPage < activeRes.startPage || editSrEndPage > activeRes.endPage) {
      setErrorMessage(`Sayfa aralığı kitap sınırları (${activeRes.startPage} - ${activeRes.endPage}) içinde olmalıdır.`);
      return;
    }

    if (editSrStartPage > editSrEndPage) {
      setErrorMessage('Başlangıç sayfası bitiş sayfasından büyük olamaz.');
      return;
    }

    try {
      updateStudentResource(editingStudentResource.id, {
        assignedStartPage: Number(editSrStartPage),
        assignedEndPage: Number(editSrEndPage),
        targetDate: editSrTargetDate || undefined,
        dailyQuestionTarget: editSrDailyTarget ? Number(editSrDailyTarget) : undefined,
        description: editSrDescription.trim() || undefined,
      });

      setEditingStudentResource(null);
      setToastMessage('Öğrenci kaynak kapsamı başarıyla güncellendi.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Güncelleme yapılırken hata oluştu.');
    }
  };

  const handleRemoveStudentResource = (srId: string, studentName: string) => {
    if (window.confirm(`${studentName} adlı öğrenciden bu kaynak atamasını kaldırmak istiyor musunuz?`)) {
      removeStudentResource(srId);
      setToastMessage('Kaynak ataması kaldırıldı.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Filter students for assignment modal
  const eligibleStudents = studentProfiles.filter((sp) => {
    if (selectedClassFilter === 'ALL') return true;
    if (selectedClassFilter === 'INDEPENDENT') return !sp.classId;
    return sp.classId === selectedClassFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kaynak Kitap Kütüphanesi</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fasikül, soru bankası, konu ve sayfa aralıkları yönetimi ve öğrenci bazlı bağımsız kapsam atamaları
          </p>
        </div>

        {isInstituteAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Yeni Kaynak Kitap Ekle
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-800 text-xs font-semibold px-3.5 py-2 rounded-xl border border-blue-200 shrink-0">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Branşınıza Yetkilendirilmiş Kaynaklar</span>
          </div>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Resource List & Filters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kitap veya yayıncı ara..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tümü ({resources.length})
              </button>
              {subjects.map((sub) => {
                const count = resources.filter((r) => r.subjectId === sub.id).length;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectFilter(sub.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
                      selectedSubjectFilter === sub.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sub.colorHex || '#2563EB' }}
                    />
                    {sub.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resource Cards */}
          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredResources.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Aramanıza uygun kaynak bulunamadı.</p>
              </div>
            ) : (
              filteredResources.map((res) => {
                const sub = subjects.find((s) => s.id === res.subjectId);
                const isSelected = activeRes?.id === res.id;
                const atananCount = studentResources.filter((sr) => sr.resourceId === res.id).length;
                const topicsCount = resourceTopics.filter((t) => t.resourceId === res.id).length;

                return (
                  <div
                    key={res.id}
                    onClick={() => setSelectedResource(res.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub?.colorHex || '#2563EB' }}
                          />
                          <h4 className="font-bold text-slate-900 text-sm truncate">{res.title}</h4>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {res.publisher} • {res.gradeLevel}. Sınıf {sub?.name}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                        {res.totalPages} Sayfa
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {topicsCount} Konu
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          {atananCount} Öğrenci
                        </span>
                      </div>
                      <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                        Detay <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Resource Details, Topics & Student Assignments */}
        <div className="lg:col-span-8">
          {activeRes ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Resource Title & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white"
                      style={{ backgroundColor: subjects.find((s) => s.id === activeRes.subjectId)?.colorHex || '#2563EB' }}
                    >
                      {subjects.find((s) => s.id === activeRes.subjectId)?.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {activeRes.gradeLevel}. Sınıf
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{activeRes.title}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                    <span>Yayıncı: <strong className="text-slate-700">{activeRes.publisher}</strong></span>
                    <span>•</span>
                    <span>Sayfa Kapsamı: <strong className="text-slate-700">{activeRes.startPage} - {activeRes.endPage}</strong> ({activeRes.totalPages} Sayfa)</span>
                  </p>
                  {activeRes.description && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {activeRes.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isInstituteAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEditResource(activeRes)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                        title="Kaynağı Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                      <button
                        onClick={() => setDeletingResourceId(activeRes.id)}
                        className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                        title="Kaynağı Arşivle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Arşivle</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleOpenAssignModal()}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Öğrenciye Ata</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs (Topics vs Teachers vs Assigned Students) */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setDetailTab('topics')}
                  className={`pb-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    detailTab === 'topics'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Konu ve Sayfa Aralıkları ({activeTopics.length})
                </button>

                {isInstituteAdmin && (
                  <button
                    onClick={() => setDetailTab('teachers')}
                    className={`pb-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                      detailTab === 'teachers'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Öğretmen Yetkilendirme ({activeTeacherAssignments.length})
                  </button>
                )}

                <button
                  onClick={() => setDetailTab('assignments')}
                  className={`pb-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    detailTab === 'assignments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Atanan Öğrenciler & İlerleme ({assignedList.length})
                </button>
              </div>

              {/* TAB 1: Topics & Page Intervals Table */}
              {detailTab === 'topics' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Tanımlı Konular ve Sayfa Aralıkları</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Öğretmenler veya öğrenciler görev oluştururken bu konuları ve sayfa aralıklarını seçebilir
                      </p>
                    </div>
                    {isInstituteAdmin && (
                      <button
                        onClick={handleOpenAddTopic}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Yeni Konu Ekle
                      </button>
                    )}
                  </div>

                  {activeTopics.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Bu kitap için henüz konu tanımlanmadı.</p>
                      {isInstituteAdmin && (
                        <button
                          onClick={handleOpenAddTopic}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> İlk konuyu şimdi ekleyin
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-12 text-center">#</th>
                            <th className="py-2.5 px-4">Konu / Ünite Başlığı</th>
                            <th className="py-2.5 px-4">Sayfa Aralığı</th>
                            <th className="py-2.5 px-4 text-center">Sayfa Adedi</th>
                            <th className="py-2.5 px-4 text-right">Eylemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeTopics.map((topic, idx) => (
                            <tr key={topic.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-4 font-bold text-slate-800">{topic.title}</td>
                              <td className="py-3 px-4 text-slate-600 font-mono">
                                Sayfa <span className="font-bold text-slate-900">{topic.startPage} - {topic.endPage}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                  {topic.endPage - topic.startPage + 1} Sayfa
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenAssignModal(topic)}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                                    title="Bu konuyu öğrencilere ata"
                                  >
                                    <Users className="w-3 h-3" /> Bu Konuyu Ata
                                  </button>
                                  {isInstituteAdmin && (
                                    <>
                                      <button
                                        onClick={() => handleOpenEditTopic(topic)}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                                        title="Konuyu Düzenle"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTopic(topic.id, topic.title)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                                        title="Konuyu Sil"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Teachers Authorization (Institute Admin only) */}
              {detailTab === 'teachers' && isInstituteAdmin && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Branş Öğretmeni Yetkilendirme</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Bu kaynağı kullanmaya yetkili öğretmenleri belirleyin. Birden fazla aynı branş öğretmenine atanabilir.
                      </p>
                    </div>
                  </div>

                  {eligibleTeachers.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Bu branşta kayıtlı öğretmen bulunamadı.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <th className="py-2.5 px-4">Öğretmen</th>
                            <th className="py-2.5 px-4">Branş</th>
                            <th className="py-2.5 px-4">Yetki Durumu</th>
                            <th className="py-2.5 px-4">Atanma Tarihi</th>
                            <th className="py-2.5 px-4 text-right">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {eligibleTeachers.map((teacher) => {
                            const teacherUser = users.find((u) => u.id === teacher.userId);
                            const assignment = activeTeacherAssignments.find(
                              (tr) => tr.teacherId === teacher.id
                            );
                            const isAssigned = !!assignment;

                            return (
                              <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                                  <img
                                    src={teacherUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                    alt={teacherUser?.fullName}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                  />
                                  <div>
                                    <span className="block font-bold text-slate-900">{teacherUser?.fullName}</span>
                                    <span className="text-[10px] text-slate-400">{teacherUser?.email}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                    {teacher.branch}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {isAssigned ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Yetkili
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                      Yetkisiz
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                  {assignment ? assignment.assignedAt : '—'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleToggleTeacherAssignment(teacher.id, isAssigned)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                      isAssigned
                                        ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                                    }`}
                                  >
                                    {isAssigned ? 'Yetkiyi Kaldır' : 'Kitabı Ata'}
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
              )}

              {/* TAB 2: Assigned Students & Progress Overview */}
              {detailTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Öğrenci Bazlı Kaynak İlerlemesi</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Her öğrencinin atanmış sayfa kapsamı, tamamlanan tekil sayfaları ve yüzdesi
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenAssignModal()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yeni Öğrenci Ata
                    </button>
                  </div>

                  {assignedList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Bu kaynak henüz hiçbir öğrenciye atanmadı.</p>
                      <button
                        onClick={() => handleOpenAssignModal()}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Öğrencilere şimdi atayın
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignedList.map((sr) => {
                        const student = studentProfiles.find((s) => s.id === sr.studentId);
                        const user = users.find((u) => u.id === student?.userId);
                        const studentClass = classes.find((c) => c.id === student?.classId);
                        const progress = getResourceProgress(sr.studentId, sr.resourceId);
                        const isExpanded = expandedStudentId === sr.studentId;

                        // Generate page matrix array
                        const matrixPages: number[] = [];
                        for (let p = sr.assignedStartPage; p <= sr.assignedEndPage; p++) {
                          matrixPages.push(p);
                        }

                        return (
                          <div
                            key={sr.id}
                            className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 transition-all hover:border-slate-300"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              {/* Student Info */}
                              <div className="flex items-center gap-3">
                                <img
                                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                  alt={user?.fullName}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-sm">{user?.fullName}</h4>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                      {studentClass ? studentClass.name : 'Özel Ders'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span>Atanan Aralık: <strong>Sayfa {sr.assignedStartPage} - {sr.assignedEndPage}</strong></span>
                                    <span>•</span>
                                    <span>Toplam: {progress.totalCount} Sayfa</span>
                                    {sr.targetDate && (
                                      <>
                                        <span>•</span>
                                        <span className="text-amber-700 flex items-center gap-1 font-medium">
                                          <Calendar className="w-3 h-3" /> Hedef: {new Date(sr.targetDate).toLocaleDateString('tr-TR')}
                                        </span>
                                      </>
                                    )}
                                    {sr.dailyQuestionTarget && (
                                      <>
                                        <span>•</span>
                                        <span className="text-indigo-700 flex items-center gap-1 font-medium">
                                          <Target className="w-3 h-3" /> {sr.dailyQuestionTarget} Soru/Gün
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Progress & Actions */}
                              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0">
                                <div className="text-left md:text-right">
                                  <div className="flex items-center md:justify-end gap-2">
                                    <span className="text-sm font-bold text-emerald-700">%{progress.percentage}</span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      ({progress.completedCount}/{progress.totalCount} sayfa)
                                    </span>
                                  </div>
                                  <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                      style={{ width: `${progress.percentage}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setExpandedStudentId(isExpanded ? null : sr.studentId)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                                      isExpanded
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title="Sayfa matrisini incele"
                                  >
                                    <BookMarked className="w-3.5 h-3.5" />
                                    <span>Matris</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditSr(sr)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg"
                                    title="Kapsamı Düzenle"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveStudentResource(sr.id, user?.fullName || 'Öğrenci')}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg"
                                    title="Atamayı Kaldır"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Interactive Page Matrix for this Student */}
                            {isExpanded && (
                              <div className="mt-4 pt-3 border-t border-slate-200 animate-in fade-in space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700">
                                    {user?.fullName} — Çözülen / Bekleyen Sayfalar:
                                  </span>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Çözüldü ({progress.completedCount})
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300" /> Kalan ({progress.remainingCount})
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-white border border-slate-200 max-h-40 overflow-y-auto">
                                  {matrixPages.map((pageNum) => {
                                    const isDone = progress.completedPages.includes(pageNum);
                                    return (
                                      <div
                                        key={pageNum}
                                        className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                                          isDone
                                            ? 'bg-emerald-500 text-white shadow-2xs'
                                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                                        }`}
                                        title={`Sayfa ${pageNum}: ${isDone ? 'Çözüldü' : 'Henüz Çözülmedi'}`}
                                      >
                                        {pageNum}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Kaynak Seçilmedi</h3>
              <p className="text-xs text-slate-500 mt-1">
                İncelemek veya yönetmek istediğiniz kaynak kitabı sol listeden seçin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Yeni Kaynak Kitap Tanımla</h3>
                <p className="text-xs text-slate-500 mt-0.5">Yayıncı, ders, sayfa aralığı ve konu/üniteleri girin</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="p-5 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kaynak Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Fenomen Fasikül 3"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ders</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Yayıncı</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Örn: Fenomen Yayınları"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf / Kademe</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Toplam Sayfa Adedi</label>
                  <input
                    type="number"
                    min={1}
                    value={totalPages}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalPages(val);
                      setEndPage(val);
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Sayfası</label>
                  <input
                    type="number"
                    min={1}
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş Sayfası</label>
                  <input
                    type="number"
                    min={1}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Açıklama / Kapsam Notu</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Örn: 1. Dönem konuları, yeni nesil soru fasikülü..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Topics section inside Add Modal */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800">Kitap Konu ve Bölümleri</label>
                    <p className="text-[11px] text-slate-400">Üniteleri tanımlayarak sayfa aralıklarını belirleyin</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTopicRow}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Konu Ekle
                  </button>
                </div>

                <div className="space-y-2">
                  {topicsInput.map((topic, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => {
                          const updated = [...topicsInput];
                          updated[i].title = e.target.value;
                          setTopicsInput(updated);
                        }}
                        placeholder="Konu Başlığı (örn: Köklü İfadeler)"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        min={1}
                        value={topic.startPage}
                        onChange={(e) => {
                          const updated = [...topicsInput];
                          updated[i].startPage = Number(e.target.value);
                          setTopicsInput(updated);
                        }}
                        placeholder="Başlangıç"
                        className="w-18 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="number"
                        min={1}
                        value={topic.endPage}
                        onChange={(e) => {
                          const updated = [...topicsInput];
                          updated[i].endPage = Number(e.target.value);
                          setTopicsInput(updated);
                        }}
                        placeholder="Bitiş"
                        className="w-18 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                      />
                      {topicsInput.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTopicRow(i)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Kaynağı Kütüphaneye Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Kaynak Kitap Bilgilerini Düzenle</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingResource.title}</p>
              </div>
              <button onClick={() => setEditingResource(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditResource} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kaynak Adı</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ders</label>
                    <select
                      value={editSubjectId}
                      onChange={(e) => setEditSubjectId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Yayıncı</label>
                    <input
                      type="text"
                      value={editPublisher}
                      onChange={(e) => setEditPublisher(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf</label>
                    <input
                      type="number"
                      value={editGradeLevel}
                      onChange={(e) => setEditGradeLevel(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç</label>
                    <input
                      type="number"
                      value={editStartPage}
                      onChange={(e) => setEditStartPage(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş / Toplam</label>
                    <input
                      type="number"
                      value={editEndPage}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setEditEndPage(v);
                        setEditTotalPages(v);
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Açıklama</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Resource Confirmation */}
      {deletingResourceId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Kaynak Kitabı Sil</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bu kaynağı silmek, bağlı olan tüm konuları ve öğrenci atama bağlantılarını da silecektir. Devam etmek istiyor musunuz?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingResourceId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmDeleteResource}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Evet, Kaynağı Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add / Edit Topic Modal */}
      {showTopicModal && activeRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTopic ? 'Konuyu Düzenle' : 'Yeni Konu / Ünite Ekle'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeRes.title}</p>
              </div>
              <button onClick={() => setShowTopicModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konu Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="Örn: Çarpanlar ve Katlar"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Sayfası</label>
                  <input
                    type="number"
                    min={activeRes.startPage}
                    max={activeRes.endPage}
                    value={topicStartPage}
                    onChange={(e) => setTopicStartPage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş Sayfası</label>
                  <input
                    type="number"
                    min={activeRes.startPage}
                    max={activeRes.endPage}
                    value={topicEndPage}
                    onChange={(e) => setTopicEndPage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                * Kitabın genel sayfa aralığı: {activeRes.startPage} - {activeRes.endPage}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingTopic ? 'Güncelle' : 'Konuyu Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Assign Resource to Students (Single or Batch) */}
      {showAssignModal && activeRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Kaynağı Öğrenciye Ata</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeRes.title} ({activeRes.publisher})</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Student Selector & Multi-selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Atanacak Öğrencileri Seçin ({selectedStudentIds.length} Seçili)
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <option value="ALL">Tüm Sınıflar</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="INDEPENDENT">Özel Ders Öğrencileri</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleToggleSelectAllStudents(eligibleStudents)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {eligibleStudents.every((s) => selectedStudentIds.includes(s.id))
                        ? 'Tümünü Kaldır'
                        : 'Tümünü Seç'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {eligibleStudents.map((sp) => {
                    const u = users.find((user) => user.id === sp.userId);
                    const isSelected = selectedStudentIds.includes(sp.id);
                    const isAlreadyAssigned = studentResources.some(
                      (sr) => sr.studentId === sp.id && sr.resourceId === activeRes.id
                    );

                    return (
                      <label
                        key={sp.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedStudentIds(selectedStudentIds.filter((id) => id !== sp.id));
                            } else {
                              setSelectedStudentIds([...selectedStudentIds, sp.id]);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{u?.fullName}</div>
                          {isAlreadyAssigned && (
                            <span className="text-[10px] text-amber-600 font-normal">
                              (Mevcut ataması var - güncellenir)
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scope & Topic Preset Selection */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    Öğrenciye Atanacak Sayfa Kapsamı
                  </label>
                  {activeTopics.length > 0 && (
                    <span className="text-[11px] text-slate-500">Konudan Hızlı Doldur:</span>
                  )}
                </div>

                {activeTopics.length > 0 && (
                  <select
                    value={selectedPresetTopicId}
                    onChange={(e) => handleSelectPresetTopic(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Özel Sayfa Aralığı Gir</option>
                    {activeTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} (Sayfa {t.startPage} - {t.endPage})
                      </option>
                    ))}
                  </select>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500">Başlangıç Sayfası</span>
                    <input
                      type="number"
                      min={activeRes.startPage}
                      max={activeRes.endPage}
                      value={assignStartPage}
                      onChange={(e) => setAssignStartPage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500">Bitiş Sayfası</span>
                    <input
                      type="number"
                      min={activeRes.startPage}
                      max={activeRes.endPage}
                      value={assignEndPage}
                      onChange={(e) => setAssignEndPage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  * Seçilen öğrencilerin ilerlemesi yalnızca bu {Math.max(1, assignEndPage - assignStartPage + 1)} sayfa üzerinden hesaplanacaktır.
                </p>
              </div>

              {/* Optional Target Date & Daily Question Target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hedef Bitiş Tarihi <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="date"
                    value={assignTargetDate}
                    onChange={(e) => setAssignTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Günlük Soru Hedefi <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={assignDailyTarget}
                    onChange={(e) => setAssignDailyTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Örn: 20"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Öğrenciye Not / Açıklama <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                </label>
                <textarea
                  rows={2}
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  placeholder="Örn: Bu fasikülü dönem sonuna kadar tamamlamanı hedefliyoruz..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {selectedStudentIds.length} Öğrenciye Atamayı Tamamla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Edit Student Resource Scope Modal */}
      {editingStudentResource && activeRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Atanan Kapsamı Düzenle</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {users.find((u) => u.id === studentProfiles.find((s) => s.id === editingStudentResource.studentId)?.userId)?.fullName}
                </p>
              </div>
              <button onClick={() => setEditingStudentResource(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSr} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Sayfası</label>
                  <input
                    type="number"
                    min={activeRes.startPage}
                    max={activeRes.endPage}
                    value={editSrStartPage}
                    onChange={(e) => setEditSrStartPage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş Sayfası</label>
                  <input
                    type="number"
                    min={activeRes.startPage}
                    max={activeRes.endPage}
                    value={editSrEndPage}
                    onChange={(e) => setEditSrEndPage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Tarih</label>
                  <input
                    type="date"
                    value={editSrTargetDate}
                    onChange={(e) => setEditSrTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Günlük Soru Hedefi</label>
                  <input
                    type="number"
                    value={editSrDailyTarget}
                    onChange={(e) => setEditSrDailyTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Örn: 25"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Not / Açıklama</label>
                <textarea
                  rows={2}
                  value={editSrDescription}
                  onChange={(e) => setEditSrDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudentResource(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Kapsamı Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
