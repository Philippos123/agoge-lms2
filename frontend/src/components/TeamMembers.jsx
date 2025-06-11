import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TeamPage = () => {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberCourses, setMemberCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Hämta teammedlemmar
  const fetchTeam = async () => {
    try {
      setError('');
      const response = await api.get('/team/');
      setTeam(response.data);
    } catch (err) {
      console.error("Error fetching team:", err);
      setError(err.response?.data?.message || "Failed to load team data. Please try again.");
    }
  };

  // Hämta medlemskurser
  const fetchMemberCourses = async (userId) => {
    try {
      setCoursesLoading(true);
      const response = await api.get(`/team/member-courses/${userId}/`);
      setMemberCourses(response.data);
    } catch (err) {
      console.error("Error fetching member courses:", err);
      setError(err.response?.data?.message || "Failed to load member's courses.");
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    console.log("User object from storage:", storedUser);
    setUser(storedUser);
  }, []);

  useEffect(() => {
    console.log('User object:', user); // Logga user-objektet
    if (!user) {
      setError('No user logged in. Please log in again.');
      setIsLoading(false);
      return;
    }
    if (user.isAdmin) { // Använd isAdmin
      console.log('Fetching team...');
      fetchTeam()
        .then(() => {
          console.log('Team data fetched successfully');
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching data:', err);
          setError(err.response?.data?.message || 'Failed to load data.');
          setIsLoading(false);
        });
    } else {
      setError('You do not have permission to view this page.');
      setIsLoading(false);
    }
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setError('Please enter a valid email format');
      return;
    }
    try {
      setMessage('');
      const response = await api.post('/team/invite/', { email: inviteEmail });
      setMessage(response.data.message || 'Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      await fetchTeam();
    } catch (err) {
      console.error("Error inviting member:", err);
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleSendNotification = async (memberId) => {
    if (!notificationMessage.trim()) {
      setError('Please enter a notification message');
      return;
    }
    try {
      const response = await api.post('/notifications/send/', {
        recipient: memberId,
        message: notificationMessage,
        notification_type: 'admin_message'
      });
      setMessage('Notification sent successfully!');
      setShowNotificationModal(false);
      setNotificationMessage('');
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(err.response?.data?.error || 'Failed to send notification');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) return;
    try {
      await api.delete(`/team/remove/${userId}/`);
      setTeam(team.filter(member => member.id !== userId));
      setMessage('Team member removed successfully');
      if (selectedMember?.id === userId) {
        setSelectedMember(null);
        setMemberCourses([]);
      }
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err.response?.data?.message || 'Failed to remove team member');
    }
  };

  const handleViewCourses = async (member) => {
    setSelectedMember(member);
    await fetchMemberCourses(member.id);
  };

  const closeMemberDetails = () => {
    setSelectedMember(null);
    setMemberCourses([]);
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded flex justify-between items-center">
          <span>{message}</span>
          <button 
            onClick={() => setMessage('')} 
            className="text-green-700 hover:text-green-900 font-bold text-lg"
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError('')} 
            className="text-red-700 hover:text-red-900 font-bold text-lg"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Team Members List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 p-4 border-b">Team Members</h2>
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
                          src={`${member.profile_image}`}
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
                        <p className="font-medium text-gray-900">{member.full_name || member.email}</p>
                        <p className="text-sm text-gray-500">{member.email} {member.is_admin && "(Admin)"}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCourses(member)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                        title="View courses"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setSelectedMember(member); setShowNotificationModal(true); }}
                        className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50"
                        title="Send notification"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                        title="Remove member"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Member Details Panel */}
        {selectedMember && (
          <div className="bg-white rounded-lg shadow overflow-hidden w-full md:w-96">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedMember.full_name || selectedMember.email}'s Details
              </h2>
              <button onClick={closeMemberDetails} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center space-x-4 mb-4">
                {selectedMember.profile_image ? (
                  <img
                    src={`${selectedMember.profile_image}`}
                    alt={selectedMember.full_name || selectedMember.email}
                    className="h-16 w-16 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${(selectedMember.first_name?.charAt(0) || selectedMember.email.charAt(0))}&background=random`;
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-xl font-medium">
                      {(selectedMember.first_name?.charAt(0) || selectedMember.email.charAt(0)).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedMember.full_name || selectedMember.email}</h3>
                  <p className="text-gray-600">{selectedMember.email}</p>
                  {selectedMember.is_admin && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Completed Courses</h3>
              {coursesLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : memberCourses.length === 0 ? (
                <p className="text-gray-500">No courses completed yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {memberCourses.map((course) => (
                    <li key={course.id} className="py-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{course.title}</p>
                          <p className="text-sm text-gray-500">Completed on: {new Date(course.completed_at).toLocaleDateString()}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {course.score ? `${course.score}%` : 'Completed'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Invite Team Member</h2>
                <button
                  onClick={() => { setShowInviteModal(false); setInviteEmail(''); setError(''); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowInviteModal(false); setInviteEmail(''); setError(''); }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitation}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Send Notification</h2>
                <button
                  onClick={() => { setShowNotificationModal(false); setNotificationMessage(''); setError(''); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Sending to: {selectedMember.full_name || selectedMember.email}
                </p>
                <label htmlFor="notification" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="notification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your notification message..."
                  rows="4"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowNotificationModal(false); setNotificationMessage(''); setError(''); }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendNotification(selectedMember.id)}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                >
                  Send Notification
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