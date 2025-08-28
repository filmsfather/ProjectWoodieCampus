-- Migration: Add class system and update user table
-- Task 11.1: 사용자 인증 정책 개선 및 데이터 모델 확장

-- 1. Create classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    grade_level VARCHAR(20),
    subject VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 2. Create teacher_classes junction table for many-to-many relationship
CREATE TABLE teacher_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, class_id)
);

-- 3. Add class_id to users table and make email nullable
ALTER TABLE users ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 4. Add class_assignments JSON field for student's class assignment history
ALTER TABLE users ADD COLUMN class_assignments JSONB DEFAULT '[]'::jsonb;

-- 5. Create indexes for performance
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_name ON classes(name);
CREATE INDEX idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX idx_teacher_classes_class ON teacher_classes(class_id);
CREATE INDEX idx_users_class ON users(class_id);
CREATE INDEX idx_users_class_assignments ON users USING gin(class_assignments);

-- 6. Add trigger for updating updated_at timestamp on classes table
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Create subjects table for subject management
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    grade_level VARCHAR(20),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 8. Create subject_workbooks junction table
CREATE TABLE subject_workbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    workbook_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, workbook_id)
);

-- 9. Create workbook_assignments table for assignment system
CREATE TABLE workbook_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workbook_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_to_type VARCHAR(20) NOT NULL CHECK (assigned_to_type IN ('student', 'class')),
    assigned_to_id UUID NOT NULL, -- either user_id or class_id
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 10. Add indexes for the new tables
CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_subjects_created_by ON subjects(created_by);
CREATE INDEX idx_subject_workbooks_subject ON subject_workbooks(subject_id);
CREATE INDEX idx_subject_workbooks_workbook ON subject_workbooks(workbook_id);
CREATE INDEX idx_workbook_assignments_workbook ON workbook_assignments(workbook_id);
CREATE INDEX idx_workbook_assignments_assigned_by ON workbook_assignments(assigned_by);
CREATE INDEX idx_workbook_assignments_assigned_to ON workbook_assignments(assigned_to_type, assigned_to_id);
CREATE INDEX idx_workbook_assignments_due_date ON workbook_assignments(due_date);

-- 11. Add triggers for updating updated_at timestamp
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workbook_assignments_updated_at BEFORE UPDATE ON workbook_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Insert default subjects (Korean education system subjects)
INSERT INTO subjects (name, description, grade_level) VALUES
('국어', '국어 과목', '전체'),
('수학', '수학 과목', '전체'),
('영어', '영어 과목', '전체'),
('과학', '과학 과목', '전체'),
('사회', '사회 과목', '전체'),
('역사', '역사 과목', '전체'),
('지리', '지리 과목', '전체'),
('물리', '물리학', '고등학교'),
('화학', '화학', '고등학교'),
('생물', '생물학', '고등학교'),
('지구과학', '지구과학', '고등학교');

-- Comments for documentation
COMMENT ON TABLE classes IS '반/클래스 정보를 저장하는 테이블';
COMMENT ON TABLE teacher_classes IS '교사-반 다대다 관계를 저장하는 중간 테이블';
COMMENT ON TABLE subjects IS '교과목 정보를 저장하는 테이블';
COMMENT ON TABLE subject_workbooks IS '교과목-문제집 연결 테이블';
COMMENT ON TABLE workbook_assignments IS '문제집 배정 정보를 저장하는 테이블';
COMMENT ON COLUMN users.class_id IS '학생이 속한 반 ID (학생만 해당)';
COMMENT ON COLUMN users.class_assignments IS '학생의 반 배정 이력 (JSON 배열)';
COMMENT ON COLUMN users.email IS '이메일 주소 (선택사항으로 변경됨)';