import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AuthService } from "../services/api";
import { useState, useEffect } from 'react';
import api from '../services/api'; // Importera din API-service

const handleLogout = async (e) => {
  e.preventDefault();

  try {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  } catch (error) {
    console.error("Logout request failed", error);
  }

  AuthService.logout();
  window.location.href = "/";
};

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', current: false },
  { name: 'Courses', href: '/course-dashboard', current: false },
  { name: 'Mitt team', href: '/team', current: false, isAdminOnly: true },
  { name: 'Mitt teams kurser', href: '/company-courses', current: false, isAdminOnly: true },
  { name: 'Marketplace', href: '/market', current: false },
  { name: 'Dokument', href: '/docs', current: false, isAdminOnly: true },
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
    profile_img_url: "/default-profile.jpg",
    isAdmin: false,
    firstName: '', // Lägg till förnamn
    lastName: '',  // Lägg till efternamn
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/user/');
        const usersData = response.data; // Backend returnerar en array

        if (usersData && usersData.length > 0) {
          const loggedInUser = usersData[0]; // Ta den första användaren (tillfällig lösning)
          const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:8000';
          let profileImageUrl = loggedInUser.profile_img_url || "/default-profile.jpg";

          // Kontrollera om URL:en redan är absolut
          if (loggedInUser.profile_img_url && !loggedInUser.profile_img_url.startsWith('http')) {
            profileImageUrl = `${baseURL}${loggedInUser.profile_img_url}`;
          }

          setCurrentUser({
            name: `${loggedInUser.first_name} ${loggedInUser.last_name}`.trim() || loggedInUser.email,
            email: loggedInUser.email || 'user@example.com',
            profile_img_url: profileImageUrl,
            isAdmin: loggedInUser.is_admin || false,
            firstName: loggedInUser.first_name || '',
            lastName: loggedInUser.last_name || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user profile for navbar:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const navigation = allNavigation.filter(item => !item.isAdminOnly || (currentUser && currentUser.isAdmin));

  return (
    <div className="h-full w-[100vw] flex flex-col inset-0 m-0 p-0 bg-gradient-to-r from-blue-900 to-blue-400 text-white ">
      <Disclosure as="nav" className="shadow-md ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="shrink-0">
                <img
                  alt="Agoge"
                  src="/Logotyp-Agoge-white.png"
                  className="size-10"
                />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      className={classNames(
                        item.current ? '' : 'text-white hover:bg-gray-700 hover:text-white',
                        'rounded-md px-3 py-2 text-sm font-medium',
                      )}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <button
                  type="button"
                  className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <MenuButton className="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden">
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
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden"
                  >
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        <a
                          href={item.href}
                          onClick={item.onClick}
                          className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
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
              {/* Mobile menu button */}
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
              </DisclosureButton>
            </div>
          </div>
        </div>

        <DisclosurePanel className="md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as="a"
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                  item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'block rounded-md px-3 py-2 text-base font-medium',
                )}
              >
                {item.name}
              </DisclosureButton>
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
              <div className="ml-3">
                <div className="text-base/5 font-medium text-white">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="text-sm font-medium text-gray-400">{currentUser.email}</div>
              </div>
              <button
                type="button"
                className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
              >
                <span className="absolute -inset-1.5" />
                <span className="sr-only">View notifications</span>
                <BellIcon aria-hidden="true" className="size-6" />
              </button>
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