import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ScormPlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [scormUrl, setScormUrl] = useState(null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const scormWindowRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hämta användar-ID från localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || 'anonymous';

        // Hämta tillgängliga språk
        const languagesResponse = await api.get(`/coursetobuy/${courseId}/available_languages/`);
        setAvailableLanguages(languagesResponse.data?.languages || []);

        // Hämta SCORM-data för att kontrollera slutförandestatus
        const scormResponse = await api.get(`https://backend-agoge-5544956f8095.herokuapp.com/api/scorm/get-data/?courseId=${courseId}`);
        const scormData = scormResponse.data || [];
        const userProgress = scormData.find(
          (entry) => entry.user_id === userId && entry.progress_data
        );
        const isCompleted = userProgress?.progress_data?.["cmi.completion_status"] === "completed";
        setIsCourseCompleted(isCompleted);

        // Hämta rekommenderade kurser
        const recommendedResponse = await api.get(`/courses/${courseId}/recommended/`);
        setRecommendedCourses(recommendedResponse.data?.courses || []);
      } catch (err) {
        setError({
          message:
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            'Misslyckades med att hämta data.',
        });
        console.error('Fel vid hämtning av data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  useEffect(() => {
    const handleScormMessage = (event) => {
      const allowedOrigins = [
        'https://backend-agoge-5544956f8095.herokuapp.com',
        'https://roaring-dragon-c80381.netlify.app',
        'http://localhost:5173',
      ];
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Ogiltig ursprung:', event.origin);
        return;
      }
      const { type, payload, messageId } = event.data;
      if (!type || !messageId) return;
      console.log(`Mottog SCORM-meddelande:`, { type, payload, messageId });

      if (type === 'OpenerMessage') {
        console.log('Mottog öppnarmeddelande:', payload);
      } else if (type === 'ScormComplete') {
        console.log('SCORM-session slutförd');
        setIsCourseCompleted(true);
        setScormUrl(null);
        setSelectedLanguage(null);
        if (scormWindowRef.current && !scormWindowRef.current.closed) {
          scormWindowRef.current.close();
        }
        scormWindowRef.current = null;
      } else {
        console.warn('Ohanterad meddelandetyp:', type);
      }
    };

    window.addEventListener('message', handleScormMessage);
    return () => window.removeEventListener('message', handleScormMessage);
  }, []);

  const handleLaunchScorm = async (languageCode) => {
    try {
      setLoading(true);
      setError(null);
      setIsCourseCompleted(false);

      scormWindowRef.current = window.open('', '_blank');
      if (!scormWindowRef.current) {
        throw new Error('Pop-up blockerad. Vänligen tillåt pop-ups för denna webbplats och försök igen.');
      }

      scormWindowRef.current.document.write(`
        <html>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0;">
            <h1>Laddar SCORM-kurs...</h1>
          </body>
        </html>
      `);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || 'anonymous';

      await api.post('/scorm/set-user-cookie/', { user_id: userId }, {
        withCredentials: true,
      });

      const response = await api.get(`/coursetobuy/${courseId}/scorm/launch/${languageCode}/`);

      if (!response.data?.scorm_url) {
        scormWindowRef.current.close();
        throw new Error('Ingen SCORM-URL mottogs');
      }

      const scormUrlWithUserId = `${response.data.scorm_url}?userId=${encodeURIComponent(userId)}`;
      scormWindowRef.current.location.href = scormUrlWithUserId;

      const checkWindowClosed = setInterval(() => {
        if (scormWindowRef.current?.closed) {
          clearInterval(checkWindowClosed);
          setScormUrl(null);
          setSelectedLanguage(null);
          scormWindowRef.current = null;
          // Kontrollera slutförandestatus igen när fönstret stängs
          const checkCompletion = async () => {
            try {
              const scormResponse = await api.get(`https://backend-agoge-5544956f8095.herokuapp.com/api/scorm/get-data/?courseId=${courseId}`);
              const scormData = scormResponse.data || [];
              const userProgress = scormData.find(
                (entry) => entry.user_id === userId && entry.progress_data
              );
              const isCompleted = userProgress?.progress_data?.["cmi.completion_status"] === "completed";
              setIsCourseCompleted(isCompleted);
            } catch (err) {
              console.error('Fel vid kontroll av slutförandestatus:', err);
            }
          };
          checkCompletion();
        }
      }, 1000);

      setSelectedLanguage(languageCode);
      setScormUrl(scormUrlWithUserId);
    } catch (error) {
      if (scormWindowRef.current && !scormWindowRef.current.closed) {
        scormWindowRef.current.close();
      }
      setError({
        message: error.message || 'Misslyckades med att starta SCORM.',
      });
      console.error('Fel vid start av SCORM:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedLanguage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Laddar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-100/90 backdrop-blur-sm border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center max-w-md w-full">
          <strong className="text-lg">Fel:</strong> {error.message}
          {error.message.includes('Pop-up blockerad') && (
            <div className="mt-4">
              <p className="text-sm mb-3">
                Tillåt pop-up-fönster i webbläsarens inställningar eller klicka på pop-up-blockeringsikonen i adressfältet.
              </p>
              <button
                onClick={() => handleLaunchScorm(selectedLanguage || availableLanguages[0]?.code)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-300 ring-1 ring-blue-500"
              >
                Försök igen
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (availableLanguages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-xl text-white bg-white/10 backdrop-blur-md rounded-lg p-6">
          Inga språk tillgängliga för denna kurs.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 relative overflow-hidden">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Tillbaka-knapp */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 py-2 px-4 rounded-lg transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Tillbaka
      </button>

      <div className="container mx-auto flex flex-col items-center min-h-screen py-12 px-4">
        {isCourseCompleted ? (
          // Vyn efter kursens slutförande
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-2xl w-full shadow-xl text-center transition-all duration-300">
            <h1 className="text-2xl font-bold text-white mb-4">Grattis, du har slutfört kursen!</h1>
            <p className="text-white/90 text-base mb-6">
              Bra jobbat! Du kan starta om kursen eller fortsätta med andra kurser.
            </p>
            <p className='text-white/90 mb-6 text-sm'>Du hittar ditt certifikat i din profil</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <button
                onClick={() => {
                  setIsCourseCompleted(false);
                  setSelectedLanguage(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-all duration-300 ring-1 ring-blue-500"
              >
                Repetera kurs
              </button>
              <button
                onClick={() => navigate('/course-dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition-all duration-300 ring-1 ring-green-500"
              >
                Tillbaka till kurser
              </button>
            </div>
            {recommendedCourses.length > 0 && (
              <div className="mt-16 max-w-2xl w-full">
                <h2 className="text-lg font-medium text-white/80 mb-4 text-center">
                  Andra kurser du kanske gillar
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white/[0.03] rounded-lg p-4 transition-all duration-300 border border-white/10"
                    >
                      <h3 className="text-base font-medium text-white mb-1">{course.title}</h3>
                      <p className="text-gray-400 text-xs line-clamp-2 mb-2">{course.description}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-400">Ca {course.time_to_complete} min</span>
                        <span className="text-yellow-400">{course.level}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/course/${course.id}/scorm`)}
                        className="mt-2 text-blue-400 hover:underline text-xs"
                      >
                        Visa kurs
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : !selectedLanguage ? (
          // Språkvalsvy (utan rekommenderade kurser)
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-2xl w-full shadow-xl transition-all duration-300">
            <h1 className="text-2xl font-bold text-white mb-4 text-center">Välj språk</h1>
            <p className="text-white/80 text-base mb-6 text-center">
              Obs: Se till att pop-up-fönster är tillåtna i din webbläsare för att starta kursen.
            </p>
            <div className="space-y-4">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLaunchScorm(lang.code)}
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-lg transition-all duration-300 text-white font-medium ring-1 ring-blue-500
                    ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // SCORM körs-vy
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-2xl w-full shadow-xl text-center transition-all duration-300">
            <h1 className="text-2xl font-bold text-white mb-4">SCORM-kurs körs</h1>
            <p className="text-white/80 text-base mb-6">
              Kursen körs i ett nytt fönster. Slutför kursen eller stäng fönstret för att återvända.
            </p>
            <button
              onClick={() => {
                if (scormWindowRef.current && !scormWindowRef.current.closed) {
                  scormWindowRef.current.close();
                }
                setScormUrl(null);
                setSelectedLanguage(null);
                scormWindowRef.current = null;
                // Kontrollera slutförandestatus vid stängning
                const checkCompletion = async () => {
                  try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const userId = user.id || 'anonymous';
                    const scormResponse = await api.get(`https://backend-agoge-5544956f8095.herokuapp.com/api/scorm/get-data/?courseId=${courseId}`);
                    const scormData = scormResponse.data || [];
                    const userProgress = scormData.find(
                      (entry) => entry.user_id === userId && entry.progress_data
                    );
                    const isCompleted = userProgress?.progress_data?.["cmi.completion_status"] === "completed";
                    setIsCourseCompleted(isCompleted);
                  } catch (err) {
                    console.error('Fel vid kontroll av slutförandestatus:', err);
                  }
                };
                checkCompletion();
              }}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg transition-all duration-300 ring-1 ring-red-500"
            >
              Stäng kurs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}