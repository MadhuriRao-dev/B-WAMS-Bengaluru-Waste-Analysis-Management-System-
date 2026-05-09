import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';

// Private Route Component
function PrivateRoute({ children, roleRequired }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (roleRequired && userRole !== roleRequired) {
    // Redirect if role doesn't match
    // If Admin tries to access citizen? Maybe allow.
    // If Citizen tries to access admin? Redirect to citizen.
    if (userRole === 'admin') return <Navigate to="/admin" />;
    if (userRole === 'worker') return <Navigate to="/worker" />;
    if (userRole === 'citizen') return <Navigate to="/citizen" />;
  }

  return children;
}

// Public Route (redirects if already logged in)
function PublicRoute({ children }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (currentUser) {
    if (userRole === 'admin') return <Navigate to="/admin" />;
    if (userRole === 'worker') return <Navigate to="/worker" />;
    return <Navigate to="/citizen" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <div className="app-content">
        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } />

          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          <Route path="/citizen" element={
            <PrivateRoute roleRequired="citizen">
              <CitizenDashboard />
            </PrivateRoute>
          } />


          <Route path="/admin" element={
            <PrivateRoute roleRequired="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />

          <Route path="/worker" element={
            <PrivateRoute roleRequired="worker">
              <WorkerDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
