import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthService } from "../services/api";
import api from "../services/api";

const API_URL = "https://backend-agoge-5544956f8095.herokuapp.com/api/coursetobuy";
const ORDER_URL = "https://backend-agoge-5544956f8095.herokuapp.com/api/orders/";

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser() || { isAdmin: false };

  // Stäng notis automatiskt
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({...notification, show: false});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Hämta användarens kurser
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesResponse = await api.get('/user/courses/');
        setCourses(coursesResponse.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  // Hämta kursinfo
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/${courseId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      setCourse(data);
      setLoading(false);
    })
    .catch(() => {
      setError("Något gick fel vid hämtning av kursen. Försök igen senare.");
      setLoading(false);
    });
  }, [courseId]);

  const getOptimizedImageUrl = (url) => {
    const baseUrl = url.split('/upload/')[0];
    const publicId = url.split('/upload/')[1];
    return `${baseUrl}/upload/f_auto,q_auto,dpr_auto,w_400,h_400,c_fill/${publicId}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleBuyNow = () => {
    navigate(`/checkout/${courseId}/`);
  };

  const handleRequestCourse = async () => {
    setLoading(true);
    setNotification({ show: false, message: '', type: '' });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setNotification({
          show: true,
          message: "Du måste vara inloggad för att begära en kurs.",
          type: "error"
        });
        navigate("/login");
        return;
      }
      if (!courseId || isNaN(courseId)) {
        setNotification({
          show: true,
          message: "Ogiltigt kurs-ID. Försök igen.",
          type: "error"
        });
        return;
      }

      const courseIdInt = parseInt(courseId);
      const response = await fetch(`${ORDER_URL}course-requests/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: courseIdInt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Begäran misslyckades med status ${response.status}`);
      }

      setNotification({
        show: true,
        message: "Din begäran om kursen har skickats till din administratör!",
        type: "success"
      });
    } catch (error) {
      setNotification({
        show: true,
        message: `Något gick fel vid begäran av kursen: ${error.message}`,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Laddar...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!course) return <p>Kurs hittades inte.</p>;

  // Kolla om användaren äger kursen
  const userOwnsCourse = courses.some((userCourse) => userCourse.id === course.id);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Kursbild */}
      <div className="mb-6">
        <img
          src={course.image_url || "/default-image.jpg"}
          alt={course.title || "Kursbild"}
          className="w-full h-64 object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Titel */}
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title || "Kurs Titel Saknas"}</h1>

      {/* Beskrivning */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Kursbeskrivning</h2>
        <p className="text-gray-700">{course.description || "Ingen beskrivning tillgänglig."}</p>
      </section>

      {/* Info */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-lg font-semibold text-gray-900">Pris: {formatPrice(course.price)}</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">Språk: {course.language_icon || "Språk saknas"}</p>
        </div>
      </section>

      {/* Notis + Köp/Begär */}
      <div className="text-center relative">
        {notification.show && (
          <div className={`mb-4 p-3 rounded-md shadow-lg text-white ${
            notification.type === 'error' ? 'bg-red-500' : 
            notification.type === 'success' ? 'bg-green-500' : 
            'bg-blue-500'
          } transition-opacity duration-300`}>
            {notification.message}
            <button 
              onClick={() => setNotification({...notification, show: false})}
              className="float-right font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {userOwnsCourse ? (
          <p className="text-green-700 font-semibold">Du äger redan denna kurs</p>
        ) : currentUser?.isAdmin ? (
          <button
            onClick={handleBuyNow}
            className="px-8 py-3 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 transition-colors"
          >
            Köp nu
          </button>
        ) : (
          <button
                onClick={handleRequestCourse}
                disabled={loading}
                className={`px-8 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Skickar...' : 'Begär kurs'}
              </button>
            )}
      </div>
    </div>
  );
}
