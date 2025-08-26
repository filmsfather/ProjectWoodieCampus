import React, { useState } from 'react';
import { AuthService } from '../services/authService';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', credentials);
    
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login(credentials);
      
      if (response.success) {
        // 로그인 성공 - 역할에 따른 리디렉션
        const user = AuthService.getCurrentUser();
        if (user?.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form-wrapper">
          <h1>로그인</h1>
          <p>Woodie Campus에 오신 것을 환영합니다</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="username">사용자명</label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                required
                placeholder="사용자명을 입력하세요"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                required
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          
          <div className="login-footer">
            <p>계정이 없으신가요? 관리자에게 문의하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;