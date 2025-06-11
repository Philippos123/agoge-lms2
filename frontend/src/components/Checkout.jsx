import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { post, get } from "../services/api";

const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState(["svenska"]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialVisibleLanguages = 3;

  useEffect(() => {
    const fetchCourseAndLanguages = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const headers = { Authorization: `Bearer ${token}` };
        
        const [courseResponse, languagesResponse] = await Promise.all([
          get(`/coursetobuy/${courseId}/`, { headers }),
          get('/languages/', { headers })
        ]);
        
        setCourse(courseResponse);
        setLanguageOptions(languagesResponse);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load course information. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndLanguages();
  }, [courseId, navigate]);

  const handleLanguageChange = (event) => {
    const { value, checked } = event.target;
    setSelectedLanguages((prevSelected) =>
      checked
        ? [...prevSelected, value]
        : prevSelected.filter((lang) => lang !== value)
    );
  };

  useEffect(() => {
    if (course && languageOptions.length > 0) {
      const additionalCost = selectedLanguages.reduce((acc, lang) => {
        const languageOption = languageOptions.find((option) => option.value === lang);
        return acc + (languageOption ? parseFloat(languageOption.price) : 0);
      }, 0);
      setTotalPrice(parseFloat(course.price) + additionalCost);
    }
  }, [selectedLanguages, course, languageOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user?.companyId) {
      setError("Company information is missing. Please contact support.");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      course: parseInt(courseId),
      languages: selectedLanguages,
      note: note.trim(),
      company: user.companyId,
    };

    try {
      await post("/orders/", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      navigate("/confirm");
    } catch (error) {
      console.error("Order Error:", error);
      setError(error.response?.data?.message || error.message || 'Order failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleLanguages = showAllLanguages
    ? languageOptions
    : languageOptions.slice(0, initialVisibleLanguages);

  if (loading) return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p>Loading course information...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{error}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Try Again
      </button>
    </div>
  );

  if (!course) return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
        <p>Course information could not be loaded.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Order Course</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-3 text-gray-800">{course.title}</h2>
        <p className="text-gray-600 mb-4">{course.description}</p>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">Base Price</h3>
          <p className="text-xl font-semibold text-blue-600">{course.price} kr</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">Select Languages</h3>
          
          <div className="space-y-2">
            {visibleLanguages.map((option) => (
              <label key={option.value} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={selectedLanguages.includes(option.value)}
                  onChange={handleLanguageChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {option.label} 
                  <span className="text-gray-500 ml-1">
                    ({option.price > 0 ? `+${option.price} kr` : 'included'})
                  </span>
                </span>
              </label>
            ))}
          </div>
          
          {languageOptions.length > initialVisibleLanguages && (
            <button
              type="button"
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={() => setShowAllLanguages(!showAllLanguages)}
            >
              {showAllLanguages ? "Show fewer languages" : `Show all ${languageOptions.length} languages`}
            </button>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="note" className="block text-gray-700 text-sm font-medium mb-2">
            Additional Notes (optional):
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Any special instructions or requirements..."
          />
        </div>

        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-medium text-gray-700">Total Price:</span>
            <span className="text-2xl font-bold text-blue-600">{totalPrice} kr</span>
          </div>
          <p className="text-sm text-gray-500">Prices include VAT.</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;