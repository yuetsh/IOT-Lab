import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentApp from './student/StudentApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<StudentApp />} />
        <Route path="/admin/*" element={<div style={{padding:'2rem'}}>Admin panel coming soon</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
