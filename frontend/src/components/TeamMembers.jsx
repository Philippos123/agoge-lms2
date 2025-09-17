import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  CalendarIcon,
  TrophyIcon,
  UserGroupIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import { BackgroundGradient } from "./ui/background-gradient";
import api from '../services/api';

const TeamPage = () => {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [filteredTeam, setFilteredTeam] = useState([]);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState({
    totalMembers: 0,
    admins: 0,
    activeMembers: 0,
    completedCourses: 0
  });

  // Animationsvarianter
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring",
        stiffness: 80
      }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2 }
    }
  };

  // Hämta teammedlemmar
  const fetchTeam = async () => {
    try {
      setError('');
      const response = await api.get('/team/');
      setTeam(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error("Fel vid hämtning av team:", err);
      setError(err.response?.data?.message || "Kunde inte ladda teamdata. Försök igen.");
    }
  };

  // Beräkna statistik
  const calculateStats = (teamData) => {
    const totalMembers = teamData.length;
    const admins = teamData.filter(member => member.is_admin).length;
    const activeMembers = teamData.filter(member => member.last_login).length;
    
    setStats({
      totalMembers,
      admins,
      activeMembers,
      completedCourses: 0 // Detta skulle behöva hämtas från en annan endpoint
    });
  };

  // Hämta medlemskurser
  const fetchMemberCourses = async (userId) => {
    try {
      setCoursesLoading(true);
      const response = await api.get(`/team/member-courses/${userId}/`);
      setMemberCourses(response.data);
    } catch (err) {
      console.error("Fel vid hämtning av medlemskurser:", err);
      setError(err.response?.data?.message || "Kunde inte ladda medlemskurser.");
    } finally {
      setCoursesLoading(false);
    }
  };

  // Filtrera team
  useEffect(() => {
    let filtered = team.filter(member => {
      const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
                         (roleFilter === 'admin' && member.is_admin) ||
                         (roleFilter === 'member' && !member.is_admin);
      
      return matchesSearch && matchesRole;
    });

    setFilteredTeam(filtered);
  }, [team, searchTerm, roleFilter]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  useEffect(() => {
    if (!user) {
      setError('Ingen användare inloggad. Vänligen logga in igen.');
      setIsLoading(false);
      return;
    }
    if (user.isAdmin) {
      fetchTeam()
        .then(() => setIsLoading(false))
        .catch(err => {
          setError(err.response?.data?.message || 'Kunde inte ladda data.');
          setIsLoading(false);
        });
    } else {
      setError('Du har inte behörighet att visa denna sida.');
      setIsLoading(false);
    }
  }, [user]);

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      setError('Ange en giltig e-postadress');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setError('Ange ett giltigt e-postformat');
      return;
    }
    try {
      setMessage('');
      const response = await api.post('/team/invite/', { email: inviteEmail });
      setMessage(response.data.message || 'Inbjudan skickad framgångsrikt!');
      setShowInviteModal(false);
      setInviteEmail('');
      await fetchTeam();
    } catch (err) {
      console.error("Fel vid inbjudan av medlem:", err);
      setError(err.response?.data?.message || 'Kunde inte skicka inbjudan');
    }
  };

  const handleSendNotification = async (memberId) => {
    if (!notificationMessage.trim()) {
      setError('Ange ett notifikationsmeddelande');
      return;
    }
    try {
      const response = await api.post('/notifications/send/', {
        recipient: memberId,
        message: notificationMessage,
        notification_type: 'admin_message'
      });
      setMessage('Notifikation skickad framgångsrikt!');
      setShowNotificationModal(false);
      setNotificationMessage('');
    } catch (err) {
      console.error("Fel vid sändning av notifikation:", err);
      setError(err.response?.data?.error || 'Kunde inte skicka notifikation');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna teammedlem?")) return;
    try {
      await api.delete(`/team/remove/${userId}/`);
      setTeam(team.filter(member => member.id !== userId));
      setMessage('Teammedlem borttagen framgångsrikt');
      if (selectedMember?.id === userId) {
        setSelectedMember(null);
        setMemberCourses([]);
      }
    } catch (err) {
      console.error("Fel vid borttagning av medlem:", err);
      setError(err.response?.data?.message || 'Kunde inte ta bort teammedlem');
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Åtkomst nekad</h2>
          <p className="text-red-600">Du har inte behörighet att visa denna sida.</p>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Laddar teamhantering...</h2>
            <p className="text-gray-600">Hämtar medlemsdata och statistik</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Teamhantering
                </h1>
                <p className="text-gray-600 mt-1">Hantera teammedlemmar och övervaka aktivitet</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full shadow-xl border border-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Bjud in medlem
            </motion.button>
          </div>
        </motion.header>

        {/* Statusmeddelanden */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-8 p-4 bg-green-100/80 backdrop-blur-sm border border-green-200/50 text-green-700 rounded-2xl flex justify-between items-center shadow-lg"
            >
              <div className="flex items-center">
                <CheckCircleIconSolid className="h-5 w-5 mr-2" />
                <span className="font-medium">{message}</span>
              </div>
              <button 
                onClick={() => setMessage('')} 
                className="text-green-700 hover:text-green-900 p-1 rounded-full hover:bg-green-200/50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-8 p-4 bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-700 rounded-2xl flex justify-between items-center shadow-lg"
            >
              <div className="flex items-center">
                <XCircleIconSolid className="h-5 w-5 mr-2" />
                <span className="font-medium">{error}</span>
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-700 hover:text-red-900 p-1 rounded-full hover:bg-red-200/50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistikkort */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalMembers}</h3>
            <p className="text-gray-600 text-sm">Totala medlemmar</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-purple-100 to-violet-100 group-hover:from-purple-200 group-hover:to-violet-200 transition-all">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.admins}</h3>
            <p className="text-gray-600 text-sm">Administratörer</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-green-100 to-teal-100 group-hover:from-green-200 group-hover:to-teal-200 transition-all">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.activeMembers}</h3>
            <p className="text-gray-600 text-sm">Aktiva medlemmar</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 group-hover:from-orange-200 group-hover:to-yellow-200 transition-all">
              <AcademicCapIcon className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.completedCourses}</h3>
            <p className="text-gray-600 text-sm">Genomförda kurser</p>
          </motion.div>
        </motion.div>

        {/* Filter och sök */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Sök medlemmar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer backdrop-blur-sm"
                >
                  <option value="all">Alla roller</option>
                  <option value="admin">Administratörer</option>
                  <option value="member">Medlemmar</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Teammedlemmar */}
          <div className="xl:col-span-2">
            <motion.div
              initial="hidden"
              animate="show"
              variants={containerVariants}
            >
              {filteredTeam.length === 0 ? (
                <motion.div 
                  variants={itemVariants}
                  className="text-center py-16 bg-white/60 rounded-2xl backdrop-blur-sm border border-white/50"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                    <UserIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Inga medlemmar hittades</h3>
                  <p className="text-gray-500 mb-6">
                    {team.length === 0 ? "Bjud in någon för att komma igång!" : "Prova att ändra dina sökkriterier."}
                  </p>
                  {team.length === 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowInviteModal(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Bjud in första medlemmen
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <BackgroundGradient className="rounded-[24px] p-1">
                  <div className="bg-white/90 rounded-[20px] shadow-xl border border-white/50 overflow-hidden backdrop-blur-sm">
                    <div className="p-6 border-b border-gray-200/50">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <SparklesIcon className="h-6 w-6 mr-2 text-blue-500" />
                        Teammedlemmar ({filteredTeam.length})
                      </h2>
                    </div>
                    
                    <div className="divide-y divide-gray-200/50">
                      <AnimatePresence>
                        {filteredTeam.map((member, index) => (
                          <motion.div
                            key={member.id}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            whileHover="hover"
                            custom={index}
                            className="p-6 transition-all hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  {member.profile_image ? (
                                    <img
                                      src={member.profile_image}
                                      alt={member.full_name || member.email}
                                      className="h-12 w-12 rounded-full object-cover shadow-lg ring-2 ring-white"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${(member.first_name?.charAt(0) || member.email.charAt(0))}&background=random`;
                                      }}
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                      {(member.first_name?.charAt(0) || member.email.charAt(0)).toUpperCase()}
                                    </div>
                                  )}
                                  {member.is_admin && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                      <ShieldCheckIcon className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900">{member.full_name || member.email}</p>
                                    {member.is_admin && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100/70 text-purple-800 rounded-full border border-purple-200/50">
                                        <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleViewCourses(member)}
                                  className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50/50 transition-colors"
                                  title="Visa kurser"
                                >
                                  <EyeIcon className="w-5 h-5" />
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => { setSelectedMember(member); setShowNotificationModal(true); }}
                                  className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50/50 transition-colors"
                                  title="Skicka notifikation"
                                >
                                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50/50 transition-colors"
                                  title="Ta bort medlem"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </BackgroundGradient>
              )}
            </motion.div>
          </div>

          {/* Medlemsdetaljpanel */}
          <div className="xl:col-span-1">
            <AnimatePresence mode="wait">
              {selectedMember ? (
                <motion.div
                  key="member-details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <BackgroundGradient className="rounded-[24px] p-1">
                    <div className="bg-white/90 rounded-[20px] shadow-xl border border-white/50 overflow-hidden backdrop-blur-sm">
                      <div className="p-6 border-b border-gray-200/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                          <UserIcon className="h-6 w-6 mr-2 text-blue-500" />
                          {selectedMember.full_name || selectedMember.email}
                        </h2>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={closeMemberDetails}
                          className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100/50 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </motion.button>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                            {selectedMember.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-400" />
                            {selectedMember.is_admin ? 'Administratör' : 'Medlem'}
                          </div>
                          {selectedMember.last_login && (
                            <div className="flex items-center text-sm text-gray-600">
                              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                              Senast inloggad: {new Date(selectedMember.last_login).toLocaleString('sv-SE', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4 flex items-center">
                          <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />
                          Kurser
                        </h3>
                        {coursesLoading ? (
                          <div className="text-center py-6">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100"
                            >
                              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                            </motion.div>
                            <p className="text-gray-600 mt-2">Laddar kurser...</p>
                          </div>
                        ) : memberCourses.length === 0 ? (
                          <div className="text-center py-6 bg-white/60 rounded-2xl border border-gray-200/50">
                            <InformationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Inga kurser registrerade</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {memberCourses.map((course, index) => (
                              <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-200/30"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{course.title}</p>
                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                      <TrophyIcon className="h-4 w-4 mr-1" />
                                      {course.completion_status === 'completed' ? 'Genomförd' : course.completion_status === 'started' ? 'Påbörjad' : 'Ej påbörjad'}
                                    </div>
                                  </div>
                                  {course.score && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100/70 text-green-800 rounded-full border border-green-200/50">
                                      {course.score.percentage}% ({course.score.raw}/{course.score.max})
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </BackgroundGradient>
                </motion.div>
              ) : (
                <motion.div
                  key="no-member"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 text-center"
                >
                  <InformationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Välj en medlem för att se detaljer</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Inbjudan Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Bjud in ny medlem</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100/50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-postadress</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Ange e-postadress"
                    className="w-full px-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100/70 rounded-xl hover:bg-gray-200/70 transition-all"
                  >
                    Avbryt
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendInvitation}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Skicka inbjudan
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifikations Modal */}
        <AnimatePresence>
          {showNotificationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Skicka notifikation</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotificationModal(false)}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100/50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meddelande</label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Skriv ditt meddelande..."
                    className="w-full px-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotificationModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100/70 rounded-xl hover:bg-gray-200/70 transition-all"
                  >
                    Avbryt
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendNotification(selectedMember.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Skicka
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamPage;