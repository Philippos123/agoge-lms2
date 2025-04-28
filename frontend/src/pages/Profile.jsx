import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import api from '../services/api'; // Antag att du har en API-service

function Profile() {
  const [currentUser, setCurrentUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    full_name: '',
    profile_image: null, // Backend kan använda 'profile_img_url'
    is_admin: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/user/');
        const usersData = response.data; // Nu är detta en array
        console.log("Hämtad användardata:", usersData);
    
        if (usersData && usersData.length > 0) {
          const currentUserData = usersData[0]; // Ta den första användaren i arrayen
    
          setCurrentUser({
            email: currentUserData.email || '',
            first_name: currentUserData.first_name || '',
            last_name: currentUserData.last_name || '',
            full_name: currentUserData.full_name || `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim(),
            profile_image: currentUserData.profile_img_url || null, // Använd profile_img_url
            is_admin: currentUserData.is_admin || false,
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
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
          <dl className="divide-y divide-gray-200">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">E-postadress</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {currentUser.email}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Förnamn</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {currentUser.first_name}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Efternamn</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {currentUser.last_name}
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
        </div>
      </div>
    </div>
    </>
  );
}

export default Profile;