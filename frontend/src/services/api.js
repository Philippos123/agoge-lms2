import axios from 'axios';
import { setupScormAPI } from '../utils/scormUtils';
import './../services/scormApiWrapper'; // Importera wrappern



const API_URL = 'http://localhost:8000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add interceptor to add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));


// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await AuthService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        AuthService.logout();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


// Authentication service
const AuthService = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/token/', { email, password });
      console.log("Inloggningssvar:", response.data); // LÄGG TILL DENNA RAD
      if (response.data.access) {
        // Spara användardata först
        localStorage.setItem('user', JSON.stringify({
          id: response.data.user_id,
          email: response.data.email,
          isAdmin: response.data.is_admin,
          firstName: response.data.first_name,
          lastName: response.data.last_name,
          companyId: response.data.company_id,
          companyName: response.data.company_name
        }));
        
        // Spara tokens
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        
        // Omdirigera till dashboard eller annan lämplig sida
        window.location.href = "/dashboard";
      }
    } catch (error) {
      throw error;
    }
  },
  

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken'); // Ta bort även refreshToken
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await api.post('/token/refresh/', {
        refresh: refreshToken,
      });
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
      }
      return response.data;
    } catch (error) {
      AuthService.logout();
      throw error;
    }
  },
};

// Dashboard service
// Dashboard service


// Hämta alla kurser
export const getCourses = async () => {
  const response = await fetch(`${API_URL}/coursetobuy/`);
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
};

// Hämta en specifik kurs
export const getCourse = async (courseId) => {
  const response = await fetch(`${API_URL}/coursetobuy/${courseId}/`);
  if (!response.ok) {
    throw new Error("Failed to fetch course");
  }
  return response.json();
};

// Lägg till en kurs
export const createCourse = async (courseData) => {
  const response = await fetch(`${API_URL}/coursetobuy/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseData),
  });
  if (!response.ok) {
    throw new Error("Failed to create course");
  }
  return response.json();
};

// Uppdatera en kurs
export const updateCourse = async (courseId, courseData) => {
  const response = await fetch(`${API_URL}/coursetobuy/${courseId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseData),
  });
  if (!response.ok) {
    throw new Error("Failed to update course");
  }
  return response.json();
};

export const getFullMediaUrl = (relativeUrl) => {
  // 1. Bättre hantering av falsy values
  if (!relativeUrl || relativeUrl === 'null' || relativeUrl === 'undefined') {
    return '/default-profile.jpg';
  }

  // 2. Hantera absoluta URL:er (inklusive https)
  if (/^https?:\/\//i.test(relativeUrl)) {
    return relativeUrl;
  }

  // 3. Använd samma bas-URL som övriga anrop
  const baseUrl = API_URL.replace('/api', ''); // Tar bort /api från slutet
  
  // 4. Hantera fall där relativ URL redan börjar med snedstreck
  const normalizedUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  
  return `${baseUrl}${normalizedUrl}`;
};


// Exportera ModuleService

export const initializeScorm = (courseId, languageCode) => {
  return fetch(`/coursetobuy/${courseId}/scorm/launch/${languageCode}/`) // Använder proxy-path
    .then(response => response.json())
    .then(data => {
      const iframe = document.createElement('iframe');
      iframe.id = 'scorm-iframe'; // Viktigt att ha en ID om du hämtar den senare
      iframe.src = data.scorm_url; // Borde nu vara en relativ sökväg om proxyn fungerar korrekt
      iframe.style.width = '100%';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';

      const container = document.getElementById('scorm-container');
      container.innerHTML = '';
      container.appendChild(iframe);

      iframe.onload = () => {
        const iframeElement = document.getElementById('scorm-iframe');
        if (iframeElement) {
          setupScormAPI(iframeElement);
        } else {
          console.error("Kunde inte hitta iframe-elementet.");
        }
      };

      return iframe;
    });
};



export const uploadDocument = async (title, file, token) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('document', file); // Ändra fältnamnet för filen om din backend förväntar sig det

  try {
    const response = await fetch(`${API_URL}/company/documents/`, { // KORREKT: ANVÄND POST
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Fel vid uppladdning:', errorData);
      throw new Error('Något gick fel vid uppladdningen');
    }

    const data = await response.json();
    return data; // Returnera data om uppladdningen lyckas
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const get = async (endpoint, options = {}) => { // 'export const' gör 'get' till en namngiven export
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Något gick fel vid hämtningen.');
  }
  return await response.json();
};

export const post = async (endpoint, body = null, options = {}) => {
  try {
    const response = await api.post(endpoint, body, options);
    return response.data;
  } catch (error) {
    console.error(`Fel vid POST-anrop till ${endpoint}:`, error);
    throw error;
  }
};

export const getCompanyDashboardData = async (token) => {
  try {
    const response = await fetch(`${API_URL}/company/dashboard/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Kunde inte hämta dashboard-data.');
    }
    const data = await response.json();
    return {
      ...data,
      logoUrl: data.logo ? `${API_URL.slice(0, -4)}${data.logo}` : null, // Ta bort '/api' från slutet innan vi lägger till /media/...
    };
  } catch (error) {
    console.error('Fel vid hämtning av dashboard-data:', error);
    throw error;
  }
};

export const updateCompanyDashboardData = async (token, dashboardText, logoFile) => {
  try {
    const formData = new FormData();
    formData.append('dashboard_text', dashboardText);
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    const response = await fetch(`${API_URL}/company/dashboard/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Kunde inte uppdatera dashboard-data.');
    }
    const data = await response.json();
    return {
      ...data,
      logoUrl: data.logo ? `${API_URL.slice(0, -4)}${data.logo}` : null, // Uppdatera även här om du vill visa den nya loggan direkt efter uppladdning
    };
  } catch (error) {
    console.error('Fel vid uppdatering av dashboard-data:', error);
    throw error;
  }
};

const UserService = {
  getProfile: async (userId) => {
    const response = await api.get(`/users/${userId}/`);
    return {
      ...response.data,
      profile_img_url: getFullMediaUrl(response.data.profile_img_url),
    };
  },

  updateProfile: async (userId, data) => {
    const response = await api.put(`/users/${userId}/`, data);
    return response.data;
  },

  uploadProfileImage: async (userId, file) => {
    const formData = new FormData();
    formData.append('profile_img', file);
    const response = await api.put(`/users/${userId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
export { UserService };


// Ytterligare SCORM-relaterade funktioner (borttagna)
// Eftersom /api/courses/${courseId}/scorm/data inte längre används.
export const CourseService = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
};


export { AuthService };
export default api;


