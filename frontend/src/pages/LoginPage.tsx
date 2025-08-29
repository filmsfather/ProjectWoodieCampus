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
      console.log('🔍 전체 로그인 응답:', response);
      
      if (response.success) {
        // 로그인 성공 - 역할에 따른 리디렉션
        const user = AuthService.getCurrentUser();
        console.log('🔍 getCurrentUser 결과:', user);
        console.log('🔍 localStorage user:', localStorage.getItem('user'));
        console.log('🔍 사용자 role:', user?.role);
        
        if (user?.role === 'admin') {
          console.log('🔍 관리자로 인식 - /admin으로 이동');
          window.location.href = '/admin';
        } else {
          console.log('🔍 일반 사용자로 인식 - /dashboard로 이동');
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
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ 
        backgroundColor: 'var(--color-neutral-50)',
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(90, 100, 80, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(170, 70, 50, 0.1) 0%, transparent 50%)'
      }}
    >
      <div 
        className="w-full max-w-md"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)'
        }}
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)'
            }}
          >
            로그인
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)' }}>
            Woodie Campus에 오신 것을 환영합니다
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div 
              className="mb-4 p-4 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#dc2626'
              }}
            >
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label 
              htmlFor="username"
              className="block mb-2"
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500',
                color: 'var(--color-text-primary)'
              }}
            >
              사용자명
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              required
              placeholder="사용자명을 입력하세요"
              disabled={loading}
              className="w-full transition-all duration-200 focus:outline-none"
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                fontSize: 'var(--font-size-base)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(90, 100, 80, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label 
              htmlFor="password"
              className="block mb-2"
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500',
                color: 'var(--color-text-primary)'
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
              className="w-full transition-all duration-200 focus:outline-none"
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                fontSize: 'var(--font-size-base)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(90, 100, 80, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full transition-all duration-200"
            style={{
              padding: 'var(--space-4)',
              backgroundColor: loading ? 'var(--color-neutral-400)' : 'var(--color-primary)',
              color: 'white',
              fontWeight: '600',
              fontSize: 'var(--font-size-base)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#4a5440';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            계정이 없으신가요? 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;