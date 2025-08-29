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
import { AdminApi } from '../../services/adminApi';
import type { Class, Student, ClassStats } from '../../services/teacherApi';
import { useAuth } from '../../hooks/useAuth';
import CreateClassModal from './CreateClassModal';
import EditClassModal from './EditClassModal';
import ClassStudentsModal from './ClassStudentsModal';

const TeacherDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStats, setClassStats] = useState<Record<string, ClassStats>>({});

  useEffect(() => {
    if (user && !authLoading) {
      loadClasses();
    }
  }, [user, authLoading]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      // 관리자는 모든 반을 조회, 교사는 담당 반만 조회
      const data = user?.role === 'admin' 
        ? await AdminApi.getAllClasses()
        : await teacherApi.getMyClasses();
      console.log('📊 Loaded classes:', data);
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
      console.log('📈 Loaded stats:', stats);
      setClassStats(stats);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (classData: any) => {
    try {
      // 관리자만 반 생성 가능
      if (user?.role === 'admin') {
        await AdminApi.createClass(classData);
      } else {
        throw new Error('관리자만 반을 생성할 수 있습니다.');
      }
      await loadClasses();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create class:', error);
      throw error;
    }
  };

  const handleEditClass = async (classId: string, classData: any) => {
    try {
      // 관리자만 반 수정 가능
      if (user?.role === 'admin') {
        await AdminApi.updateClass(classId, classData);
      } else {
        throw new Error('관리자만 반을 수정할 수 있습니다.');
      }
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
      // 관리자만 반 삭제 가능
      if (user?.role === 'admin') {
        await AdminApi.deleteClass(classId);
      } else {
        alert('관리자만 반을 삭제할 수 있습니다.');
        return;
      }
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 스켈레톤 */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-200 rounded-lg animate-pulse">
                      <div className="h-6 w-6 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* 통계 카드 스켈레톤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  </div>
                  <div className="p-3 bg-gray-200 rounded-lg animate-pulse">
                    <div className="h-6 w-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 로딩 메시지 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">반 목록을 불러오는 중입니다</h3>
              <p className="text-gray-600">잠시만 기다려 주세요...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">반 관리 대시보드</h1>
                </div>
                <p className="text-gray-600 reading-leading">
                  안녕하세요, <span className="font-medium text-gray-900">{user?.full_name || user?.username}</span>님! 
                  {user?.role === 'admin' ? ' 모든 반을 관리하고' : ' 담당하시는 반을'} 효율적으로 운영하세요.
                </p>
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 role-primary text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  새 반 만들기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 통계 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="p-6 flex items-center justify-between flex-1">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {user?.role === 'admin' ? '전체 반 수' : '담당 반 수'}
                </div>
                <div className="text-2xl font-bold text-gray-900 numeric-mono">
                  {classes.length}개
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="p-6 flex items-center justify-between flex-1">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  총 학생 수
                </div>
                <div className="text-2xl font-bold text-gray-900 numeric-mono">
                  {Object.values(classStats).reduce((sum, stats) => sum + (stats?.total_students || 0), 0)}명
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="p-6 flex items-center justify-between flex-1">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  활성 과제
                </div>
                <div className="text-2xl font-bold text-gray-900 numeric-mono">
                  {Object.values(classStats).reduce((sum, stats) => sum + (stats?.active_assignments || 0), 0)}개
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="p-6 flex items-center justify-between flex-1">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  평균 진도율
                </div>
                <div className="text-2xl font-bold text-gray-900 numeric-mono">
                  {classes.length > 0 
                    ? Math.round(Object.values(classStats).reduce((sum, stats) => sum + (stats?.average_progress || 0), 0) / classes.length)
                    : 0}%
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 반 목록 섹션 */}
        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-center py-16 p-6">
              <div className="p-4 bg-neutral-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AcademicCapIcon className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {user?.role === 'admin' ? '생성된 반이 없습니다' : '담당 반이 없습니다'}
              </h3>
              <p className="text-gray-700 mb-6 max-w-sm mx-auto reading-leading">
                {user?.role === 'admin' 
                  ? '새 반을 만들어서 교사와 학생들을 배정해보세요.' 
                  : '관리자가 반을 배정할 때까지 기다려주세요.'}
              </p>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  새 반 만들기
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.role === 'admin' ? '전체 반 목록' : '담당 반 목록'}
            </h2>
            <div className="text-sm text-gray-600">
              총 {classes.length}개 반
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-fit">
            {classes.map((cls) => {
              const stats = classStats[cls.id];
              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-role-primary transition-colors flex flex-col h-full"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 text-ellipsis-1 mb-1">
                          {cls.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          {cls.grade_level && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-role-primary-light/20 text-blue-600 font-medium">
                              {cls.grade_level}학년
                            </span>
                          )}
                          {cls.subject && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary/20 text-gray-700 font-medium">
                              {cls.subject}
                            </span>
                          )}
                        </div>
                      </div>
                      {user?.role === 'admin' && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => openEditModal(cls)}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-info/20 rounded-lg transition-colors"
                            title="반 정보 수정"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-error/20 rounded-lg transition-colors"
                            title="반 삭제"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {cls.description && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 reading-leading text-ellipsis-2">
                          {cls.description}
                        </p>
                      </div>
                    )}

                    {stats && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600 numeric-mono">
                            {stats.total_students}
                          </div>
                          <div className="text-xs font-medium text-blue-600/80 mt-1">학생 수</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-xl font-bold text-green-600 numeric-mono">
                            {stats.average_progress}%
                          </div>
                          <div className="text-xs font-medium text-green-600/80 mt-1">평균 진도</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-neutral-200">
                      <button
                        onClick={() => openStudentsModal(cls)}
                        className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                      >
                        <UsersIcon className="h-4 w-4" />
                        학생 관리
                      </button>
                    </div>
                </div>
              </div>
            );
          })}
          </div>
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
    </div>
  );
};

export default TeacherDashboard;