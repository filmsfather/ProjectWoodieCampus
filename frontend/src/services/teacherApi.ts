import { api } from './api';

export interface Class {
  id: string;
  name: string;
  teacher_id: string;
  grade_level?: number;
  subject?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  teacher?: {
    id: string;
    username: string;
    full_name: string;
  };
  student_count?: number;
}

export interface ClassStats {
  total_students: number;
  active_assignments: number;
  average_progress: number;
  completed_assignments: number;
}

export interface Student {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  class_id?: string;
  created_at: string;
}

export interface CreateClassData {
  name: string;
  grade_level?: number;
  subject?: string;
  description?: string;
}

export interface UpdateClassData {
  name?: string;
  grade_level?: number;
  subject?: string;
  description?: string;
}

export const teacherApi = {
  // 현재 교사의 담당 반 목록 조회
  getMyClasses: async (): Promise<Class[]> => {
    const response = await api.get('/teachers/classes');
    return response.data.data;
  },

  // 특정 교사의 담당 반 목록 조회 (관리자 전용)
  getTeacherClassesById: async (teacherId: string): Promise<Class[]> => {
    const response = await api.get(`/teachers/${teacherId}/classes`);
    return response.data.data;
  },

  // 새 반 생성
  createClass: async (classData: CreateClassData): Promise<Class> => {
    const response = await api.post('/teachers/classes', classData);
    return response.data.data;
  },

  // 반 정보 수정
  updateClass: async (classId: string, classData: UpdateClassData): Promise<Class> => {
    const response = await api.put(`/teachers/classes/${classId}`, classData);
    return response.data.data;
  },

  // 반 삭제 (소프트 삭제)
  deleteClass: async (classId: string): Promise<void> => {
    await api.delete(`/teachers/classes/${classId}`);
  },

  // 교사를 반에 배정 (관리자 전용)
  assignTeacherToClass: async (teacherId: string, classId: string): Promise<any> => {
    const response = await api.post(`/teachers/${teacherId}/classes/${classId}`);
    return response.data.data;
  },

  // 교사를 반에서 제거 (관리자 전용)
  removeTeacherFromClass: async (teacherId: string, classId: string): Promise<void> => {
    await api.delete(`/teachers/${teacherId}/classes/${classId}`);
  },
};

export const classApi = {
  // 모든 반 목록 조회 (관리자 전용)
  getAllClasses: async (): Promise<Class[]> => {
    const response = await api.get('/classes');
    return response.data.data;
  },

  // 특정 반 정보 조회
  getClassById: async (classId: string): Promise<Class> => {
    const response = await api.get(`/classes/${classId}`);
    return response.data.data;
  },

  // 반의 학생 목록 조회
  getClassStudents: async (classId: string): Promise<Student[]> => {
    const response = await api.get(`/classes/${classId}/students`);
    return response.data.data;
  },

  // 학생을 반에 추가
  addStudentToClass: async (classId: string, studentId: string): Promise<any> => {
    const response = await api.post(`/classes/${classId}/students/${studentId}`);
    return response.data.data;
  },

  // 학생을 반에서 제거 (관리자 전용)
  removeStudentFromClass: async (classId: string, studentId: string): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${studentId}`);
  },

  // 학생을 다른 반으로 이동 (관리자 전용)
  moveStudentToClass: async (classId: string, studentId: string): Promise<any> => {
    const response = await api.put(`/classes/${classId}/students/${studentId}`);
    return response.data.data;
  },

  // 반 통계 조회
  getClassStats: async (classId: string): Promise<ClassStats> => {
    const response = await api.get(`/classes/${classId}/stats`);
    return response.data.data;
  },
};