-- 문제집 배포 시스템 추가
-- 교사가 학생들에게 문제집을 배포할 수 있는 기능

-- 먼저 workbooks 테이블이 존재하는지 확인하고 없으면 생성
-- (기존 problem_sets 테이블을 workbooks로 사용하거나 별도 생성)

-- workbooks 테이블 (problem_sets와 별도로 관리하는 경우)
CREATE TABLE IF NOT EXISTS workbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- workbook_problems 중간 테이블 (workbook과 problem 연결)
CREATE TABLE IF NOT EXISTS workbook_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workbook_id, problem_id),
    UNIQUE(workbook_id, order_index)
);

-- 학생 그룹 테이블 (커스텀 그룹용)
CREATE TABLE student_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 그룹 멤버십 테이블
CREATE TABLE student_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES student_groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, student_id)
);

-- 문제집 배포 테이블 (핵심 테이블)
CREATE TABLE workbook_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 배포 대상 타입: 'individual', 'group', 'class'
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('individual', 'group', 'class')),
    
    -- 대상 ID들 (JSON 배열로 저장)
    target_ids JSONB NOT NULL,
    
    -- 배포 일정
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- 추가 설정
    allow_late_submission BOOLEAN DEFAULT true,
    show_correct_answers BOOLEAN DEFAULT false,
    max_attempts INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 개별 학생에게 배포된 문제집 상태 추적
CREATE TABLE student_workbook_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES workbook_assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 상태: 'assigned', 'in_progress', 'completed', 'overdue'
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
    
    -- 진행 상황
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- 통계
    total_problems INTEGER DEFAULT 0,
    solved_problems INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- seconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- 인덱스 생성
CREATE INDEX idx_workbooks_created_by ON workbooks(created_by);
CREATE INDEX idx_workbooks_status ON workbooks(status);

CREATE INDEX idx_workbook_problems_workbook ON workbook_problems(workbook_id);
CREATE INDEX idx_workbook_problems_problem ON workbook_problems(problem_id);

CREATE INDEX idx_student_groups_created_by ON student_groups(created_by);

CREATE INDEX idx_student_group_members_group ON student_group_members(group_id);
CREATE INDEX idx_student_group_members_student ON student_group_members(student_id);

CREATE INDEX idx_workbook_assignments_workbook ON workbook_assignments(workbook_id);
CREATE INDEX idx_workbook_assignments_assigned_by ON workbook_assignments(assigned_by);
CREATE INDEX idx_workbook_assignments_target_type ON workbook_assignments(target_type);
CREATE INDEX idx_workbook_assignments_scheduled ON workbook_assignments(scheduled_for);
CREATE INDEX idx_workbook_assignments_due ON workbook_assignments(due_date);

CREATE INDEX idx_student_workbook_assignments_assignment ON student_workbook_assignments(assignment_id);
CREATE INDEX idx_student_workbook_assignments_student ON student_workbook_assignments(student_id);
CREATE INDEX idx_student_workbook_assignments_status ON student_workbook_assignments(status);

-- 트리거 추가 (updated_at 자동 업데이트)
CREATE TRIGGER update_workbooks_updated_at BEFORE UPDATE ON workbooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_groups_updated_at BEFORE UPDATE ON student_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workbook_assignments_updated_at BEFORE UPDATE ON workbook_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_workbook_assignments_updated_at BEFORE UPDATE ON student_workbook_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 함수: 문제집 배포 시 개별 학생 배정 레코드 자동 생성
CREATE OR REPLACE FUNCTION create_student_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- individual 타입인 경우 target_ids의 각 학생에게 배정
    IF NEW.target_type = 'individual' THEN
        INSERT INTO student_workbook_assignments (assignment_id, student_id)
        SELECT NEW.id, (jsonb_array_elements_text(NEW.target_ids))::UUID;
    
    -- class 타입인 경우 해당 반의 모든 학생에게 배정
    ELSIF NEW.target_type = 'class' THEN
        INSERT INTO student_workbook_assignments (assignment_id, student_id)
        SELECT NEW.id, uc.student_id
        FROM user_classes uc
        WHERE uc.class_id = ANY(SELECT (jsonb_array_elements_text(NEW.target_ids))::UUID);
    
    -- group 타입인 경우 해당 그룹의 모든 학생에게 배정
    ELSIF NEW.target_type = 'group' THEN
        INSERT INTO student_workbook_assignments (assignment_id, student_id)
        SELECT NEW.id, sgm.student_id
        FROM student_group_members sgm
        WHERE sgm.group_id = ANY(SELECT (jsonb_array_elements_text(NEW.target_ids))::UUID);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 연결 (workbook_assignments 테이블에 레코드가 삽입될 때 실행)
CREATE TRIGGER trigger_create_student_assignments
    AFTER INSERT ON workbook_assignments
    FOR EACH ROW EXECUTE FUNCTION create_student_assignments();

-- 함수: 학생의 문제집 진행률 업데이트
CREATE OR REPLACE FUNCTION update_student_progress(
    p_assignment_id UUID,
    p_student_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_total_problems INTEGER;
    v_solved_problems INTEGER;
    v_correct_answers INTEGER;
    v_total_time INTEGER;
    v_progress_percentage INTEGER;
BEGIN
    -- 문제집의 총 문제 수 계산
    SELECT COUNT(*)
    INTO v_total_problems
    FROM workbook_problems wp
    JOIN workbook_assignments wa ON wa.workbook_id = wp.workbook_id
    WHERE wa.id = p_assignment_id;
    
    -- 학생이 푼 문제 수와 정답 수 계산
    SELECT 
        COUNT(*) as solved,
        COUNT(CASE WHEN sr.is_correct THEN 1 END) as correct,
        COALESCE(SUM(sr.time_spent), 0) as total_time
    INTO v_solved_problems, v_correct_answers, v_total_time
    FROM solution_records sr
    JOIN workbook_problems wp ON wp.problem_id = sr.problem_id
    JOIN workbook_assignments wa ON wa.workbook_id = wp.workbook_id
    WHERE wa.id = p_assignment_id AND sr.user_id = p_student_id;
    
    -- 진행률 계산
    v_progress_percentage := CASE 
        WHEN v_total_problems = 0 THEN 0
        ELSE (v_solved_problems * 100) / v_total_problems
    END;
    
    -- student_workbook_assignments 테이블 업데이트
    UPDATE student_workbook_assignments
    SET 
        total_problems = v_total_problems,
        solved_problems = v_solved_problems,
        correct_answers = v_correct_answers,
        total_time_spent = v_total_time,
        progress_percentage = v_progress_percentage,
        status = CASE 
            WHEN v_progress_percentage >= 100 THEN 'completed'
            WHEN v_solved_problems > 0 THEN 'in_progress'
            ELSE status
        END,
        started_at = CASE 
            WHEN started_at IS NULL AND v_solved_problems > 0 THEN CURRENT_TIMESTAMP
            ELSE started_at
        END,
        completed_at = CASE 
            WHEN v_progress_percentage >= 100 AND completed_at IS NULL THEN CURRENT_TIMESTAMP
            ELSE completed_at
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE assignment_id = p_assignment_id AND student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;