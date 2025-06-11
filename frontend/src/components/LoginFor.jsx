import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuroraBackground } from './ui/aurora';
import { motion } from "motion/react";


const API_URL = 'https://backend-agoge-5544956f8095.herokuapp.com/api';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSSOLogin = () => {
    window.location.href = `${API_URL}/login/azuread-oauth2/`; // Anpassa URL:en om din är annorlunda
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/token/`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.access);
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user_id,
        email: response.data.email,
        isAdmin: response.data.is_admin,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        companyId: response.data.company_id,
        companyName: response.data.company_name,
        isUtbCompany: response.data.is_utb_company,
      }));
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
          refresh: localStorage.getItem('refreshToken'),
        });
        localStorage.setItem('token', response.data.access);
        startTokenRefresh(expiresIn);
      } catch (error) {
        console.error('Token refresh failed', error);
        // Hantera utloggning eller felhantering här
      }
    }, (expiresIn - 60) * 1000);
  };

  // Antag att backend returnerar 'expires_in' i sekunder vid lyckad inloggning
  // const expiresIn = 3600; // Exempelvärde, bör komma från backend
  // Om du behåller lokal inloggning, se till att starta token-uppdateringen där det är relevant

  return (  
    <div className=" absolute bg-gradient-to-b from-indigo-900 to-indigo-500 flex items-center justify-center">
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center"
      >
    <div className=" isolated w-[100vw] h-[100vh] lg:py-30 sm:py-10 flex justify-center items-center">
      
      
      <div className="max-w-md w-full mx-auto px-8 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-3xl sm:text-4xl font-bold text-gray-300 text-center uppercase pt-10 ">Agoges </h2>
        <h2 className='text-5xl md:text-4xl sd:text-4xl font-bold bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r from-blue-600 via-yellow-600 to-blue-600 [text-shadow:0_0_rgba(0,0,0,0)]  text-center mb-10 uppercase '> Företag portal</h2>

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
                placeholder="Your Work Email"
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
                <a href="#" className="font-semibold text-yellow-500 hover:text-indigo-500">
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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              className="flex w-full cursor-pointer justify-center rounded-md bg-linear-to-l/srgb from-indigo-800 to-indigo-500 px-3 py-4 text-sm font-semibold text-white shadow-xs hover:text-xl hover:from-blue-500 hover:to-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 duration-200"
              disabled={loading}
            >
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <button
            type="button"
            className="flex w-full justify-center cursor-pointer rounded-md bg-linear-to-r/srgb from-blue-500 to-blue-200 px-3 py-4 text-sm font-semibold text-white shadow-sm hover:text-xl hover:from-blue-500 hover:to-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 duration-200"
            onClick={handleSSOLogin}
          >
            Logga in med SSO
          </button>
        </div>

        <p className="mt-10  text-center text-sm text-gray-500">
          Saknar ditt företag ett konto?{' '}
          <a href="#" className="font-semibold text-yellow-600 hover:text-indigo-500">
            Ansök om företagskonto här
          </a>
        </p>
      </div>
    </div>
      </motion.div>
      </AuroraBackground>
    </div>
  );
}