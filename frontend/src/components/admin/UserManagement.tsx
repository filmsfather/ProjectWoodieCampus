import React, { useState, useEffect } from 'react';
import { AdminApi, formatRole, formatDate, type User } from '../../services/adminApi';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface UserManagementProps {}

const UserManagement: React.FC<UserManagementProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // 필터링 및 검색
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 사용자 목록 로드
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedRole) params.role = selectedRole;
      if (activeFilter !== 'all') {
        params.isActive = activeFilter === 'active';
      }

      const response = await AdminApi.getUsers(params);
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 필터 변경 시 데이터 로드
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, selectedRole, activeFilter]);

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    loadUsers();
  };

  // 사용자 생성 성공 핸들러
  const handleUserCreated = () => {
    setShowCreateModal(false);
    loadUsers(); // 목록 새로고침
  };

  // 사용자 편집 핸들러
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // 사용자 업데이트 성공 핸들러
  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers(); // 목록 새로고침
  };

  // 사용자 삭제 핸들러
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // 사용자 삭제 확인 핸들러
  const handleUserDeleted = () => {
    setShowDeleteDialog(false);
    setSelectedUser(null);
    loadUsers(); // 목록 새로고침
  };

  // 사용자 활성화/비활성화 토글
  const handleToggleUserStatus = async (user: User) => {
    try {
      if (user.isActive) {
        await AdminApi.deleteUser(user.id);
      } else {
        await AdminApi.activateUser(user.id);
      }
      loadUsers(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 상태 변경에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
      <div className="container max-w-7xl mx-auto" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div 
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)'
            }}
          >
            {/* 배경 워터마크 */}
            <div 
              className="absolute inset-0 flex items-center justify-end pr-8 opacity-5 pointer-events-none"
              style={{ transform: 'scale(1.5) translateX(20px)' }}
            >
              <div style={{ fontSize: '120px' }}>👥</div>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: '700',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-2)'
                  }}
                >
                  사용자 관리
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                  시스템 사용자를 관리하고 권한을 설정하세요
                </p>
              </div>
              
              <button 
                className="transition-all duration-200 hover:scale-105"
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  color: 'white',
                  fontWeight: '500',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                새 사용자 추가
              </button>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6">
          <div 
            className="transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)'
            }}
          >
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="사용자명, 이메일, 이름으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full transition-all duration-200 focus:scale-[1.02]"
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      border: '1px solid var(--color-border-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="transition-all duration-200 hover:scale-105"
                  style={{
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                    color: 'white',
                    fontWeight: '500',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  검색
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label 
                  className="block mb-2"
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  역할 필터
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full transition-all duration-200 focus:scale-[1.02]"
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="">모든 역할</option>
                  <option value="admin">관리자</option>
                  <option value="teacher">교사</option>
                  <option value="student">학생</option>
                </select>
              </div>

              <div>
                <label 
                  className="block mb-2"
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  상태 필터
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full transition-all duration-200 focus:scale-[1.02]"
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="all">모든 사용자</option>
                  <option value="active">활성 사용자</option>
                  <option value="inactive">비활성 사용자</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className="transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}>
                  총 사용자
                </span>
                <span style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: '700',
                  color: '#9333ea'
                }}>
                  {totalCount}명
                </span>
              </div>
            </div>
            
            <div 
              className="transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}>
                  현재 페이지
                </span>
                <span style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: '700',
                  color: '#9333ea'
                }}>
                  {currentPage} / {totalPages}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6">
            <div 
              className="transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ 
                  color: '#dc2626',
                  fontWeight: '500'
                }}>
                  {error}
                </span>
                <button 
                  onClick={() => setError(null)}
                  style={{
                    color: '#dc2626',
                    fontSize: 'var(--font-size-xl)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 표시 */}
        {loading && (
          <div 
            className="text-center mb-6"
            style={{ padding: 'var(--space-8)' }}
          >
            <div 
              className="animate-spin rounded-full mx-auto mb-4"
              style={{
                height: '48px',
                width: '48px',
                border: '2px solid var(--color-neutral-200)',
                borderBottom: '2px solid #9333ea'
              }}
            ></div>
            <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>
              사용자 목록을 불러오는 중...
            </p>
          </div>
        )}

      {/* 사용자 카드 목록 */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {users.map((user) => (
            <div 
              key={user.id} 
              className="group transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                position: 'relative',
                opacity: user.isActive ? 1 : 0.7
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {/* 기본 정보 섹션 */}
                  <div className="mb-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                      <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        margin: 0
                      }}>
                        {user.username}
                      </h3>
                      <span 
                        style={{
                          background: user.role === 'admin' 
                            ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)'
                            : user.role === 'teacher'
                            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-block'
                        }}
                      >
                        {formatRole(user.role)}
                      </span>
                      <span 
                        style={{
                          background: user.isActive 
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%)',
                          color: user.isActive ? '#059669' : '#6b7280',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '500',
                          padding: 'var(--space-1) var(--space-2)',
                          border: `1px solid ${user.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`,
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-block'
                        }}
                      >
                        {user.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <p style={{
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      {user.email}
                    </p>
                    {user.fullName && (
                      <p style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        margin: 0
                      }}>
                        {user.fullName}
                      </p>
                    )}
                  </div>

                  {/* 메타 정보 섹션 */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    <div>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        marginBottom: 'var(--space-1)'
                      }}>
                        가입일
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: '500'
                      }}>
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        marginBottom: 'var(--space-1)'
                      }}>
                        마지막 로그인
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: '500'
                      }}>
                        {user.lastLogin ? formatDate(user.lastLogin) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 섹션 */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-2) var(--space-3)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)'
                    }}
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(user)}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: user.isActive 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-2) var(--space-3)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {user.isActive ? '비활성화' : '활성화'}
                  </button>
                  {user.isActive && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-lg)'
              }}
            >
              사용자가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div 
          className="mt-8"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: currentPage === 1 
                ? 'rgba(255,255,255,0.7)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500',
              color: 'var(--color-text-primary)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            이전
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, currentPage - 2) + i;
            if (page > totalPages) return null;
            
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: page === currentPage 
                    ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  color: page === currentPage ? 'white' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  minWidth: '40px'
                }}
              >
                {page}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: currentPage === totalPages 
                ? 'rgba(255,255,255,0.7)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500',
              color: 'var(--color-text-primary)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* 모달들 */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {showDeleteDialog && selectedUser && (
        <DeleteConfirmDialog
          user={selectedUser}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedUser(null);
          }}
          onUserDeleted={handleUserDeleted}
        />
      )}
      </div>
    </div>
  );
};

export default UserManagement;