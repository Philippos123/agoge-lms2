import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignIn() {
  // State för att hålla reda på användarens inloggningsinformation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // För att visa eventuella felmeddelanden
  const [loading, setLoading] = useState(false); // För att visa laddningsindikator
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        email,
        password
      }) ;
  
      // Korrekt sätt att spara token
      localStorage.setItem('token', response.data.access);
      
      // Spara även refresh token om den finns
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }
      
      // Store user info
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user_id,
        email: response.data.email,
        isAdmin: response.data.is_admin,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        companyId: response.data.company_id,
        companyName: response.data.company_name
      }));
  
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail || 
        'Felaktiga inloggningsuppgifter. Kontrollera din e-post och lösenord.'
      );
    } finally {
      setLoading(false);
    }
  };
  const startTokenRefresh = (expiresIn) => {
    setTimeout(async () => {
      try {
        const response = await axios.post('/api/token/refresh/', {
          refresh: localStorage.getItem('refreshToken')
        });
        localStorage.setItem('token', response.data.access);
        startTokenRefresh(expiresIn); // Continue refreshing
      } catch (error) {
        console.error('Token refresh failed', error);
        AuthService.logout();
      }
    }, (expiresIn - 60) * 1000); // Refresh 1 minute before expiration
  };
  
  // In successful login handler
  const expiresIn = 3600; // Get from backend response
  startTokenRefresh(expiresIn);

  return (
    <div className="bg-gray-900 isolated h-[100vh] w-[100vw] lg:py-30 sm:py-10 flex justify-center items-center">
      <div className="max-w-md w-full mx-auto px-8 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-semibold text-white text-center mb-10 uppercase pt-10 ">Agoges <br></br>kunskaps portal</h2>

        <img
          src="/Logotyp-Agoge-white.png"
          className="w-42 h-auto mx-auto mb-6"
          alt="Agoge Logo"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-100">
              Email address
            </label>
            <div className="mt-2 justify-center text-right items-baseline">
              <input
                placeholder="Email address"
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full py-4 rounded-md bg-white px-3  text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-100">
                Password
              </label>
              <div className="text-sm">
                <a href="#" className="font-semibold text-yellow-500 hover:text-yellow-500 ">
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                placeholder="Password"
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md py-4 bg-white px-3 text-base text-black outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>} {/* Visa eventuella felmeddelanden */}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-4 text-sm font-semibold text-black shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={loading} // Inaktivera knappen under laddning
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <p className="mt-10 text-center text-sm text-gray-500 pb-15">
          Not a member?{' '}
          <a href="#" className="font-semibold text-yellow-600 hover:text-indigo-500">
            Start a 14 day free trial
          </a>
        </p>
      </div>
    </div>
  );
}
