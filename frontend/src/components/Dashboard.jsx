import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import DocumentsDashboard from "./DocumentsDashboard";
import { getCompanyDashboardData, updateCompanyDashboardData } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(null);
  const [is_admin, setIsAdmin] = useState(false);
  const [dashboardText, setDashboardText] = useState("");
  const [newDashboardText, setNewDashboardText] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const location = useLocation();
  const prevLocation = useRef(null);
  const dashboardContentRef = useRef(null);
  const logoRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObject = JSON.parse(storedUser);
          setCompanyName(userObject.companyName || "");
          setEmail(userObject.email || "");
          setIsAdmin(userObject.isAdmin || false);
        }

        const data = await getCompanyDashboardData(token);
        setDashboardText(data.dashboard_text || '');
        setLogoUrl(data.logoUrl || null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  useEffect(() => {
    if (loading) return;

    const animateContent = () => {
      // Reset styles before animation
      gsap.set(dashboardContentRef.current, { opacity: 0, y: 20 });
      gsap.set(logoRef.current, { opacity: 0, scale: 0.8 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      
      // Animate main content
      tl.to(dashboardContentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8
      });

      // Animate logo with delay
      tl.to(logoRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.5)"
      }, "-=0.4");

      // Add subtle pulse effect to logo
      tl.to(logoRef.current, {
        scale: 1.05,
        duration: 0.8,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, "+=0.5");
    };

    const isComingFromTeam = prevLocation.current?.pathname === '/team';
    const shouldAnimate = !isComingFromTeam || location.pathname !== '/team';

    if (shouldAnimate) {
      animateContent();
    } else {
      gsap.set([dashboardContentRef.current, logoRef.current], { opacity: 1, y: 0, scale: 1 });
    }

    prevLocation.current = location;
  }, [loading, location]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setNewDashboardText(dashboardText);
    setNewLogoFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await updateCompanyDashboardData(token, newDashboardText, newLogoFile);
      setDashboardText(data.dashboard_text);
      setLogoUrl(data.logoUrl);
      setIsEditing(false);
      setError('');
    } catch (error) {
      console.error('Update error:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-200 to-blue-100 pt-15 pb-15">
      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-background rounded-2xl pb-15"
        ref={dashboardContentRef}
      >
        <p className="text-lg mb-4">Du tillhör företaget <span className="font-extrabold text-blue-700">{companyName}</span></p>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-2/3 mb-4 md:mb-0">
            <h2 className="text-2xl font-semibold mb-4">
              Välkommen till din dashboard <span className=" font-extrabold ">{email}!</span>
            </h2>
            <p className="text-gray-700">{dashboardText || "Här kan du se viktig information och notiser."}</p>
          </div>
          
          {logoUrl && (
            <div ref={logoRef} className="md:w-1/2 flex justify-center">
              <img 
                src={logoUrl} 
                alt="Företagslogga" 
                className="max-h-50 transition-all duration-300 hover:scale-105" 
              />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {is_admin && (
          <div className="mb-8">
            {!isEditing ? (
              <button
                onClick={handleEditToggle}
                className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
              >
                Redigera innehåll
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                <div>
                  <label htmlFor="dashboardText" className="block text-sm font-medium text-gray-700 mb-1">
                    Information om bolaget
                  </label>
                  <textarea
                    id="dashboardText"
                    value={newDashboardText}
                    onChange={(e) => setNewDashboardText(e.target.value)}
                    rows={5}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="logoFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Ladda upp logotyp
                  </label>
                  <input
                    type="file"
                    id="logoFile"
                    onChange={(e) => setNewLogoFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {newLogoFile && (
                    <p className="mt-2 text-sm text-gray-500">Vald fil: {newLogoFile.name}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Spara ändringar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl text-center font-bold mb-8">Kurser att göra</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-r from-blue-950 to-blue-500 text-white text-center rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <h4 className="text-xl font-semibold mb-2">Kurs 1</h4>
              <p>Grundläggande säkerhet</p>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-300 text-white text-center rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <h4 className="text-xl font-semibold mb-2">Kurs 2</h4>
              <p>Avancerad säkerhet</p>
            </div>
            <div className="bg-gradient-to-r from-blue-300 to-blue-100 text-white text-center rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <h4 className="text-xl font-semibold mb-2">Kurs 3</h4>
              <p>Specialträning</p>
            </div>
          </div>

          <div className="text-center py-8">
            <h2 className="text-3xl font-bold mb-8">Dina dokument</h2>
            <DocumentsDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;