import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TeamPage = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [team, setTeam] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/team/');
      setTeam(response.data);
    } catch (err) {
      console.error("Error fetching team:", err);
      setError("Failed to load team data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const response = await api.post('/team/invite/', { email: inviteEmail });
      setMessage(response.data.message || 'Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      fetchTeam();
    } catch (err) {
      console.error("Error inviting member:", err);
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) return;

    try {
      await api.delete(`/team/remove/${userId}/`);
      setTeam(team.filter(member => member.id !== userId));
      setMessage('Team member removed successfully');
    } catch (err) {
      console.error("Error removing member:", err);
      setError('Failed to remove team member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !team.length) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchTeam}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
        
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Invite Member
          </button>
        
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
          <button 
            onClick={() => setMessage('')} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError('')} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {team.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No team members found. Invite someone to get started!
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {team.map(member => (
              <li key={member.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {member.profile_image ? (
                      <img
                        src={`http://localhost:8000${member.profile_image}`}
                        alt={member.full_name || member.email}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${(member.first_name?.charAt(0) || member.email.charAt(0))}&background=random`;
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {(member.first_name?.charAt(0) || member.email.charAt(0)).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.full_name || member.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  {user?.is_admin && member.id !== user.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                      title="Remove member"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitation}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;