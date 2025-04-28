import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from './../services/api';
import './../services/scormApiWrapper'; // Se till att wrappern laddas HÄR

export default function ScormPlayer() {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const newWindow = useRef(null); // Använd useRef för fönsterreferens

  useEffect(() => {
    const fetchAvailableLanguages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/coursetobuy/${courseId}/available_languages/`);
        if (response.data && response.data.languages) {
          setAvailableLanguages(response.data.languages);
        } else {
          setError({ message: 'Could not fetch available languages.' });
        }
      } catch (err) {
        setError({
          message:
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            'Failed to fetch available languages.',
        });
        console.error('Error fetching available languages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableLanguages();
  }, [courseId]);

  const openScormInLanguage = async (languageCode) => {
    setError(null);
    console.log("openScormInLanguage CALLED with languageCode:", languageCode);
    try {
      const response = await api.get(`/coursetobuy/${courseId}/scorm/launch/${languageCode}/`);
      if (response.data && response.data.scorm_url) {
        const win = window.open(response.data.scorm_url, '_blank');
        newWindow.current = win; // Uppdatera referensen
        console.log("openScormInLanguage: SCORM window opened:", win);
  
        // Försök att exponera API när det nya fönstret har öppnats (med fördröjning)
        if (win) {
          console.log("openScormInLanguage: New window object:", win); // Kontrollera fönsterobjektet
          setTimeout(() => {
            try {
              win.API = window.API;
              win.API_1483_2004_API = window.API;
              console.log("openScormInLanguage: Försöker koppla API:", window.API);
              console.log("openScormInLanguage: SCORM API kopplat till det nya fönstret (med fördröjning).");
            } catch (error) {
              console.error("openScormInLanguage: Kunde inte koppla SCORM API till det nya fönstret (med fördröjning):", error);
            }
            if (win.API) {
              console.log("openScormInLanguage: win.API efter tilldelning:", win.API); // Kontrollera om tilldelningen lyckades
            } else {
              console.log("openScormInLanguage: win.API är fortfarande null eller undefined.");
            }
          }, 500);
        }
      } else {
        setError({ message: 'Could not get SCORM URL for the selected language.' });
        console.log("openScormInLanguage: Error getting SCORM URL.");
      }
    } catch (err) {
      setError({
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to launch SCORM content.',
      });
      console.error('openScormInLanguage: Error launching SCORM:', err);
    }
  };

  if (loading) return <div>Loading course languages...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (availableLanguages.length === 0) return <div>No languages available for this course.</div>;

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="bg-gradient-to-r from-blue-950 to-gray-950/70 h-full flex items-center justify-center text-white text-center flex-col p-4">
        <div className="scorm-container bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-xl mb-6">
          <h2 className="text-4xl font-semibold py-4">Choose Language</h2>
          <p className="text-lg mb-4">Select the language to start the course:</p>

          <div className="flex justify-center gap-4">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => openScormInLanguage(lang.code)}
                className="bg-gradient-to-r from-green-800 to-green-400 hover:bg-green-600 text-white rounded-xl py-3 px-6 transition ease-in-out duration-300 shadow-lg transform hover:scale-105 cursor-pointer"
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}