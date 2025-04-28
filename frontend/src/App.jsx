import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './pages/Dashboard'; // Här ändrar vi importen till den nya platsen
import { AuthService } from './services/api';
import Market from './pages/market'; // Justera sökvägen för market-importen
import CourseToBuyDetail from './pages/CourseToBuyDetail';
import Team from './pages/Team';
import CourseDashboard from './pages/CourseDashboard';
import CompanyCourses from './pages/CourseDashboard';
import TestEditor from './pages/test'
import ScormPlayer from './components/ScormPlayer'; // Justera sökvägen för ScormPlayer-importen
import Docs from './pages/UploadDocs'; // Justera sökvägen för Docs-importen
import Checkout from './pages/CheckOut';
import Confirm from './pages/Confirm';
import AcceptInvitePage from './pages/AcceptInvitePage';
import RegistrationSuccess from './components/RegistrationSuccess';
import Profile from './pages/Profile';


const ProtectedRoute = ({ children }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  
  console.log('ProtectedRoute - isLoggedIn:', isLoggedIn);  // Lägg till logg här
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const RedirectIfLoggedIn = ({ children }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  
  console.log('RedirectIfLoggedIn - isLoggedIn:', isLoggedIn);  // Lägg till detta
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
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
          element={
            <RedirectIfLoggedIn>
              <Login />
            </RedirectIfLoggedIn>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/course/:courseId/scorm" element={<ProtectedRoute><ScormPlayer /></ProtectedRoute>} />

        <Route path="/confirm" element={<ProtectedRoute><Confirm /></ProtectedRoute>} />
        <Route path="/market" element={ <ProtectedRoute><Market /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/course/:courseId" element={<ProtectedRoute><CourseToBuyDetail /></ProtectedRoute>} /> {/* Dynamisk rutt */}
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