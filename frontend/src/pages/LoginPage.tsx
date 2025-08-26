import React, { useState } from 'react';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 로그인 로직 구현
    console.log('Login attempt:', credentials);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form-wrapper">
          <h1>로그인</h1>
          <p>Woodie Campus에 오신 것을 환영합니다</p>
          
          <form onSubmit={handleSubmit} className="login-form">
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
              />
            </div>
            
            <button type="submit" className="login-btn">
              로그인
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