import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

import Home from './pages/Home';
import GigList from './pages/GigList';
import GigDetail from './pages/GigDetail';
import CreateGig from './pages/student/CreateGig';
import EditGig from './pages/student/EditGig';
import MyGigs from './pages/student/MyGigs';
import Wallet from './pages/student/Wallet';

import ClientDashboard from './pages/client/ClientDashboard';
import MyHires from './pages/client/MyHires';
import OrderDetail from './pages/client/OrderDetail';
import StudentDashboard from './pages/student/StudentDashboard';
import MyOrders from './pages/student/MyOrders';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminDisputes from './pages/admin/Disputes';

import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';

const Unauthorized = () => <div className="p-8 text-center text-destructive"><h1 className="text-2xl font-bold">403 - Unauthorized</h1></div>;

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <ErrorBoundary>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route path="/" element={<Home />} />
      <Route path="/gigs" element={<GigList />} />
      <Route path="/gigs/:id" element={<GigDetail />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Client routes */}
        <Route path="/dashboard" element={<ClientDashboard />} />
        <Route path="/client/my-hires" element={<MyHires />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student/orders" element={<MyOrders />} />
        <Route path="/student/create-gig" element={<CreateGig />} />
        <Route path="/student/edit-gig/:id" element={<EditGig />} />
        <Route path="/student/my-gigs" element={<MyGigs />} />
        <Route path="/student/wallet" element={<Wallet />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
