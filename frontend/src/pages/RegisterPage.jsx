import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Building2, Mail, Lock, Check, ArrowRight, UserPlus, Star, Users, BookOpen, Trophy, Zap, Clock, Image as ImageIcon } from 'lucide-react';

// Mock functions to simulate API calls
const mockApiCall = (endpoint, data, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint.includes('accept-invite') && !data) {
        resolve({
          data: {
            email: 'invited@company.com',
            companyName: 'Tech Solutions AB'
          }
        });
      } else {
        resolve({ data: { success: true } });
      }
    }, delay);
  });
};

// Plan Selection Component (unchanged)
const PlanSelection = ({ isOpen, onClose, onSelectPlan, isLoading, companyName }) => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '499',
      period: 'månad',
      description: 'Perfekt för mindre team',
      features: [
        '1 egen kurs',
        'Full tillgång till marketplace',
        'Analysverktyg',
        'Hur många användare du vill'
      ],
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-green-600 to-green-700',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '35 000',
      period: 'år',
      description: 'Bäst för växande företag',
      features: [
        'Full tillgång till kursbyggaren',
        'Full tillgång till marketplace',
        'Analysverktyg',
        'Hur många användare du vill',
        'Ai-driven lärväg',
        'anpassa plattformen med din logotyp och färger',
      ],
      icon: <Trophy className="w-8 h-8" />,
      color: 'from-blue-600 to-blue-700',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '50 000',
      period: 'år',
      description: 'För stora organisationer',
      features: [
        'Allt i Professional',
        'Egen domän',
        'Fullt anpassad plattform',
        'Skapa kurser med AI'
      ],
      icon: <Users className="w-8 h-8" />,
      color: 'from-purple-600 to-purple-700',
      popular: false
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState('professional');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
        <div className="text-center p-8 border-b border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-2">
            Välj din plan för {companyName || 'ditt företag'}
          </h2>
          <p className="text-gray-300">
            Välj den plan som passar era behov bäst. Du kan alltid ändra senare.
          </p>
        </div>
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-gray-800 border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-gray-800/80 scale-105'
                    : 'border-gray-600 hover:border-gray-500'
                } ${plan.popular ? 'ring-2 ring-blue-500/50' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      Populär
                    </div>
                  </div>
                )}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl mb-4 text-white`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <div className="flex items-baseline">
                    {plan.price === 'Kontakta oss' ? (
                      <span className="text-2xl font-bold text-white">kr/{plan.period}</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        <span className="text-gray-400 ml-1">kr/{plan.period}</span>
                      </>
                    )}
                  </div>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {selectedPlan === 'enterprise' ? (
              <button
                onClick={() => onSelectPlan(selectedPlan, 'contact')}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Bearbetar...</span>
                  </>
                ) : (
                  <>
                    <span>Kontakta säljteam</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => onSelectPlan(selectedPlan, 'trial')}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl hover:from-green-500 hover:to-green-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Startar...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Testa gratis</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onSelectPlan(selectedPlan, 'paid')}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium disabled:opacity-50 border-2 border-transparent hover:border-blue-400"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Bearbetar...</span>
                    </>
                  ) : (
                    <>
                      <span>Börja direkt - Betala nu</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Component (unchanged)
const RegistrationSuccess = ({ onContinue }) => (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
      <div className="w-16 h-16 bg-blue-900 border border-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-blue-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Registrering klar!</h3>
      <p className="text-gray-300 mb-6">
        Ditt konto har skapats. Välj nu den plan som passar er bäst.
      </p>
      <button
        onClick={onContinue}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
      >
        Välj plan <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Final Success Component (unchanged)
const PlanConfirmation = ({ plan, type, onComplete }) => {
  const getMessage = () => {
    switch (type) {
      case 'trial':
        return {
          title: 'Gratis testperiod aktiverad! 🎉',
          message: 'Din 14-dagars testperiod har startat. Utforska alla funktioner utan kostnad.',
          button: 'Gå till dashboard'
        };
      case 'paid':
        return {
          title: 'Betalning slutförd! 🎉',
          message: `Tack för att du valde ${plan} planen. Ditt konto är nu aktivt.`,
          button: 'Gå till dashboard'
        };
      case 'contact':
        return {
          title: 'Förfrågan skickad! 📧',
          message: 'Vårt säljteam kommer kontakta dig inom 24 timmar för att diskutera era behov.',
          button: 'Stäng'
        };
      default:
        return {
          title: 'Välkommen till Agoge! 🎉',
          message: 'Ditt konto är klart. Börja utforska plattformen.',
          button: 'Kom igång'
        };
    }
  };

  const { title, message, button } = getMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-900 border border-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <button
          onClick={onComplete}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-lg hover:from-green-500 hover:to-green-400 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
        >
          {button} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    branschTyp: 'annat',
    orgNumber: '',
    logo: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [focusedField, setFocusedField] = useState('');
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planType, setPlanType] = useState(null);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const token = window.location.search.includes('invite') ? 'mock-token' : null;

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      mockApiCall(`/api/accept-invite/${token}/`)
        .then(response => {
          setIsInvited(true);
          setInvitationData(response.data);
          setFormData(prev => ({
            ...prev,
            email: response.data.email || '',
            companyName: response.data.companyName || ''
          }));
          setIsLoading(false);
        })
        .catch(() => {
          setError('Ogiltig eller utgången inbjudan');
          setIsLoading(false);
        });
    }
  }, [token]);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    // Basic validation for organization number (e.g., Swedish format: 123456-7890)
    const orgNumberRegex = /^\d{6}-\d{4}$/;
    if (!isInvited && !orgNumberRegex.test(formData.orgNumber)) {
      setError('Ogiltigt organisationsnummer. Använd formatet XXXXXX-XXXX.');
      setIsLoading(false);
      return;
    }

    try {
      if (isInvited) {
        await mockApiCall(`/api/accept-invite/${token}/`, {
          email: formData.email,
          password: formData.password,
        });
      } else {
        await mockApiCall('/api/register/', {
          email: formData.email,
          password: formData.password,
          name: formData.companyName,
          bransch_typ: formData.branschTyp,
          org_number: formData.orgNumber,
          logo: formData.logo ? formData.logo.name : null // Send logo file name or null
        });
      }
      setSuccess(true);
    } catch {
      setError('Registreringen misslyckades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setError('Vänligen ladda upp en PNG, JPEG eller SVG-fil.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Logotypen får inte vara större än 5MB.');
        return;
      }
      setFormData(prev => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handlePlanSelection = (plan, type) => {
    setSelectedPlan(plan);
    setPlanType(type);
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setShowPlanSelection(false);
      setShowFinalConfirmation(true);
    }, 2000);
  };

  const handleComplete = () => {
    setShowFinalConfirmation(false);
    // Clean up logo preview URL
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    alert(`Omdirigerar till dashboard...`);
  };

  if (showFinalConfirmation) {
    return (
      <PlanConfirmation
        plan={selectedPlan}
        type={planType}
        onComplete={handleComplete}
      />
    );
  }

  if (success) {
    return (
      <>
        <RegistrationSuccess onContinue={() => setShowPlanSelection(true)} />
        <PlanSelection
          isOpen={showPlanSelection}
          onClose={() => setShowPlanSelection(false)}
          onSelectPlan={handlePlanSelection}
          isLoading={isLoading}
          companyName={formData.companyName}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-blue-800/20"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {isInvited ? 'Välkommen till teamet' : 'Registrera ditt företag'}
        </h1>
        <p className="text-gray-400 text-lg">
          {isInvited 
            ? `Gå med i ${invitationData?.companyName || 'företaget'}` 
            : 'Skapa ditt konto och kom igång idag'
          }
        </p>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
              <div className="flex items-center gap-3 text-white">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span>Laddar...</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Email */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-postadress
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-5 h-5 ${focusedField === 'email' ? 'text-blue-400' : 'text-gray-500'}`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  placeholder="din@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  required
                  disabled={isInvited && invitationData?.email}
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lösenord
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 w-5 h-5 ${focusedField === 'password' ? 'text-blue-400' : 'text-gray-500'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Minst 8 tecken"
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Company Fields */}
            {!isInvited && (
              <>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Företagsnamn
                  </label>
                  <div className="relative">
                    <Building2 className={`absolute left-3 top-3 w-5 h-5 ${focusedField === 'companyName' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      onFocus={() => setFocusedField('companyName')}
                      onBlur={() => setFocusedField('')}
                      placeholder="Företag"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organisationsnummer
                  </label>
                  <div className="relative">
                    <Building2 className={`absolute left-3 top-3 w-5 h-5 ${focusedField === 'orgNumber' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <input
                      type="text"
                      value={formData.orgNumber}
                      onChange={(e) => handleInputChange('orgNumber', e.target.value)}
                      onFocus={() => setFocusedField('orgNumber')}
                      onBlur={() => setFocusedField('')}
                      placeholder="XXXXXX-XXXX"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Företagslogotyp (valfritt)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoChange}
                      onFocus={() => setFocusedField('logo')}
                      onBlur={() => setFocusedField('')}
                      className="w-full py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:hover:bg-blue-500"
                    />
                    {logoPreview && (
                      <div className="mt-4">
                        <img src={logoPreview} alt="Logo Preview" className="max-w-[150px] h-auto rounded-lg border border-gray-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vilken bransch tillhör ni?
                  </label>
                  <select
                    value={formData.branschTyp}
                    onChange={(e) => handleInputChange('branschTyp', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="teknik">Teknik</option>
                    <option value="vård">Vård</option>
                    <option value="handel">Handel</option>
                    <option value="service">Service</option>
                    <option value="fordon">Fordon</option>
                    <option value="industri">Industri</option>
                    <option value="sälj">Sälj</option>
                    <option value="ekonomi">Ekonomi</option>
                    <option value="it">IT</option>
                    <option value="bygg">Bygg</option>
                    <option value="transport">Transport</option>
                    <option value="skola">Skola</option>
                    <option value="annat">Annat</option>
                  </select>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Registrerar...</span>
                </>
              ) : (
                <>
                  <span>{isInvited ? 'Gå med i teamet' : 'Skapa konto'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-gray-500">
          Genom att registrera dig godkänner du våra{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">användarvillkor</a> och{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">integritetspolicy</a>.
        </p>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  return <RegisterPage />;
};

export default App;