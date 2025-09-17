import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import DocumentsDashboard from "./DocumentsDashboard";
import { getCompanyDashboardData, updateCompanyDashboardData } from '../services/api';
import api from '../services/api';
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const Dashboard = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [first_name, setFirstName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboardText, setDashboardText] = useState("");
  const [newDashboardText, setNewDashboardText] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goals, setGoals] = useState({ primaryGoal: "", skillsToDevelop: "" });
  const [courses, setCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs
  const location = useLocation();
  const prevLocation = useRef(null);
  const dashboardContentRef = useRef(null);
  const logoRef = useRef(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Check for first login
  const isFirstLogin = localStorage.getItem('firstLogin') === 'true';

  // Dynamically assign gradient classes
  const getGradientClasses = (index) => {
    const gradients = [
      { from: "from-blue-900", to: "to-blue-700" },
      { from: "from-blue-700", to: "to-blue-500" },
      { from: "from-blue-500", to: "to-blue-300" },
    ];
    return gradients[index % gradients.length];
  };

  // Fetch user, dashboard, courses, and featured courses data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch user information
      const userResponse = await api.get('/user/');
      const usersData = userResponse.data;

      if (usersData && usersData.length > 0) {
        const loggedInUser = usersData[0];
        setCompanyName(loggedInUser.companyName || "");
        setEmail(loggedInUser.email || "");
        setFirstName(loggedInUser.first_name || "");
        setIsAdmin(loggedInUser.is_admin || false);
      } else {
        console.warn("Kunde inte hämta användarinformation för dashboard.");
      }

      // Define userId for SCORM data fetching
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || "anonymous";

      // Fetch dashboard data
      const dashboardData = await getCompanyDashboardData(token);
      setDashboardText(dashboardData.dashboard_text || '');
      setNewDashboardText(dashboardData.dashboard_text || '');
      setLogoUrl(dashboardData.logo_url || null);

      // Fetch courses
      const coursesResponse = await api.get('/courses/');
      const coursesData = coursesResponse.data || [];
      setCourses(coursesData);

      // Fetch featured courses from backend
      try {
        const featuredResponse = await api.getFeaturedCourses();
        let featuredCoursesData = featuredResponse.data.map(item => item.course) || [];
      
        // Fetch progress for completion status, handling both SCORM and JSON
        featuredCoursesData = await Promise.all(
          featuredCoursesData.map(async (course) => {
            try {
              let isCompleted = false;
        
              if (course.course_type === 'scorm') {
                const scormResponse = await api.get(`/scorm/get-data/?courseId=${course.id}`);
                const scormData = scormResponse.data || [];
                const userProgress = scormData.find(
                  (entry) => entry.user_id === userId && entry.progress_data
                );
                isCompleted = userProgress?.progress_data?.["cmi.completion_status"] === "completed";
              } else if (course.course_type === 'json') {
                const progressResponse = await api.get(`/courses/${course.id}/progress/`);
                const progressData = progressResponse.data || {};
                isCompleted = progressData.is_completed || false;
              }
        
              return { ...course, isCompleted };
            } catch (err) {
              console.error(`Error fetching data for course ${course.id}:`, err);
              return { ...course, isCompleted: false };
            }
          })
        );
      
        setFeaturedCourses(featuredCoursesData);
        localStorage.setItem('featuredCourses', JSON.stringify(featuredCoursesData));
      } catch (error) {
        console.warn("Kunde inte hämta utvalda kurser, använder localStorage som reserv...");
        // Fallback to localStorage if backend fetch fails
        let savedFeatured = JSON.parse(localStorage.getItem('featuredCourses')) || [];
        savedFeatured = await Promise.all(
          savedFeatured.map(async (course) => {
            try {
              const scormResponse = await api.get(`https://backend-agoge-5544956f8095.herokuapp.com/api/scorm/get-data/?courseId=${course.id}`);
              const scormData = scormResponse.data || [];
              const userProgress = scormData.find(
                (entry) => entry.user_id === userId && entry.progress_data
              );
              const isCompleted = userProgress?.progress_data?.["cmi.completion_status"] === "completed";
              return { ...course, isCompleted };
            } catch (err) {
              console.error(`Error fetching SCORM data for course ${course.id}:`, err);
              return { ...course, isCompleted: false };
            }
          })
        );
        const validFeatured = savedFeatured
          .filter(fc => coursesData.some(c => c.id === fc.id))
          .slice(0, 3);
        setFeaturedCourses(validFeatured.length ? validFeatured : coursesData.slice(0, 3));
      }

      // Check for first login
      if (isFirstLogin) {
        setShowGoalForm(true);
        localStorage.setItem('firstLogin', 'false');
      }

      setLoading(false);
    } catch (error) {
      console.error('Fel vid hämtning av data för dashboard:', error);
      setError(error.message || "Kunde inte hämta data för dashboard.");
      setLoading(false);
    }
  }, [token, isFirstLogin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Animation effects
  useEffect(() => {
    if (loading) return;

    const animateContent = () => {
      gsap.set(dashboardContentRef.current, { opacity: 0, y: 20 });
      gsap.set(logoRef.current, { opacity: 0, scale: 0.8 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(dashboardContentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
      });

      tl.to(logoRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.5)",
      }, "-=0.4");

      tl.to(logoRef.current, {
        scale: 1.05,
        duration: 0.8,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
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

  

  // Handlers
  const handleEditToggle = useCallback(() => {
    setIsEditing(!isEditing);
    setNewDashboardText(dashboardText);
    setNewLogoFile(null);
  }, [isEditing, dashboardText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await updateCompanyDashboardData(token, newDashboardText, newLogoFile);
      setDashboardText(data.dashboard_text);
      setLogoUrl(data.logo_url);
      setIsEditing(false);
      setError('');
    } catch (error) {
      console.error('Uppdateringsfel:', error);
      setError(error.message || "Kunde inte uppdatera dashboard");
    }
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    console.log("Användarens mål:", goals);
    setShowGoalForm(false);
  };

  const handleGoalChange = (e) => {
    setGoals(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle selection of featured courses
  const handleSelectFeaturedCourses = async (selectedCourseIds) => {
    try {
      const selectedCourses = courses
        .filter(course => selectedCourseIds.includes(course.id))
        .slice(0, 3);

      const selectedCourseIdsForApi = selectedCourses.map(course => course.id);

      // Call the method from the api instance
      await api.updateFeaturedCourses({ course_ids: selectedCourseIdsForApi });

      // Fetch SCORM data for selected courses to include completion status
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || "anonymous";
      const updatedCourses = await Promise.all(
        selectedCourses.map(async (course) => {
          try {
            const scormResponse = await api.get(`https://backend-agoge-5544956f8095.herokuapp.com/api/scorm/get-data/?courseId=${course.id}`);
            const scormData = scormResponse.data || [];
            const userProgress = scormData.find(
              (entry) => entry.user_id === userId && entry.progress_data
            );
            const isCompleted = userProgress?.progress_data?.["cmi.completion_status"] === "completed";
            return { ...course, isCompleted };
          } catch (err) {
            console.error(`Error fetching SCORM data for course ${course.id}:`, err);
            return { ...course, isCompleted: false };
          }
        })
      );

      setFeaturedCourses(updatedCourses);
      localStorage.setItem('featuredCourses', JSON.stringify(updatedCourses));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Fel vid uppdatering av utvalda kurser:', error);
      setError(error.response?.data?.message || "Kunde inte uppdatera utvalda kurser.");
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 pt-16 pb-16">
      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">What are your goals at {companyName}?</h2>
            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div>
                <label htmlFor="primaryGoal" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary goal (for the coming year)
                </label>
                <textarea
                  id="primaryGoal"
                  name="primaryGoal"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={goals.primaryGoal}
                  onChange={handleGoalChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="skillsToDevelop" className="block text-sm font-medium text-gray-700 mb-1">
                  Three skills you want to develop
                </label>
                <textarea
                  id="skillsToDevelop"
                  name="skillsToDevelop"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={goals.skillsToDevelop}
                  onChange={handleGoalChange}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
        ref={dashboardContentRef}
      >
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 flex flex-col md:flex-row">
          <div className="p-6 md:w-2/3">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Välkommen till din dashboard, <span className="text-blue-600">{first_name}</span>!
            </h2>
            <p className="text-gray-600">
              {dashboardText || "Here you can find important information and updates."}
            </p>
          </div>
          
          {logoUrl && (
            <div ref={logoRef} className="md:w-1/3 flex items-center justify-center p-6 bg-gray-50">
              <img
                src={logoUrl}
                alt="Company logo"
                className="max-h-40 object-contain transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150?text=Logo+Missing";
                }}
              />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <div className="mb-8">
            {!isEditing ? (
              <button
                onClick={handleEditToggle}
                className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit Content
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                  <label htmlFor="dashboardText" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Information
                  </label>
                  <textarea
                    id="dashboardText"
                    value={newDashboardText}
                    onChange={(e) => setNewDashboardText(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="logoFile" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Logo
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="logoFile"
                      onChange={(e) => setNewLogoFile(e.target.files?.[0] || null)}
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {newLogoFile && (
                    <p className="mt-2 text-sm text-gray-500">Selected file: {newLogoFile.name}</p>
                  )}
                  {logoUrl && !newLogoFile && (
                    <p className="mt-2 text-sm text-gray-500">Current logo will be kept</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Courses Section */}
        <div className="mb-12">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
    <div>
      <h3 className="text-3xl font-bold text-gray-900 mb-2">Prioriterade Kurser</h3>
      <p className="text-gray-600">Våra mest populära och rekommenderade kurser</p>
    </div>
    {isAdmin && (
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Välj utvalda kurser
      </button>
    )}
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {featuredCourses.map((course, index) => {
      const { from, to } = getGradientClasses(index);

      return (
        <div
          key={course.id}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
        >
          {/* Course Image Container */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
            {course.image_url ? (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-course.jpg';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}

            {/* Completion Badge */}
            {course.isCompleted && (
              <div className="absolute top-4 left-4 flex items-center bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow-lg">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Slutförd
              </div>
            )}

            {/* Course Type Badge */}
            <div className="absolute top-4 right-4">
              
            </div>

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${from} ${to} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
          </div>

          {/* Course Content */}
          <div className="p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {course.title}
            </h4>

            <p className="text-gray-600 line-clamp-3 mb-6 leading-relaxed">
              {course.description || "Ingen beskrivning tillgänglig"}
            </p>

            {/* Course Stats */}
            <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span></span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Interaktiv</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                const token = localStorage.getItem('token');
                if (course.course_type === 'scorm') {
                  navigate(`/course/${course.id}/scorm`);
                } else if (course.course_type === 'json') {
                  window.location.href = `https://player.agoge-lms.se/coursetobuy/${course.id}/?token=${token}`;
                } else {
                  console.warn(`Okänt kursformat för kurs ${course.id}: ${course.course_type}`);
                  setError('Okänt kursformat');
                }
              }}
              className={`w-full cursor-pointer inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                course.isCompleted
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white'
              }`}
            >
              {course.isCompleted ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Repetera kurs
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                  Starta kurs
                </>
              )}
            </button>
          </div>
        </div>
      );
    })}
  </div>

  {/* Empty State */}
  {featuredCourses.length === 0 && (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga prioriterade kurser än</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        {isAdmin 
          ? "Klicka på 'Välj utvalda kurser' för att lägga till prioriterade kurser." 
          : "Prioriterade kurser kommer att visas här när de blir tillgängliga."
        }
      </p>
    </div>
  )}
</div>

        {/* Admin Call to Action */}
        {isAdmin && (
          <div className="my-12 p-6 bg-orange-50/50 border-l-4 border-amber-600 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">
              Vill ni göra mer med era utbildningar?
            </h4>
            <p className="text-blue-800 mb-4">
              Vi kan hjälpa er att omvandla era PowerPoint-presentationer till engagerande, interaktiva kurser med uppföljning och resultatspårning.
            </p>
            <a
              href="/kontakt"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800 transition"
            >
              Kontakta oss
            </a>
          </div>
        )}
        {/* Documents Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <DocumentsDashboard />
          </div>
        </div>

        {/* Modal for selecting featured courses */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Välj utvalda kurser (max 3)</h2>
              <SelectFeaturedCourses
                courses={courses}
                onSave={handleSelectFeaturedCourses}
                onCancel={() => setIsModalOpen(false)}
                initialSelected={featuredCourses.map(c => c.id)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component for selecting and reordering featured courses
function SelectFeaturedCourses({ courses, onSave, onCancel, initialSelected }) {
  const [selectedIds, setSelectedIds] = useState(initialSelected);

  // Handle toggling course selection
  const handleToggleCourse = (courseId) => {
    if (selectedIds.includes(courseId)) {
      setSelectedIds(selectedIds.filter((id) => id !== courseId));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, courseId]);
    }
  };

  // Move course up in the order
  const handleMoveUp = (index) => {
    if (index === 0) return; // Can't move up if already at the top
    const newSelectedIds = [...selectedIds];
    [newSelectedIds[index - 1], newSelectedIds[index]] = [
      newSelectedIds[index],
      newSelectedIds[index - 1],
    ];
    setSelectedIds(newSelectedIds);
  };

  // Move course down in the order
  const handleMoveDown = (index) => {
    if (index === selectedIds.length - 1) return; // Can't move down if already at the bottom
    const newSelectedIds = [...selectedIds];
    [newSelectedIds[index], newSelectedIds[index + 1]] = [
      newSelectedIds[index + 1],
      newSelectedIds[index],
    ];
    setSelectedIds(newSelectedIds);
  };

  // Handle save
  const handleSave = () => {
    onSave(selectedIds);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Välj och ordna utvalda kurser (max 3)</h2>
      <div className="mb-4 max-h-32 overflow-y-auto">
        {selectedIds.map((courseId, index) => {
          const course = courses.find((c) => c.id === courseId);
          return (
            <div
              key={courseId}
              className="flex items-center justify-between mb-2 p-2 bg-gray-100 rounded-md"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(courseId)}
                  onChange={() => handleToggleCourse(courseId)}
                  className="mr-2"
                />
                <span>{course ? course.title : 'Kurs inte hittad'}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className={`px-2 py-1 text-sm rounded-md ${
                    index === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === selectedIds.length - 1}
                  className={`px-2 py-1 text-sm rounded-md ${
                    index === selectedIds.length - 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* List of available courses for selection */}
      <div className="max-h-32 overflow-y-auto mb-4">
        {courses
          .filter((course) => !selectedIds.includes(course.id))
          .map((course) => (
            <div key={course.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(course.id)}
                onChange={() => handleToggleCourse(course.id)}
                disabled={!selectedIds.includes(course.id) && selectedIds.length >= 3}
                className="mr-2"
              />
              <span>{course.title}</span>
            </div>
          ))}
      </div>

      {selectedIds.length >= 3 && (
        <p className="text-yellow-600 mb-2">Max 3 kurser kan väljas.</p>
      )}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          Avbryt
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Spara
        </button>
      </div>
    </div>
  );
}

export default Dashboard;