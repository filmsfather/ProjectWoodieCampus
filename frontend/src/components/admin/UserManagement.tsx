import React, { useState, useEffect } from 'react';
import { AdminApi, formatRole, formatDate, type User } from '../../services/adminApi';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface UserManagementProps {
  className?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ className }) => {
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
    <div className={`user-management ${className || ''}`}>
      {/* 헤더 */}
      <div className="management-header">
        <h2>사용자 관리</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          새 사용자 추가
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="management-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="사용자명, 이메일, 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">검색</button>
        </form>

        <div className="filter-controls">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="filter-select"
          >
            <option value="">모든 역할</option>
            <option value="admin">관리자</option>
            <option value="teacher">교사</option>
            <option value="student">학생</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">모든 사용자</option>
            <option value="active">활성 사용자</option>
            <option value="inactive">비활성 사용자</option>
          </select>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="management-stats">
        <div className="stat-item">
          <span className="stat-label">총 사용자:</span>
          <span className="stat-value">{totalCount}명</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">현재 페이지:</span>
          <span className="stat-value">{currentPage} / {totalPages}</span>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* 로딩 표시 */}
      {loading && (
        <div className="loading-spinner">사용자 목록을 불러오는 중...</div>
      )}

      {/* 사용자 테이블 */}
      {!loading && (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>사용자명</th>
                <th>이메일</th>
                <th>이름</th>
                <th>역할</th>
                <th>상태</th>
                <th>가입일</th>
                <th>마지막 로그인</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'inactive-user' : ''}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.fullName || '-'}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{user.lastLogin ? formatDate(user.lastLogin) : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="편집"
                      >
                        편집
                      </button>
                      <button
                        className={`btn-toggle ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => handleToggleUserStatus(user)}
                        title={user.isActive ? '비활성화' : '활성화'}
                      >
                        {user.isActive ? '비활성화' : '활성화'}
                      </button>
                      {user.isActive && (
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user)}
                          title="삭제"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && !loading && (
            <div className="empty-state">
              사용자가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-page"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            이전
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, currentPage - 2) + i;
            if (page > totalPages) return null;
            
            return (
              <button
                key={page}
                className={`btn-page ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}

          <button
            className="btn-page"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
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
  );
};

export default UserManagement;