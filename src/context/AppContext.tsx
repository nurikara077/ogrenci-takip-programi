import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Organization,
  Class,
  Subject,
  TeacherProfile,
  StudentProfile,
  TeacherStudentRelation,
  TeacherClassRelation,
  Resource,
  TeacherResource,
  ResourceTopic,
  StudentResource,
  StudentCompletedPage,
  WeeklyPlan,
  DailyTask,
  StudyRecord,
  Notification,
  TaskStatus,
  VerificationStatus,
  AuditLog,
} from '../types';
import { MigrationService, MigrationSummary, BackupData } from '../services/migrationService';
import { DEFAULT_SIMULATION_DATE } from '../utils/dateUtils';

export interface TaskRealization {
  actualQuestions: number;
  actualMinutes: number;
  targetQuestions: number;
  targetMinutes: number;
  plannedPagesCount: number;
  solvedPagesCount: number;
  solvedPages: number[];
  questionPercent: number;
  timePercent: number;
  pagePercent: number;
  // UI Display Capping & Over-Target fields
  displayQuestionPercent: number;
  isQuestionOverTarget: boolean;
  extraQuestions: number;
  questionDisplayText: string;
  questionExtraBadgeText?: string;
  displayTimePercent: number;
  isTimeOverTarget: boolean;
  extraMinutes: number;
  timeDisplayText: string;
  timeExtraBadgeText?: string;
  status: TaskStatus;
  verificationStatus: VerificationStatus;
  statusLabel: string;
  statusColor: {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  };
  matrixColor: 'WHITE' | 'GREEN' | 'RED' | 'YELLOW' | 'BLUE' | 'ORANGE' | 'GRAY';
  matrixText: string;
  matrixBadgeClass: string;
  studentDeclarationText: string;
  teacherVerificationText: string;
}
import {
  initialUsers,
  initialOrganizations,
  initialClasses,
  initialSubjects,
  initialTeacherProfiles,
  initialStudentProfiles,
  initialTeacherClassRelations,
  initialTeacherStudentRelations,
  initialResources,
  initialTeacherResources,
  initialResourceTopics,
  initialStudentResources,
  initialStudentCompletedPages,
  initialWeeklyPlans,
  initialDailyTasks,
  initialStudyRecords,
  initialNotifications,
  initialAuditLogs,
} from '../data/mockData';

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: User;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  users: User[];
  organizations: Organization[];
  classes: Class[];
  subjects: Subject[];
  teacherProfiles: TeacherProfile[];
  studentProfiles: StudentProfile[];
  teacherClassRelations: TeacherClassRelation[];
  teacherStudentRelations: TeacherStudentRelation[];
  resources: Resource[];
  teacherResources: TeacherResource[];
  resourceTopics: ResourceTopic[];
  studentResources: StudentResource[];
  studentCompletedPages: StudentCompletedPage[];
  weeklyPlans: WeeklyPlan[];
  dailyTasks: DailyTask[];
  studyRecords: StudyRecord[];
  notifications: Notification[];
  auditLogs: AuditLog[];

  // Mutators & Core Business Logic
  addStudent: (studentData: {
    fullName: string;
    email?: string;
    phone?: string;
    classId?: string;
    studentNumber?: string;
    notes?: string;
    isIndependent: boolean;
  }) => StudentProfile;
  updateStudentProfile: (studentId: string, updates: Partial<StudentProfile>) => void;

  addResource: (resourceData: {
    subjectId: string;
    title: string;
    publisher: string;
    gradeLevel: number;
    totalPages: number;
    startPage: number;
    endPage: number;
    description?: string;
    topics?: { title: string; startPage: number; endPage: number }[];
  }) => Resource;
  updateResource: (resourceId: string, updates: Partial<Resource>) => void;
  deleteResource: (resourceId: string) => void;
  archiveResource: (resourceId: string) => Resource;
  assignResourceToTeacher: (resourceId: string, teacherId: string, assignedBy?: string) => TeacherResource;
  unassignResourceFromTeacher: (resourceId: string, teacherId: string) => void;
  canTeacherAccessResource: (teacherUserIdOrId: string, resourceId: string) => boolean;
  getTeacherAssignedResources: (teacherUserIdOrId: string) => Resource[];
  canTeacherAccessTask: (teacherUserIdOrId: string, taskId: string) => boolean;
  getTeacherVisibleTasks: (teacherUserIdOrId: string, studentId?: string) => DailyTask[];

  addResourceTopic: (
    resourceId: string,
    topic: { title: string; startPage: number; endPage: number }
  ) => ResourceTopic;
  updateResourceTopic: (topicId: string, updates: Partial<ResourceTopic>) => void;
  deleteResourceTopic: (topicId: string) => void;

  assignResourceToStudent: (
    resourceId: string,
    studentId: string,
    startPage?: number,
    endPage?: number,
    targetDate?: string,
    dailyQuestionTarget?: number,
    description?: string
  ) => StudentResource;
  assignResourceToMultipleStudents: (
    resourceId: string,
    studentIds: string[],
    options: {
      startPage: number;
      endPage: number;
      targetDate?: string;
      dailyQuestionTarget?: number;
      description?: string;
    }
  ) => StudentResource[];
  updateStudentResource: (studentResourceId: string, updates: Partial<StudentResource>) => void;
  removeStudentResource: (studentResourceId: string) => void;

  addDailyTask: (taskData: Omit<DailyTask, 'id' | 'createdAt' | 'isCompleted'> & { autoExpandScope?: boolean }) => DailyTask;
  updateDailyTask: (taskId: string, updates: Partial<DailyTask> & { autoExpandScope?: boolean; revisionNote?: string }) => void;
  deleteDailyTask: (taskId: string) => void;
  copyDailyTask: (
    taskId: string,
    targetDate: string,
    targetDayOfWeek: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar',
    targetStudentId?: string
  ) => DailyTask;
  addBatchDailyTasks: (
    studentIds: string[],
    taskData: Omit<DailyTask, 'id' | 'createdAt' | 'isCompleted' | 'studentId'>
  ) => { createdTasks: DailyTask[]; errors: string[] };

  saveStudyRecord: (recordData: {
    dailyTaskId: string;
    actualQuestionCount: number;
    actualDurationMinutes: number;
    completedStartPage?: number;
    completedEndPage?: number;
    studentNotes?: string;
  }) => StudyRecord;
  updateStudyRecord: (
    recordId: string,
    updates: Partial<StudyRecord>
  ) => StudyRecord;
  deleteStudyRecord: (recordId: string) => void;

  // Task Verification & Late Completion (FAZ 4)
  verifyDailyTask: (taskId: string, teacherId: string) => { success: boolean; error?: string };
  rejectDailyTask: (taskId: string, teacherId: string, note?: string) => { success: boolean; error?: string };
  completeLateDailyTask: (
    taskId: string,
    studentId: string,
    actualQuestions: number,
    actualMinutes: number,
    completedStartPage?: number,
    completedEndPage?: number,
    studentNotes?: string
  ) => { success: boolean; error?: string };
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;

  addClass: (classData: {
    name: string;
    gradeLevel: number;
    academicYear: string;
    organizationId?: string;
  }) => Class;
  addSubject: (subjectData: { name: string; code: string; colorHex: string }) => Subject;
  assignTeacherToClass: (teacherId: string, classId: string, subjectId: string) => TeacherClassRelation;
  removeTeacherFromClass: (relationId: string) => void;

  // Authorization & Permissions (RBAC)
  canTeacherAccessStudent: (teacherUserId: string, studentId: string) => boolean;
  canTeacherModifyStudent: (teacherUserId: string, studentId: string) => boolean;
  canTeacherAssignSubject: (teacherUserId: string, subjectId: string) => boolean;
  getTeacherAllowedSubjects: (teacherUserId: string) => Subject[];
  validateTaskCreation: (
    teacherUserId: string,
    taskData: {
      studentId: string;
      subjectId: string;
      resourceId?: string;
      startPage?: number;
      endPage?: number;
      targetQuestionCount?: number;
      targetDurationMinutes?: number;
      taskDate?: string;
    }
  ) => { isValid: boolean; error?: string };
  canModifyTask: (userId: string, task: DailyTask) => boolean;
  canModifyStudyRecord: (userId: string, record: StudyRecord) => boolean;
  canManageClass: (userId: string, classId: string) => boolean;
  canManageOrganization: (userId: string, orgId?: string) => boolean;
  getTeacherStudents: (teacherUserId: string) => StudentProfile[];
  getTeacherClasses: (teacherUserId: string) => Class[];

  // Calculators
  getTaskRealization: (taskId: string) => TaskRealization;
  getResourceProgress: (studentId: string, resourceId: string) => {
    completedCount: number;
    totalCount: number;
    remainingCount: number;
    percentage: number;
    completedPages: number[];
    assignedStartPage: number;
    assignedEndPage: number;
    targetDate?: string;
    dailyQuestionTarget?: number;
    description?: string;
  };

  getStudentSummary: (studentId: string) => {
    plannedQuestions: number;
    actualQuestions: number;
    questionSuccessRate: number;
    displayQuestionSuccessRate: number;
    isQuestionOverTarget: boolean;
    extraQuestions: number;
    questionDisplayText: string;
    questionExtraBadgeText?: string;
    plannedMinutes: number;
    actualMinutes: number;
    timeSuccessRate: number;
    displayTimeSuccessRate: number;
    isTimeOverTarget: boolean;
    extraMinutes: number;
    timeDisplayText: string;
    timeExtraBadgeText?: string;
    completedTasksCount: number;
    totalTasksCount: number;
    taskSuccessRate: number;
    overdueTasksCount: number;
  };

  // Production Infrastructure & Multi-tenant (FAZ 4)
  syncStatus: 'ONLINE_SYNCED' | 'SYNCING' | 'OFFLINE_FALLBACK';
  runDataMigration: () => MigrationSummary;
  exportBackup: () => BackupData;
  restoreBackup: () => boolean;
  checkTenantAccess: (targetOrgId?: string) => boolean;

  resetToInitialData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'ogrenci_takip_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with seed data
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_currentUserId`) || 'user-teacher-ahmet';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_isAuthenticated`);
    return saved !== null ? saved === 'true' : true;
  });

  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [classes, setClasses] = useState<Class[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_classes`);
    return saved ? JSON.parse(saved) : initialClasses;
  });
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>(initialTeacherProfiles);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_studentProfiles`);
    return saved ? JSON.parse(saved) : initialStudentProfiles;
  });
  const [teacherClassRelations, setTeacherClassRelations] = useState<TeacherClassRelation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tcr`);
    return saved ? JSON.parse(saved) : initialTeacherClassRelations;
  });
  const [teacherStudentRelations, setTeacherStudentRelations] = useState<TeacherStudentRelation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tsr`);
    return saved ? JSON.parse(saved) : initialTeacherStudentRelations;
  });
  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_resources`);
    return saved ? JSON.parse(saved) : initialResources;
  });
  const [teacherResources, setTeacherResources] = useState<TeacherResource[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_teacherResources`);
    return saved ? JSON.parse(saved) : initialTeacherResources;
  });
  const [resourceTopics, setResourceTopics] = useState<ResourceTopic[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_topics`);
    return saved ? JSON.parse(saved) : initialResourceTopics;
  });
  const [studentResources, setStudentResources] = useState<StudentResource[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_studentResources`);
    return saved ? JSON.parse(saved) : initialStudentResources;
  });
  const [studentCompletedPages, setStudentCompletedPages] = useState<StudentCompletedPage[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_completedPages`);
    return saved ? JSON.parse(saved) : initialStudentCompletedPages;
  });
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_weeklyPlans`);
    return saved ? JSON.parse(saved) : initialWeeklyPlans;
  });
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_dailyTasks`);
    return saved ? JSON.parse(saved) : initialDailyTasks;
  });
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_studyRecords`);
    return saved ? JSON.parse(saved) : initialStudyRecords;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : initialNotifications;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_auditLogs`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  // Production Sync & Connection Status (FAZ 4)
  const [syncStatus, setSyncStatus] = useState<'ONLINE_SYNCED' | 'SYNCING' | 'OFFLINE_FALLBACK'>('ONLINE_SYNCED');

  // Reactive Data Flow Listener (Requirement 8 - TEST 13)
  useEffect(() => {
    const handleRealtimeEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail?.eventType === 'TASK_REALIZATION_CREATED' ||
        customEvent.detail?.eventType === 'TASK_UPDATED'
      ) {
        setSyncStatus('SYNCING');
        setTimeout(() => setSyncStatus('ONLINE_SYNCED'), 200);
      }
    };
    window.addEventListener('ogrenci_takip_realtime_event', handleRealtimeEvent);
    return () => {
      window.removeEventListener('ogrenci_takip_realtime_event', handleRealtimeEvent);
    };
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_currentUserId`, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
    localStorage.setItem(`${STORAGE_KEY}_studentProfiles`, JSON.stringify(studentProfiles));
    localStorage.setItem(`${STORAGE_KEY}_tcr`, JSON.stringify(teacherClassRelations));
    localStorage.setItem(`${STORAGE_KEY}_tsr`, JSON.stringify(teacherStudentRelations));
    localStorage.setItem(`${STORAGE_KEY}_resources`, JSON.stringify(resources));
    localStorage.setItem(`${STORAGE_KEY}_teacherResources`, JSON.stringify(teacherResources));
    localStorage.setItem(`${STORAGE_KEY}_topics`, JSON.stringify(resourceTopics));
    localStorage.setItem(`${STORAGE_KEY}_studentResources`, JSON.stringify(studentResources));
    localStorage.setItem(`${STORAGE_KEY}_completedPages`, JSON.stringify(studentCompletedPages));
    localStorage.setItem(`${STORAGE_KEY}_weeklyPlans`, JSON.stringify(weeklyPlans));
    localStorage.setItem(`${STORAGE_KEY}_dailyTasks`, JSON.stringify(dailyTasks));
    localStorage.setItem(`${STORAGE_KEY}_studyRecords`, JSON.stringify(studyRecords));
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    localStorage.setItem(`${STORAGE_KEY}_auditLogs`, JSON.stringify(auditLogs));
  }, [
    users,
    classes,
    studentProfiles,
    teacherClassRelations,
    teacherStudentRelations,
    resources,
    teacherResources,
    resourceTopics,
    studentResources,
    studentCompletedPages,
    weeklyPlans,
    dailyTasks,
    studyRecords,
    notifications,
    auditLogs,
  ]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
    }
  };

  // Add new student
  const addStudent = (data: {
    fullName: string;
    email?: string;
    phone?: string;
    classId?: string;
    studentNumber?: string;
    notes?: string;
    isIndependent: boolean;
  }): StudentProfile => {
    const newUserId = `user-student-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      email: data.email || `${data.fullName.toLowerCase().replace(/\s+/g, '.')}@okul.k12.tr`,
      fullName: data.fullName,
      role: 'STUDENT',
      phone: data.phone,
      organizationId: data.isIndependent ? undefined : 'org-1',
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const newProfileId = `sp-${Date.now()}`;
    const newProfile: StudentProfile = {
      id: newProfileId,
      userId: newUserId,
      classId: data.classId,
      studentNumber: data.studentNumber || `${Math.floor(100 + Math.random() * 900)}`,
      notes: data.notes,
    };

    // If teacher added it, relate them
    const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);
    if (currentTeacherProfile) {
      const newRelation: TeacherStudentRelation = {
        id: `tsr-${Date.now()}`,
        teacherId: currentTeacherProfile.id,
        studentId: newProfileId,
        organizationId: data.isIndependent ? undefined : 'org-1',
        relationType: data.isIndependent ? 'PRIVATE_TUTOR' : 'INSTITUTIONAL',
        isActive: true,
      };
      setTeacherStudentRelations((prev) => [...prev, newRelation]);
    }

    setUsers((prev) => [...prev, newUser]);
    setStudentProfiles((prev) => [...prev, newProfile]);

    return newProfile;
  };

  // Add new resource with topics
  const addResource = (data: {
    subjectId: string;
    title: string;
    publisher: string;
    gradeLevel: number;
    totalPages: number;
    startPage: number;
    endPage: number;
    description?: string;
    topics?: { title: string; startPage: number; endPage: number }[];
  }): Resource => {
    if (currentUser.role !== 'INSTITUTE_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Yalnızca kurum yöneticisi kurumsal kaynak ekleyebilir.');
    }

    const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);
    const newResourceId = `res-${Date.now()}`;
    const newResource: Resource = {
      id: newResourceId,
      createdByTeacherId: currentTeacherProfile?.id,
      createdBy: currentUser.id,
      organizationId: currentUser.organizationId || 'org-1',
      institutionId: currentUser.organizationId || 'org-1',
      subjectId: data.subjectId,
      title: data.title,
      publisher: data.publisher,
      gradeLevel: data.gradeLevel,
      totalPages: data.totalPages,
      startPage: data.startPage,
      endPage: data.endPage,
      description: data.description,
      isArchived: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const newTopics: ResourceTopic[] = (data.topics || []).map((t, idx) => ({
      id: `rt-${Date.now()}-${idx}`,
      resourceId: newResourceId,
      title: t.title,
      startPage: t.startPage,
      endPage: t.endPage,
      orderIndex: idx + 1,
    }));

    setResources((prev) => [...prev, newResource]);
    if (newTopics.length > 0) {
      setResourceTopics((prev) => [...prev, ...newTopics]);
    }

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: 'RESOURCE_CREATED',
      targetType: 'RESOURCE',
      targetId: newResourceId,
      newValue: { title: data.title, publisher: data.publisher, subjectId: data.subjectId },
      note: `"${data.title}" kurumsal kütüphaneye eklendi.`,
    });

    return newResource;
  };

  const updateResource = (resourceId: string, updates: Partial<Resource>) => {
    if (currentUser.role !== 'INSTITUTE_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Yalnızca kurum yöneticisi kaynak bilgilerini güncelleyebilir.');
    }
    const res = resources.find((r) => r.id === resourceId);
    if (!res) throw new Error('Kaynak bulunamadı.');

    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    );

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: 'RESOURCE_UPDATED',
      targetType: 'RESOURCE',
      targetId: resourceId,
      previousValue: res,
      newValue: updates,
      note: `"${res.title}" kaynak bilgileri güncellendi.`,
    });
  };

  const archiveResource = (resourceId: string): Resource => {
    if (currentUser.role !== 'INSTITUTE_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Yalnızca kurum yöneticisi kaynak arşivleyebilir.');
    }
    const res = resources.find((r) => r.id === resourceId);
    if (!res) throw new Error('Kaynak bulunamadı.');

    const nowStr = new Date().toISOString();
    const updatedRes: Resource = {
      ...res,
      isArchived: true,
      status: 'ARCHIVED',
      updatedAt: nowStr,
    };

    setResources((prev) => prev.map((r) => (r.id === resourceId ? updatedRes : r)));

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: 'RESOURCE_ARCHIVED',
      targetType: 'RESOURCE',
      targetId: resourceId,
      previousValue: { isArchived: res.isArchived, status: res.status },
      newValue: { isArchived: true, status: 'ARCHIVED' },
      note: `"${res.title}" kaynağı arşivlendi.`,
    });

    return updatedRes;
  };

  const deleteResource = (resourceId: string) => {
    archiveResource(resourceId);
  };

  // FAZ 4: Institutional Resource & Teacher Authorization
  const assignResourceToTeacher = (
    resourceId: string,
    teacherId: string,
    assignedBy?: string
  ): TeacherResource => {
    const assignerUser = assignedBy ? users.find((u) => u.id === assignedBy) : currentUser;
    if (assignerUser && assignerUser.role !== 'INSTITUTE_ADMIN' && assignerUser.role !== 'SUPER_ADMIN') {
      throw new Error('Yalnızca kurum yöneticisi öğretmenlere kaynak atayabilir.');
    }

    const res = resources.find((r) => r.id === resourceId);
    if (!res) {
      throw new Error('Kaynak bulunamadı.');
    }

    if (res.isArchived || res.status === 'ARCHIVED') {
      throw new Error('Arşivlenmiş bir kaynak öğretmene atanamaz.');
    }

    const tp = teacherProfiles.find((t) => t.id === teacherId || t.userId === teacherId);
    if (!tp) {
      throw new Error('Öğretmen profili bulunamadı.');
    }

    const teacherUser = users.find((u) => u.id === tp.userId);
    const targetOrgId = teacherUser?.organizationId || assignerUser?.organizationId || 'org-1';
    const resOrgId = res.institutionId || res.organizationId || 'org-1';

    if (resOrgId !== targetOrgId) {
      throw new Error('Farklı bir kuruma ait kaynak atanamaz.');
    }

    if (tp.branchSubjectId && res.subjectId && tp.branchSubjectId !== res.subjectId) {
      throw new Error('Bir kaynak yalnızca kendi branşındaki öğretmenlere atanabilir.');
    }

    const assignedById = assignerUser?.id || currentUser.id;
    const nowStr = new Date().toISOString();

    let trRecord: TeacherResource | undefined;
    setTeacherResources((prev) => {
      const existing = prev.find((tr) => tr.teacherId === tp.id && tr.resourceId === resourceId);
      if (existing) {
        trRecord = {
          ...existing,
          isActive: true,
          assignedBy: assignedById,
          assignedAt: nowStr,
          updatedAt: nowStr,
        };
        return prev.map((tr) => (tr.id === existing.id ? trRecord! : tr));
      } else {
        trRecord = {
          id: `tr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          institutionId: targetOrgId,
          organizationId: targetOrgId,
          teacherId: tp.id,
          resourceId,
          assignedBy: assignedById,
          assignedAt: nowStr,
          isActive: true,
          createdAt: nowStr,
        };
        return [...prev, trRecord!];
      }
    });

    addAuditLog({
      actorId: assignedById,
      actorName: assignerUser?.fullName || 'Kurum Yöneticisi',
      actorRole: assignerUser?.role || 'INSTITUTE_ADMIN',
      action: 'RESOURCE_ASSIGNED_TO_TEACHER',
      targetType: 'TEACHER_RESOURCE',
      targetId: resourceId,
      newValue: { teacherId: tp.id, resourceId, assignedBy: assignedById },
      note: `"${res.title}" kaynağı ${teacherUser?.fullName || 'öğretmene'} atandı.`,
    });

    return trRecord || {
      id: `tr-${Date.now()}`,
      institutionId: targetOrgId,
      organizationId: targetOrgId,
      teacherId: tp.id,
      resourceId,
      assignedBy: assignedById,
      assignedAt: nowStr,
      isActive: true,
    };
  };

  const unassignResourceFromTeacher = (resourceId: string, teacherId: string) => {
    if (currentUser.role !== 'INSTITUTE_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Yalnızca kurum yöneticisi kaynak atamasını kaldırabilir.');
    }
    const tp = teacherProfiles.find((t) => t.id === teacherId || t.userId === teacherId);
    const teacherProfileId = tp?.id || teacherId;
    const res = resources.find((r) => r.id === resourceId);

    setTeacherResources((prev) =>
      prev.map((tr) =>
        tr.resourceId === resourceId && tr.teacherId === teacherProfileId
          ? { ...tr, isActive: false, updatedAt: new Date().toISOString() }
          : tr
      )
    );

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: 'RESOURCE_UNASSIGNED_FROM_TEACHER',
      targetType: 'TEACHER_RESOURCE',
      targetId: resourceId,
      newValue: { teacherId: teacherProfileId, resourceId, isActive: false },
      note: `"${res?.title || resourceId}" kaynağının öğretmen ataması kaldırıldı.`,
    });
  };

  const canTeacherAccessResource = (teacherUserIdOrId: string, resourceId: string): boolean => {
    const user = users.find((u) => u.id === teacherUserIdOrId);
    const tp = teacherProfiles.find((t) => t.id === teacherUserIdOrId || t.userId === teacherUserIdOrId);
    const effectiveUser = user || (tp ? users.find((u) => u.id === tp.userId) : undefined);

    if (!effectiveUser) return false;

    const res = resources.find((r) => r.id === resourceId);
    if (!res) return false;

    const userOrgId = effectiveUser.organizationId || 'org-1';
    const resOrgId = res.institutionId || res.organizationId || 'org-1';
    if (resOrgId !== userOrgId) {
      return false;
    }

    if (effectiveUser.role === 'INSTITUTE_ADMIN' || effectiveUser.role === 'SUPER_ADMIN') {
      return true;
    }

    if (effectiveUser.role === 'TEACHER') {
      if (res.isArchived || res.status === 'ARCHIVED') {
        return false;
      }
      const teacherProfileId = tp?.id || teacherProfiles.find((t) => t.userId === effectiveUser.id)?.id;
      if (!teacherProfileId) return false;

      return teacherResources.some(
        (tr) =>
          tr.teacherId === teacherProfileId &&
          tr.resourceId === resourceId &&
          tr.isActive === true &&
          (tr.institutionId === userOrgId || tr.organizationId === userOrgId)
      );
    }

    return false;
  };

  const getTeacherAssignedResources = (teacherUserIdOrId: string): Resource[] => {
    const user = users.find((u) => u.id === teacherUserIdOrId);
    const tp = teacherProfiles.find((t) => t.id === teacherUserIdOrId || t.userId === teacherUserIdOrId);
    const effectiveUser = user || (tp ? users.find((u) => u.id === tp.userId) : undefined);
    if (!effectiveUser) return [];

    const userOrgId = effectiveUser.organizationId || 'org-1';

    if (effectiveUser.role === 'INSTITUTE_ADMIN' || effectiveUser.role === 'SUPER_ADMIN') {
      return resources.filter(
        (r) => (r.institutionId || r.organizationId || 'org-1') === userOrgId && !r.isArchived && r.status !== 'ARCHIVED'
      );
    }

    if (effectiveUser.role === 'TEACHER') {
      return resources.filter((r) => canTeacherAccessResource(effectiveUser.id, r.id));
    }

    return [];
  };

  const canTeacherAccessTask = (teacherUserIdOrId: string, taskId: string): boolean => {
    const user = users.find((u) => u.id === teacherUserIdOrId);
    const tp = teacherProfiles.find((t) => t.id === teacherUserIdOrId || t.userId === teacherUserIdOrId);
    const effectiveUser = user || (tp ? users.find((u) => u.id === tp.userId) : undefined);
    if (!effectiveUser) return false;

    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) return false;

    const userOrgId = effectiveUser.organizationId || 'org-1';

    if (effectiveUser.role === 'INSTITUTE_ADMIN' || effectiveUser.role === 'SUPER_ADMIN') {
      const taskTeacher = teacherProfiles.find((t) => t.id === task.teacherId);
      const taskTeacherUser = taskTeacher ? users.find((u) => u.id === taskTeacher.userId) : undefined;
      return (taskTeacherUser?.organizationId || 'org-1') === userOrgId;
    }

    if (effectiveUser.role === 'TEACHER') {
      const teacherProfileId = tp?.id || teacherProfiles.find((t) => t.userId === effectiveUser.id)?.id;
      if (!teacherProfileId) return false;

      if (task.teacherId !== teacherProfileId) {
        return false;
      }

      if (task.resourceId) {
        if (!canTeacherAccessResource(effectiveUser.id, task.resourceId)) {
          return false;
        }
      }

      return true;
    }

    return false;
  };

  const getTeacherVisibleTasks = (teacherUserIdOrId: string, studentId?: string): DailyTask[] => {
    const user = users.find((u) => u.id === teacherUserIdOrId);
    const tp = teacherProfiles.find((t) => t.id === teacherUserIdOrId || t.userId === teacherUserIdOrId);
    const effectiveUser = user || (tp ? users.find((u) => u.id === tp.userId) : undefined);
    if (!effectiveUser) return [];

    let tasks = dailyTasks;
    if (studentId) {
      tasks = tasks.filter((t) => t.studentId === studentId);
    }

    const userOrgId = effectiveUser.organizationId || 'org-1';

    if (effectiveUser.role === 'INSTITUTE_ADMIN' || effectiveUser.role === 'SUPER_ADMIN') {
      return tasks.filter((task) => {
        const taskTeacher = teacherProfiles.find((t) => t.id === task.teacherId);
        const taskTeacherUser = taskTeacher ? users.find((u) => u.id === taskTeacher.userId) : undefined;
        return (taskTeacherUser?.organizationId || 'org-1') === userOrgId;
      });
    }

    if (effectiveUser.role === 'TEACHER') {
      return tasks.filter((task) => canTeacherAccessTask(effectiveUser.id, task.id));
    }

    return [];
  };

  // Topic Management (Requirement 2)
  const addResourceTopic = (
    resourceId: string,
    topic: { title: string; startPage: number; endPage: number }
  ): ResourceTopic => {
    const existingTopics = resourceTopics.filter((t) => t.resourceId === resourceId);
    const newTopic: ResourceTopic = {
      id: `rt-${Date.now()}-${existingTopics.length + 1}`,
      resourceId,
      title: topic.title,
      startPage: topic.startPage,
      endPage: topic.endPage,
      orderIndex: existingTopics.length + 1,
    };
    setResourceTopics((prev) => [...prev, newTopic]);
    return newTopic;
  };

  const updateResourceTopic = (topicId: string, updates: Partial<ResourceTopic>) => {
    setResourceTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, ...updates } : t)));
  };

  const deleteResourceTopic = (topicId: string) => {
    setResourceTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  // Helper to recompute completed pages for a student & resource across all active study records
  const syncCompletedPagesForStudent = (
    currentStudentResources: StudentResource[],
    allRecords: StudyRecord[],
    studentId: string,
    resourceId: string
  ) => {
    const sr = currentStudentResources.find((s) => s.studentId === studentId && s.resourceId === resourceId);
    if (!sr) return;

    // Active records for this student & resource
    const activeRecords = allRecords.filter(
      (r) =>
        r.studentId === studentId &&
        r.resourceId === resourceId &&
        r.completedStartPage !== undefined &&
        r.completedEndPage !== undefined
    );

    const uniquePagesSet = new Set<number>();
    activeRecords.forEach((r) => {
      const s = Math.min(r.completedStartPage!, r.completedEndPage!);
      const e = Math.max(r.completedStartPage!, r.completedEndPage!);
      for (let p = s; p <= e; p++) {
        if (p >= sr.assignedStartPage && p <= sr.assignedEndPage) {
          uniquePagesSet.add(p);
        }
      }
    });

    // Also include any initial seeded completed pages that match this assignment
    initialStudentCompletedPages.forEach((p) => {
      if (
        p.studentResourceId === sr.id &&
        p.pageNumber >= sr.assignedStartPage &&
        p.pageNumber <= sr.assignedEndPage
      ) {
        // If it was created by an active record, it's already counted. If it's a seed record, keep it.
        const recordIsDeleted = !allRecords.some((r) => r.id === p.studyRecordId);
        if (!recordIsDeleted || !p.studyRecordId) {
          uniquePagesSet.add(p.pageNumber);
        }
      }
    });

    setStudentCompletedPages((prev) => {
      // Keep pages for all other student resources
      const otherPages = prev.filter((p) => p.studentResourceId !== sr.id);
      const newPagesList: StudentCompletedPage[] = Array.from(uniquePagesSet)
        .sort((a, b) => a - b)
        .map((pNum) => ({
          id: `scp-${sr.id}-${pNum}`,
          studentResourceId: sr.id,
          studentId,
          pageNumber: pNum,
          completedAt: new Date().toISOString(),
        }));

      return [...otherPages, ...newPagesList];
    });
  };

  // Assign resource to student with independent scope (Requirement 3)
  const assignResourceToStudent = (
    resourceId: string,
    studentId: string,
    startPage?: number,
    endPage?: number,
    targetDate?: string,
    dailyQuestionTarget?: number,
    description?: string
  ): StudentResource => {
    const res = resources.find((r) => r.id === resourceId);
    if (!res) throw new Error('Kaynak bulunamadı.');
    if (res.isArchived || res.status === 'ARCHIVED') {
      throw new Error('Arşivlenmiş bir kaynak öğrenciye atanamaz.');
    }
    if (currentUser.role === 'TEACHER' && !canTeacherAccessResource(currentUser.id, resourceId)) {
      throw new Error('Yetkisiz işlem: Bu kaynağı öğrenciye atama yetkiniz bulunmamaktadır.');
    }

    const currentTeacherProfile = teacherProfiles.find((tp) => tp.userId === currentUser.id);

    const sStart = startPage ?? (res?.startPage || 1);
    const sEnd = endPage ?? (res?.endPage || res?.totalPages || 100);

    const newSr: StudentResource = {
      id: `sr-${Date.now()}-${studentId}`,
      studentId,
      resourceId,
      assignedByTeacherId: currentTeacherProfile?.id || 'tp-ahmet',
      assignedStartPage: Math.min(sStart, sEnd),
      assignedEndPage: Math.max(sStart, sEnd),
      targetDate,
      dailyQuestionTarget,
      description,
      status: 'ACTIVE',
      assignedAt: new Date().toISOString(),
    };

    setStudentResources((prev) => {
      // replace if exists for this student & resource, or append
      const filtered = prev.filter((item) => !(item.studentId === studentId && item.resourceId === resourceId));
      return [...filtered, newSr];
    });

    return newSr;
  };

  // Multi-student assignment (Requirement 3)
  const assignResourceToMultipleStudents = (
    resourceId: string,
    studentIds: string[],
    options: {
      startPage: number;
      endPage: number;
      targetDate?: string;
      dailyQuestionTarget?: number;
      description?: string;
    }
  ): StudentResource[] => {
    const createdList: StudentResource[] = [];
    studentIds.forEach((sId) => {
      const sr = assignResourceToStudent(
        resourceId,
        sId,
        options.startPage,
        options.endPage,
        options.targetDate,
        options.dailyQuestionTarget,
        options.description
      );
      createdList.push(sr);
    });
    return createdList;
  };

  const updateStudentResource = (studentResourceId: string, updates: Partial<StudentResource>) => {
    setStudentResources((prev) =>
      prev.map((sr) => (sr.id === studentResourceId ? { ...sr, ...updates } : sr))
    );
  };

  const removeStudentResource = (studentResourceId: string) => {
    setStudentResources((prev) => prev.filter((sr) => sr.id !== studentResourceId));
    setStudentCompletedPages((prev) => prev.filter((p) => p.studentResourceId !== studentResourceId));
  };

  // Daily task creation, validation, copying & batch
  const getTeacherAllowedSubjects = (teacherUserId: string): Subject[] => {
    const user = users.find((u) => u.id === teacherUserId);
    if (!user) return [];
    if (user.role === 'INSTITUTE_ADMIN') {
      return subjects;
    }
    if (user.role !== 'TEACHER') {
      return [];
    }

    const tp = teacherProfiles.find((t) => t.userId === teacherUserId);
    if (!tp) return [];

    const taughtSubjectIds = teacherClassRelations
      .filter((tcr) => tcr.teacherId === tp.id)
      .map((tcr) => tcr.subjectId);

    if (tp.branchSubjectId && !taughtSubjectIds.includes(tp.branchSubjectId)) {
      taughtSubjectIds.push(tp.branchSubjectId);
    }

    return subjects.filter(
      (s) =>
        taughtSubjectIds.includes(s.id) ||
        (tp.branch && s.name.toLowerCase().includes(tp.branch.toLowerCase()))
    );
  };

  const canTeacherAssignSubject = (teacherUserId: string, subjectId: string): boolean => {
    const user = users.find((u) => u.id === teacherUserId);
    if (!user) return false;
    if (user.role === 'INSTITUTE_ADMIN') return true;
    if (user.role !== 'TEACHER') return false;

    const allowed = getTeacherAllowedSubjects(teacherUserId);
    return allowed.some((s) => s.id === subjectId);
  };

  const validateTaskCreation = (
    teacherUserId: string,
    taskData: {
      studentId: string;
      subjectId: string;
      resourceId?: string;
      startPage?: number;
      endPage?: number;
      targetQuestionCount?: number;
      targetDurationMinutes?: number;
      taskDate?: string;
      autoExpandScope?: boolean;
    }
  ): { isValid: boolean; error?: string } => {
    // 0. Rol Kontrolü: Öğrenciler kesinlikle görev oluşturamaz
    const actorUser = users.find((u) => u.id === teacherUserId);
    if (actorUser?.role === 'STUDENT') {
      return {
        isValid: false,
        error: 'Öğrenciler görev oluşturamaz. Görev oluşturma yetkisi yalnızca öğretmen ve kurum yöneticilerine aittir.',
      };
    }

    // 1. Öğrenci Yetkisi (RBAC)
    if (!canTeacherAccessStudent(teacherUserId, taskData.studentId)) {
      return {
        isValid: false,
        error: 'Bu öğrenciye görev atama yetkiniz bulunmamaktadır.',
      };
    }

    // 2. Branş / Ders Yetkisi (RBAC)
    if (!canTeacherAssignSubject(teacherUserId, taskData.subjectId)) {
      const subject = subjects.find((s) => s.id === taskData.subjectId);
      const tp = teacherProfiles.find((t) => t.userId === teacherUserId);
      return {
        isValid: false,
        error: `Yetkiniz olmayan bir derse (${subject?.name || 'Seçilen Ders'}) görev atayamazsınız. ${tp?.branch ? `${tp.branch} branşı öğretmeni olarak yalnızca ${tp.branch} dersine görev atayabilirsiniz.` : ''}`,
      };
    }

    // 3. Tarih Geçerliliği
    if (!taskData.taskDate || isNaN(Date.parse(taskData.taskDate))) {
      return {
        isValid: false,
        error: 'Lütfen geçerli bir görev tarihi seçin.',
      };
    }

    // 4. Negatif ve Mantık Kontrolleri
    if (taskData.targetQuestionCount !== undefined && taskData.targetQuestionCount < 0) {
      return {
        isValid: false,
        error: 'Soru hedefi negatif olamaz.',
      };
    }

    if (taskData.targetDurationMinutes !== undefined && taskData.targetDurationMinutes < 0) {
      return {
        isValid: false,
        error: 'Süre hedefi negatif olamaz.',
      };
    }

    if (
      (taskData.targetQuestionCount || 0) <= 0 &&
      (taskData.targetDurationMinutes || 0) <= 0
    ) {
      return {
        isValid: false,
        error: 'Lütfen en az bir soru hedefi veya süre hedefi belirleyin.',
      };
    }

    // 5. Kaynak ve Sayfa Kapsamı Kontrolleri
    if (taskData.resourceId) {
      const res = resources.find((r) => r.id === taskData.resourceId);
      if (!res) {
        return {
          isValid: false,
          error: 'Belirtilen kaynak sistemde bulunamadı.',
        };
      }

      // Öğretmen kaynak yetkilendirme kontrolü (FAZ 4)
      const user = users.find((u) => u.id === teacherUserId);
      if (user?.role === 'TEACHER') {
        const canAccess = canTeacherAccessResource(teacherUserId, taskData.resourceId);
        if (!canAccess) {
          return {
            isValid: false,
            error: 'Bu kaynağı kullanarak görev oluşturma yetkiniz yok. Kaynak size atanmamış veya aktif değil.',
          };
        }
      }

      // Arşivlenmiş kaynak kontrolü
      if (res.isArchived || res.status === 'ARCHIVED') {
        return {
          isValid: false,
          error: 'Arşivlenmiş bir kaynak ile yeni görev oluşturulamaz.',
        };
      }

      // Öğrenciye atanmış kaynak kontrolü
      const studentRes = studentResources.find(
        (sr) => sr.studentId === taskData.studentId && sr.resourceId === taskData.resourceId
      );

      if (!studentRes) {
        return {
          isValid: false,
          error: `"${res.title}" kaynağı bu öğrenciye henüz atanmamıştır. Görev vermeden önce kaynağı öğrencinin kaynaklarına ekleyiniz.`,
        };
      }

      if (taskData.startPage !== undefined && taskData.endPage !== undefined) {
        if (taskData.startPage > taskData.endPage) {
          return {
            isValid: false,
            error: 'Başlangıç sayfası bitiş sayfasından büyük olamaz.',
          };
        }

        if (
          !taskData.autoExpandScope &&
          (taskData.startPage < studentRes.assignedStartPage ||
          taskData.endPage > studentRes.assignedEndPage)
        ) {
          return {
            isValid: false,
            error: `Seçtiğiniz sayfa aralığı (${taskData.startPage}-${taskData.endPage}), öğrencinin atanmış kaynak kapsamı (${studentRes.assignedStartPage}-${studentRes.assignedEndPage}) dışındadır!`,
          };
        }
      }
    }

    return { isValid: true };
  };

  const getTaskRealization = (taskId: string): TaskRealization => {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) {
      return {
        actualQuestions: 0,
        actualMinutes: 0,
        targetQuestions: 0,
        targetMinutes: 0,
        plannedPagesCount: 0,
        solvedPagesCount: 0,
        solvedPages: [],
        questionPercent: 0,
        displayQuestionPercent: 0,
        isQuestionOverTarget: false,
        extraQuestions: 0,
        questionDisplayText: '%0',
        timePercent: 0,
        displayTimePercent: 0,
        isTimeOverTarget: false,
        extraMinutes: 0,
        timeDisplayText: '%0',
        pagePercent: 0,
        status: 'PLANNED',
        verificationStatus: 'PENDING',
        statusLabel: 'Planlandı',
        statusColor: {
          badgeBg: 'bg-slate-100',
          badgeText: 'text-slate-700',
          badgeBorder: 'border-slate-200',
          dotColor: 'bg-slate-400',
        },
        matrixColor: 'WHITE',
        matrixText: 'Görev Yok',
        matrixBadgeClass: 'bg-white text-slate-400 border border-dashed border-slate-300',
        studentDeclarationText: 'Görev Yok',
        teacherVerificationText: 'Görev Yok',
      };
    }

    const records = studyRecords.filter((r) => r.dailyTaskId === task.id);
    const actualQuestions = records.reduce((s, r) => s + (r.actualQuestionCount || 0), 0);
    const actualMinutes = records.reduce((s, r) => s + (r.actualDurationMinutes || 0), 0);

    const targetQuestions = task.targetQuestionCount || 0;
    const targetMinutes = task.targetDurationMinutes || 0;

    let plannedPagesCount = 0;
    const collectedPages: number[] = [];

    if (task.startPage && task.endPage && task.startPage <= task.endPage) {
      plannedPagesCount = task.endPage - task.startPage + 1;

      for (const rec of records) {
        if (rec.completedStartPage && rec.completedEndPage) {
          const rMin = Math.min(rec.completedStartPage, rec.completedEndPage);
          const rMax = Math.max(rec.completedStartPage, rec.completedEndPage);
          for (let p = rMin; p <= rMax; p++) {
            if (p >= task.startPage && p <= task.endPage) {
              collectedPages.push(p);
            }
          }
        }
      }
    }

    const solvedPages = Array.from(new Set(collectedPages)).sort((a, b) => a - b);
    const solvedPagesCount = solvedPages.length;

    const questionPercent =
      targetQuestions > 0
        ? Number(((actualQuestions / targetQuestions) * 100).toFixed(1))
        : (actualQuestions > 0 ? 100 : 0);

    const isQuestionOverTarget = targetQuestions > 0 && actualQuestions > targetQuestions;
    const extraQuestions = Math.max(0, actualQuestions - targetQuestions);
    const displayQuestionPercent = Math.min(100, questionPercent);

    let questionDisplayText = `%${displayQuestionPercent.toString().replace('.', ',')}`;
    let questionExtraBadgeText: string | undefined = undefined;

    if (isQuestionOverTarget) {
      questionDisplayText = '%100 Tamamlandı';
      questionExtraBadgeText = `+${extraQuestions} ekstra soru`;
    } else if (targetQuestions > 0 && actualQuestions === targetQuestions) {
      questionDisplayText = '%100';
    } else if (targetQuestions === 0 && actualQuestions === 0) {
      questionDisplayText = '%0';
    }

    const timePercent =
      targetMinutes > 0
        ? Number(((actualMinutes / targetMinutes) * 100).toFixed(1))
        : (actualMinutes > 0 ? 100 : 0);

    const isTimeOverTarget = targetMinutes > 0 && actualMinutes > targetMinutes;
    const extraMinutes = Math.max(0, actualMinutes - targetMinutes);
    const displayTimePercent = Math.min(100, timePercent);

    let timeDisplayText = `%${displayTimePercent.toString().replace('.', ',')}`;
    let timeExtraBadgeText: string | undefined = undefined;

    if (isTimeOverTarget) {
      timeDisplayText = '%100 Tamamlandı';
      timeExtraBadgeText = `+${extraMinutes} dk ekstra çalışma`;
    } else if (targetMinutes > 0 && actualMinutes === targetMinutes) {
      timeDisplayText = '%100';
    } else if (targetMinutes === 0 && actualMinutes === 0) {
      timeDisplayText = '%0';
    }

    const pagePercent =
      plannedPagesCount > 0
        ? Number(((solvedPagesCount / plannedPagesCount) * 100).toFixed(1))
        : 0;

    // Simulation current date: 2026-09-03
    const todayStr = DEFAULT_SIMULATION_DATE;

    let status: TaskStatus = 'PLANNED';
    let statusLabel = 'Planlandı';
    let statusColor = {
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-200',
      dotColor: 'bg-slate-400',
    };

    const isFullyCompleted =
      task.isCompleted ||
      (targetQuestions > 0 &&
        actualQuestions >= targetQuestions &&
        (plannedPagesCount === 0 || solvedPagesCount >= plannedPagesCount));

    const isLateCompletion =
      isFullyCompleted &&
      (task.taskDate < todayStr ||
        records.some((r) => r.recordDate > task.taskDate) ||
        Boolean(task.originalTaskDate && task.completionDate && task.completionDate > task.originalTaskDate));

    if (isFullyCompleted) {
      if (isLateCompletion) {
        status = 'LATE_COMPLETED';
        statusLabel = 'Geç Tamamlandı';
        statusColor = {
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-800',
          badgeBorder: 'border-amber-300',
          dotColor: 'bg-amber-500',
        };
      } else {
        status = 'COMPLETED';
        statusLabel = 'Tamamlandı';
        statusColor = {
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          badgeBorder: 'border-emerald-200',
          dotColor: 'bg-emerald-500',
        };
      }
    } else if (actualQuestions > 0 || actualMinutes > 0 || solvedPagesCount > 0) {
      if (task.taskDate >= todayStr) {
        status = 'IN_PROGRESS';
        statusLabel = 'Devam Ediyor';
        statusColor = {
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-700',
          badgeBorder: 'border-blue-200',
          dotColor: 'bg-blue-500',
        };
      } else {
        status = 'INCOMPLETE';
        statusLabel = 'Eksik';
        statusColor = {
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-700',
          badgeBorder: 'border-amber-200',
          dotColor: 'bg-amber-500',
        };
      }
    } else {
      if (task.taskDate < todayStr) {
        status = 'OVERDUE';
        statusLabel = 'Gecikmiş';
        statusColor = {
          badgeBg: 'bg-rose-50',
          badgeText: 'text-rose-700',
          badgeBorder: 'border-rose-200',
          dotColor: 'bg-rose-500',
        };
      } else {
        status = 'PLANNED';
        statusLabel = 'Planlandı';
        statusColor = {
          badgeBg: 'bg-slate-100',
          badgeText: 'text-slate-700',
          badgeBorder: 'border-slate-200',
          dotColor: 'bg-slate-400',
        };
      }
    }

    // Verification Status and Unified Matrix Logic (FAZ 4 Standard)
    const verificationStatus: VerificationStatus = task.verificationStatus || 'PENDING';

    let matrixColor: 'WHITE' | 'GREEN' | 'RED' | 'YELLOW' | 'BLUE' | 'ORANGE' | 'GRAY' = 'GRAY';
    let matrixText = 'Planlandı';
    let matrixBadgeClass = 'bg-slate-100 text-slate-700 border border-slate-300';

    if (verificationStatus === 'REJECTED') {
      matrixColor = 'RED';
      matrixText = 'Yapılmadı';
      matrixBadgeClass = 'bg-rose-100 text-rose-800 border border-rose-300';
      statusLabel = 'Öğretmen Kontrolü: Yapılmadı';
      statusColor = {
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-300',
        dotColor: 'bg-rose-500',
      };
    } else if (status === 'COMPLETED' || status === 'LATE_COMPLETED') {
      if (verificationStatus === 'VERIFIED') {
        matrixColor = 'GREEN';
        matrixText = status === 'LATE_COMPLETED' ? 'Geç Tamamlandı — Doğrulandı' : 'Tamamlandı / Doğrulandı';
        matrixBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
        statusLabel = status === 'LATE_COMPLETED' ? 'Geç Tamamlandı — Doğrulandı' : 'Tamamlandı — Doğrulandı';
        statusColor = {
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          badgeBorder: 'border-emerald-300',
          dotColor: 'bg-emerald-500',
        };
      } else {
        // PENDING: Öğrenci tamamladı ama öğretmen henüz onaylamadı. Kesinlikle YEŞİL DEĞİL, SARI!
        matrixColor = 'YELLOW';
        matrixText = status === 'LATE_COMPLETED' ? 'Geç Tamamlandı — Kontrol Bekliyor' : 'Öğretmen Kontrolü Bekliyor';
        matrixBadgeClass = 'bg-amber-100 text-amber-800 border border-amber-300';
        statusLabel = status === 'LATE_COMPLETED' ? 'Geç Tamamlandı (Kontrol Bekliyor)' : 'Öğretmen Kontrolü Bekliyor';
        statusColor = {
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-800',
          badgeBorder: 'border-amber-300',
          dotColor: 'bg-amber-500',
        };
      }
    } else if (status === 'OVERDUE') {
      matrixColor = 'ORANGE';
      matrixText = 'Gecikmiş';
      matrixBadgeClass = 'bg-orange-100 text-orange-800 border border-orange-300';
      statusLabel = 'Gecikmiş';
      statusColor = {
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-700',
        badgeBorder: 'border-orange-300',
        dotColor: 'bg-orange-500',
      };
    } else if (status === 'IN_PROGRESS') {
      matrixColor = 'BLUE';
      matrixText = 'Devam Ediyor';
      matrixBadgeClass = 'bg-blue-100 text-blue-800 border border-blue-300';
      statusLabel = 'Devam Ediyor';
      statusColor = {
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
        dotColor: 'bg-blue-500',
      };
    } else {
      matrixColor = 'GRAY';
      matrixText = status === 'INCOMPLETE' ? 'Eksik' : 'Planlandı';
      matrixBadgeClass = 'bg-slate-100 text-slate-700 border border-slate-300';
      statusLabel = status === 'INCOMPLETE' ? 'Eksik' : 'Planlandı';
      statusColor = {
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        badgeBorder: 'border-slate-200',
        dotColor: 'bg-slate-400',
      };
    }

    const studentDeclarationText =
      records.length > 0
        ? `${actualQuestions} / ${targetQuestions || 0} Soru • ${actualMinutes} dk`
        : 'Çalışma kaydı girilmedi';

    const teacherVerificationText =
      verificationStatus === 'VERIFIED'
        ? `Öğretmen Tarafından Doğrulandı${task.verifiedAt ? ' (' + new Date(task.verifiedAt).toLocaleDateString('tr-TR') + ')' : ''}`
        : verificationStatus === 'REJECTED'
        ? `Öğretmen Kontrolü: Yapılmadı${task.verificationNote ? ' — ' + task.verificationNote : ''}`
        : records.length > 0
        ? 'Öğretmen Kontrolü Bekliyor'
        : 'Doğrulama Beklemede';

    return {
      actualQuestions,
      actualMinutes,
      targetQuestions,
      targetMinutes,
      plannedPagesCount,
      solvedPagesCount,
      solvedPages,
      questionPercent,
      timePercent,
      pagePercent,
      displayQuestionPercent,
      isQuestionOverTarget,
      extraQuestions,
      questionDisplayText,
      questionExtraBadgeText,
      displayTimePercent,
      isTimeOverTarget,
      extraMinutes,
      timeDisplayText,
      timeExtraBadgeText,
      status,
      verificationStatus,
      statusLabel,
      statusColor,
      matrixColor,
      matrixText,
      matrixBadgeClass,
      studentDeclarationText,
      teacherVerificationText,
    };
  };

  const addDailyTask = (
    taskData: Omit<DailyTask, 'id' | 'createdAt' | 'isCompleted'> & { autoExpandScope?: boolean }
  ): DailyTask => {
    // Öğrencilerin görev oluşturma yetkisi bulunmamaktadır
    if (currentUser.role === 'STUDENT') {
      throw new Error('Öğrencilerin görev oluşturma yetkisi bulunmamaktadır. Görev atamaları yalnızca öğretmen veya yöneticiler tarafından yapılabilir.');
    }

    // If autoExpandScope is requested and resource is assigned, expand student's scope if pages are outside
    if (taskData.resourceId && taskData.startPage !== undefined && taskData.endPage !== undefined && taskData.autoExpandScope) {
      const studentRes = studentResources.find(
        (sr) => sr.studentId === taskData.studentId && sr.resourceId === taskData.resourceId
      );
      if (studentRes) {
        const newStart = Math.min(studentRes.assignedStartPage, taskData.startPage);
        const newEnd = Math.max(studentRes.assignedEndPage, taskData.endPage);
        if (newStart !== studentRes.assignedStartPage || newEnd !== studentRes.assignedEndPage) {
          updateStudentResource(studentRes.id, {
            assignedStartPage: newStart,
            assignedEndPage: newEnd,
          });
        }
      }
    }

    const val = validateTaskCreation(currentUser.id, taskData);
    if (!val.isValid) {
      throw new Error(val.error || 'Görev oluşturma kurallara uygun değil.');
    }

    const { autoExpandScope: _, ...taskPayload } = taskData;
    const newTask: DailyTask = {
      ...taskPayload,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setDailyTasks((prev) => [...prev, newTask]);

    // Send notification to student
    const studentUser = users.find((u) => {
      const sp = studentProfiles.find((s) => s.id === taskData.studentId);
      return sp && sp.userId === u.id;
    });

    if (studentUser) {
      const sub = subjects.find((s) => s.id === taskData.subjectId);
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: studentUser.id,
        title: `Yeni Görev: ${sub?.name || 'Ödev'}`,
        message: `${taskData.dayOfWeek} günü için ${taskData.targetQuestionCount || 0} soru hedefi eklendi.`,
        type: 'NEW_TASK',
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedTaskId: newTask.id,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }

    return newTask;
  };

  const updateDailyTask = (
    taskId: string,
    updates: Partial<DailyTask> & { autoExpandScope?: boolean; revisionNote?: string }
  ) => {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Görev bulunamadı.');

    if (currentUser.role === 'STUDENT') {
      throw new Error('Öğrencilerin görev düzenleme yetkisi bulunmamaktadır.');
    }

    if (!canModifyTask(currentUser.id, task)) {
      throw new Error('Bu görevi düzenleme yetkiniz bulunmamaktadır.');
    }

    // Teacher cannot modify another teacher's task or unassigned resources/students
    if (currentUser.role === 'TEACHER') {
      const tp = teacherProfiles.find((t) => t.userId === currentUser.id);
      if (!tp || task.teacherId !== tp.id) {
        throw new Error('Yalnızca kendi sorumluluğunuzdaki görevleri revize edebilirsiniz.');
      }
      if (updates.resourceId && !canTeacherAccessResource(currentUser.id, updates.resourceId)) {
        throw new Error('Yetkiniz olmayan bir kaynağa görev revize edemezsiniz.');
      }
      if (updates.studentId && !canTeacherAccessStudent(currentUser.id, updates.studentId)) {
        throw new Error('Sorumluluğunuzda olmayan bir öğrenciye görev revize edemezsiniz.');
      }
    }

    const merged = { ...task, ...updates };

    if (merged.resourceId && merged.startPage !== undefined && merged.endPage !== undefined && updates.autoExpandScope) {
      const studentRes = studentResources.find(
        (sr) => sr.studentId === merged.studentId && sr.resourceId === merged.resourceId
      );
      if (studentRes) {
        const newStart = Math.min(studentRes.assignedStartPage, merged.startPage);
        const newEnd = Math.max(studentRes.assignedEndPage, merged.endPage);
        if (newStart !== studentRes.assignedStartPage || newEnd !== studentRes.assignedEndPage) {
          updateStudentResource(studentRes.id, {
            assignedStartPage: newStart,
            assignedEndPage: newEnd,
          });
        }
      }
    }

    const val = validateTaskCreation(currentUser.id, merged);
    if (!val.isValid) {
      throw new Error(val.error || 'Görev güncelleme kurallara uygun değil.');
    }

    const { autoExpandScope: _, revisionNote, ...cleanUpdates } = updates;

    // Track Task Revision & Versioning (Requirement 11 & 12)
    const revisionCount = (task.revisionCount || 0) + 1;
    const nowStr = new Date().toISOString();

    const previousSnapshot: Partial<DailyTask> = {
      targetQuestionCount: task.targetQuestionCount,
      targetDurationMinutes: task.targetDurationMinutes,
      startPage: task.startPage,
      endPage: task.endPage,
      taskDate: task.taskDate,
      dayOfWeek: task.dayOfWeek,
      subjectId: task.subjectId,
      resourceId: task.resourceId,
      description: task.description,
    };

    const newSnapshot: Partial<DailyTask> = {
      ...cleanUpdates,
    };

    const newRevision: TaskRevision = {
      revisionNumber: revisionCount,
      editedBy: currentUser.id,
      editedByName: currentUser.fullName,
      editedAt: nowStr,
      previousValue: previousSnapshot,
      newValue: newSnapshot,
      note: revisionNote || (cleanUpdates.description ? `Revizyon ${revisionCount}: ${cleanUpdates.description}` : `Revizyon ${revisionCount}: Görev hedefleri güncellendi`),
    };

    const updatedRevisionHistory = [...(task.revisionHistory || []), newRevision];

    // NOTE: StudyRecords are explicitly PRESERVED and untouched to protect student's past effort!
    setDailyTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...cleanUpdates,
              revisionCount,
              revisionHistory: updatedRevisionHistory,
            }
          : t
      )
    );

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: 'TASK_REVISED',
      targetType: 'DAILY_TASK',
      targetId: taskId,
      previousValue: previousSnapshot,
      newValue: newSnapshot,
      note: `Görev revize edildi (Revizyon ${revisionCount}). Öğrencinin geçmiş çalışma kayıtları korundu.${
        task.isCompleted || task.verificationStatus === 'VERIFIED'
          ? ' [DİKKAT: Daha önce tamamlanmış/doğrulanmış görev revize edildi]'
          : ''
      }`,
    });

    MigrationService.broadcastEvent('TASK_UPDATED', { taskId, action: 'REVISED', revisionCount });
  };

  const deleteDailyTask = (taskId: string) => {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!canModifyTask(currentUser.id, task)) {
      throw new Error('Bu görevi silme yetkiniz bulunmamaktadır.');
    }

    setDailyTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const copyDailyTask = (
    taskId: string,
    targetDate: string,
    targetDayOfWeek: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar',
    targetStudentId?: string
  ): DailyTask => {
    const original = dailyTasks.find((t) => t.id === taskId);
    if (!original) throw new Error('Kopyalanacak görev bulunamadı.');

    const finalStudentId = targetStudentId || original.studentId;

    const val = validateTaskCreation(currentUser.id, {
      studentId: finalStudentId,
      subjectId: original.subjectId,
      resourceId: original.resourceId,
      startPage: original.startPage,
      endPage: original.endPage,
      targetQuestionCount: original.targetQuestionCount,
      targetDurationMinutes: original.targetDurationMinutes,
      taskDate: targetDate,
    });

    if (!val.isValid) {
      throw new Error(val.error || 'Görev kopyalama doğrulanamadı.');
    }

    const newTask: DailyTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      weeklyPlanId: original.weeklyPlanId,
      studentId: finalStudentId,
      teacherId:
        currentUser.role === 'TEACHER'
          ? (teacherProfiles.find((t) => t.userId === currentUser.id)?.id || original.teacherId)
          : original.teacherId,
      subjectId: original.subjectId,
      resourceId: original.resourceId,
      resourceTopicId: original.resourceTopicId,
      taskDate: targetDate,
      dayOfWeek: targetDayOfWeek,
      taskType: original.taskType,
      targetQuestionCount: original.targetQuestionCount,
      targetDurationMinutes: original.targetDurationMinutes,
      startPage: original.startPage,
      endPage: original.endPage,
      description: original.description ? `${original.description} (Kopya)` : undefined,
      copiedFromTaskId: taskId,
      status: 'PLANNED',
      verificationStatus: 'PENDING',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setDailyTasks((prev) => [...prev, newTask]);

    // Audit log
    const user = users.find((u) => u.id === currentUser.id);
    addAuditLog({
      actorId: currentUser.id,
      actorName: user?.fullName || 'Kullanıcı',
      actorRole: user?.role || 'TEACHER',
      action: 'TASK_COPIED',
      targetType: 'DAILY_TASK',
      targetId: newTask.id,
      previousValue: { originalTaskId: taskId },
      newValue: { newTaskId: newTask.id, targetDate, targetStudentId: finalStudentId },
      note: `Görev ${targetDate} tarihine kopyalandı.`,
    });

    return newTask;
  };

  const addBatchDailyTasks = (
    studentIds: string[],
    taskData: Omit<DailyTask, 'id' | 'createdAt' | 'isCompleted' | 'studentId'>
  ): { createdTasks: DailyTask[]; errors: string[] } => {
    const createdTasks: DailyTask[] = [];
    const errors: string[] = [];

    studentIds.forEach((studentId) => {
      const studentProfile = studentProfiles.find((s) => s.id === studentId);
      const studentUser = users.find((u) => u.id === studentProfile?.userId);
      const studentName = studentUser?.fullName || studentId;

      const val = validateTaskCreation(currentUser.id, {
        studentId,
        subjectId: taskData.subjectId,
        resourceId: taskData.resourceId,
        startPage: taskData.startPage,
        endPage: taskData.endPage,
        targetQuestionCount: taskData.targetQuestionCount,
        targetDurationMinutes: taskData.targetDurationMinutes,
        taskDate: taskData.taskDate,
      });

      if (!val.isValid) {
        errors.push(`${studentName}: ${val.error}`);
        return;
      }

      const newTask: DailyTask = {
        ...taskData,
        id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        studentId,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };

      createdTasks.push(newTask);
    });

    if (createdTasks.length > 0) {
      setDailyTasks((prev) => [...prev, ...createdTasks]);
    }

    return { createdTasks, errors };
  };

  // Student Study Log saving with EXACT unique page progress calculation & range validation
  const saveStudyRecord = (recordData: {
    dailyTaskId: string;
    actualQuestionCount: number;
    actualDurationMinutes: number;
    completedStartPage?: number;
    completedEndPage?: number;
    studentNotes?: string;
  }): StudyRecord => {
    const task = dailyTasks.find((t) => t.id === recordData.dailyTaskId);
    if (!task) throw new Error('Görev bulunamadı');

    // ARALIK KONTROLÜ (Requirement 5):
    if (task.resourceId && recordData.completedStartPage !== undefined && recordData.completedEndPage !== undefined) {
      const pStart = Math.min(recordData.completedStartPage, recordData.completedEndPage);
      const pEnd = Math.max(recordData.completedStartPage, recordData.completedEndPage);

      if (pStart < 1) {
        throw new Error('Sayfa numarası 1 veya daha büyük olmalıdır.');
      }

      const studentResource = studentResources.find(
        (sr) => sr.studentId === task.studentId && sr.resourceId === task.resourceId
      );

      if (studentResource) {
        if (pStart < studentResource.assignedStartPage || pEnd > studentResource.assignedEndPage) {
          throw new Error(
            `Girdiğiniz sayfa aralığı (${pStart}-${pEnd}), size atanan kaynak kapsamının (${studentResource.assignedStartPage}-${studentResource.assignedEndPage}) dışındadır!`
          );
        }
      }
    }

    // Duplicate realization prevention (Requirement 7)
    const isDuplicate = studyRecords.some(
      (r) =>
        r.dailyTaskId === recordData.dailyTaskId &&
        r.actualQuestionCount === recordData.actualQuestionCount &&
        r.actualDurationMinutes === recordData.actualDurationMinutes &&
        Math.abs(new Date(r.createdAt).getTime() - Date.now()) < 3000
    );
    if (isDuplicate) {
      throw new Error('Bu çalışma kaydı zaten kaydedildi (mükerrer kayıt engellendi).');
    }

    const newRecordId = `rec-${Date.now()}`;
    const newRecord: StudyRecord = {
      id: newRecordId,
      dailyTaskId: recordData.dailyTaskId,
      studentId: task.studentId,
      subjectId: task.subjectId,
      resourceId: task.resourceId,
      recordDate: task.taskDate,
      actualQuestionCount: recordData.actualQuestionCount,
      actualDurationMinutes: recordData.actualDurationMinutes,
      completedStartPage: recordData.completedStartPage,
      completedEndPage: recordData.completedEndPage,
      studentNotes: recordData.studentNotes,
      createdAt: new Date().toISOString(),
    };

    // Update task completion based on target
    const targetQ = task.targetQuestionCount || 0;
    const isTargetMet = targetQ > 0 ? recordData.actualQuestionCount >= targetQ : true;

    setDailyTasks((prev) =>
      prev.map((t) => (t.id === recordData.dailyTaskId ? { ...t, isCompleted: isTargetMet } : t))
    );

    const updatedRecords = [...studyRecords, newRecord];
    setStudyRecords(updatedRecords);

    // Sync pages for unique calculation (Requirement 4, 6, 11)
    if (task.resourceId) {
      syncCompletedPagesForStudent(studentResources, updatedRecords, task.studentId, task.resourceId);
    }

    // Broadcast reactive event to all views and tabs (Requirement 8 - TEST 13)
    MigrationService.broadcastEvent('TASK_REALIZATION_CREATED', {
      record: newRecord,
      taskId: task.id,
      studentId: task.studentId,
    });

    // Notify the teacher
    const teacherProfile = teacherProfiles.find((tp) => tp.id === task.teacherId);
    if (teacherProfile) {
      const studentUser = users.find((u) => {
        const sp = studentProfiles.find((s) => s.id === task.studentId);
        return sp && sp.userId === u.id;
      });

      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: teacherProfile.userId,
        title: 'Ödev Tamamlandı',
        message: `${studentUser?.fullName || 'Öğrenci'}, ${recordData.actualQuestionCount} soru ve ${recordData.actualDurationMinutes} dk çalışma kaydetti.`,
        type: 'STUDY_RECORD_ENTERED',
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedTaskId: task.id,
        relatedStudentId: task.studentId,
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    return newRecord;
  };

  // Study record update (Requirement 11)
  const updateStudyRecord = (recordId: string, updates: Partial<StudyRecord>): StudyRecord => {
    const existing = studyRecords.find((r) => r.id === recordId);
    if (!existing) throw new Error('Çalışma kaydı bulunamadı');

    const updatedRecord: StudyRecord = { ...existing, ...updates };

    // Range validation
    if (
      updatedRecord.resourceId &&
      updatedRecord.completedStartPage !== undefined &&
      updatedRecord.completedEndPage !== undefined
    ) {
      const pStart = Math.min(updatedRecord.completedStartPage, updatedRecord.completedEndPage);
      const pEnd = Math.max(updatedRecord.completedStartPage, updatedRecord.completedEndPage);

      const studentResource = studentResources.find(
        (sr) => sr.studentId === updatedRecord.studentId && sr.resourceId === updatedRecord.resourceId
      );

      if (studentResource) {
        if (pStart < studentResource.assignedStartPage || pEnd > studentResource.assignedEndPage) {
          throw new Error(
            `Girdiğiniz sayfa aralığı (${pStart}-${pEnd}), size atanan kaynak kapsamının (${studentResource.assignedStartPage}-${studentResource.assignedEndPage}) dışındadır!`
          );
        }
      }
    }

    const updatedRecords = studyRecords.map((r) => (r.id === recordId ? updatedRecord : r));
    setStudyRecords(updatedRecords);

    if (updatedRecord.resourceId) {
      syncCompletedPagesForStudent(
        studentResources,
        updatedRecords,
        updatedRecord.studentId,
        updatedRecord.resourceId
      );
    }

    const task = dailyTasks.find((t) => t.id === existing.dailyTaskId);
    if (task) {
      const recordsForTask = updatedRecords.filter((r) => r.dailyTaskId === task.id);
      const totalQ = recordsForTask.reduce((s, r) => s + (r.actualQuestionCount || 0), 0);
      const targetQ = task.targetQuestionCount || 0;
      const isTargetMet = targetQ > 0 ? totalQ >= targetQ : true;
      setDailyTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isCompleted: isTargetMet } : t))
      );
    }

    return updatedRecord;
  };

  // Study record deletion with auto-recalculation (Requirement 11)
  const deleteStudyRecord = (recordId: string) => {
    const recordToDelete = studyRecords.find((r) => r.id === recordId);
    if (!recordToDelete) return;

    const taskId = recordToDelete.dailyTaskId;
    const studentId = recordToDelete.studentId;
    const resourceId = recordToDelete.resourceId;

    const remainingRecords = studyRecords.filter((r) => r.id !== recordId);
    setStudyRecords(remainingRecords);

    // If task has no other study records, mark incomplete
    const otherRecords = remainingRecords.filter((r) => r.dailyTaskId === taskId);
    if (otherRecords.length === 0) {
      setDailyTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, isCompleted: false } : t)));
    }

    if (resourceId) {
      syncCompletedPagesForStudent(studentResources, remainingRecords, studentId, resourceId);
    }
  };

  const login = (email: string, password?: string) => {
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!foundUser) {
      return { success: false, message: 'Bu e-posta adresine kayıtlı kullanıcı bulunamadı.' };
    }
    if (!foundUser.isActive) {
      return { success: false, message: 'Bu kullanıcı hesabı aktif değil.' };
    }
    setCurrentUserId(foundUser.id);
    setIsAuthenticated(true);
    localStorage.setItem(`${STORAGE_KEY}_isAuthenticated`, 'true');
    localStorage.setItem(`${STORAGE_KEY}_currentUserId`, foundUser.id);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(`${STORAGE_KEY}_isAuthenticated`, 'false');
  };

  const updateStudentProfile = (studentId: string, updates: Partial<StudentProfile>) => {
    setStudentProfiles((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s))
    );
  };

  const addClass = (classData: {
    name: string;
    gradeLevel: number;
    academicYear: string;
    organizationId?: string;
  }): Class => {
    const newClass: Class = {
      id: `class-${Date.now()}`,
      organizationId: classData.organizationId || 'org-1',
      name: classData.name,
      gradeLevel: classData.gradeLevel,
      academicYear: classData.academicYear,
    };
    setClasses((prev) => [...prev, newClass]);
    return newClass;
  };

  const addSubject = (subjectData: { name: string; code: string; colorHex: string }): Subject => {
    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      name: subjectData.name,
      code: subjectData.code.toUpperCase(),
      colorHex: subjectData.colorHex,
      isCustom: true,
    };
    setSubjects((prev) => [...prev, newSubject]);
    return newSubject;
  };

  const assignTeacherToClass = (teacherId: string, classId: string, subjectId: string): TeacherClassRelation => {
    const newRel: TeacherClassRelation = {
      id: `tcr-${Date.now()}`,
      teacherId,
      classId,
      subjectId,
    };
    setTeacherClassRelations((prev) => [...prev, newRel]);
    return newRel;
  };

  const removeTeacherFromClass = (relationId: string) => {
    setTeacherClassRelations((prev) => prev.filter((r) => r.id !== relationId));
  };

  // RBAC and Teacher Scope
  const getTeacherStudents = (teacherUserId: string): StudentProfile[] => {
    const user = users.find((u) => u.id === teacherUserId);
    if (!user) return [];
    if (user.role === 'INSTITUTE_ADMIN') {
      return studentProfiles;
    }

    const tp = teacherProfiles.find((t) => t.userId === teacherUserId);
    if (!tp) return [];

    // Classes this teacher teaches
    const taughtClassIds = teacherClassRelations
      .filter((tcr) => tcr.teacherId === tp.id)
      .map((tcr) => tcr.classId);

    // Students in those classes
    const classStudents = studentProfiles.filter(
      (sp) => sp.classId && taughtClassIds.includes(sp.classId)
    );

    // Direct students (e.g. private tutor relations)
    const directStudentIds = teacherStudentRelations
      .filter((tsr) => tsr.teacherId === tp.id && tsr.isActive)
      .map((tsr) => tsr.studentId);

    const directStudents = studentProfiles.filter((sp) => directStudentIds.includes(sp.id));

    // Combine distinct
    const seen = new Set<string>();
    const result: StudentProfile[] = [];
    for (const item of [...classStudents, ...directStudents]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  };

  const getTeacherClasses = (teacherUserId: string): Class[] => {
    const user = users.find((u) => u.id === teacherUserId);
    if (!user) return [];
    if (user.role === 'INSTITUTE_ADMIN') {
      return classes;
    }

    const tp = teacherProfiles.find((t) => t.userId === teacherUserId);
    if (!tp) return [];

    const taughtClassIds = teacherClassRelations
      .filter((tcr) => tcr.teacherId === tp.id)
      .map((tcr) => tcr.classId);

    return classes.filter((c) => taughtClassIds.includes(c.id));
  };

  const canTeacherAccessStudent = (teacherUserId: string, studentId: string): boolean => {
    const user = users.find((u) => u.id === teacherUserId);
    if (!user) return false;
    if (user.role === 'INSTITUTE_ADMIN') return true;
    if (user.role !== 'TEACHER') return false;

    const allowed = getTeacherStudents(teacherUserId);
    return allowed.some((s) => s.id === studentId);
  };

  const canTeacherModifyStudent = (teacherUserId: string, studentId: string): boolean => {
    return canTeacherAccessStudent(teacherUserId, studentId);
  };

  const canModifyTask = (userId: string, task: DailyTask): boolean => {
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    if (user.role === 'INSTITUTE_ADMIN') return true;
    if (user.role !== 'TEACHER') return false;

    const tp = teacherProfiles.find((t) => t.userId === userId);
    if (!tp) return false;

    return task.teacherId === tp.id;
  };

  const canModifyStudyRecord = (userId: string, record: StudyRecord): boolean => {
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    if (user.role === 'INSTITUTE_ADMIN') return true;
    if (user.role === 'STUDENT') {
      const sp = studentProfiles.find((s) => s.userId === userId);
      return sp?.id === record.studentId;
    }
    return false;
  };

  const canManageClass = (userId: string, classId: string): boolean => {
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    if (user.role === 'INSTITUTE_ADMIN') return true;
    return false;
  };

  const canManageOrganization = (userId: string, orgId?: string): boolean => {
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    if (user.role === 'INSTITUTE_ADMIN') return true;
    return false;
  };

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const verifyDailyTask = (taskId: string, teacherId: string): { success: boolean; error?: string } => {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Görev bulunamadı.' };

    const teacher = users.find((u) => u.id === teacherId);
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'INSTITUTE_ADMIN' && teacher.role !== 'COORDINATOR')) {
      return { success: false, error: 'Yetkisiz işlem: Sadece öğretmenler veya yöneticiler görev doğrulayabilir.' };
    }

    if (teacher.role === 'TEACHER') {
      if (!canTeacherAccessStudent(teacherId, task.studentId)) {
        return { success: false, error: 'Yetkisiz işlem: Bu öğrencinin görevini doğrulama yetkiniz bulunmamaktadır.' };
      }
      if (!canTeacherAccessTask(teacherId, taskId)) {
        return { success: false, error: 'Yetkisiz işlem: Bu görevi kontrol etme veya doğrulama yetkiniz bulunmamaktadır.' };
      }
    }

    const prevVerification = task.verificationStatus || 'PENDING';
    const verifiedTimestamp = new Date().toISOString();

    setDailyTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              verificationStatus: 'VERIFIED',
              verifiedBy: teacherId,
              verifiedAt: verifiedTimestamp,
              verificationNote: undefined,
            }
          : t
      )
    );

    addAuditLog({
      actorId: teacherId,
      actorName: teacher.fullName,
      actorRole: teacher.role,
      action: 'TASK_VERIFIED',
      targetType: 'DAILY_TASK',
      targetId: taskId,
      previousValue: { verificationStatus: prevVerification },
      newValue: { verificationStatus: 'VERIFIED', verifiedBy: teacherId, verifiedAt: verifiedTimestamp },
      note: 'Öğretmen görevi doğruladı.',
    });

    MigrationService.broadcastEvent('TASK_UPDATED', { taskId, action: 'VERIFIED' });
    return { success: true };
  };

  const rejectDailyTask = (taskId: string, teacherId: string, note?: string): { success: boolean; error?: string } => {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Görev bulunamadı.' };

    const teacher = users.find((u) => u.id === teacherId);
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'INSTITUTE_ADMIN' && teacher.role !== 'COORDINATOR')) {
      return { success: false, error: 'Yetkisiz işlem: Sadece öğretmenler veya yöneticiler bu işlemi yapabilir.' };
    }

    if (teacher.role === 'TEACHER') {
      if (!canTeacherAccessStudent(teacherId, task.studentId)) {
        return { success: false, error: 'Yetkisiz işlem: Bu öğrencinin görevini değiştirme yetkiniz bulunmamaktadır.' };
      }
      if (!canTeacherAccessTask(teacherId, taskId)) {
        return { success: false, error: 'Yetkisiz işlem: Bu görevi kontrol etme veya reddetme yetkiniz bulunmamaktadır.' };
      }
    }

    const prevVerification = task.verificationStatus || 'PENDING';
    const rejectedTimestamp = new Date().toISOString();

    // Student's studyRecords are NEVER deleted!
    setDailyTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              verificationStatus: 'REJECTED',
              verifiedBy: teacherId,
              verifiedAt: rejectedTimestamp,
              verificationNote: note || 'Öğretmen tarafından yapılmadı olarak işaretlendi.',
            }
          : t
      )
    );

    addAuditLog({
      actorId: teacherId,
      actorName: teacher.fullName,
      actorRole: teacher.role,
      action: 'TASK_REJECTED',
      targetType: 'DAILY_TASK',
      targetId: taskId,
      previousValue: { verificationStatus: prevVerification },
      newValue: {
        verificationStatus: 'REJECTED',
        verifiedBy: teacherId,
        verifiedAt: rejectedTimestamp,
        verificationNote: note || '',
      },
      note: note || 'Öğretmen görevi yapılmadı olarak işaretledi.',
    });

    MigrationService.broadcastEvent('TASK_UPDATED', { taskId, action: 'REJECTED' });
    return { success: true };
  };

  const completeLateDailyTask = (
    taskId: string,
    studentId: string,
    actualQuestions: number,
    actualMinutes: number,
    completedStartPage?: number,
    completedEndPage?: number,
    studentNotes?: string
  ): { success: boolean; error?: string } => {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Görev bulunamadı.' };

    if (task.studentId !== studentId) {
      return { success: false, error: 'Yetkisiz işlem: Başka bir öğrencinin görevini tamamlayamazsınız.' };
    }

    saveStudyRecord({
      dailyTaskId: taskId,
      actualQuestionCount: actualQuestions,
      actualDurationMinutes: actualMinutes,
      completedStartPage,
      completedEndPage,
      studentNotes,
    });

    const todayStr = DEFAULT_SIMULATION_DATE;
    const isLate = task.taskDate < todayStr;

    setDailyTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              originalTaskDate: t.originalTaskDate || t.taskDate,
              completionDate: todayStr,
              isCompleted: true,
              status: isLate ? 'LATE_COMPLETED' : 'COMPLETED',
              verificationStatus: 'PENDING',
            }
          : t
      )
    );

    const studentUser = users.find((u) => {
      const sp = studentProfiles.find((s) => s.id === studentId);
      return sp && sp.userId === u.id;
    });

    addAuditLog({
      actorId: studentId,
      actorName: studentUser?.fullName || 'Öğrenci',
      actorRole: 'STUDENT',
      action: isLate ? 'TASK_LATE_COMPLETED' : 'TASK_COMPLETED',
      targetType: 'DAILY_TASK',
      targetId: taskId,
      previousValue: { status: task.status, isCompleted: task.isCompleted },
      newValue: {
        status: isLate ? 'LATE_COMPLETED' : 'COMPLETED',
        originalTaskDate: task.originalTaskDate || task.taskDate,
        completionDate: todayStr,
        verificationStatus: 'PENDING',
      },
      note: isLate ? 'Geçmiş görev sonradan tamamlandı.' : 'Görev tamamlandı.',
    });

    return { success: true };
  };

  // Progress calculator for a student on a specific resource (Requirement 4, 7, 8)
  const getResourceProgress = (studentId: string, resourceId: string) => {
    const sr = studentResources.find((item) => item.studentId === studentId && item.resourceId === resourceId);
    if (!sr) {
      return {
        completedCount: 0,
        totalCount: 0,
        remainingCount: 0,
        percentage: 0,
        completedPages: [],
        assignedStartPage: 1,
        assignedEndPage: 1,
        targetDate: undefined,
        dailyQuestionTarget: undefined,
        description: undefined,
      };
    }

    const totalPagesAssigned = Math.max(1, sr.assignedEndPage - sr.assignedStartPage + 1);

    // Filter completed pages for this student resource within the assigned range
    const pagesForResource = studentCompletedPages.filter(
      (p) =>
        p.studentResourceId === sr.id &&
        p.pageNumber >= sr.assignedStartPage &&
        p.pageNumber <= sr.assignedEndPage
    );

    // Unique sorted list of completed page numbers
    const uniquePages = Array.from(new Set(pagesForResource.map((p) => p.pageNumber))).sort((a: number, b: number) => a - b);
    const completedCount = uniquePages.length;
    const remainingCount = Math.max(0, totalPagesAssigned - completedCount);
    // Exact 1 decimal place percentage e.g. 13 / 32 * 100 = 40.625 -> 40.6
    const percentage = Number(((completedCount / totalPagesAssigned) * 100).toFixed(1));

    return {
      completedCount,
      totalCount: totalPagesAssigned,
      remainingCount,
      percentage,
      completedPages: uniquePages,
      assignedStartPage: sr.assignedStartPage,
      assignedEndPage: sr.assignedEndPage,
      targetDate: sr.targetDate,
      dailyQuestionTarget: sr.dailyQuestionTarget,
      description: sr.description,
    };
  };

  const resetToInitialData = () => {
    setUsers(initialUsers);
    setClasses(initialClasses);
    setStudentProfiles(initialStudentProfiles);
    setTeacherProfiles(initialTeacherProfiles);
    setTeacherClassRelations(initialTeacherClassRelations);
    setTeacherStudentRelations(initialTeacherStudentRelations);
    setResources(initialResources);
    setTeacherResources(initialTeacherResources);
    setResourceTopics(initialResourceTopics);
    setStudentResources(initialStudentResources);
    setStudentCompletedPages(initialStudentCompletedPages);
    setWeeklyPlans(initialWeeklyPlans);
    setDailyTasks(initialDailyTasks);
    setStudyRecords(initialStudyRecords);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);

    localStorage.removeItem(`${STORAGE_KEY}_users`);
    localStorage.removeItem(`${STORAGE_KEY}_classes`);
    localStorage.removeItem(`${STORAGE_KEY}_studentProfiles`);
    localStorage.removeItem(`${STORAGE_KEY}_tcr`);
    localStorage.removeItem(`${STORAGE_KEY}_tsr`);
    localStorage.removeItem(`${STORAGE_KEY}_resources`);
    localStorage.removeItem(`${STORAGE_KEY}_teacherResources`);
    localStorage.removeItem(`${STORAGE_KEY}_topics`);
    localStorage.removeItem(`${STORAGE_KEY}_studentResources`);
    localStorage.removeItem(`${STORAGE_KEY}_completedPages`);
    localStorage.removeItem(`${STORAGE_KEY}_weeklyPlans`);
    localStorage.removeItem(`${STORAGE_KEY}_dailyTasks`);
    localStorage.removeItem(`${STORAGE_KEY}_studyRecords`);
    localStorage.removeItem(`${STORAGE_KEY}_notifications`);
    localStorage.removeItem(`${STORAGE_KEY}_auditLogs`);
  };

  // Student overall performance calculator
  const getStudentSummary = (studentId: string) => {
    const tasks = dailyTasks.filter((t) => t.studentId === studentId);
    const records = studyRecords.filter((r) => r.studentId === studentId);

    const plannedQuestions = tasks.reduce((sum, t) => sum + (t.targetQuestionCount || 0), 0);
    const actualQuestions = records.reduce((sum, r) => sum + (r.actualQuestionCount || 0), 0);
    const questionSuccessRate = plannedQuestions > 0 ? Math.round((actualQuestions / plannedQuestions) * 100) : 0;
    const isQuestionOverTarget = plannedQuestions > 0 && actualQuestions > plannedQuestions;
    const extraQuestions = Math.max(0, actualQuestions - plannedQuestions);
    const displayQuestionSuccessRate = Math.min(100, questionSuccessRate);
    const questionDisplayText = isQuestionOverTarget
      ? '%100 Tamamlandı'
      : (plannedQuestions > 0 && actualQuestions === plannedQuestions ? '%100' : `%${questionSuccessRate}`);
    const questionExtraBadgeText = isQuestionOverTarget ? `+${extraQuestions} ekstra soru` : undefined;

    const plannedMinutes = tasks.reduce((sum, t) => sum + (t.targetDurationMinutes || 0), 0);
    const actualMinutes = records.reduce((sum, r) => sum + (r.actualDurationMinutes || 0), 0);
    const timeSuccessRate = plannedMinutes > 0 ? Math.round((actualMinutes / plannedMinutes) * 100) : 0;
    const isTimeOverTarget = plannedMinutes > 0 && actualMinutes > plannedMinutes;
    const extraMinutes = Math.max(0, actualMinutes - plannedMinutes);
    const displayTimeSuccessRate = Math.min(100, timeSuccessRate);
    const timeDisplayText = isTimeOverTarget
      ? '%100 Tamamlandı'
      : (plannedMinutes > 0 && actualMinutes === plannedMinutes ? '%100' : `%${timeSuccessRate}`);
    const timeExtraBadgeText = isTimeOverTarget ? `+${extraMinutes} dk ekstra çalışma` : undefined;

    const totalTasksCount = tasks.length;
    const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
    const taskSuccessRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // Verification breakdowns (FAZ 4)
    const verifiedTasksCount = tasks.filter((t) => t.verificationStatus === 'VERIFIED').length;
    const rejectedTasksCount = tasks.filter((t) => t.verificationStatus === 'REJECTED').length;
    const pendingVerificationTasksCount = tasks.filter(
      (t) => (t.isCompleted || studyRecords.some((r) => r.dailyTaskId === t.id)) && (!t.verificationStatus || t.verificationStatus === 'PENDING')
    ).length;

    // Overdue check: taskDate in past and !isCompleted
    const todayStr = DEFAULT_SIMULATION_DATE;
    const overdueTasksCount = tasks.filter((t) => !t.isCompleted && t.taskDate < todayStr).length;

    return {
      plannedQuestions,
      actualQuestions,
      questionSuccessRate,
      displayQuestionSuccessRate,
      isQuestionOverTarget,
      extraQuestions,
      questionDisplayText,
      questionExtraBadgeText,
      plannedMinutes,
      actualMinutes,
      timeSuccessRate,
      displayTimeSuccessRate,
      isTimeOverTarget,
      extraMinutes,
      timeDisplayText,
      timeExtraBadgeText,
      completedTasksCount,
      totalTasksCount,
      taskSuccessRate,
      overdueTasksCount,
      verifiedTasksCount,
      rejectedTasksCount,
      pendingVerificationTasksCount,
    };
  };

  // FAZ 4: Multi-tenant and Migration helpers
  const runDataMigration = (): MigrationSummary => {
    const res = MigrationService.migrateLocalStorageToProduction();
    return res.summary;
  };

  const exportBackup = (): BackupData => {
    return MigrationService.createSafetyBackup();
  };

  const restoreBackup = (): boolean => {
    return MigrationService.restoreSafetyBackup();
  };

  const checkTenantAccess = (targetOrgId?: string): boolean => {
    const res = MigrationService.verifyMultiTenantIsolation(currentUser.organizationId || 'org-1', targetOrgId);
    return res.isAllowed;
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        switchUser,
        users,
        organizations,
        classes,
        subjects,
        teacherProfiles,
        studentProfiles,
        teacherClassRelations,
        teacherStudentRelations,
        resources,
        teacherResources,
        resourceTopics,
        studentResources,
        studentCompletedPages,
        weeklyPlans,
        dailyTasks,
        studyRecords,
        notifications,
        auditLogs,
        addStudent,
        updateStudentProfile,
        addResource,
        updateResource,
        deleteResource,
        archiveResource,
        assignResourceToTeacher,
        unassignResourceFromTeacher,
        canTeacherAccessResource,
        getTeacherAssignedResources,
        canTeacherAccessTask,
        getTeacherVisibleTasks,
        addResourceTopic,
        updateResourceTopic,
        deleteResourceTopic,
        assignResourceToStudent,
        assignResourceToMultipleStudents,
        updateStudentResource,
        removeStudentResource,
        addDailyTask,
        updateDailyTask,
        deleteDailyTask,
        copyDailyTask,
        addBatchDailyTasks,
        saveStudyRecord,
        updateStudyRecord,
        deleteStudyRecord,
        verifyDailyTask,
        rejectDailyTask,
        completeLateDailyTask,
        addAuditLog,
        addClass,
        addSubject,
        assignTeacherToClass,
        removeTeacherFromClass,
        canTeacherAccessStudent,
        canTeacherModifyStudent,
        canTeacherAssignSubject,
        getTeacherAllowedSubjects,
        validateTaskCreation,
        canModifyTask,
        canModifyStudyRecord,
        canManageClass,
        canManageOrganization,
        getTeacherStudents,
        getTeacherClasses,
        getTaskRealization,
        getResourceProgress,
        getStudentSummary,
        syncStatus,
        runDataMigration,
        exportBackup,
        restoreBackup,
        checkTenantAccess,
        resetToInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
