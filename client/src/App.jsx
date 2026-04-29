import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Mock dashboard components for demonstration
const AdminDashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Admin Dashboard</h1></div>;
const StudentDashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Student Dashboard</h1></div>;
const ClientDashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Client Dashboard</h1></div>;
const Unauthorized = () => <div className="p-8 text-center text-destructive"><h1 className="text-2xl font-bold">403 - Unauthorized</h1></div>;

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      {/* Root redirection based on auth & role */}
      <Route path="/" element={
        !isAuthenticated ? <Navigate to="/login" /> :
        user?.role === 'admin' ? <Navigate to="/admin-dashboard" /> :
        user?.role === 'student' ? <Navigate to="/student-dashboard" /> :
        <Navigate to="/dashboard" />
      } />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Client routes */}
        <Route path="/dashboard" element={<ClientDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
