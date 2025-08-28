import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { validateConfig } from './config';
import { AccessibilityManager } from './utils/accessibility';
import './App.css';

// Lazy loading을 통한 코드 스플리팅
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProblemsPage = React.lazy(() => import('./pages/ProblemsPage'));
const WorkbooksPage = React.lazy(() => import('./pages/WorkbooksPage'));
const WorkbookDetailPage = React.lazy(() => import('./pages/WorkbookDetailPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const TeacherPage = React.lazy(() => import('./pages/TeacherPage'));
const ImageUploadTestPage = React.lazy(() => import('./pages/ImageUploadTestPage').then(module => ({ default: module.ImageUploadTestPage })));
const CreateProblemPage = React.lazy(() => import('./pages/CreateProblemPage').then(module => ({ default: module.CreateProblemPage })));
const SolveProblemPage = React.lazy(() => import('./pages/SolveProblemPage'));

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="loading-spinner" role="status" aria-label="페이지를 로딩 중입니다">
    <div className="spinner"></div>
    <p>로딩 중...</p>
  </div>
);

function App() {
  // 환경변수 검증 및 접근성 초기화
  React.useEffect(() => {
    validateConfig();
    AccessibilityManager.getInstance();
  }, []);

  return (
    <Router>
      <div className="app">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
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

            {/* 교사 페이지 - 교사와 관리자만 접근 가능 */}
            <Route path="/teacher" element={
              <PrivateRoute allowedRoles={['teacher', 'admin']}>
                <Layout showSidebar={true} />
              </PrivateRoute>
            }>
              <Route index element={<TeacherPage />} />
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
          </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
