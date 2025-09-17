import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { AuthService } from '../services/api';
import { useState, useEffect } from 'react';
import api from '../services/api';

const handleLogout = async (e) => {
  e.preventDefault();
  try {
    await fetch(
      'http://localhost:8000/api/logout/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
  } catch (error) {
    console.error('Logout request failed', error);
  }
  AuthService.logout();
  window.location.href = '/';
};

const handleCreateCourse = async () => {
  console.log('handleCreateCourse called');
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refresh_token');
  if (!token) {
      console.error('No token found in localStorage');
      alert('Du måste vara inloggad för att skapa en kurs.');
      return;
  }
  console.log('Access Token:', token);
  console.log('Refresh Token:', refreshToken);
  try {
      console.log('Sending request to /forward-token/');
      const response = await api.post(
          '/forward-token/',
          { redirect_to: 'builder.agoge-lms.se', refresh_token: refreshToken },
          { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Response received:', response.data);
      window.location.href = `https://builder.agoge-lms.se?token=${response.data.token}&refresh_token=${response.data.refresh_token || refreshToken}`;
  } catch (err) {
      console.error('Error in handleCreateCourse:', err.response?.data || err.message);
      alert(
          err.response?.status === 400
              ? `Ogiltig förfrågan: ${err.response?.data?.error || 'Kontrollera token och backend.'}`
              : `Kunde inte ansluta till kursbyggaren: ${err.message}`
      );
  }
};

const allNavigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    current: false,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v6H8V5z" />
      </svg>
    )
  },
  { 
    name: 'Kurser', 
    href: '/course-dashboard', 
    current: false,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    name: 'Marknads Plats', 
    href: '/market', 
    current: false,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  { 
    name: 'Behörighet', 
    href: '/team', 
    current: false, 
    isAdminOnly: true,
    icon: <ShieldCheckIcon className="w-4 h-4" />
  },   
  {
    name: 'Kurs Översikt',
    href: '/admin/course-overview',
    current: false,
    isAdminOnly: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    name: 'Dokument', 
    href: '/docs', 
    current: false, 
    isAdminOnly: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    name: 'Skapa Kurs',
    href: '#',
    onClick: handleCreateCourse,
    current: false,
    isAdminOnly: true,
    icon: <SparklesIcon className="w-4 h-4" />,
    isSpecial: true
  },
];

const userNavigation = [
  { 
    name: 'Your Profile', 
    href: '/profile',
    icon: <UserCircleIcon className="w-4 h-4" />
  },
  { 
    name: 'Sign out', 
    href: '/', 
    onClick: handleLogout,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    )
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar({ settings }) {
  const [currentUser, setCurrentUser] = useState({
    name: 'Användare',
    email: 'user@example.com',
    profile_img_url: '/default-profile.jpg',
    isAdmin: false,
    firstName: '',
    lastName: '',
    company: null,
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/user/');
        const usersData = response.data;

        if (usersData && usersData.length > 0) {
          const loggedInUser = usersData[0];
          const baseURL = api.defaults.baseURL
            ? api.defaults.baseURL.replace('/api', '')
            : 'https://backend-agoge-5544956f8095.herokuapp.com';
          let profileImageUrl =
            loggedInUser.profile_img_url || '/default-profile.jpg';

          if (
            loggedInUser.profile_img_url &&
            !loggedInUser.profile_img_url.startsWith('http')
          ) {
            profileImageUrl = `${baseURL}${loggedInUser.profile_img_url}`;
          }

          setCurrentUser({
            name:
              `${loggedInUser.first_name} ${loggedInUser.last_name}`.trim() ||
              loggedInUser.email,
            email: loggedInUser.email || 'user@example.com',
            profile_img_url: profileImageUrl,
            isAdmin: loggedInUser.is_admin,
            firstName: loggedInUser.first_name || '',
            lastName: loggedInUser.last_name || '',
            company: loggedInUser.company || null,
          });
          setUserLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching user profile for navbar:', error);
      }
    };

    const fetchNotifications = async () => {
      if (!currentUser.isAdmin) return;

      try {
        setNotificationsLoading(true);
        setNotificationsError(null);
        const response = await api.get('/course-requests/unread/');
        setNotifications(response.data);
        setUnreadCount(response.data.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotificationsError('Kunde inte hämta notiser');
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchUserProfile().then(() => {
      if (currentUser.isAdmin) {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
      }
    });
  }, [currentUser.isAdmin]);

  const markAsRead = async (requestId) => {
    try {
      await api.post(`/course-requests/mark-read/${requestId}/`);
      setNotifications(notifications.filter((n) => n.id !== requestId));
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAccept = async (course, requestId) => {
    await markAsRead(requestId);
    window.location.href = `https://roaring-dragon-c80381.netlify.app/checkout/${course}/`;
  };

  const isUtbCompany = currentUser?.company?.is_utb_company === true;

  const navigation = allNavigation.filter((item) => {
    if (item.name === 'Marknads Plats' && isUtbCompany) {
      return false;
    }
    return !item.isAdminOnly || currentUser?.isAdmin;
  });

  // Lägg till separator om admin och "Behörighet" finns med
  const shouldShowSeparator = currentUser?.isAdmin && navigation.some(item => item.name === 'Behörighet');
  if (shouldShowSeparator) {
    navigation.splice(navigation.findIndex(item => item.name === 'Behörighet'), 0, { name: 'separator', separator: true });
  }

  return (
    <div className="w-full bg-white shadow-lg border-b border-gray-200">
      <Disclosure as="nav" className="shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <div className="shrink-0">
                <img
                  alt="Agoge"
                  src="/Logotyp-Agoge.png"
                  className="size-12"
                />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-3">
                  {userLoaded &&
                    navigation.map((item) => (
                      item.separator ? (
                        <div
                          key={item.name}
                          className="h-8 w-px bg-gray-300 mx-4"
                        />
                      ) : (
                        <a
                          key={item.name}
                          href={item.href}
                          onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick(); } : undefined}
                          aria-current={item.current ? 'page' : undefined}
                          className={classNames(
                            'group flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                            item.current 
                              ? 'bg-blue-50 text-blue-700 shadow-md' 
                              : item.isSpecial
                                ? 'bg-gradient-to-r from-purple-500 to-primary-500 text-white hover:from-purple-600 hover:to-primary-400 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                : item.isAdminOnly
                                  ? 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 border border-transparent hover:border-yellow-200'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <span className="mr-2 opacity-75 group-hover:opacity-100 transition-opacity">
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                          {item.isAdminOnly && !item.isSpecial && (
                            <ShieldCheckIcon className="ml-2 h-3 w-3 text-yellow-500" />
                          )}
                        </a>
                      )
                    ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {currentUser.isAdmin && (
                  <Menu as="div" className="relative ml-3">
                    <MenuButton className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </span>
                      )}
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </MenuButton>
                    <MenuItems className="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <BellIcon className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Notifikationer</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {unreadCount} nya
                            </span>
                          )}
                        </div>
                      </div>
                      {notificationsLoading ? (
                        <div className="px-6 py-8 text-center">
                          <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                          <p className="mt-3 text-sm text-gray-500">Hämtar notiser...</p>
                        </div>
                      ) : notificationsError ? (
                        <div className="px-6 py-4 text-center text-red-600 bg-red-50">
                          <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {notificationsError}
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map((notification, index) => (
                            <MenuItem key={notification.id}>
                              {({ active }) => (
                                <div className={`${active ? 'bg-blue-50' : 'bg-white'} ${index !== notifications.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                  <div className="px-6 py-4">
                                    <div className="flex items-start space-x-3">
                                      <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <UserCircleIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900">
                                          {notification.requester_name}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                          Begärde kurs: <span className="font-medium">{notification.course_title}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                          {new Date(notification.requested_at).toLocaleString('sv-SE')}
                                        </p>
                                      </div>
                                      {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                      )}
                                    </div>
                                    <div className="flex space-x-3 mt-4">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAccept(notification.course, notification.id);
                                        }}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                                      >
                                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                                        Acceptera
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notification.id);
                                        }}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                      >
                                        <XMarkIcon className="h-4 w-4 mr-1" />
                                        Neka
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </MenuItem>
                          ))}
                        </div>
                      ) : (
                        <div className="px-6 py-12 text-center">
                          <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
                          <h3 className="mt-4 text-sm font-medium text-gray-900">Inga notiser</h3>
                          <p className="mt-1 text-sm text-gray-500">Du har inga nya notifikationer</p>
                        </div>
                      )}
                    </MenuItems>
                  </Menu>
                )}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <MenuButton className="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <img
                        alt={currentUser.name}
                        src={currentUser.profile_img_url || "/default-profile.jpg"}
                        className="size-8 rounded-full"
                      />
                    </MenuButton>
                  </div>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-none"
                  >
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        {({ active }) => (
                          <a
                            href={item.href}
                            onClick={item.onClick}
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              'flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                            )}
                          >
                            <span className="mr-3 text-gray-400">{item.icon}</span>
                            {item.name}
                          </a>
                        )}
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
              </DisclosureButton>
            </div>
            {currentUser.isAdmin && (
              <div className="hidden md:flex space-x-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-300/40">
                <ShieldCheckIcon className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-medium text-black">Admin</span>
              </div>
            )}
          </div>
        </div>
        <DisclosurePanel className="md:hidden">
          <div className="space-y-2 px-2 pt-2 pb-3 sm:px-3">
            {navigation.map((item) => (
              item.separator ? (
                <hr key={item.name} className="my-4 border-gray-200" />
              ) : (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick(); } : undefined}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    'flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200',
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : item.isSpecial
                        ? 'bg-gradient-to-r from-purple-500/50 to-blue-500/50 text-white'
                        : item.isAdminOnly
                          ? 'text-gray-600 bg-yellow-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {item.isAdminOnly && !item.isSpecial && (
                    <ShieldCheckIcon className="ml-auto h-4 w-4 text-yellow-500" />
                  )}
                </DisclosureButton>
              )
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 pb-3">
            <div className="flex items-center px-5">
              <div className="shrink-0">
                <img
                  alt={currentUser.name}
                  src={currentUser.profile_img_url || "/default-profile.jpg"}
                  className="size-10 rounded-full"
                />
              </div>
              <div className="ml-3 flex-1">
                <div className="text-base/5 font-medium text-black flex items-center space-x-2">
                  <span>{currentUser.firstName} {currentUser.lastName}</span>
                  {currentUser.isAdmin && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-300/40">
                      <ShieldCheckIcon className="h-3 w-3 text-yellow-300" />
                      <span className="text-xs text-black">Admin</span>
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-400">{currentUser.email}</div>
              </div>
              {currentUser.isAdmin && (
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none"
                >
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="mt-3 space-y-1 px-2">
              {userNavigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  onClick={item.onClick}
                  className="flex items-center space-x-3 px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
                >
                  <span className="text-gray-400">{item.icon}</span>
                  <span>{item.name}</span>
                </DisclosureButton>
              ))}
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
}