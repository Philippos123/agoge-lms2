import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthService } from "../services/api"; // Importera AuthService

const API_URL = "http://localhost:8000/api/coursetobuy";
const ORDER_URL = "http://localhost:8000/api/orders/";

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser() || { isAdmin: false }; // Hämta användare och fallback för isAdmin

  const formatPrice = (price) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  useEffect(() => {
    fetch(`${API_URL}/${courseId}/`)
      .then((response) => response.json())
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching course:", error));
  }, [courseId]);

  if (loading) return <p>Laddar...</p>;
  if (!course) return <p>Kurs hittades inte.</p>;

  const handleBuyNow = () => {
    navigate(`/checkout/${courseId}/`);
  };

  const handleRequestCourse = () => {
    // Här lägger du logiken för att hantera begäran om kurs
    console.log(`Kurs med ID ${courseId} begärd av användare ${currentUser?.name || 'okänd'}`);
    // Du kanske vill skicka en API-förfrågan till din backend här
    alert("Din begäran om kursen har skickats!"); // En enkel feedback till användaren
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Kursbild */}
      <div className="mb-6">
        <img
          src={`http://localhost:8000${course.image_url}`}
          alt={course.title}
          className="w-full h-64 object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Kurs titel */}
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>

      {/* Kurs beskrivning */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Kursbeskrivning</h2>
        <p className="text-gray-700">{course.description}</p>
      </section>

      {/* Kurs info */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-lg font-semibold text-gray-900">Pris: {formatPrice(course.price)} </p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">Språk: {course.language_icon}</p>
        </div>
      </section>

      {/* Köp/Begär-knapp */}
      <div className="text-center">
        {currentUser?.isAdmin ? (
          <button
            onClick={handleBuyNow}
            className="px-8 py-3 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 transition-colors"
          >
            Köp nu
          </button>
        ) : (
          <button
            onClick={handleRequestCourse}
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition-colors"
          >
            Begär kurs
          </button>
        )}
      </div>
    </div>
  );
}