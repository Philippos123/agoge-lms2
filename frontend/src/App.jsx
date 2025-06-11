import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import LoginPp from './components/LoginPp';
import LoginFor from './components/LoginFor';
import Dashboard from './pages/Dashboard';
import { AuthService } from './services/api';
import Market from './pages/market';
import CourseToBuyDetail from './pages/CourseToBuyDetail';
import Team from './pages/Team';
import CourseDashboard from './pages/CourseDashboard';
import CompanyCourses from './pages/CourseDashboard';
import TestEditor from './pages/test'
import ScormPlayer from './components/ScormPlayer';
import Docs from './pages/UploadDocs';
import Checkout from './pages/CheckOut';
import Confirm from './pages/Confirm';
import AcceptInvitePage from './pages/AcceptInvitePage';
import RegistrationSuccess from './components/RegistrationSuccess';
import Profile from './pages/Profile';
import AuthCallback from './components/AuthCallback';
import ScormLauncher from './components/ScormLauncher';
import AdminCourseOverviewPage from './pages/AdminCourseOverview';
import InspectPage from './pages/Inspect';
import AiDashboardPage from './pages/AiDashboard';
import Kontakt from './pages/kontakt';


const ProtectedRoute = ({ children }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  console.log('ProtectedRoute - isLoggedIn:', isLoggedIn);
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const RedirectIfLoggedIn = ({ children }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  console.log('RedirectIfLoggedIn - isLoggedIn:', isLoggedIn);
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />; // Ändra omdirigeringen hit
  }
  return children;
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">Laddar...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<RedirectIfLoggedIn>
            <Login />
          </RedirectIfLoggedIn>
        }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/scorm-launcher/:courseId/:languageCode" element={<ScormLauncher />} />
        <Route 
          path="/login-privat" // Lägg till en explicit /login-rutt och använd RedirectIfLoggedIn där
          element={
            <RedirectIfLoggedIn>
              <LoginPp />
            </RedirectIfLoggedIn>
          } 
        />
        <Route 
          path="/login-foretag" // Lägg till en explicit /login-rutt och använd RedirectIfLoggedIn där
          element={
            <RedirectIfLoggedIn>
              <LoginFor />
            </RedirectIfLoggedIn>
          } 
        />
        <Route path="/admin/course-overview" element={<ProtectedRoute><AdminCourseOverviewPage /></ProtectedRoute>} />
        <Route path="/inspect/:courseId" element={<ProtectedRoute><InspectPage /></ProtectedRoute>} />
        <Route path="/course/:courseId/scorm" element={<ProtectedRoute><ScormPlayer /></ProtectedRoute>} />
        <Route path="/confirm" element={<ProtectedRoute><Confirm /></ProtectedRoute>} />
        <Route path="/market" element={ <ProtectedRoute><Market /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/course/:courseId" element={<ProtectedRoute><CourseToBuyDetail /></ProtectedRoute>} />
        <Route path="/course-dashboard" element={<ProtectedRoute><CourseDashboard/></ProtectedRoute>} />
        <Route path="/accept-invite/:token" element= {<AcceptInvitePage />}/>
        <Route path="/checkout/:courseId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/test" element={<TestEditor />} />
        <Route 
          path="/docs" 
          element={
            <ProtectedRoute>
              <Docs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-dashboard"
          element={
            <ProtectedRoute>
              <AiDashboardPage/> 
            </ProtectedRoute>
          }
        />
        <Route 
          path="/company-courses"
          element={
            <ProtectedRoute>
              <CompanyCourses /> 
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;