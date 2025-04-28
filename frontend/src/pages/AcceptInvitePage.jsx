import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [password, setPassword] = useState('');
  const [otherQuestions, setOtherQuestions] = useState({});
  const [company, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [learningStyle, setLearningStyle] = useState(null);
  const [showLogo, setShowLogo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const logoRef = useRef(null);
  const registrationFormRef = useRef(null);
  const loadingAnimationRef = useRef(null);
  const mainContainerRef = useRef(null);
  const mounted = useRef(true);

  const learningStyles = [
    { id: 'visual', label: 'Visuellt' },
    { id: 'auditory', label: 'Auditivt (genom att lyssna)' },
    { id: 'kinesthetic', label: 'Kinestetiskt (genom att göra)' },
    { id: 'readingWriting', label: 'Genom att läsa och skriva' },
  ];

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get(`/accept-invite/${token}/`);
        if (response.data.message === 'Användare behöver skapa ett konto.') {
          setMessage(response.data.message);
          setEmail(response.data.email);
          setShowRegistrationForm(true);
          if (response.data.company_name) {
            setCompanyName(response.data.company_name);
            setCompanyId(response.data.company_id);
          }
          if (response.data.company_logo_url) {
            const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:8000';
            setCompanyLogoUrl(baseURL + response.data.company_logo_url);
          }
        } else if (response.data.message) {
          setMessage(response.data.message);
          if (response.data.company_name) {
            setCompanyName(response.data.company_name);
            setCompanyId(response.data.company_id);
          }
        } else if (response.data.error) {
          setError(response.data.error);
        }
      } catch (error) {
        setError('Kunde inte verifiera inbjudningslänken.');
        console.error('Fel vid verifiering av inbjudningslänk:', error);
      }
    };
    verifyToken();
  }, [token]);

  const animateLoading = () => {
    gsap.to(loadingAnimationRef.current, { opacity: 1, duration: 2.3 });
    gsap.to(loadingAnimationRef.current.querySelector('.loader-circle'), {
      rotation: 360,
      duration: 2,
      repeat: -1,
      ease: "linear"
    });
  };

  const handleLearningStyleSelect = (selectedId) => {
    setLearningStyle(selectedId);
  };

  useEffect(() => {
    if (showLogo && logoRef.current && imageLoaded) {
      gsap.set(logoRef.current, {
        opacity: 0,
        scale: 0.3,
        y: 100,
        filter: "drop-shadow(0 0 0px rgba(255, 215, 0, 0))"
      });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" }
      });

      // 1. Intro-animation (kortare)
      tl.to(logoRef.current, {
        opacity: 1,
        scale: 1.1,
        y: 0,
        duration: 1.2, // Kortare från 1.2
      })

        // 2. Konfetti kommer direkt efter intro (ingen lång pulsering först)
        .call(() => {
          const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

          for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            Object.assign(confetti.style, {
              left: `${Math.random() * 100}vw`,
              top: '-10px',
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              position: 'fixed',
              zIndex: '1000',
              borderRadius: '50%',
              pointerEvents: 'none'
            });
            document.body.appendChild(confetti);

            gsap.to(confetti, {
              y: window.innerHeight + 50,
              rotation: Math.random() * 360,
              x: `+=${(Math.random() - 0.5) * 80}`,
              opacity: 0,
              duration: Math.random() * 2 + 1,
              delay: Math.random() * 0.3,
              ease: "power1.out",
              onComplete: () => confetti.remove()
            });
          }
        }, undefined, "-=0.3") // Starta 0.3s FÖRE slutet av föregående animation

        // 3. Pulsering sker SAMTIDIGT med konfetti
        .to(logoRef.current, {
          filter: [
            "drop-shadow(0 0 30px rgba(255, 255, 255, 0.8))",
            "drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))"
          ],
          duration: 1.2,
          repeat: 1, // Färre repetitioner
          yoyo: true,
          ease: "sine.inOut"
        }, "-=0.5") // Starta 0.5s innan detta segment börjar

        // 4. Avslut
        .to(logoRef.current, {
          filter: "drop-shadow(0 0 60px rgba(255, 255, 255, 0.9))",
          duration: 0.25
        })
        .to(logoRef.current, {
          filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))",
          duration: 0.45
        })

        // 5. Navigering
        .to(logoRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => navigate('/dashboard', { replace: true })
        });

      return () => {
        tl.kill();
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
          if (el.style.zIndex === '1000') el.remove();
        });
      };
    }
  }, [showLogo, imageLoaded, navigate]);

  const handleRegistration = async (event) => {
    event.preventDefault();
    setIsRegistering(true);
    animateLoading();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('invite_token', token);
    formData.append('learning_style', learningStyle); // Här lägger du till learningStyle
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    if (profileImage) {
      formData.append('profile_img', profileImage); // Använd 'profile_img' här

    }
    for (const key in otherQuestions) {
      formData.append(key, otherQuestions[key]);
    }
    try {
      const response = await api.post('/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Viktigt för filuppladdning
        },
      });
      setMessage('Registrering lyckades! Du kommer nu att omdirigeras...');

      // Fade out form
      await gsap.to(mainContainerRef.current, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          setShowRegistrationForm(false);
          setShowLogo(true);
        }
      });

    } catch (error) {
      setError('Registrering misslyckades.');
      console.error('Fel vid registrering:', error);
      setIsRegistering(false);
      gsap.to(loadingAnimationRef.current, { opacity: 0, duration: 0.3 });
      if (error.response?.data) {
        setError(error.response.data.error || 'Registrering misslyckades.');
      }
      gsap.to(mainContainerRef.current, { opacity: 1, duration: 0.3, delay: 0.5 });
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, files } = event.target;
    if (name === 'password') {
      setPassword(value);
    } else if (name === 'firstName') {
      setFirstName(value);
    } else if (name === 'lastName') {
      setLastName(value);
    } else if (type === 'file' && name === 'profileImage') {
      setProfileImage(files[0]);
    } else if (otherQuestions.hasOwnProperty(name)) {
      setOtherQuestions(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-conic-280 from-blue-400 via-indigo-50 to-blue-400 py-12 px-4 sm:px-6 lg:px-8 flex relative overflow-hidden justify-center items-center">
      {companyLogoUrl && showLogo && (
        <div
          ref={logoRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0 }}
        >
          <img
            src={companyLogoUrl}
            alt={`${company} logotyp`}
            className="h-96 w-auto max-w-[90vw]"
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      <div
        ref={mainContainerRef}
        className="max-w-md w-full bg-white shadow-md rounded-lg p-8 relative"
        style={{ opacity: showRegistrationForm ? 1 : 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Acceptera Inbjudan till {company}</h1>
        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {showRegistrationForm && (
          <form ref={registrationFormRef} onSubmit={handleRegistration} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                E-post:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">
                Förnamn:
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={handleInputChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">
                Efternamn:
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={handleInputChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Lösenord:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="profileImage" className="block text-gray-700 text-sm font-bold mb-2">
                Profilbild (valfritt):
              </label>
              <input
                type="file"
                id="profileImage"
                name="profileImage"
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <div className="space-y-2">
                <h2 className="text-gray-700 text-sm font-bold mb-2">Hur lär du dig bäst?</h2>
                <div className="flex flex-wrap gap-2">
                  {learningStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={`rounded-md bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-800 shadow-sm  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${learningStyle === style.id ? 'bg-indigo-500 text-white' : 'hover:bg-gray-300'}`}
                      onClick={() => handleLearningStyleSelect(style.id)}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-800 to-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={isRegistering || !learningStyle}
            >
              {isRegistering ? 'Registrerar...' : 'Registrera dig'}
            </button>
          </form>
        )}

        {/* Loading animation */}
        <div
          ref={loadingAnimationRef}
          className="opacity-0 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center flex-col"
        >
          <div className="loader-circle border-t-4 border-blue-500 border-solid rounded-full h-12 w-12"></div>
        </div>
      </div>
    </div>
  );
}
export default AcceptInvitePage;