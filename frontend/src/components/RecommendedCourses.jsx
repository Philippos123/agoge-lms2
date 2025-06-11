import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function RecommendedCourses({ courses, companyBransch }) {
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

    const formatPrice = (price) => {
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
    };

  useEffect(() => {
    setIsLoading(true);
    // Simulera en laddningstid för bättre UX vid snabba nätverk
    const timer = setTimeout(() => {
      const filteredCourses = courses.filter(
        (course) => course.bransch_typ?.toLowerCase() === companyBransch?.toLowerCase()
      );
      setRecommendedCourses(filteredCourses);
      setIsLoading(false);
    }, 300);

    

    return () => clearTimeout(timer);
  }, [courses, companyBransch]);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <div className="animate-pulse flex space-x-4 w-full max-w-6xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 space-y-4 py-1">
              <div className="h-40 bg-gray-300 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendedCourses.length === 0) {
    return (
      <section className="p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Inga kurser hittades för din bransch
        </h2>
        <p className="text-gray-600 mb-6">
          Vi kunde inte hitta några kurser för "{companyBransch}". Kolla gärna vårt fulla utbud.
        </p>
        <Link 
          to="/market" 
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Se alla kurser
        </Link>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Rekommenderade kurser för{" "}
            <span className="text-blue-600 capitalize">{companyBransch}</span>
          </h2>
          <p className="text-lg text-gray-600">
            Handplockade utbildningar för din bransch
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendedCourses.slice(0, 3).map((course) => (
            <article
              key={course.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={`https://backend-agoge-5544956f8095.herokuapp.com${course.image_url}`}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {course.language}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(course.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {course.duration || 'Flexibel'}
                  </span>
                </div>

                <Link
                  to={`/course/${course.id}`}
                  className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-500 transition-colors"
                >
                  Visa kurs
                </Link>
              </div>
            </article>
          ))}
        </div>

        {recommendedCourses.length > 3 && (
          <div className="text-center mt-8">
            <Link
              to="/market"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Visa fler kurser ({recommendedCourses.length - 3} till)
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}