import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import WorkbooksPage from './pages/WorkbooksPage';
import WorkbookDetailPage from './pages/WorkbookDetailPage';
import AdminPage from './pages/AdminPage';
import { ImageUploadTestPage } from './pages/ImageUploadTestPage';
import { CreateProblemPage } from './pages/CreateProblemPage';
import SolveProblemPage from './pages/SolveProblemPage';
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
          
          {/* 인증이 필요한 라우트 - 모든 역할 접근 가능 */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout showSidebar={true} />
            </PrivateRoute>
          }>
            <Route index element={<DashboardPage />} />
          </Route>
          
          {/* 문제 관리 - 교사와 관리자만 접근 가능 */}
          <Route path="/problems" element={
            <PrivateRoute allowedRoles={['teacher', 'admin']}>
              <Layout showSidebar={true} />
            </PrivateRoute>
          }>
            <Route index element={<ProblemsPage />} />
            <Route path="create" element={<CreateProblemPage />} />
            <Route path="solve/:problemId" element={
              <PrivateRoute>
                <SolveProblemPage />
              </PrivateRoute>
            } />
          </Route>
          
          {/* 문제집 관리 - 모든 역할 접근 가능 */}
          <Route path="/workbooks" element={
            <PrivateRoute>
              <Layout showSidebar={true} />
            </PrivateRoute>
          }>
            <Route index element={<WorkbooksPage />} />
            <Route path=":id" element={<WorkbookDetailPage />} />
          </Route>
          
          {/* 관리자 페이지 - 관리자만 접근 가능 */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Layout showSidebar={true} />
            </PrivateRoute>
          }>
            <Route index element={<AdminPage />} />
          </Route>

          {/* 테스트 페이지 - 관리자와 교사만 접근 가능 */}
          <Route path="/upload-test" element={
            <PrivateRoute allowedRoles={['admin', 'teacher']}>
              <Layout showSidebar={true} />
            </PrivateRoute>
          }>
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
