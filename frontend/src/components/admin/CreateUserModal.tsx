import React, { useState, useEffect } from 'react';
import { AdminApi, generateRandomPassword, type CreateUserRequest } from '../../services/adminApi';
import { classApi } from '../../services/teacherApi';
import type { Class } from '../../services/teacherApi';

interface CreateUserModalProps {
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onUserCreated }) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    role: 'student',
    fullName: '',
  });
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const allClasses = await classApi.getAllClasses();
      setClasses(allClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 랜덤 비밀번호 생성
  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData(prev => ({
      ...prev,
      password: newPassword,
    }));
    setShowPassword(true);
  };

  // 폼 유효성 검사
  const validateForm = (): string | null => {
    if (!formData.username.trim()) return '사용자명을 입력하세요';
    if (formData.username.length < 3) return '사용자명은 최소 3자 이상이어야 합니다';
    // 이메일이 제공된 경우에만 유효성 검사
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return '유효한 이메일을 입력하세요';
    }
    if (!formData.password.trim()) return '비밀번호를 입력하세요';
    if (formData.password.length < 4) return '비밀번호는 최소 4자 이상이어야 합니다';
    return null;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await AdminApi.createUser(formData);
      
      // 학생이고 반을 선택했다면 반에 배정
      if (formData.role === 'student' && selectedClassId) {
        await classApi.addStudentToClass(selectedClassId, user.id);
      }
      
      onUserCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 생성에 실패했습니다');
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
      <div className="modal-content create-user-modal">
        <div className="modal-header">
          <h3>새 사용자 추가</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 사용자명 */}
          <div className="form-group">
            <label htmlFor="username">
              사용자명 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="사용자명 입력"
              required
              disabled={loading}
            />
          </div>

          {/* 이메일 */}
          <div className="form-group">
            <label htmlFor="email">
              이메일 <span className="optional">(선택사항)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="이메일 주소 입력 (선택사항)"
              disabled={loading}
            />
          </div>

          {/* 이름 */}
          <div className="form-group">
            <label htmlFor="fullName">이름</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="전체 이름 입력"
              disabled={loading}
            />
          </div>

          {/* 역할 */}
          <div className="form-group">
            <label htmlFor="role">역할</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="student">학생</option>
              <option value="teacher">교사</option>
              <option value="admin">관리자</option>
            </select>
          </div>

          {/* 반 배정 (학생인 경우만) */}
          {formData.role === 'student' && (
            <div className="form-group">
              <label htmlFor="classId">
                반 배정 <span className="optional">(선택사항)</span>
              </label>
              <select
                id="classId"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loading}
              >
                <option value="">반 선택 안함</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.grade_level && `(${cls.grade_level}학년)`}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                나중에 반을 배정하거나 변경할 수 있습니다
              </small>
            </div>
          )}

          {/* 비밀번호 */}
          <div className="form-group">
            <label htmlFor="password">
              비밀번호 <span className="required">*</span>
            </label>
            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호 입력"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
              <button
                type="button"
                className="btn-generate-password"
                onClick={handleGeneratePassword}
                disabled={loading}
              >
                자동생성
              </button>
            </div>
            <small className="form-hint">
              최소 4자 이상, 영문/숫자/특수문자 조합 권장
            </small>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* 폼 액션 */}
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
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '생성 중...' : '사용자 생성'}
            </button>
          </div>
        </form>

        {/* 생성 후 안내 */}
        {formData.password && showPassword && (
          <div className="password-notice">
            <h4>⚠️ 중요 안내</h4>
            <p>생성된 비밀번호를 사용자에게 안전하게 전달해주세요.</p>
            <p>사용자는 첫 로그인 후 비밀번호를 변경하는 것을 권장합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUserModal;