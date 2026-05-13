import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import StudentApp from './student/StudentApp';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function App() {
  return (
    <BrowserRouter>
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
