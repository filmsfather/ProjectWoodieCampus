-- Migration: Add RLS policies for new class system tables
-- Task 11.1: RLS 정책 업데이트

-- Enable Row Level Security for new tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_assignments ENABLE ROW LEVEL SECURITY;

-- Classes table policies
-- Teachers can view their own classes, students can view their assigned class, admins can view all
CREATE POLICY "Users can view relevant classes" ON classes
    FOR SELECT USING (
        -- Admins can see all classes
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
        -- Teachers can see classes they are assigned to
        (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'teacher') AND
         (teacher_id::text = auth.uid()::text OR 
          EXISTS (SELECT 1 FROM teacher_classes WHERE teacher_id::text = auth.uid()::text AND class_id = classes.id))) OR
        -- Students can see their assigned class
        (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'student' AND class_id = classes.id))
    );

-- Teachers and admins can create/update/delete classes
CREATE POLICY "Teachers and admins can manage classes" ON classes
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('teacher', 'admin')
    ));

-- Teacher_classes table policies
-- Teachers can view their own assignments, admins can view all
CREATE POLICY "Users can view relevant teacher-class assignments" ON teacher_classes
    FOR SELECT USING (
        -- Admins can see all assignments
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
        -- Teachers can see their own assignments
        (teacher_id::text = auth.uid()::text AND EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'teacher'))
    );

-- Teachers and admins can manage teacher-class assignments
CREATE POLICY "Teachers and admins can manage teacher-class assignments" ON teacher_classes
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('teacher', 'admin')
    ));

-- Subjects table policies
-- All authenticated users can view subjects
CREATE POLICY "Authenticated users can view subjects" ON subjects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can create/update/delete subjects
CREATE POLICY "Admins can manage subjects" ON subjects
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    ));

-- Subject_workbooks table policies
-- All authenticated users can view subject-workbook relationships
CREATE POLICY "Authenticated users can view subject-workbooks" ON subject_workbooks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Teachers and admins can manage subject-workbook relationships
CREATE POLICY "Teachers and admins can manage subject-workbooks" ON subject_workbooks
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('teacher', 'admin')
    ));

-- Workbook_assignments table policies
-- Users can view assignments relevant to them
CREATE POLICY "Users can view relevant workbook assignments" ON workbook_assignments
    FOR SELECT USING (
        -- Admins can see all assignments
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
        -- Teachers can see assignments they created or for classes they teach
        (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'teacher') AND
         (assigned_by::text = auth.uid()::text OR
          (assigned_to_type = 'class' AND 
           EXISTS (SELECT 1 FROM teacher_classes WHERE teacher_id::text = auth.uid()::text AND class_id::text = assigned_to_id::text)))) OR
        -- Students can see assignments assigned to them directly
        (assigned_to_type = 'student' AND assigned_to_id::text = auth.uid()::text AND
         EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'student')) OR
        -- Students can see assignments assigned to their class
        (assigned_to_type = 'class' AND
         EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'student' AND class_id::text = assigned_to_id::text))
    );

-- Teachers can create assignments, teachers and admins can update/delete
CREATE POLICY "Teachers can create workbook assignments" ON workbook_assignments
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('teacher', 'admin')
    ));

CREATE POLICY "Teachers and admins can update workbook assignments" ON workbook_assignments
    FOR UPDATE USING (
        -- Admins can update all assignments
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
        -- Teachers can update assignments they created
        (assigned_by::text = auth.uid()::text AND EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'teacher'))
    );

CREATE POLICY "Teachers and admins can delete workbook assignments" ON workbook_assignments
    FOR DELETE USING (
        -- Admins can delete all assignments
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
        -- Teachers can delete assignments they created
        (assigned_by::text = auth.uid()::text AND EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'teacher'))
    );

-- Update existing users table policy to handle nullable email
-- Drop and recreate the user profile policies to handle the new class_id field
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Updated users policies
CREATE POLICY "Users can view relevant profiles" ON users
    FOR SELECT USING (
        -- Users can see their own profile
        auth.uid()::text = id::text OR
        -- Admins can see all profiles
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
        -- Teachers can see profiles of students in their classes
        (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'teacher') AND
         role = 'student' AND
         EXISTS (SELECT 1 FROM teacher_classes tc JOIN classes c ON tc.class_id = c.id 
                WHERE tc.teacher_id::text = auth.uid()::text AND c.id = users.class_id))
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid()::text = id::text OR 
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
    );

-- Allow admins to insert new users
CREATE POLICY "Admins can create users" ON users
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    ));

-- Comments for documentation
COMMENT ON POLICY "Users can view relevant classes" ON classes IS '사용자별 반 정보 조회 권한 정책';
COMMENT ON POLICY "Teachers and admins can manage classes" ON classes IS '교사/관리자 반 관리 권한 정책';
COMMENT ON POLICY "Users can view relevant workbook assignments" ON workbook_assignments IS '문제집 배정 정보 조회 권한 정책';
COMMENT ON POLICY "Users can view relevant profiles" ON users IS '사용자 프로필 조회 권한 정책 (반 시스템 반영)';