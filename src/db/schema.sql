-- ====================================================================
-- ÖĞRENCİ TAKİP PLATFORMU — PRODUCTION POSTGRESQL / SUPABASE DDL
-- FAZ 4: MULTI-TENANT, RBAC, DATA ISOLATION & AUDITING SCHEMA
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'INSTITUTE_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM ('ACTIVE', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('QUESTION_TARGET', 'PAGE_RANGE', 'TOPIC_STUDY', 'FREE_TASK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'LATE_COMPLETED', 'INCOMPLETE', 'OVERDUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE relation_type AS ENUM ('INSTITUTIONAL', 'PRIVATE_TUTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. INSTITUTIONS (Multi-Tenant Kurum Tablosu)
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USERS (Kullanıcı Tablosu)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CLASSES (Sınıf / Şube Tablosu)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Örn: "8-A", "12-SAY"
    grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    academic_year VARCHAR(20) NOT NULL, -- Örn: "2026-2027"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_institution_class UNIQUE (institution_id, name, academic_year)
);

-- 6. SUBJECTS (Dersler / Branşlar)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    color_hex VARCHAR(10) NOT NULL DEFAULT '#2563EB',
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TEACHER PROFILES (Öğretmen Detayları)
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    branch_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    is_independent BOOLEAN NOT NULL DEFAULT FALSE,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. STUDENT PROFILES (Öğrenci Detayları)
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    student_number VARCHAR(50),
    parent_phone VARCHAR(50),
    notes TEXT,
    is_independent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TEACHER-CLASS RELATIONS (Öğretmen - Sınıf - Branş Eşleşmesi)
CREATE TABLE IF NOT EXISTS teacher_class_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teacher_class_subject UNIQUE (teacher_id, class_id, subject_id)
);

-- 10. TEACHER-STUDENT RELATIONS (Bireysel / Özel Ders İlişkisi)
CREATE TABLE IF NOT EXISTS teacher_student_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    relation_type relation_type NOT NULL DEFAULT 'INSTITUTIONAL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teacher_student UNIQUE (teacher_id, student_id)
);

-- 11. RESOURCES (Kitap / Kaynak Havuzu)
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    created_by_teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    publisher VARCHAR(255) NOT NULL,
    grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    total_pages INT NOT NULL CHECK (total_pages > 0),
    start_page INT NOT NULL DEFAULT 1,
    end_page INT NOT NULL,
    status resource_status NOT NULL DEFAULT 'ACTIVE',
    description TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_resource_pages CHECK (end_page >= start_page)
);

-- 12. RESOURCE TOPICS (Kaynak Ünite / Konu Aralıkları)
CREATE TABLE IF NOT EXISTS resource_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_page INT NOT NULL,
    end_page INT NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_topic_pages CHECK (end_page >= start_page)
);

-- 13. STUDENT RESOURCES (Öğrenciye Atanan Kaynak Kapsamı)
CREATE TABLE IF NOT EXISTS student_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
    assigned_by_teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
    assigned_start_page INT NOT NULL DEFAULT 1,
    assigned_end_page INT NOT NULL,
    target_date DATE,
    daily_question_target INT,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_resource UNIQUE (student_id, resource_id)
);

-- 14. WEEKLY PLANS (Haftalık Plan Üst Başlığı)
CREATE TABLE IF NOT EXISTS weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    created_by_teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    week_number INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. DAILY TASKS (Günlük Görevler)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_plan_id UUID REFERENCES weekly_plans(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    resource_id UUID REFERENCES resources(id) ON DELETE RESTRICT,
    task_date DATE NOT NULL,
    start_date DATE,
    due_date DATE,
    day_of_week VARCHAR(20) NOT NULL,
    task_type task_type NOT NULL DEFAULT 'QUESTION_TARGET',
    target_question_count INT DEFAULT 0 CHECK (target_question_count >= 0),
    target_duration_minutes INT DEFAULT 0 CHECK (target_duration_minutes >= 0),
    start_page INT,
    end_page INT,
    description TEXT,
    status task_status NOT NULL DEFAULT 'PLANNED',
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_note TEXT,
    original_task_date DATE,
    completion_date DATE,
    revision_count INT NOT NULL DEFAULT 0,
    revision_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_daily_task_dates CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

-- 16. TASK REALIZATIONS / STUDY RECORDS (Çalışma Kayıtları & Gerçekleşmeler)
CREATE TABLE IF NOT EXISTS task_realizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_task_id UUID NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    actual_question_count INT NOT NULL DEFAULT 0 CHECK (actual_question_count >= 0),
    actual_duration_minutes INT NOT NULL DEFAULT 0 CHECK (actual_duration_minutes >= 0),
    solved_start_page INT,
    solved_end_page INT,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. STUDENT COMPLETED PAGES (Sayfa Sayfa İlerleme Takibi)
CREATE TABLE IF NOT EXISTS student_completed_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_resource_id UUID NOT NULL REFERENCES student_resources(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    study_record_id UUID REFERENCES task_realizations(id) ON DELETE SET NULL,
    page_number INT NOT NULL CHECK (page_number > 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_completed_page UNIQUE (student_id, student_resource_id, page_number)
);

-- 18. AUDIT LOGS (Güvenlik ve Değişiklik Günlüğü)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'TASK_CREATED', 'TASK_DELETED', 'RESOURCE_ARCHIVED'
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PRODUCTION QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_classes_institution ON classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_class ON student_profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_relations ON teacher_class_relations(teacher_id, class_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_student_date ON daily_tasks(student_id, task_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_daily_tasks_teacher ON daily_tasks(teacher_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_realizations_task ON task_realizations(daily_task_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_realizations_student_date ON task_realizations(student_id, record_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_resources_institution_subject ON resources(institution_id, subject_id) WHERE is_deleted = FALSE;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR MULTI-TENANT ISOLATION
-- ====================================================================
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_realizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Kural 1: Kurum İzolasyonu (Tenant Isolation)
-- Kullanıcı yalnızca kendi institution_id'sine ait verileri görebilir
CREATE POLICY tenant_isolation_users ON users
    USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

CREATE POLICY tenant_isolation_daily_tasks ON daily_tasks
    USING (student_id IN (
        SELECT sp.id FROM student_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE u.institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    ));

-- Kural 2: Arşivlenmiş Kaynaktan Görev Oluşturulmasını Önleyen Trigger
CREATE OR REPLACE FUNCTION check_resource_archive_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resource_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM resources WHERE id = NEW.resource_id AND (status = 'ARCHIVED' OR is_deleted = TRUE)) THEN
            RAISE EXCEPTION 'HATA: Arşivlenmiş veya silinmiş bir kaynak ile yeni görev oluşturulamaz!';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_archived_resource_task ON daily_tasks;
CREATE TRIGGER trg_prevent_archived_resource_task
    BEFORE INSERT OR UPDATE ON daily_tasks
    FOR EACH ROW
    EXECUTE FUNCTION check_resource_archive_status();
