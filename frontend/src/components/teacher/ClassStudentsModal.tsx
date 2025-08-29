import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { classApi } from '../../services/teacherApi';
import type { Class, Student } from '../../services/teacherApi';
import { AdminApi } from '../../services/adminApi';
import { useAuth } from '../../hooks/useAuth';

interface ClassStudentsModalProps {
  class: Class;
  onClose: () => void;
  onStudentUpdate: () => void;
}

const ClassStudentsModal: React.FC<ClassStudentsModalProps> = ({ 
  class: cls, 
  onClose, 
  onStudentUpdate 
}) => {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [cls.id, user, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 ClassStudentsModal - 데이터 로드 시작');
      console.log('🔍 ClassStudentsModal - authLoading:', authLoading);
      console.log('🔍 ClassStudentsModal - 현재 사용자:', user);
      console.log('🔍 ClassStudentsModal - 사용자 역할:', user?.role);
      console.log('🔍 ClassStudentsModal - localStorage user:', localStorage.getItem('user'));
      console.log('🔍 ClassStudentsModal - localStorage token:', localStorage.getItem('accessToken'));
      
      // 현재 반의 학생들 로드
      const classStudents = await classApi.getClassStudents(cls.id);
      setStudents(classStudents);

      // 관리자인 경우 모든 학생 목록도 로드 (반 배정용)
      if (user?.role === 'admin') {
        console.log('🔍 ClassStudentsModal - 관리자 권한으로 모든 사용자 조회 시작');
        console.log('🔍 ClassStudentsModal - 현재 반 ID:', cls.id);
        
        const response = await AdminApi.getUsers();
        console.log('🔍 ClassStudentsModal - AdminApi.getUsers() 전체 응답:', response);
        
        const allUsers = response.users;
        console.log('🔍 ClassStudentsModal - 조회된 모든 사용자:', allUsers);
        console.log('🔍 ClassStudentsModal - 첫 번째 사용자 예시:', allUsers[0]);
        
        // 각 사용자의 role 확인
        allUsers.forEach((user, index) => {
          console.log(`🔍 ClassStudentsModal - 사용자 ${index}: role="${user.role}", class_id="${user.class_id}"`);
        });
        
        const studentUsers = allUsers.filter(u => {
          console.log(`🔍 ClassStudentsModal - 사용자 "${u.username}" role 체크: "${u.role}" === "student" ? ${u.role === 'student'}`);
          return u.role === 'student';
        }).map(user => ({
          id: user.id,
          username: user.username,
          full_name: user.fullName || user.username,
          email: user.email || undefined,
          class_id: user.class_id || undefined,
          created_at: user.createdAt
        }));
        console.log('🔍 ClassStudentsModal - 필터된 학생 사용자:', studentUsers);
        
        // 현재 반에 속하지 않은 학생들만 필터링
        const available = studentUsers.filter(student => {
          const isAvailable = !student.class_id || student.class_id !== cls.id;
          console.log(`🔍 ClassStudentsModal - 학생 "${student.username}" 추가 가능 여부: class_id="${student.class_id}" !== "${cls.id}" ? ${isAvailable}`);
          return isAvailable;
        });
        console.log('🔍 ClassStudentsModal - 추가 가능한 학생들:', available);
        setAvailableStudents(available);
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    try {
      setActionLoading(studentId);
      await classApi.addStudentToClass(cls.id, studentId);
      await loadData();
      onStudentUpdate();
    } catch (error) {
      console.error('Failed to add student:', error);
      alert('학생 추가에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('정말로 이 학생을 반에서 제거하시겠습니까?')) {
      return;
    }

    try {
      setActionLoading(studentId);
      await classApi.removeStudentFromClass(cls.id, studentId);
      await loadData();
      onStudentUpdate();
    } catch (error) {
      console.error('Failed to remove student:', error);
      alert('학생 제거에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
        <div className="modal relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {cls.name} - 학생 관리
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              총 {students.length}명의 학생
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                학생 추가
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">이 반에는 아직 학생이 없습니다.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-gray-50 p-4 rounded-lg border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {student.full_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        @{student.username}
                      </p>
                      {student.email && (
                        <p className="text-sm text-gray-500">
                          {student.email}
                        </p>
                      )}
                    </div>
                    
                    {user?.role === 'admin' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          disabled={actionLoading === student.id}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="반에서 제거"
                        >
                          {actionLoading === student.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                          ) : (
                            <UserMinusIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 학생 추가 모달 */}
      {showAddModal && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full flex items-center justify-center p-4" style={{ zIndex: 10001 }}>
          <div className="modal relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                학생 추가
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {availableStudents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  추가할 수 있는 학생이 없습니다.
                </div>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.full_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        @{student.username}
                      </div>
                      {student.class_id && (
                        <div className="text-xs text-orange-600">
                          다른 반에 소속됨
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        handleAddStudent(student.id);
                        setShowAddModal(false);
                      }}
                      disabled={actionLoading === student.id}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {actionLoading === student.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      ) : (
                        <>
                          <UserPlusIcon className="h-4 w-4 mr-2" />
                          추가
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClassStudentsModal;