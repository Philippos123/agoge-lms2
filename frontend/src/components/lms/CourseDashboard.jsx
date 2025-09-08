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

        coursesData = coursesData.filter(course => course.is_active); // Add this line
        
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
      navigate(`/course/${randomCourse.id}/scorm`);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-10 bg-gray-200 rounded mt-6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          <AcademicCapIcon className="h-12 w-12 mx-auto text-blue-400 mb-3" />
          <h3 className="text-xl font-medium mb-2">Inga kurser hittades</h3>
          <p className="mb-4">
            Du har inte köpt några kurser ännu. Utforska vårt utbud för att
            hitta lämpliga utbildningar.
          </p>
          <Link
            to="/market"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Bläddra kurser <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const companyCourses = courses.filter(c => c.is_marketplace === false);
  const marketplaceCourses = courses.filter(c => c.is_marketplace === true);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mina kurser</h1>
          <p className="text-lg text-gray-600 mb-4">
            {courses.length} {courses.length === 1 ? "kurs" : "kurser"} pågående
          </p>
          <button
            onClick={handleSurpriseMe}
            className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Överraska mig!
          </button>
        </header>

        {/* Ditt företags kurser */}
        {companyCourses.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Ditt företags kurser
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {companyCourses.map(course => renderCourseCard(course))}
            </div>
          </div>
        )}

        {/* Divider */}
        {companyCourses.length > 0 && marketplaceCourses.length > 0 && (
          <div className="my-12">
            <hr className="border-t border-gray-200" />
          </div>
        )}

        {/* Marketplace-kurser */}
        {marketplaceCourses.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Övriga kurser
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
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
        className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 ${
          hoveredCard === course.id ? "shadow-xl ring-2 ring-blue-500" : "hover:shadow-lg"
        }`}
        onMouseEnter={() => setHoveredCard(course.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

          <span className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {course.language}
          </span>

          {course.hasEverCompleted && (
            <div className="absolute top-3 left-3 flex items-center bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Slutförd
            </div>
          )}

          {course.is_marketplace === false && (
            <div className="absolute bottom-3 left-3 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
              Ditt företags kurs
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 line-clamp-2 mb-2">
            {course.title}
          </h2>

          <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>

          <div className="flex items-center text-sm text-gray-500 mb-5">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>Ca {course.time_to_complete || "Flexibel tid"} Minuter</span>
          </div>

          <div className="flex space-x-3">
            {course.course_type === 'scorm' ? (
              <Link
                to={`/course/${course.id}/scorm`}
                className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-500 transition-colors"
              >
                {course.hasEverCompleted ? "Repetera kurs" : "Starta Kurs"}
              </Link>
            ) : (
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (course.course_type === 'json') {
                    // Navigera till JSON-spelaren med token i URL:en
                    window.location.href = `https://player.agoge-lms.se/coursetobuy/${course.id}/?token=${token}`;
                  } else {
                    console.warn(`Okänt kursformat för kurs ${course.id}: ${course.course_type}`);
                    setError('Okänt kursformat');
                  }
                }}
                className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-500 transition-colors"
              >
                {course.hasEverCompleted ? "Repetera kurs" : "Starta Kurs"}
              </button>
            )}
            <Link
              to={`/course/${course.id}`}
              className="flex-1 text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Detaljer
            </Link>
          </div>
        </div>
      </article>
    );
  }
}