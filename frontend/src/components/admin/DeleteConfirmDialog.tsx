import React, { useState } from 'react';
import { AdminApi, formatRole, type User } from '../../services/adminApi';

interface DeleteConfirmDialogProps {
  user: User;
  onClose: () => void;
  onUserDeleted: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ 
  user, 
  onClose, 
  onUserDeleted 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const requiredText = user.username;
  const isConfirmed = confirmText === requiredText;

  // 사용자 삭제(비활성화) 핸들러
  const handleConfirmDelete = async () => {
    if (!isConfirmed) {
      setError('사용자명을 정확히 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await AdminApi.deleteUser(user.id);
      onUserDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 삭제에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 모달 외부 클릭 핸들러
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content delete-confirm-dialog">
        <div className="modal-header">
          <h3>사용자 삭제 확인</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="delete-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h4>정말로 이 사용자를 삭제하시겠습니까?</h4>
            <p>
              이 작업은 사용자 계정을 <strong>비활성화</strong>합니다. 
              계정 데이터는 보존되지만 로그인할 수 없게 됩니다.
            </p>
          </div>
        </div>

        {/* 사용자 정보 표시 */}
        <div className="user-details">
          <div className="detail-item">
            <span className="label">사용자명:</span>
            <span className="value">{user.username}</span>
          </div>
          <div className="detail-item">
            <span className="label">이메일:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="detail-item">
            <span className="label">이름:</span>
            <span className="value">{user.fullName || '설정되지 않음'}</span>
          </div>
          <div className="detail-item">
            <span className="label">역할:</span>
            <span className={`role-badge role-${user.role}`}>
              {formatRole(user.role)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">가입일:</span>
            <span className="value">
              {new Date(user.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>

        {/* 추가 경고 사항 */}
        <div className="deletion-effects">
          <h4>삭제 시 영향:</h4>
          <ul>
            <li>사용자는 시스템에 로그인할 수 없게 됩니다</li>
            <li>기존 문제 풀이 기록은 보존됩니다</li>
            <li>나중에 계정을 다시 활성화할 수 있습니다</li>
            {user.role === 'admin' && (
              <li className="admin-warning">
                <strong>관리자 권한이 제거됩니다</strong>
              </li>
            )}
          </ul>
        </div>

        {/* 확인 입력 */}
        <div className="confirmation-input">
          <label htmlFor="confirmInput">
            계속하려면 사용자명 "<strong>{requiredText}</strong>"을 입력하세요:
          </label>
          <input
            type="text"
            id="confirmInput"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`"${requiredText}" 입력`}
            disabled={loading}
            autoComplete="off"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleConfirmDelete}
            disabled={loading || !isConfirmed}
          >
            {loading ? '삭제 중...' : '사용자 삭제'}
          </button>
        </div>

        {/* 복구 안내 */}
        <div className="recovery-notice">
          <small>
            💡 삭제된 사용자는 관리자가 언제든지 다시 활성화할 수 있습니다.
          </small>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;