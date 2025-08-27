import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import WorkbooksPage from './pages/WorkbooksPage';
import WorkbookDetailPage from './pages/WorkbookDetailPage';
import AdminPage from './pages/AdminPage';
import { ImageUploadTestPage } from './pages/ImageUploadTestPage';
import { CreateProblemPage } from './pages/CreateProblemPage';
import { validateConfig } from './config';
import './App.css';

function App() {
  // 환경변수 검증
  React.useEffect(() => {
    validateConfig();
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/" element={<Layout showSidebar={false} />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
          
          {/* 인증이 필요한 라우트 */}
          <Route path="/dashboard" element={<Layout showSidebar={true} />}>
            <Route index element={<DashboardPage />} />
          </Route>
          
          <Route path="/problems" element={<Layout showSidebar={true} />}>
            <Route index element={<ProblemsPage />} />
            <Route path="create" element={<CreateProblemPage />} />
          </Route>
          
          <Route path="/workbooks" element={<Layout showSidebar={true} />}>
            <Route index element={<WorkbooksPage />} />
            <Route path=":id" element={<WorkbookDetailPage />} />
          </Route>
          
          <Route path="/admin" element={<Layout showSidebar={true} />}>
            <Route index element={<AdminPage />} />
          </Route>

          <Route path="/upload-test" element={<Layout showSidebar={true} />}>
            <Route index element={<ImageUploadTestPage />} />
          </Route>
          
          {/* 404 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
