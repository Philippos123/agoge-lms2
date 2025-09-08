// src/components/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import RegistrationSuccess from './RegistrationSuccess';

const RegisterPage3 = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [branschTyp, setBranschTyp] = useState('annat');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const navigate = useNavigate();
  const { token } = useParams(); // Get invite token from URL

  // Check if user is joining via invitation
  useEffect(() => {
    if (token) {
      axios.get(`/api/accept-invite/${token}/`)
        .then(response => {
          setIsInvited(true);
          setInvitationData(response.data);
          setEmail(response.data.email || '');
        })
        .catch(err => {
          setError('Invalid or expired invitation');
        });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isInvited) {
        // Handle invited employee registration
        await axios.post(`/api/accept-invite/${token}/`, {
          email,
          password,
        });
      } else {
        // Handle admin/company registration
        await axios.post('/api/register/', {
          email,
          password,
          name: companyName,
          bransch_typ: branschTyp,
        });
      }
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  if (success) {
    return <RegistrationSuccess />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className=" p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-4">{isInvited ? 'Join Company' : 'Register Company'}</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          required
          disabled={isInvited && invitationData?.email} // Disable if email is pre-filled from invite
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          required
        />
        {!isInvited && (
          <>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              className="w-full p-2 mb-4 border rounded"
              required
            />
            <select
              value={branschTyp}
              onChange={(e) => setBranschTyp(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            >
              <option value="teknik">Teknik</option>
              <option value="vård">Vård</option>
              <option value="handel">Handel</option>
              <option value="service">Service</option>
              <option value="fordon">Fordon</option>
              <option value="industri">Industri</option>
              <option value="sälj">Sälj</option>
              <option value="ekonomi">Ekonomi</option>
              <option value="it">IT</option>
              <option value="bygg">Bygg</option>
              <option value="transport">Transport</option>
              <option value="skola">Skola</option>
              <option value="annat">Annat</option>
            </select>
          </>
        )}
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          {isInvited ? 'Join' : 'Register'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default RegisterPage3;