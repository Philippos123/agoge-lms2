import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuroraBackground } from '../components/ui/aurora-invite';

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
const [confirmPassword, setConfirmPassword] = useState('');
const [gender, setGender] = useState('');
const [otherQuestions, setOtherQuestions] = useState({});
const [company, setCompanyName] = useState('');
const [companyId, setCompanyId] = useState('');
const [companyLogoUrl, setCompanyLogoUrl] = useState('');
const [isRegistering, setIsRegistering] = useState(false);
const [learningStyle, setLearningStyle] = useState(null);
const [showLogo, setShowLogo] = useState(false);
const [imageLoaded, setImageLoaded] = useState(false);
const [currentStep, setCurrentStep] = useState(1);
const logoRef = useRef(null);
const registrationFormRef = useRef(null);
const loadingAnimationRef = useRef(null);
const mainContainerRef = useRef(null);
const mounted = useRef(true);

const learningStyles = [
  { id: 'visual', label: 'Visuellt', icon: '👁️', description: 'Lär genom bilder och diagram' },
  { id: 'auditory', label: 'Auditivt', icon: '👂', description: 'Lär genom att lyssna' },
  { id: 'kinesthetic', label: 'Kinestetiskt', icon: '✋', description: 'Lär genom att göra' },
  { id: 'readingWriting', label: 'Läsa/Skriva', icon: '📚', description: 'Lär genom text och anteckningar' },
];

const genderOptions = [
  { value: 'man', label: 'Man' },
  { value: 'kvinna', label: 'Kvinna' },
  { value: 'annat', label: 'Annat' },
  { value: 'vill_ej_uppge', label: 'Vill ej uppge' },
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
          const logoUrl = response.data.company_logo_url;
          console.log('company_logo_url from API:', logoUrl);
          if (logoUrl.match(/^https?:\/\//)) {
            setCompanyLogoUrl(logoUrl);
          } else if (logoUrl.startsWith('http//') || logoUrl.startsWith('https//')) {
            setCompanyLogoUrl(logoUrl.replace(/^http\/\//, 'http://').replace(/^https\/\//, 'https://'));
          } else {
            const baseURL = api.defaults.baseURL
              ? api.defaults.baseURL.replace(/\/api\/?$/, '')
              : 'https://backend-agoge-5544956f8095.herokuapp.com';
            setCompanyLogoUrl(`${baseURL}/${logoUrl.replace(/^\//, '')}`);
          }
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

useEffect(() => {
  if (isRegistering && loadingAnimationRef.current) {
    gsap.to(loadingAnimationRef.current, { opacity: 1, duration: 0.5 });
    const loader = loadingAnimationRef.current.querySelector('.loader-circle');
    if (loader) {
      gsap.to(loader, {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: 'linear',
      });
    }
  } else if (loadingAnimationRef.current) {
    gsap.to(loadingAnimationRef.current, { opacity: 0, duration: 0.3 });
  }
}, [isRegistering]);

const handleLearningStyleSelect = (selectedId) => {
  setLearningStyle(selectedId);
};

const handleGenderSelect = (selectedGender) => {
  setGender(selectedGender);
};

const nextStep = () => {
  setCurrentStep(prev => Math.min(prev + 1, 3));
};

const prevStep = () => {
  setCurrentStep(prev => Math.max(prev - 1, 1));
};

const isStep1Valid = firstName && lastName && password && confirmPassword && password === confirmPassword;
const isStep2Valid = gender && learningStyle;

useEffect(() => {
  if (showLogo && logoRef.current && imageLoaded) {
    gsap.set(logoRef.current, {
      opacity: 0,
      scale: 0.3,
      y: 100,
      filter: 'drop-shadow(0 0 0px rgba(255, 215, 0, 0))',
    });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
    });

    tl.to(logoRef.current, {
      opacity: 1,
      scale: 1.1,
      y: 0,
      duration: 1.2,
    })
      .call(
        () => {
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
              pointerEvents: 'none',
            });
            document.body.appendChild(confetti);

            gsap.to(confetti, {
              y: window.innerHeight + 50,
              rotation: Math.random() * 360,
              x: `+=${(Math.random() - 0.5) * 80}`,
              opacity: 0,
              duration: Math.random() * 2 + 1,
              delay: Math.random() * 0.3,
              ease: 'power1.out',
              onComplete: () => confetti.remove(),
            });
          }
        },
        undefined,
        '-=0.3'
      )
      .to(
        logoRef.current,
        {
          filter: [
            'drop-shadow(0 0 30px rgba(255, 255, 255, 0.8))',
            'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))',
          ],
          duration: 1.2,
          repeat: 1,
          yoyo: true,
          ease: 'sine.inOut',
        },
        '-=0.5'
      )
      .to(logoRef.current, {
        filter: 'drop-shadow(0 0 60px rgba(255, 255, 255, 0.9))',
        duration: 0.25,
      })
      .to(logoRef.current, {
        filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))',
        duration: 0.45,
      })
      .to(logoRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => navigate('/dashboard', { replace: true }),
      });

    return () => {
      tl.kill();
      document.querySelectorAll('div[style*="position: fixed"]').forEach((el) => {
        if (el.style.zIndex === '1000') el.remove();
      });
    };
  }
}, [showLogo, imageLoaded, navigate]);

