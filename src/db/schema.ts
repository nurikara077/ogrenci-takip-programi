/**
 * TypeScript Schema Definitions & Database Entity Types
 * Production Database Representation matching src/db/schema.sql
 */

export interface DbInstitution {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  institution_id?: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'STUDENT' | 'TEACHER' | 'INSTITUTE_ADMIN';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbClass {
  id: string;
  institution_id: string;
  name: string;
  grade_level: number;
  academic_year: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSubject {
  id: string;
  institution_id?: string;
  name: string;
  code: string;
  color_hex: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTeacherProfile {
  id: string;
  user_id: string;
  branch_subject_id?: string;
  is_independent: boolean;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface DbStudentProfile {
  id: string;
  user_id: string;
  class_id?: string;
  student_number?: string;
  parent_phone?: string;
  notes?: string;
  is_independent: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTeacherClassRelation {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  created_at: string;
}

export interface DbTeacherStudentRelation {
  id: string;
  teacher_id: string;
  student_id: string;
  institution_id?: string;
  relation_type: 'INSTITUTIONAL' | 'PRIVATE_TUTOR';
  is_active: boolean;
  created_at: string;
}

export interface DbResource {
  id: string;
  institution_id?: string;
  subject_id: string;
  created_by_teacher_id: string;
  title: string;
  publisher: string;
  grade_level: number;
  total_pages: number;
  start_page: number;
  end_page: number;
  status: 'ACTIVE' | 'ARCHIVED';
  description?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbResourceTopic {
  id: string;
  resource_id: string;
  title: string;
  start_page: number;
  end_page: number;
  order_index: number;
  created_at: string;
}

export interface DbStudentResource {
  id: string;
  student_id: string;
  resource_id: string;
  assigned_by_teacher_id: string;
  assigned_start_page: number;
  assigned_end_page: number;
  target_date?: string;
  daily_question_target?: number;
  description?: string;
  status: string;
  assigned_at: string;
}

export interface DbDailyTask {
  id: string;
  weekly_plan_id?: string;
  student_id: string;
  teacher_id: string;
  subject_id: string;
  resource_id?: string;
  task_date: string;
  start_date?: string;
  due_date?: string;
  day_of_week: string;
  task_type: 'QUESTION_TARGET' | 'PAGE_RANGE' | 'PAGE_TARGET' | 'TOPIC_STUDY' | 'FREE_TASK' | string;
  target_question_count: number;
  target_duration_minutes: number;
  start_page?: number;
  end_page?: number;
  description?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'LATE_COMPLETED' | 'INCOMPLETE' | 'OVERDUE';
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_by?: string;
  verified_at?: string;
  verification_note?: string;
  original_task_date?: string;
  completion_date?: string;
  revision_count: number;
  revision_history?: unknown[];
  is_completed: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTaskRealization {
  id: string;
  daily_task_id: string;
  student_id: string;
  resource_id?: string;
  record_date: string;
  actual_question_count: number;
  actual_duration_minutes: number;
  solved_start_page?: number;
  solved_end_page?: number;
  notes?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbStudentCompletedPage {
  id: string;
  student_resource_id: string;
  student_id: string;
  study_record_id?: string;
  page_number: number;
  completed_at: string;
}
