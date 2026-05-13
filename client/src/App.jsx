import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import StudentApp from './student/StudentApp';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  }

  return (
    <BrowserRouter>
      <button
        className="theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={`切换到${theme === 'dark' ? '浅色' : '深色'}模式`}
        title={`切换到${theme === 'dark' ? '浅色' : '深色'}模式`}
      >
        {theme === 'dark' ? '深色' : '浅色'}
      </button>
      <Routes>
        <Route path="/*" element={<StudentApp />} />
        <Route path="/admin/*" element={
          <Suspense fallback={<div style={{padding:'2rem'}}>加载中...</div>}>
            <AdminApp />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