const handleRegistration = async (event) => {
  event.preventDefault();
  setIsRegistering(true);

  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('invite_token', token);
  formData.append('learning_style', learningStyle);
  formData.append('first_name', firstName);
  formData.append('last_name', lastName);
  formData.append('gender', gender);
  if (profileImage) {
    formData.append('profile_img', profileImage);
  }
  for (const key in otherQuestions) {
    formData.append(key, otherQuestions[key]);
  }
  try {
    const response = await api.post('/register/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    setMessage('Registrering lyckades! Du kommer nu att omdirigeras...');

    await gsap.to(mainContainerRef.current, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        setShowRegistrationForm(false);
        setShowLogo(true);
      },
    });
  } catch (error) {
    setError('Registrering misslyckades.');
    console.error('Fel vid registrering:', error);
    setIsRegistering(false);
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
  } else if (name === 'confirmPassword') {
    setConfirmPassword(value);
  } else if (name === 'firstName') {
    setFirstName(value);
  } else if (name === 'lastName') {
    setLastName(value);
  } else if (type === 'file' && name === 'profileImage') {
    setProfileImage(files[0]);
  } else if (otherQuestions.hasOwnProperty(name)) {
    setOtherQuestions((prev) => ({ ...prev, [name]: value }));
  }
};

const renderStepIndicator = () => (
  <div className="flex justify-center mb-8">
    <div className="flex items-center space-x-4">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              currentStep >= step
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 3 && (
            <div
              className={`w-8 h-1 transition-all duration-300 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const renderStep1 = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
      Grundläggande information
    </h2>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
          Förnamn *
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={firstName}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Ditt förnamn"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
          Efternamn *
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={lastName}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Ditt efternamn"
        />
      </div>
    </div>

    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
        E-post
      </label>
      <input
        type="email"
        id="email"
        value={email}
        readOnly
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
      />
    </div>

    <div>
      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
        Lösenord *
      </label>
      <input
        type="password"
        id="password"
        name="password"
        value={password}
        onChange={handleInputChange}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        placeholder="Välj ett säkert lösenord"
      />
    </div>

    <div>
      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-950 mb-2">
        Bekräfta lösenord *
      </label>
      <input
        type="password"
        id="confirmPassword"
        name="confirmPassword"
        value={confirmPassword}
        onChange={handleInputChange}
        required
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
          confirmPassword && password !== confirmPassword
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
        placeholder="Upprepa ditt lösenord"
      />
      {confirmPassword && password !== confirmPassword && (
        <p className="text-red-500 text-sm mt-1">Lösenorden matchar inte</p>
      )}
    </div>

    <button
      type="button"
      onClick={nextStep}
      disabled={!isStep1Valid}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
    >
      Nästa steg
    </button>
  </div>
);

const renderStep2 = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
      Personlig information
    </h2>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Kön *
      </label>
      <div className="grid grid-cols-2 gap-3">
        {genderOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`p-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              gender === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
            onClick={() => handleGenderSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Hur lär du dig bäst? *
      </label>
      <div className="grid grid-cols-1 gap-3">
        {learningStyles.map((style) => (
          <button
            key={style.id}
            type="button"
            className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
              learningStyle === style.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleLearningStyleSelect(style.id)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{style.icon}</span>
              <div>
                <div className={`font-semibold ${learningStyle === style.id ? 'text-blue-700' : 'text-gray-800'}`}>
                  {style.label}
                </div>
                <div className={`text-sm ${learningStyle === style.id ? 'text-blue-600' : 'text-gray-600'}`}>
                  {style.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>

    <div className="flex space-x-4">
      <button
        type="button"
        onClick={prevStep}
        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
      >
        Tillbaka
      </button>
      <button
        type="button"
        onClick={nextStep}
        disabled={!isStep2Valid}
        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
      >
        Nästa steg
      </button>
    </div>
  </div>
);

const renderStep3 = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
      Slutför registrering
    </h2>

    <div>
      <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
        Profilbild (valfritt)
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="profileImage"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
            >
              <span>Ladda upp en fil</span>
              <input
                id="profileImage"
                name="profileImage"
                type="file"
                className="sr-only"
                onChange={handleInputChange}
                accept="image/*"
              />
            </label>
            <p className="pl-1">eller dra och släpp</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF upp till 10MB</p>
          {profileImage && (
            <p className="text-sm text-green-600 font-medium">
              ✓ {profileImage.name}
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-2">Sammanfattning:</h3>
      <div className="space-y-1 text-sm text-gray-600">
        <p><span className="font-medium">Namn:</span> {firstName} {lastName}</p>
        <p><span className="font-medium">E-post:</span> {email}</p>
        <p><span className="font-medium">Kön:</span> {genderOptions.find(g => g.value === gender)?.label}</p>
        <p><span className="font-medium">Lärstil:</span> {learningStyles.find(l => l.id === learningStyle)?.label}</p>
      </div>
    </div>

    <div className="flex space-x-4">
      <button
        type="button"
        onClick={prevStep}
        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
      >
        Tillbaka
      </button>
      <button
        type="submit"
        disabled={isRegistering}
        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
      >
        {isRegistering ? 'Registrerar...' : 'Slutför registrering'}
      </button>
    </div>
  </div>
);

return (
  <AuroraBackground>
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex relative overflow-hidden justify-center items-center">
      <div
        ref={mainContainerRef}
        className="max-w-lg w-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-8 relative z-20 border border-white/20"
        style={{ opacity: showRegistrationForm ? 1 : 0 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-950 bg-clip-text text-transparent mb-2">
          Acceptera inbjudan till <span className="font-semibold text-gray-800">{company}</span>
          </h2>
          
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {showRegistrationForm && (
          <form ref={registrationFormRef} onSubmit={handleRegistration} className="space-y-6">
            {renderStepIndicator()}
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </form>
        )}

        {isRegistering && (
          <div
            ref={loadingAnimationRef}
            className="flex flex-col items-center justify-center opacity-0 absolute top-0 left-0 w-full h-full z-30 bg-white/90 backdrop-blur-sm rounded-2xl"
          >
            <div className="loader-circle border-4 border-gray-200 border-t-blue-600 rounded-full h-12 w-12 mb-4"></div>
            <p className="text-gray-600 font-medium">Skapar ditt konto...</p>
          </div>
        )}
      </div>

      {showLogo && companyLogoUrl && (
        <div
          ref={logoRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          style={{ opacity: 0 }}
        >
          <img
            src={companyLogoUrl}
            alt={`${company} logotyp`}
            className="h-96 w-auto max-w-[90vw] filter drop-shadow-2xl"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150?text=Logo+Missing';
            }}
          />
        </div>
      )}
    </div>
  </AuroraBackground>
);
}

export default AcceptInvitePage;