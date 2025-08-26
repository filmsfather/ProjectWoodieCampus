import React, { useState } from 'react';
import { AdminApi, formatRole, generateRandomPassword } from '../../services/adminApi';
import type { User } from '../../services/adminApi';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onUserUpdated }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  // const [loading, setLoading] = useState(false); // 현재 사용하지 않음
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 역할 변경 상태
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  // 비밀번호 재설정 상태
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // 역할 변경 핸들러
  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      setError('변경할 역할이 현재 역할과 같습니다');
      return;
    }

    try {
      setRoleChangeLoading(true);
      setError(null);
      
      await AdminApi.updateUserRole(user.id, { role: selectedRole });
      setSuccessMessage('사용자 역할이 성공적으로 변경되었습니다');
      
      // 잠시 후 모달 닫기
      setTimeout(() => {
        onUserUpdated();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '역할 변경에 실패했습니다');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  // 비밀번호 재설정 핸들러
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      setError('새 비밀번호를 입력하세요');
      return;
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    try {
      setPasswordResetLoading(true);
      setError(null);

      await AdminApi.resetUserPassword(user.id, { newPassword });
      setSuccessMessage('비밀번호가 성공적으로 재설정되었습니다');
      setNewPassword('');
      setShowPassword(false);
      
      // 잠시 후 탭 변경
      setTimeout(() => {
        setActiveTab('info');
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  // 랜덤 비밀번호 생성
  const handleGeneratePassword = () => {
    const password = generateRandomPassword();
    setNewPassword(password);
    setShowPassword(true);
  };

  // 모달 외부 클릭 핸들러
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 메시지 자동 삭제
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content edit-user-modal">
        <div className="modal-header">
          <h3>사용자 편집: {user.username}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* 사용자 기본 정보 표시 */}
        <div className="user-info-summary">
          <div className="info-item">
            <span className="label">이메일:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="label">이름:</span>
            <span className="value">{user.fullName || '설정되지 않음'}</span>
          </div>
          <div className="info-item">
            <span className="label">상태:</span>
            <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
              {user.isActive ? '활성' : '비활성'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">가입일:</span>
            <span className="value">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            역할 관리
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            비밀번호 재설정
          </button>
        </div>

        {/* 메시지 표시 */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* 역할 관리 탭 */}
        {activeTab === 'info' && (
          <div className="tab-content">
            <div className="form-group">
              <label>현재 역할</label>
              <div className="current-role">
                <span className={`role-badge role-${user.role}`}>
                  {formatRole(user.role)}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newRole">새 역할 선택</label>
              <select
                id="newRole"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                disabled={roleChangeLoading}
              >
                <option value="student">학생</option>
                <option value="teacher">교사</option>
                <option value="admin">관리자</option>
              </select>
            </div>

            {selectedRole !== user.role && (
              <div className="role-change-notice">
                <p>
                  <strong>{formatRole(user.role)}</strong>에서 
                  <strong> {formatRole(selectedRole)}</strong>로 역할을 변경합니다.
                </p>
                {selectedRole === 'admin' && (
                  <p className="warning">
                    ⚠️ 관리자 권한을 부여하면 모든 시스템 기능에 접근할 수 있습니다.
                  </p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={roleChangeLoading}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRoleChange}
                disabled={roleChangeLoading || selectedRole === user.role}
              >
                {roleChangeLoading ? '변경 중...' : '역할 변경'}
              </button>
            </div>
          </div>
        )}

        {/* 비밀번호 재설정 탭 */}
        {activeTab === 'password' && (
          <div className="tab-content">
            <form onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <div className="password-input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    disabled={passwordResetLoading}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={passwordResetLoading}
                  >
                    {showPassword ? '숨기기' : '보기'}
                  </button>
                  <button
                    type="button"
                    className="btn-generate-password"
                    onClick={handleGeneratePassword}
                    disabled={passwordResetLoading}
                  >
                    자동생성
                  </button>
                </div>
                <small className="form-hint">
                  최소 8자 이상, 영문/숫자/특수문자 조합 권장
                </small>
              </div>

              <div className="password-reset-notice">
                <h4>⚠️ 비밀번호 재설정 안내</h4>
                <ul>
                  <li>기존 비밀번호는 즉시 무효화됩니다</li>
                  <li>새 비밀번호를 사용자에게 안전하게 전달해주세요</li>
                  <li>사용자는 다음 로그인 시 비밀번호 변경을 권장합니다</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={passwordResetLoading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={passwordResetLoading || !newPassword.trim()}
                >
                  {passwordResetLoading ? '재설정 중...' : '비밀번호 재설정'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;