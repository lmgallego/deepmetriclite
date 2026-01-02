import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Readiness from './pages/Readiness';
import PowerProfile from './pages/PowerProfile';
import Fatigue from './pages/Fatigue';
import Activities from './pages/Activities';
import Zones from './pages/Zones';
import Roadmap from './pages/Roadmap';

// Component for protecting private routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-netflix-red animate-pulse text-xl font-bold">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
         <Navbar />
         <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/readiness" 
              element={
                <PrivateRoute>
                  <Readiness />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/power-profile" 
              element={
                <PrivateRoute>
                  <PowerProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/fatigue" 
              element={
                <PrivateRoute>
                  <Fatigue />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/activities" 
              element={
                <PrivateRoute>
                  <Activities />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/zones" 
              element={
                <PrivateRoute>
                  <Zones />
                </PrivateRoute>
              } 
            />
         </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
