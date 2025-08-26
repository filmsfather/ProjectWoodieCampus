import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ showSidebar = false }) => {
  return (
    <div className="layout">
      <Header />
      <div className="layout-content">
        {showSidebar && <Sidebar />}
        <main className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;