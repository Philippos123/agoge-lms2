import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Award, Download, Edit3, Camera, Settings } from 'lucide-react';
import Navbar from '../components/navbar';
import api from '../services/api';

function Profile() {
  const [currentUser, setCurrentUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    full_name: '',
    profile_image: null,
    is_admin: false,
    id: null,
  });
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificatesError, setCertificatesError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get('/user/');
        console.log('Full /api/user/ response:', response);
        const currentUserData = response.data[0];

        setCurrentUser({
          id: currentUserData.id || null,
          email: currentUserData.email || '',
          first_name: currentUserData.first_name || '',
          last_name: currentUserData.last_name || '',
          full_name: currentUserData.full_name || `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim(),
          profile_image: currentUserData.profile_img_url || null,
          is_admin: currentUserData.is_admin || false,
        });

        // Hämta certifikat
        if (currentUserData.id) {
          try {
            const certResponse = await api.get(`/user/${currentUserData.id}/certificates/`);
            setCertificates(certResponse.data.certificates || []);
          } catch (certErr) {
            console.error('Error fetching certificates:', certErr);
            setCertificatesError('Kunde inte hämta certifikat.');
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Kunde inte hämta profildata. Försök igen senare.');

        // Fallback to localStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          setCurrentUser({
            id: storedUser.id || null,
            email: storedUser.email || '',
            first_name: storedUser.firstName || '',
            last_name: storedUser.lastName || '',
            full_name: `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim(),
            profile_image: null,
            is_admin: storedUser.isAdmin || false,
          });
        }
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = () => {
    if (currentUser.first_name && currentUser.last_name) {
      return currentUser.first_name.charAt(0) + currentUser.last_name.charAt(0);
    }
    return currentUser.email?.charAt(0)?.toUpperCase() || '';
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-pulse border-t-blue-400"></div>
          </div>
        </div>
      </>
    );
  }

  if (error && !currentUser.email) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8 max-w-md">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Fel</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative px-6 py-16 mx-auto max-w-4xl">
            <div className="text-center">
              {/* Profile Image */}
              <div className="relative inline-block mb-6">
                <div className="relative group">
                  {currentUser.profile_image ? (
                    <img
                      className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
                      src={currentUser.profile_image}
                      alt={currentUser.full_name || currentUser.email}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${getInitials()}&background=random`;
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-105">
                      <span className="text-white font-bold text-4xl">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110">
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2 tracking-tight">
                  {currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.email}
                </h1>
                <p className="text-blue-100 text-lg mb-4">{currentUser.email}</p>
                
                {currentUser.is_admin && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    <Shield className="w-4 h-4" />
                    Administrator
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-12 mx-auto max-w-4xl">
          {error && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
              <p className="text-yellow-800">Varning: {error} Vissa data kan vara från lokal lagring.</p>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white/60 backdrop-blur-lg rounded-lg p-1 mb-8 shadow-lg border border-white/20">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
              }`}
            >
              <User className="w-5 h-5" />
              Profil
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'certificates'
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
              }`}
            >
              <Award className="w-5 h-5" />
              Certifikat ({certificates.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
              }`}
            >
              <Settings className="w-5 h-5" />
              Inställningar
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Profilinformation</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors duration-200">
                      <Edit3 className="w-4 h-4" />
                      Redigera
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">E-postadress</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-800">{currentUser.email || 'Ej tillgänglig'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Användarroll</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-800">
                          {currentUser.is_admin ? 'Administrator' : 'Standardanvändare'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Förnamn</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-800">{currentUser.first_name || 'Ej tillgänglig'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Efternamn</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-800">{currentUser.last_name || 'Ej tillgänglig'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800">Mina Certifikat</h2>
                  <p className="text-gray-600 mt-1">Dina genomförda kurser och erhållna certifikat</p>
                </div>
                
                <div className="p-6">
                  {certificatesError && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                      <p className="text-red-600">{certificatesError}</p>
                    </div>
                  )}
                  
                  {certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Inga certifikat ännu</p>
                      <p className="text-gray-400">Slutför en kurs för att få ditt första certifikat!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {certificates.map((cert) => (
                        <div
                          key={cert.certificate_code}
                          className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors duration-200">
                                    {cert.course_title}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Certifikat #{cert.certificate_code}
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-gray-600 mb-4">
                                Utfärdat: <span className="font-medium">{formatDate(cert.issued_date)}</span>
                              </p>
                              
                              <a
                                href={cert.certificate_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                              >
                                <Download className="w-4 h-4" />
                                Ladda ner PDF
                              </a>
                            </div>
                            
                            <div className="ml-4">
                              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                <Award className="w-10 h-10 text-white" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Achievement badge */}
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800">Inställningar</h2>
                  <p className="text-gray-600 mt-1">Hantera dina kontoinställningar och preferenser</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Notification Settings */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Notifikationer</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-gray-700">E-postmeddelanden för nya kurser</span>
                          <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-700">Påminnelser om deadline</span>
                          <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-700">Certifikatmeddelanden</span>
                          <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                        </label>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Integritet</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-gray-700">Visa profil för andra användare</span>
                          <input type="checkbox" className="toggle toggle-primary" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-700">Visa certifikat offentligt</span>
                          <input type="checkbox" className="toggle toggle-primary" />
                        </label>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Konto</h3>
                      <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200">
                          Ändra lösenord
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200">
                          Exportera data
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200">
                          Radera konto
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;