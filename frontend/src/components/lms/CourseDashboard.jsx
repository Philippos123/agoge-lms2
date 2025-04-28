import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { ClockIcon, AcademicCapIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user/courses/');
        setCourses(response.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Kunde inte hämta dina kurser. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    };
    
    // Simulera laddningstid för bättre UX
    const timer = setTimeout(fetchCourses, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
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
          <p className="mb-4">Du har inte köpt några kurser ännu. Utforska vårt utbud för att hitta lämpliga utbildningar.</p>
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

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mina kurser</h1>
          <p className="text-lg text-gray-600">
            {courses.length} {courses.length === 1 ? 'kurs' : 'kurser'} pågående
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {courses.map((course) => (
            <article
              key={course.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300${
                hoveredCard === course.id ? 'shadow-xl ring-2 ring-blue-500' : 'hover:shadow-lg'
              }`}
              onMouseEnter={() => setHoveredCard(course.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={`http://localhost:8000/${course.image_url}`}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                <span className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {course.language}
                </span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-2">
                    {course.title}
                  </h2>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-5">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>Ca {course.time_to_complete || 'Flexibel tid'} Minuter</span>
                </div>

                <div className="flex space-x-3">
                  <Link
                    to={`/course/${course.id}/scorm`}
                    className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-500 transition-colors"
                  >
                    Fortsätt studera
                  </Link>
                  <Link
                    to={`/course/${course.id}`}
                    className="flex-1 text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Detaljer
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}