import React, { useState, useEffect } from 'react';
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
    id: null, // Lägg till id för certifikat-anrop
  });
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificatesError, setCertificatesError] = useState('');

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !currentUser.email) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl bg-white shadow-xl rounded-lg overflow-hidden p-6">
          <h2 className="text-xl font-semibold text-red-600">Fel</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-indigo-600 py-6 px-4 sm:px-6 text-white">
            <h2 className="text-xl font-semibold">Min Profil</h2>
            <div className="mt-4 flex flex-col items-center">
              <div className="relative group">
                {currentUser.profile_image ? (
                  <img
                    className="h-24 w-24 rounded-full object-cover shadow-lg border-2 border-white"
                    src={currentUser.profile_image}
                    alt={currentUser.full_name || currentUser.email}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${(currentUser.first_name?.charAt(0) || currentUser.email.charAt(0))}&background=random`;
                    }}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-xl">
                      {(currentUser.first_name?.charAt(0) || currentUser.email.charAt(0))?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-2 text-lg font-semibold">
                {currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.email}
              </h3>
              {currentUser.is_admin && (
                <p className="text-xs text-indigo-200 bg-indigo-800 px-2 py-1 rounded-full mt-1">
                  Admin
                </p>
              )}
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6">
            {error && (
              <p className="text-yellow-600 mb-4">Varning: {error} Vissa data kan vara från lokal lagring.</p>
            )}
            <dl className="divide-y divide-gray-200">
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">E-postadress</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {currentUser.email || 'Ej tillgänglig'}
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Förnamn</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {currentUser.first_name || 'Ej tillgänglig'}
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Efternamn</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {currentUser.last_name || 'Ej tillgänglig'}
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Användarroll</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {currentUser.is_admin ? 'Administratör' : 'Standardanvändare'}
                </dd>
              </div>
              {currentUser.profile_image && (
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Profilbild</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <img
                      src={currentUser.profile_image}
                      alt="Profilbild"
                      className="h-16 w-16 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${(currentUser.first_name?.charAt(0) || currentUser.email.charAt(0))}&background=random`;
                      }}
                    />
                  </dd>
                </div>
              )}
            </dl>

            {/* Certifikatsektion */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Mina Certifikat</h3>
              {certificatesError && (
                <p className="text-red-600 mb-4">{certificatesError}</p>
              )}
              {certificates.length === 0 ? (
                <p>Inga certifikat ännu.</p>
              ) : (
                <ul className="space-y-4">
                  {certificates.map((cert) => (
                    <li key={cert.certificate_code} className="border p-4 rounded-lg">
                      <p><strong>Kurs:</strong> {cert.course_title}</p>
                      <p><strong>Utfärdat:</strong> {new Date(cert.issued_date).toLocaleDateString()}</p>
                      <a
                        href={cert.certificate_url}
                        download
                        className="text-blue-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ladda ner certifikat (PDF)
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;