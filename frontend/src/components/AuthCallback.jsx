import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_URL = 'https://backend-agoge-5544956f8095.herokuapp.com/api';

  console.log('AuthCallback component rendering.');

  useEffect(() => {
    console.log('AuthCallback useEffect ran.');

    const fetchTokensAndUser = async () => {
      console.log('fetchTokensAndUser started.');
      try {
        // Fetch JWT tokens
        console.log('Calling /api/auth/jwt/');
        const tokenResponse = await axios.get(`${API_URL}/auth/jwt/`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('Token response:', tokenResponse.data);

        // Store tokens
        localStorage.setItem('token', tokenResponse.data.access);
        localStorage.setItem('refreshToken', tokenResponse.data.refresh);
        console.log('Tokens saved:', localStorage.getItem('token'));

        // Fetch user data
        console.log('Calling /api/user/');
        const userResponse = await axios.get(`${API_URL}/user/`, {
          headers: {
            'Authorization': `Bearer ${tokenResponse.data.access}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true // Include sessionid cookie
        });
        console.log('User response:', userResponse.data);

        // Store user data in localStorage to match AuthService.login format
        const user = userResponse.data[0]; // e.g., {id: 103, email: "philip.samaras@justnameit.se", ...}
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
          isAdmin: user.is_admin,
          firstName: user.first_name,
          lastName: user.last_name,
          companyId: user.company,
          companyName: user.company_name || '' // Adjust if not provided
        }));

        // Update user_id cookie
        document.cookie = `user_id=${user.id}; path=/; secure; samesite=None; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}`;
        console.log('User data saved to localStorage and user_id cookie set:', user.id);

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Error in AuthCallback:', err);
        setError('Kunde inte autentisera. Försök igen.');
        console.log('Error response:', err.response);
        setLoading(false);
      } finally {
        setLoading(false);
        console.log('fetchTokensAndUser finished.');
      }
    };

    fetchTokensAndUser();
  }, [navigate]);

  if (loading) {
    return <div>Laddar autentisering...</div>;
  }

  if (error) {
    return <div>Fel: {error}</div>;
  }

  return null;
};

export default AuthCallback;