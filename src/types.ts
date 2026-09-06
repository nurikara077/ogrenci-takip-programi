export type Role = 'TEACHER' | 'STUDENT' | 'INSTITUTE_ADMIN' | 'COORDINATOR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  organizationId?: string; // Optional if independent tutor/student
  createdAt: string;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Class {
  id: string;
  organizationId: string;
  name: string; // e.g. "8-A", "12-SAY"
  gradeLevel: number; // 8, 12, etc.
  academicYear: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  branchSubjectId: string; // Primary subject
  isIndependent: boolean; // Özel ders veren öğretmen
  bio?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  classId?: string; // Kurum sınıfı (e.g. 8-A) veya undefined (bireysel)
  studentNumber?: string;
  parentPhone?: string;
  notes?: string;
}

export type RelationType = 'PRIVATE_TUTOR' | 'INSTITUTIONAL';

export interface TeacherStudentRelation {
  id: string;
  teacherId: string;
  studentId: string;
  organizationId?: string;
  relationType: RelationType;
  isActive: boolean;
}

export interface TeacherClassRelation {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

export interface Subject {
  id: string;
  name: string; // e.g. "Matematik", "Türkçe", "Fen Bilimleri"
  code: string;
  colorHex: string; // Used for UI tags & borders
  isCustom?: boolean;
}

export interface Resource {
  id: string;
  createdByTeacherId?: string;
  createdBy?: string;
  organizationId?: string;
  institutionId?: string;
  subjectId: string;
  title: string; // e.g. "Fenomen Fasikül 3"
  publisher: string; // e.g. "Fenomen Yayınları"
  gradeLevel: number;
  totalPages: number;
  startPage: number;
  endPage: number;
  description?: string;
  isArchived?: boolean;
  status?: 'ACTIVE' | 'ARCHIVED';
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherResource {
  id: string;
  institutionId: string;
  organizationId?: string;
  teacherId: string;
  resourceId: string;
  assignedBy: string;
  assignedAt: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceTopic {
  id: string;
  resourceId: string;
  title: string; // e.g. "Köklü İfadeler"
  startPage: number;
  endPage: number;
  orderIndex: number;
}

export interface StudentResource {
  id: string;
  studentId: string;
  resourceId: string;
  assignedByTeacherId: string;
  assignedStartPage: number;
  assignedEndPage: number;
  targetDate?: string;
  dailyQuestionTarget?: number;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  assignedAt: string;
}

// Separate table for unique page completions to avoid duplicate counting
export interface StudentCompletedPage {
  id: string;
  studentResourceId: string;
  studentId: string;
  pageNumber: number;
  completedAt: string;
  studyRecordId?: string;
}

export interface WeeklyPlan {
  id: string;
  studentId: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  title?: string;
  createdAt: string;
}

export type TaskType = 
  | 'QUESTION_TARGET'
  | 'PAGE_TARGET'
  | 'DURATION_TARGET'
  | 'PERCENT_TARGET'
  | 'TOPIC_TARGET'
  | 'FREE_TASK';

export type TaskStatus = 
  | 'PLANNED'         // Planlandı
  | 'IN_PROGRESS'     // Devam Ediyor
  | 'COMPLETED'       // Tamamlandı
  | 'LATE_COMPLETED'  // Geç Tamamlandı
  | 'INCOMPLETE'      // Eksik
  | 'OVERDUE';        // Gecikmiş

export type VerificationStatus = 
  | 'PENDING'         // Öğrenci tamamladı / Öğretmen kontrolü bekliyor
  | 'VERIFIED'        // Öğretmen tarafından doğrulandı
  | 'REJECTED';       // Öğretmen kontrolü: Yapılmadı

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  previousValue?: any;
  newValue?: any;
  note?: string;
}

export interface TaskRevision {
  revisionNumber: number;
  editedBy: string;
  editedByName?: string;
  editedAt: string;
  previousValue: Partial<DailyTask>;
  newValue: Partial<DailyTask>;
  note?: string;
}

export interface DailyTask {
  id: string;
  weeklyPlanId: string;
  studentId: string;
  teacherId: string;
  subjectId: string;
  resourceId?: string;
  resourceTopicId?: string;
  taskDate: string; // YYYY-MM-DD
  dayOfWeek: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';
  taskType: TaskType;
  targetQuestionCount?: number;
  targetDurationMinutes?: number;
  startPage?: number;
  endPage?: number;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  verificationStatus?: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNote?: string;
  originalTaskDate?: string;
  completionDate?: string;
  copiedFromTaskId?: string;
  revisionCount?: number;
  revisionHistory?: TaskRevision[];
  isCompleted: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface StudyRecord {
  id: string;
  dailyTaskId: string;
  studentId: string;
  subjectId: string;
  resourceId?: string;
  recordDate: string; // YYYY-MM-DD
  actualQuestionCount: number;
  actualDurationMinutes: number;
  completedStartPage?: number;
  completedEndPage?: number;
  studentNotes?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'NEW_TASK' | 'TASK_COMPLETED' | 'TASK_OVERDUE' | 'STUDY_RECORD_ENTERED' | 'ANNOUNCEMENT';
  isRead: boolean;
  createdAt: string;
  relatedTaskId?: string;
  relatedStudentId?: string;
}
