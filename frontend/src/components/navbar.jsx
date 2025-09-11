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
  if (!token) {
    console.error('No token found in localStorage');
    alert('Du måste vara inloggad för att skapa en kurs.');
    return;
  }
  console.log('Token:', token);
  try {
    console.log('Sending request to /forward-token/');
    const response = await api.post('/forward-token/', 
      { redirect_to: 'builder.agoge-lms.se' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Response received:', response.data);
    window.location.href = `https://builder.agoge-lms.se?token=${response.data.token}`;
  } catch (err) {
    console.error('Error in handleCreateCourse:', err.response?.data || err.message);
    alert(err.response?.status === 400 
      ? `Ogiltig förfrågan: ${err.response?.data?.error || 'Kontrollera token och backend.'}`
      : `Kunde inte ansluta till kursbyggaren: ${err.message}`);
  }
};

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', current: false },
  { name: 'Kurser', href: '/course-dashboard', current: false },
  { name: 'Marknads Plats', href: '/market', current: false },
  { name: 'Behörighet', href: '/team', current: false, isAdminOnly: true },   
  {
    name: 'Kurs Översikt',
    href: '/admin/course-overview',
    current: false,
    isAdminOnly: true,
  },
  { name: 'Dokument', href: '/docs', current: false, isAdminOnly: true },
  {
    name: 'Skapa Kurs',
    href: '#',
    onClick: handleCreateCourse,
    current: false,
    isAdminOnly: true,
  },
];

const userNavigation = [
  { name: 'Your Profile', href: '/profile' },
  { name: 'Sign out', href: '/', onClick: handleLogout },
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
    <div className="h-full w-[100vw] flex flex-col inset-0 m-0 p-0 bg-gradient-to-r from-blue-900 to-blue-400 text-white">
      <Disclosure as="nav" className="shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <div className="shrink-0">
                <img
                  alt="Agoge"
                  src="/Logotyp-Agoge-white.png"
                  className="size-12" // Ökad från size-10 till size-12
                />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-3"> {/* Ökad från space-x-4 till space-x-6 */}
                {userLoaded &&
                    navigation.map((item) => (
                      item.separator ? (
                        <span
                          key={item.name}
                          className="text-gray-300 h-6 border-l border-gray-400 mx-2" // Stilren vertikal linje
                        />
                      ) : (
                        <a
                          key={item.name}
                          href={item.href}
                          onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick(); } : undefined}
                          aria-current={item.current ? 'page' : undefined}
                          className={classNames(
                            item.current ? '' : 'text-white hover:bg-gray-700 hover:text-white',
                            'rounded-md px-3 py-2 text-sm relative', // Ökad från text-sm till text-base
                            item.isAdminOnly ? 'bg-yellow-500/10' : 'left'
                          )}
                          title={item.isAdminOnly ? 'Admin-funktion' : ''}
                        >
                          <span className="flex items-center space-x-1">
                            {item.isAdminOnly && (
                              <ShieldCheckIcon className="h-4 w-4 text-yellow-300" />
                            )}
                            <span>{item.name}</span>
                          </span>
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
                    <MenuButton className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none">
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                      )}
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </MenuButton>
                    <MenuItems className="absolute right-0 z-10 mt-2 w-96 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                      <div className="px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50 flex items-center">
                        <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
                        Notiser
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {notificationsLoading ? (
                        <div className="px-4 py-6 text-center">
                          <div className="animate-pulse flex justify-center">
                            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">Hämtar notiser...</p>
                        </div>
                      ) : notificationsError ? (
                        <div className="px-4 py-3 text-sm text-red-600">
                          {notificationsError}
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map((notification) => (
                            <MenuItem key={notification.id}>
                              {({ active }) => (
                                <div className={`${active ? 'bg-gray-50' : ''} px-4 py-3`}>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 flex items-center">
                                        <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                                        {notification.requester_name} begärde:
                                      </p>
                                      <p className="ml-7 mt-1 text-gray-700">{notification.course_title}</p>
                                      <p className="ml-7 mt-1 text-xs text-gray-500">
                                        {new Date(notification.requested_at).toLocaleString('sv-SE')}
                                      </p>
                                    </div>
                                    {!notification.read && (
                                      <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                    )}
                                  </div>
                                  <div className="ml-7 mt-3 flex space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAccept(notification.course, notification.id);
                                      }}
                                      className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200 transition-colors"
                                      href="/checkout"
                                    >
                                      Acceptera
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded hover:bg-red-200 transition-colors"
                                    >
                                      Neka
                                    </button>
                                  </div>
                                </div>
                              )}
                            </MenuItem>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <BellIcon className="mx-auto h-8 w-8 text-gray-300" />
                          <p className="mt-2 text-sm text-gray-500">Inga nya notiser</p>
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
                        <a
                          href={item.href}
                          onClick={item.onClick}
                          className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-none"
                        >
                          {item.name}
                        </a>
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
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
              </DisclosureButton>
            </div>
            {currentUser.isAdmin && (
              <div className="flex space-x-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-300/40">
                <ShieldCheckIcon className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-medium text-yellow-100">Admin</span>
              </div>
            )}
          </div>
        </div>
        <DisclosurePanel className="md:hidden">
          <div className="space-y-2 px-2 pt-2 pb-3 sm:px-3"> {/* Ökad från space-y-1 till space-y-2 */}
            {navigation.map((item) => (
              item.separator ? (
                <span
                  key={item.name}
                  className="block h-6 border-l border-gray-400 mx-3" // Stilren vertikal linje i mobil
                />
              ) : (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick(); } : undefined}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-3 text-base font-medium',
                    item.isAdminOnly ? 'border border-yellow-300/30 bg-yellow-500/10' : '',
                    item.isAdminSection ? 'font-bold bg-yellow-500/20 border-2 border-yellow-300' : ''
                  )}
                >
                  <span className="flex items-center space-x-2">
                    <span>{item.name}</span>
                    {item.isAdminOnly && (
                      <ShieldCheckIcon className="h-4 w-4 text-yellow-300" />
                    )}
                  </span>
                </DisclosureButton>
              )
            ))}
          </div>
          <div className="border-t border-gray-700 pt-4 pb-3">
            <div className="flex items-center px-5">
              <div className="shrink-0">
                <img
                  alt={currentUser.name}
                  src={currentUser.profile_img_url || "/default-profile.jpg"}
                  className="size-10 rounded-full"
                />
              </div>
              <div className="ml-3 flex-1">
                <div className="text-base/5 font-medium text-white flex items-center space-x-2">
                  <span>{currentUser.firstName} {currentUser.lastName}</span>
                  {currentUser.isAdmin && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-300/40">
                      <ShieldCheckIcon className="h-3 w-3 text-yellow-300" />
                      <span className="text-xs text-yellow-100">Admin</span>
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
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
}