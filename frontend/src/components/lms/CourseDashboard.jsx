// CourseDashboard.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  ClockIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  PlayIcon,
  BookOpenIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user.id || "anonymous";

        const coursesResponse = await api.get("/user/courses/");
        let coursesData = coursesResponse.data;

        coursesData = await Promise.all(
          coursesData.map(async (course) => {
            try {
              if (course.course_type === 'scorm') {
                const scormResponse = await api.get(`/scorm/get-data/?courseId=${course.id}`);
                const scormData = scormResponse.data || [];
                const userProgress = scormData.find(
                  (entry) => entry.user_id === userId && entry.progress_data
                );
                const isCompleted = userProgress?.progress_data?.["cmi.completion_status"] === "completed";
                return { ...course, isCompleted, hasEverCompleted: isCompleted };
              } else if (course.course_type === 'json') {
                const progressResponse = await api.get(`/courses/${course.id}/progress/`);
                const progressData = progressResponse.data;
                const isCompleted = progressData?.is_completed || false;
                const hasEverCompleted = progressData?.has_ever_completed || false;
                return { ...course, isCompleted, hasEverCompleted };
              }
            } catch (err) {
              console.error(`Error fetching data for course ${course.id}:`, err);
              return { ...course, isCompleted: false, hasEverCompleted: false };
            }
          })
        );

        coursesData = coursesData.filter(course => course.is_active);
        
        // Sortera egna kurser högre
        coursesData.sort((a, b) =>
          a.is_marketplace === b.is_marketplace
            ? 0
            : a.is_marketplace
            ? 1
            : -1
        );

        setCourses(coursesData);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Kunde inte hämta dina kurser. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchCourses, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSurpriseMe = () => {
    if (courses.length > 0) {
      const randomIndex = Math.floor(Math.random() * courses.length);
      const randomCourse = courses[randomIndex];
      if (randomCourse.course_type === 'scorm') {
        navigate(`/course/${randomCourse.id}/scorm`);
      } else if (randomCourse.course_type === 'json') {
        const token = localStorage.getItem('token');
        window.location.href = `https://player.agoge-lms.se/coursetobuy/${randomCourse.id}/?token=${token}`;
      }
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-6 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="flex gap-3 mt-6">
                    <div className="h-10 bg-gray-200 rounded flex-1"></div>
                    <div className="h-10 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Ett fel uppstod</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Försök igen
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-12 shadow-lg">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AcademicCapIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Välkommen till Agoge!</h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Du har inte köpt några kurser ännu. Utforska vårt omfattande utbud av kurser 
              och börja din lärresa redan idag.
            </p>
            <Link
              to="/market"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              <BookOpenIcon className="mr-3 h-6 w-6" />
              Utforska kurser
              <ArrowRightIcon className="ml-3 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const companyCourses = courses.filter(c => c.is_marketplace === false);
  const marketplaceCourses = courses.filter(c => c.is_marketplace === true);
  const completedCourses = courses.filter(c => c.hasEverCompleted).length;

  return (
    <section className=" w-full max-w-full py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-16 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mina kurser
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-600">
              <div className="flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">{courses.length} kurser totalt</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">{completedCourses} slutförda</span>
              </div>
              <div className="flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSurpriseMe}
            className="inline-flex cursor-pointer items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <SparklesIcon className="h-6 w-6 mr-3" />
            Överraska mig!
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </header>

        {/* Company Courses Section */}
        {companyCourses.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
              <div className="px-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                  Mina kurser
                  <span className="ml-3 bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                    {companyCourses.length}
                  </span>
                </h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {companyCourses.map(course => renderCourseCard(course))}
            </div>
          </div>
        )}

        {/* Marketplace Courses Section */}
        {marketplaceCourses.length > 0 && (
          <div>
            <div className="flex items-center mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
              <div className="px-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                  Övriga kurser
                  <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {marketplaceCourses.length}
                  </span>
                </h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {marketplaceCourses.map(course => renderCourseCard(course))}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  function renderCourseCard(course) {
    return (
      <article
        key={course.id}
        className={`group bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 transform ${
          hoveredCard === course.id 
            ? "shadow-2xl ring-2 ring-blue-500 -translate-y-2" 
            : "hover:shadow-xl hover:-translate-y-1"
        }`}
        onMouseEnter={() => setHoveredCard(course.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {course.image_url ? (
            <img
              src={course.image_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <BookOpenIcon className="w-16 h-16" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

          {/* Badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            
            {course.language && (
              <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                {course.language}
              </span>
            )}
          </div>

          {/* Completion Badge */}
          {course.hasEverCompleted && (
            <div className="absolute top-4 left-4 flex items-center bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow-lg">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Slutförd
            </div>
          )}

          {/* Company Course Badge */}
          {course.is_marketplace === false && (
            <div className="absolute bottom-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              🏢 Företagskurs
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h2>

          <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">
            {course.description || "Ingen beskrivning tillgänglig"}
          </p>

          {/* Course Info */}
          <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{course.time_to_complete || "Flexibel"} min</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Interaktiv</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {course.course_type === 'scorm' ? (
              <Link
                to={`/course/${course.id}/scorm`}
                className={`flex-1 cursor-pointer inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  course.hasEverCompleted
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                {course.hasEverCompleted ? "Repetera" : "Starta"}
              </Link>
            ) : (
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (course.course_type === 'json') {
                    window.location.href = `https://player.agoge-lms.se/coursetobuy/${course.id}/?token=${token}`;
                  } else {
                    console.warn(`Okänt kursformat för kurs ${course.id}: ${course.course_type}`);
                    setError('Okänt kursformat');
                  }
                }}
                className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  course.hasEverCompleted
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                {course.hasEverCompleted ? "Repetera" : "Starta"}
              </button>
            )}
            
            <Link
              to={`/course/${course.id}`}
              className="px-4 py-3 bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 hover:border-gray-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </article>
    );
  }
}