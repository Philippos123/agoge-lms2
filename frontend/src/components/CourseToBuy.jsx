import { useState } from "react";
import { Link } from "react-router-dom";

export default function CourseToBuy({ courses }) {
  // State for search, filter, and number of courses to display
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [visibleCourses, setVisibleCourses] = useState(4);

  const branschTypes = [
    "teknik",
    "vård",
    "handel",
    "service",
    "fordon",
    "industri",
    "bygg",
    "skola",
    "sälj",
    "ekonomi",
    "it",
    "transport",
    "annat",
  ];

  // Filter courses based on search term and filter
  const filteredCourses = courses.filter((course) => {
    const matchesSearchTerm =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterCategory =
      filterCategory === "" || course.bransch_typ === filterCategory;

    return matchesSearchTerm && matchesFilterCategory;
  });

  // Limit the number of courses displayed
  const coursesToDisplay = filteredCourses.slice(0, visibleCourses);

  // Funktion för att formatera priset
  const formatPrice = (price) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Utforska våra kurser
          </h2>
          <p className="text-lg text-gray-600">
            Hitta den perfekta utbildningen för dig eller ditt team
          </p>
        </header>

        {/* Search and filter controls */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Sök kurser
            </label>
            <input
              id="search"
              type="text"
              placeholder="Sök efter kurser..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrera efter bransch
            </label>
            <select
              id="filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alla branscher</option>
              {branschTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        {searchTerm || filterCategory ? (
          <div className="mb-6 text-gray-600">
            Visar {coursesToDisplay.length} av {filteredCourses.length} kurser
            {searchTerm && ` som matchar "${searchTerm}"`}
            {filterCategory && ` inom ${filterCategory}`}
          </div>
        ) : null}

        {/* Display filtered and searched courses */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Inga kurser hittades
            </h3>
            <p className="text-gray-600 mb-4">
              Försök med en annan sökterm eller ett annat filter
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Rensa filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {coursesToDisplay.map((course) => (
                <article
                  key={course.id}
                  className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={`http://localhost:8000/${course.image_url}`}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                        {course.title}
                      </h3>
                      {course.language && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {course.language}
                        </span>
                      )}
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

            {/* "See more" button */}
            {visibleCourses < filteredCourses.length && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleCourses(visibleCourses + 4)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-600 transition-colors"
                >
                  Visa fler kurser ({filteredCourses.length - visibleCourses} till)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}