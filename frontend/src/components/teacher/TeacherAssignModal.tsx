import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { AdminApi } from '../../services/adminApi';
import type { Class } from '../../services/teacherApi';
import type { User } from '../../services/adminApi';

interface TeacherAssignModalProps {
  class: Class;
  onClose: () => void;
  onUpdate: () => void;
}

const TeacherAssignModal: React.FC<TeacherAssignModalProps> = ({ 
  class: cls, 
  onClose, 
  onUpdate 
}) => {
  const [assignedTeachers, setAssignedTeachers] = useState<User[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [cls.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 모든 사용자 중에서 teacher 역할만 가져오기
      const { users: allUsers } = await AdminApi.getUsers();
      const teachers = allUsers.filter(user => user.role === 'teacher');
      
      // 현재 반에 배정된 선생님과 배정 가능한 선생님 분리
      // 임시로 모든 선생님을 배정 가능한 선생님으로 표시
      // 실제로는 각 반에 어떤 선생님이 배정되어 있는지 API에서 가져와야 함
      setAssignedTeachers(cls.teacher ? [{ 
        id: cls.teacher.id, 
        username: cls.teacher.username, 
        fullName: cls.teacher.full_name,
        role: 'teacher' as const,
        isActive: true,
        createdAt: new Date().toISOString()
      }] : []);
      
      setAvailableTeachers(teachers.filter(teacher => 
        !cls.teacher || teacher.id !== cls.teacher.id
      ));
      
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    try {
      setActionLoading(teacherId);
      await AdminApi.assignTeacherToClass(teacherId, cls.id);
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to assign teacher:', error);
      alert('선생님 배정에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!confirm('정말로 이 선생님을 반에서 제거하시겠습니까?')) {
      return;
    }

    try {
      setActionLoading(teacherId);
      await AdminApi.removeTeacherFromClass(teacherId, cls.id);
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove teacher:', error);
      alert('선생님 제거에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
      <div className="modal relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {cls.name} - 선생님 배정
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 현재 배정된 선생님들 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            현재 배정된 선생님 ({assignedTeachers.length}명)
          </h4>
          
          {assignedTeachers.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <div className="text-gray-500">이 반에는 배정된 선생님이 없습니다.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {teacher.fullName || teacher.username}
                      </h5>
                      <p className="text-sm text-gray-600">
                        @{teacher.username}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveTeacher(teacher.id)}
                      disabled={actionLoading === teacher.id}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                      title="배정 해제"
                    >
                      {actionLoading === teacher.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                      ) : (
                        <UserMinusIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 배정 가능한 선생님들 */}
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            배정 가능한 선생님 ({availableTeachers.length}명)
          </h4>
          
          {availableTeachers.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <div className="text-gray-500">배정 가능한 선생님이 없습니다.</div>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {teacher.fullName || teacher.username}
                    </div>
                    <div className="text-sm text-gray-600">
                      @{teacher.username}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAssignTeacher(teacher.id)}
                    disabled={actionLoading === teacher.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading === teacher.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    ) : (
                      <>
                        <UserPlusIcon className="h-4 w-4 mr-2" />
                        배정
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignModal;