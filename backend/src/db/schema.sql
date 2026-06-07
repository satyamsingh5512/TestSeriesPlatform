-- =============================================================================
-- EdTech Examination Platform — Master Schema (Supabase/PostgreSQL)
-- =============================================================================

-- Cleanup existing (if re-running)
DROP TABLE IF EXISTS analysis_reports CASCADE;
DROP TABLE IF EXISTS analysis CASCADE; -- Old version
DROP TABLE IF EXISTS violations CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS question_stats CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS event_logs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS consent_records CASCADE;
DROP TABLE IF EXISTS tenant_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Cleanup existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS exam_type CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS difficulty_tier CASCADE; -- Cleanup old type if exists
DROP TYPE IF EXISTS attempt_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS violation_type CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS AND TYPES ────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'student');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE exam_type AS ENUM ('fixed', 'adaptive');
CREATE TYPE question_type AS ENUM ('MCQ', 'MULTI_CORRECT', 'NAT', 'SUBJECTIVE');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'flagged', 'cancelled');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- ─── CORE TABLES ────────────────────────────────────────────────────────────

-- 1. Tenants (Multi-tenancy Root)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    theme_settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'student',
    dob DATE,
    consent_verified BOOLEAN DEFAULT FALSE,
    parent_consent_at TIMESTAMPTZ,
    current_session_token TEXT,
    last_login_at TIMESTAMPTZ,
    reset_otp VARCHAR(6),
    reset_otp_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- 3. Exams
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 180,
    total_marks DECIMAL(10,2) DEFAULT 0.00,
    exam_type exam_type DEFAULT 'fixed',
    status exam_status DEFAULT 'draft',
    negative_marking_enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}', -- Store negative marking rules here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sections
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER, -- Optional: Per-section timer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    qtype question_type NOT NULL,
    payload JSONB NOT NULL, -- { text, options: {A,B,C,D}, images: [], latex: "" }
    correct_key TEXT, -- A, B, or "10.5" or "A,C"
    nat_min DECIMAL(18,4),
    nat_max DECIMAL(18,4),
    marks DECIMAL(5,2) DEFAULT 4.00,
    negative_marks DECIMAL(5,2) DEFAULT -1.00,
    explanation TEXT,
    topic VARCHAR(100),
    difficulty_tier VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    difficulty_score DECIMAL(5,2) DEFAULT 0.5, -- For IRT calibration
    irt_params JSONB DEFAULT '{}', -- { alpha, beta, gamma }
    sequence INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Attempts
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status attempt_status DEFAULT 'in_progress',
    total_score DECIMAL(10,2) DEFAULT 0.00,
    percentile DECIMAL(5,2),
    irt_theta DECIMAL(10,5),
    time_taken_seconds INTEGER DEFAULT 0,
    analysis_preview JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Responses
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT,
    first_answer TEXT,
    answer_changes INTEGER DEFAULT 0,
    is_correct BOOLEAN,
    marks_awarded DECIMAL(5,2) DEFAULT 0.00,
    time_spent_seconds INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 8. Violations
CREATE TABLE violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- TAB_SWITCH, MULTIPLE_FACES, etc.
    details JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'flagged', -- flagged, cleared, suspicious
    purge_after TIMESTAMPTZ
);

-- 9. Analysis Reports
CREATE TABLE analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
    topic_report JSONB NOT NULL,
    weakness_map JSONB NOT NULL,
    percentile DECIMAL(5,2),
    irt_theta DECIMAL(10,5),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    source_version VARCHAR(20) DEFAULT 'v1'
);

-- 10. Question Stats (Calibration)
CREATE TABLE question_stats (
    question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    times_attempted INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    avg_time_seconds DECIMAL(10,2) DEFAULT 0.00,
    last_calibrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Event Logs
CREATE TABLE event_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES attempts(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    status job_status DEFAULT 'pending',
    payload JSONB DEFAULT '{}',
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Consent Records
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    parent_name VARCHAR(255),
    consent_source VARCHAR(50), -- web, app, email
    consent_status VARCHAR(20) DEFAULT 'pending',
    consent_verified_at TIMESTAMPTZ,
    document_ref TEXT, -- Link to S3 or external vault
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Tenant Settings
CREATE TABLE tenant_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    branding JSONB DEFAULT '{}',
    proctoring_thresholds JSONB DEFAULT '{"max_violations": 5}',
    retention_days INTEGER DEFAULT 365,
    custom_flags JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────

-- Tenant Scoping
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_exams_tenant ON exams(tenant_id);
CREATE INDEX idx_questions_tenant ON questions(tenant_id);
CREATE INDEX idx_attempts_tenant ON attempts(tenant_id);

-- Frequently Filtered / Foreign Keys
CREATE INDEX idx_sections_exam ON sections(exam_id, order_index);
CREATE INDEX idx_questions_section ON questions(section_id, sequence);
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_exam ON attempts(exam_id);
CREATE INDEX idx_responses_attempt ON responses(attempt_id);
CREATE INDEX idx_violations_attempt ON violations(attempt_id);
CREATE INDEX idx_users_password_reset ON users(tenant_id, email, reset_otp_expires_at) WHERE reset_otp IS NOT NULL;
CREATE INDEX idx_violations_purge_after ON violations(purge_after) WHERE purge_after IS NOT NULL;

-- Analytics & Search
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_tier);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Composite for performance
CREATE INDEX idx_user_exam_attempt ON attempts(user_id, exam_id);
