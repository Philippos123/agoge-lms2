import axios from 'axios';
import { setupScormAPI } from '../utils/scormUtils';
import './../services/scormApiWrapper'; // Importera wrappern



const API_URL = 'https://backend-agoge-5544956f8095.herokuapp.com/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials : true, // Enable sending cookies with requests
});

api.updateFeaturedCourses = async (data) => {
  try {
    const response = await api.put('/featured-courses/', data);
    return response.data;
  } catch (error) {
    console.error('Error updating featured courses:', error);
    throw error; // Re-throw to handle in the component
  }
};

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
      if (response.data.access) {
        // Spara tokens
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);

        // Sätt token för kommande anrop
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

        // Hämta användarinfo
        const userResponse = await api.get('/user/');
        const user = userResponse.data[0];  // Om du returnerar en lista med en användare

        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
          isAdmin: user.is_admin,
          firstName: user.first_name,
          lastName: user.last_name,
          companyId: user.company,
          companyName: user.company_name || "",
        }));

        // Omdirigera först när allt är klart
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Login failed:", error);
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
  const token = localStorage.getItem('token'); // Hämta token från localStorage
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/coursetobuy/`, {
    headers: headers,
  });
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

export const initializeScorm = async (courseId, languageCode) => {
  try {
    // 1. Fetch the SCORM launch URL
    const response = await fetch(`/api/coursetobuy/${courseId}/scorm/launch/${languageCode}/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.launch_url) {
      throw new Error('No launch_url in response');
    }

    // 2. Create and configure the iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'scorm-iframe';
    iframe.src = data.launch_url;
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.setAttribute('allow', 'fullscreen');

    // 3. Handle container
    const container = document.getElementById('scorm-container');
    if (!container) {
      throw new Error('SCORM container not found');
    }
    
    container.innerHTML = '';
    container.appendChild(iframe);

    // 4. Return a promise that resolves when iframe is loaded
    return new Promise((resolve, reject) => {
      iframe.onload = () => {
        try {
          setupScormAPI(iframe);
          resolve(iframe);
        } catch (error) {
          console.error('SCORM API setup failed:', error);
          reject(error);
        }
      };

      iframe.onerror = () => {
        reject(new Error('Failed to load SCORM content'));
      };
    });

  } catch (error) {
    console.error('SCORM initialization failed:', error);
    throw error; // Re-throw for calling code to handle
  }
};



export const uploadDocument = async (title, file, token) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('document_file', file); // Ändra fältnamnet för filen om din backend förväntar sig det

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


export const del = async (url, config = {}) => {
  try {
    const response = await api.delete(url, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
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
    formData.append('dashboard_text', dashboardText || ''); // Ensure field exists even if empty
    
    if (logoFile) {
      formData.append('logo', logoFile, logoFile.name); // Include filename
    }

    const response = await fetch(`${API_URL}/company/dashboard/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Explicitly DO NOT set Content-Type header for FormData
      },
      body: formData,
      credentials: 'include' // Add this if using cookies/sessions
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Update failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};
const updateFeaturedCourses = async (data) => {
  try {
    const response = await fetch('/api/featured-courses', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update featured courses');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating featured courses:', error);
    throw error;
  }
};

const UserService = {
  getProfile: async (userId) => {
    const response = await api.get(`/user/${userId}/`);
    return {
      ...response.data,
      profile_img_url: getFullMediaUrl(response.data.profile_img_url),
    };
  },

  updateProfile: async (userId, data) => {
    const response = await api.put(`/user/${userId}/`, data);
    return response.data;
  },

  uploadProfileImage: async (userId, file) => {
    const formData = new FormData();
    formData.append('profile_img', file);
    const response = await api.put(`/user/${userId}/`, formData, {
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


