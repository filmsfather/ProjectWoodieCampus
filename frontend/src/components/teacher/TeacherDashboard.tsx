import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UsersIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { teacherApi, classApi } from '../../services/teacherApi';
import type { Class, Student, ClassStats } from '../../services/teacherApi';
import { useAuth } from '../../hooks/useAuth';
import CreateClassModal from './CreateClassModal';
import EditClassModal from './EditClassModal';
import ClassStudentsModal from './ClassStudentsModal';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStats, setClassStats] = useState<Record<string, ClassStats>>({});

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await teacherApi.getMyClasses();
      setClasses(data);
      
      // 각 반의 통계 정보 로드
      const stats: Record<string, ClassStats> = {};
      for (const cls of data) {
        try {
          const classStats = await classApi.getClassStats(cls.id);
          stats[cls.id] = classStats;
        } catch (error) {
          console.error(`Failed to load stats for class ${cls.id}:`, error);
        }
      }
      setClassStats(stats);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (classData: any) => {
    try {
      await teacherApi.createClass(classData);
      await loadClasses();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create class:', error);
      throw error;
    }
  };

  const handleEditClass = async (classId: string, classData: any) => {
    try {
      await teacherApi.updateClass(classId, classData);
      await loadClasses();
      setShowEditModal(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Failed to update class:', error);
      throw error;
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('정말로 이 반을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await teacherApi.deleteClass(classId);
      await loadClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('반 삭제에 실패했습니다.');
    }
  };

  const openEditModal = (cls: Class) => {
    setSelectedClass(cls);
    setShowEditModal(true);
  };

  const openStudentsModal = (cls: Class) => {
    setSelectedClass(cls);
    setShowStudentsModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">교사 대시보드</h1>
            <p className="mt-2 text-gray-600">
              안녕하세요, {user?.full_name || user?.username}님! 담당하시는 반을 관리하세요.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 반 만들기
          </button>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    담당 반 수
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classes.length}개
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    총 학생 수
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Object.values(classStats).reduce((sum, stats) => sum + stats.total_students, 0)}명
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    활성 과제
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Object.values(classStats).reduce((sum, stats) => sum + stats.active_assignments, 0)}개
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    평균 진도율
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(
                      Object.values(classStats).reduce((sum, stats) => sum + stats.average_progress, 0) / 
                      Math.max(Object.values(classStats).length, 1)
                    )}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 반 목록 */}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">담당 반이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            새 반을 만들어서 학생들을 관리해보세요.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              새 반 만들기
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const stats = classStats[cls.id];
            return (
              <div
                key={cls.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {cls.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="반 정보 수정"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="반 삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    {cls.grade_level && (
                      <p className="text-sm text-gray-600">
                        학년: {cls.grade_level}학년
                      </p>
                    )}
                    {cls.subject && (
                      <p className="text-sm text-gray-600">
                        과목: {cls.subject}
                      </p>
                    )}
                    {cls.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {cls.description}
                      </p>
                    )}
                  </div>

                  {stats && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.total_students}
                        </div>
                        <div className="text-xs text-gray-500">학생 수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {stats.average_progress}%
                        </div>
                        <div className="text-xs text-gray-500">평균 진도</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={() => openStudentsModal(cls)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <UsersIcon className="h-4 w-4 mr-2" />
                      학생 관리
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 모달들 */}
      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateClass}
        />
      )}

      {showEditModal && selectedClass && (
        <EditClassModal
          class={selectedClass}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClass(null);
          }}
          onSubmit={(data) => handleEditClass(selectedClass.id, data)}
        />
      )}

      {showStudentsModal && selectedClass && (
        <ClassStudentsModal
          class={selectedClass}
          onClose={() => {
            setShowStudentsModal(false);
            setSelectedClass(null);
          }}
          onStudentUpdate={loadClasses}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;