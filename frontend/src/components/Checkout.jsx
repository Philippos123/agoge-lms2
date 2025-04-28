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
  const [totalPrice, setTotalPrice] = useState(0);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const initialVisibleLanguages = 3;

  useEffect(() => {
    const fetchCourseAndLanguages = async () => {
      setLoading(true);
      try {
        const courseResponse = await get(`/coursetobuy/${courseId}/`);
        setCourse(courseResponse);
        const languagesResponse = await get('/languages/');
        setLanguageOptions(languagesResponse);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchCourseAndLanguages();
  }, [courseId]);

  const handleLanguageChange = (event) => {
    const { value, checked } = event.target;
    setSelectedLanguages((prevSelected) =>
      checked
        ? [...prevSelected, value]
        : prevSelected.filter((lang) => lang !== value)
    );
  };

  useEffect(() => {
    const additionalCost = selectedLanguages.reduce((acc, lang) => {
      const languageOption = languageOptions.find((option) => option.value === lang);
      return acc + (languageOption ? parseFloat(languageOption.price) : 0);
    }, 0);
    setTotalPrice(course ? parseFloat(course.price) + additionalCost : additionalCost);
  }, [selectedLanguages, course, languageOptions]);

  const handleSubmit = async () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const companyId = user?.companyId;

    const orderData = {
      course: parseInt(courseId),
      languages: selectedLanguages,
      note: note,
      company: companyId,
    };

    try {
      const response = await post("/orders/", orderData);
      console.log(response);
      navigate("/confirm");
    } catch (error) {
      console.error("Error:", error);
      alert(`Order failed: ${error.message || 'Kunde inte lägga order.'}`);
    }
  };

  const visibleLanguages = showAllLanguages
    ? languageOptions
    : languageOptions.slice(0, initialVisibleLanguages);

  if (loading) return <p>Laddar information...</p>;
  if (!course) return <p>Kursinformation kunde inte hämtas.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Beställ Kurs</h1>
      <div>
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">{course.title}</h2>
          <p>{course.description}</p>

          <div className="block">
            <span>Välj Språk:</span>
            {visibleLanguages.map((option) => (
              <label key={option.value} className="block">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={selectedLanguages.includes(option.value)}
                  onChange={handleLanguageChange}
                  className="mr-2"
                />
                {option.label} ({option.price > 0 ? `+${option.price} kr` : 'ingår'})
              </label>
            ))}
            {languageOptions.length > initialVisibleLanguages && (
              <button
                type="button"
                className="text-blue-500 hover:underline cursor-pointer mt-2"
                onClick={() => setShowAllLanguages(!showAllLanguages)}
              >
                {showAllLanguages ? "Visa färre språk" : "Visa fler språk"}
              </button>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="note" className="block text-gray-700 text-sm font-bold mb-2">
              Anteckningar (valfritt):
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus-shadow-outline"
          >
            Lägg till beställning
          </button>
          <p className="text-xl font-bold text-blue-900">Pris: {totalPrice} kr</p>
          <p className="text-sm text-gray-500">Obs: Priser är inklusive moms.</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;