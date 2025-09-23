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
  InformationCircleIcon,
  FolderIcon,
  UsersIcon,
  PencilIcon,
  Squares2X2Icon,
  ArrowLeftIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  FolderIcon as FolderIconSolid
} from '@heroicons/react/24/solid';
import { BackgroundGradient } from "./ui/background-gradient";
import api from '../services/api';

const TeamPage = () => {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [filteredTeam, setFilteredTeam] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('team'); // 'team' eller 'groups'
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageGroupsModal, setShowManageGroupsModal] = useState(false);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  
  // Form states
  const [inviteEmails, setInviteEmails] = useState(['']);
  const [selectedInviteGroups, setSelectedInviteGroups] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  
  // Selected states
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemberGroups, setSelectedMemberGroups] = useState([]);
  const [memberCourses, setMemberCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  
  
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    admins: 0,
    activeMembers: 0,
    completedCourses: 0,
    totalGroups: ""
  });

  // Animation variants
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

  // Email management functions
  const addEmailField = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const removeEmailField = (index) => {
    if (inviteEmails.length > 1) {
      setInviteEmails(inviteEmails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index, value) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const validateEmails = () => {
    const validEmails = inviteEmails.filter(email => {
      const trimmed = email.trim();
      return trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    });

    if (validEmails.length === 0) {
      setError('Ange minst en giltig e-postadress');
      return false;
    }

    // Check for duplicates
    const uniqueEmails = new Set(validEmails);
    if (uniqueEmails.size !== validEmails.length) {
      setError('Duplicerade e-postadresser är inte tillåtna');
      return false;
    }

    return validEmails;
  };

  // Group management in invite modal
  const toggleInviteGroup = (groupId) => {
    setSelectedInviteGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Fetch functions
  const fetchGroupDetails = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/`);
      return response.data;
    } catch (err) {
      console.error("Fel vid hämtning av gruppdetaljer:", err);
      setError(err.response?.data?.message || "Kunde inte ladda gruppdetaljer.");
      return null;
    }
  };

  const calculateStats = (teamData, groupsData) => {
    const totalMembers = teamData.length;
    const admins = teamData.filter(member => member.is_admin).length;
    const activeMembers = teamData.filter(member => member.last_login).length;
    const totalGroups = groupsData?.length || 0;
    
    setStats({
      totalMembers,
      admins,
      activeMembers,
      completedCourses: 0,
      totalGroups
    });
  };

  const fetchMemberCourses = async () => {
    try {
      setCoursesLoading(true);
      const coursesResponse = await api.get('/user/courses/');
      const courses = coursesResponse.data;
  
      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          const progressResponse = await api.get(`/courses/${course.id}/progress/`);
          return {
            ...course,
            progress: progressResponse.data,
          };
        })
      );
  
      const sortedCourses = coursesWithProgress.sort(
        (a, b) => new Date(b.progress.last_accessed || b.progress.completed_at) - new Date(a.progress.last_accessed || a.progress.completed_at)
      );
  
      setMemberCourses(sortedCourses);
    } catch (err) {
      console.error("Fel vid hämtning av medlemskurser:", err);
      setError(err.response?.data?.message || "Kunde inte ladda medlemskurser.");
    } finally {
      setCoursesLoading(false);
    }
  };

  // Group management functions
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Ange ett gruppnamn');
      return;
    }
    try {
      const response = await api.post('/groups/', { 
        name: newGroupName.trim(), 
        description: newGroupDescription.trim() 
      });
      setMessage('Grupp skapad framgångsrikt!');
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      await fetchGroups();
    } catch (err) {
      console.error("Fel vid skapande av grupp:", err);
      setError(err.response?.data?.message || 'Kunde inte skapa grupp');
    }
  };

  const handleEditGroup = async () => {
    if (!editGroupName.trim() || !selectedGroup) {
      setError('Ange ett gruppnamn');
      return;
    }
    try {
      await api.put(`/groups/${selectedGroup.id}/`, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim()
      });
      setMessage('Grupp uppdaterad framgångsrikt!');
      setShowEditGroupModal(false);
      setSelectedGroup(null);
      await fetchGroups();
    } catch (err) {
      console.error("Fel vid uppdatering av grupp:", err);
      setError(err.response?.data?.message || 'Kunde inte uppdatera grupp');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna grupp? Alla medlemmar kommer att tas bort från gruppen.")) return;
    try {
      await api.delete(`/groups/${groupId}/`);
      setMessage('Grupp borttagen framgångsrikt');
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      await fetchGroups();
      await fetchTeam(); // Uppdatera team för att reflektera förändringar
    } catch (err) {
      console.error("Fel vid borttagning av grupp:", err);
      setError(err.response?.data?.message || 'Kunde inte ta bort grupp');
    }
  };

  const handleUpdateMemberGroups = async (groupId, add = true) => {
    if (!selectedMember) return;
    try {
      const endpoint = `/groups/${groupId}/${add ? 'add_members/' : 'remove_members/'}`;
      await api.post(endpoint, { member_ids: [selectedMember.id] });
      setMessage(add ? 'Medlem tillagd i grupp' : 'Medlem borttagen från grupp');
      
      // Update selected member's groups
      const updatedGroups = add 
        ? [...selectedMemberGroups, groups.find(g => g.id === groupId)]
        : selectedMemberGroups.filter(g => g.id !== groupId);
      setSelectedMemberGroups(updatedGroups);
      
      // Update groups state with new member count
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, members_count: add ? (group.members_count || 0) + 1 : (group.members_count || 0) - 1 }
          : group
      ));
  
      await fetchTeam(); // Still needed for team data consistency
    } catch (err) {
      console.error("Fel vid uppdatering av grupper:", err);
      setError(err.response?.data?.message || 'Kunde inte uppdatera grupper');
    }
  };

  const handleViewGroupDetails = async (group) => {
    const groupDetails = await fetchGroupDetails(group.id);
    if (groupDetails) {
      setSelectedGroup(groupDetails);
      setShowGroupDetailsModal(true);
    }
  };

  const handleEditGroupClick = (group) => {
    setSelectedGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || '');
    setShowEditGroupModal(true);
  };

  // Team member functions
  const handleSendInvitations = async () => {
    const validEmails = validateEmails();
    if (!validEmails) return;

    try {
      setMessage('');
      const invitationPromises = validEmails.map(email => 
        api.post('/team/invite/', { 
          email: email.trim(),
          groups: selectedInviteGroups.length > 0 ? selectedInviteGroups : undefined
        })
      );
      
      const results = await Promise.allSettled(invitationPromises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      let successMessage = '';
      if (successful.length > 0) {
        successMessage = `${successful.length} inbjudan${successful.length > 1 ? 'ar' : ''} skickade framgångsrikt!`;
      }
      
      if (failed.length > 0) {
        const errorMessage = `${failed.length} inbjudan${failed.length > 1 ? 'ar' : ''} misslyckades.`;
        if (successful.length > 0) {
          setMessage(successMessage + ' ' + errorMessage);
        } else {
          setError(errorMessage);
        }
      } else {
        setMessage(successMessage);
      }

      // Reset form on success
      if (successful.length > 0) {
        setShowInviteModal(false);
        setInviteEmails(['']);
        setSelectedInviteGroups([]);
        await fetchTeam();
      }
    } catch (err) {
      console.error("Fel vid inbjudan av medlemmar:", err);
      setError('Kunde inte skicka inbjudningar');
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
    setSelectedMemberGroups(member.groups || []);
    await fetchMemberCourses(member.id);
  };

  const closeMemberDetails = () => {
    setSelectedMember(null);
    setMemberCourses([]);
  };

  useEffect(() => {
    calculateStats(team, groups);
  }, [team, groups]);

  // Filter functions
  useEffect(() => {
    let filtered = team.filter(member => {
      const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
                         (roleFilter === 'admin' && member.is_admin) ||
                         (roleFilter === 'member' && !member.is_admin);

      const matchesGroup = groupFilter === 'all' || (
                           Array.isArray(member.groups) &&
                           member.groups.some(g => {
                             if (typeof g === "object" && g.id) {
                               return g.id === parseInt(groupFilter);
                             }
                             return false; // ignorera strängar
                           })
                         );
      
      return matchesSearch && matchesRole && matchesGroup;
    });

    setFilteredTeam(filtered);
  }, [team, searchTerm, roleFilter, groupFilter]);

  const filteredGroups = groups.filter(group => {
    const name = group?.full_name?.toLowerCase() || "";
    const description = group?.description?.toLowerCase() || "";
    const search = groupSearchTerm?.toLowerCase() || "";
  
    return name.includes(search) || description.includes(search);
  });

  // Initialize
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) {
      setError('Du har inte behörighet att visa denna sida.');
      setIsLoading(false);
      return;
    }
  
    (async () => {
      try {
        setIsLoading(true);
        await fetchTeam();        // ladda team först
        await fetchGroups();      // ladda grupper efteråt (kan använda team-snapshot)
        // calculateStats kan köras nu
        calculateStats(Array.isArray(team) ? team : [], Array.isArray(groups) ? groups : []);
        setIsLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Kunde inte ladda data.');
        setIsLoading(false);
      }
    })();
  }, [user]);

  
  
  const fetchTeam = async () => {
    try {
      setError('');
      const response = await api.get('/team/');
      const data = response.data;
  
      const rawTeam = Array.isArray(data) ? data : (Array.isArray(data.team) ? data.team : []);
      const normalizedTeam = rawTeam.map(member => ({
        ...member,
        groups: Array.isArray(member.groups)
          ? member.groups.map(g =>
              typeof g === "string"
                ? { id: null, name: g }
                : g
            )
          : []
      }));
  
      setTeam(normalizedTeam);
  
      // Spara även stats från backend
      if (data.stats) {
        setStats({
          totalMembers: data.stats.total_members,
          admins: data.stats.admins,
          activeMembers: data.stats.active_members,
          completedCourses: data.stats.completed_courses,
          totalGroups: data.stats.total_groups
        });
      }
    } catch (err) {
      console.error("Fel vid hämtning av team:", err);
      setError(err.response?.data?.message || "Kunde inte ladda teamdata. Försök igen.");
    }
  };
  
  const fetchGroups = async () => {
  try {
    const response = await api.get('/groups/');
    const groupsWithDetails = response.data.map(group => ({
      ...group,
      members_count: Array.isArray(group.members) ? group.members.length : 0,
      members: Array.isArray(group.members) ? group.members.map(m => {
        if (typeof m === "string") {
          return { id: null, full_name: m, email: "" }; // fallback för sträng
        }
        if (typeof m === "number") {
          const member = team.find(u => u.id === m);
          return {
            id: m,
            full_name: member?.full_name || member?.email || "Unknown",
            email: member?.email || ""
          };
        }
        return m; // redan objekt
      }) : []
    }));
    setGroups(groupsWithDetails);
    console.log("Enriched groups:", groupsWithDetails); // Debug
  } catch (err) {
    console.error("Fel vid hämtning av grupper:", err);
    setError(err.response?.data?.message || "Kunde inte ladda grupper.");
  }
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
        
        {/* Header med navigation */}
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Teamhantering</h1>
              <p className="text-gray-600">Hantera dina teammedlemmar och grupper</p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-white/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveView('team')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === 'team' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Medlemmar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveView('groups')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === 'groups' 
                    ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FolderIcon className="h-5 w-5 mr-2" />
                Grupper
              </motion.button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              {activeView === 'team' ? (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full shadow-xl border border-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Bjud in medlemmar
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateGroupModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-full shadow-xl border border-purple-500/20 hover:from-purple-700 hover:to-violet-700 transition-all"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Skapa grupp
                </motion.button>
              )}
            </div>
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12"
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
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 group-hover:from-violet-200 group-hover:to-pink-200 transition-all">
              <FolderIconSolid className="h-6 w-6 text-violet-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalGroups}</h3>
            <p className="text-gray-600 text-sm">Totala grupper</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 group-hover:from-yellow-200 group-hover:to-orange-200 transition-all">
              <TrophyIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.completedCourses}</h3>
            <p className="text-gray-600 text-sm">Avslutade kurser</p>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeView === 'team' ? (
            <motion.div
              key="team-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {/* Team filter och sök */}
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
                    <div className="relative">
                      <FolderIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="pl-10 pr-8 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer backdrop-blur-sm"
                      >
                        <option value="all">Alla grupper</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Team Members Grid */}
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
                                        {/* Grupptaggar */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {member.groups?.map(group => (
                                            <span key={group.id} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-violet-100/70 text-violet-800 rounded-full border border-violet-200/50">
                                              <FolderIcon className="h-3 w-3 mr-1" />
                                              {group.name}
                                            </span>
                                          ))}
                                          {(!member.groups || member.groups.length === 0) && (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100/70 text-gray-600 rounded-full border border-gray-200/50">
                                              Ingen grupp
                                            </span>
                                          )}
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
                                        onClick={() => {
                                          setSelectedMember(member);
                                          setSelectedMemberGroups(member.groups || []);
                                          setShowManageGroupsModal(true);
                                        }}
                                        className="p-2 text-violet-600 hover:text-violet-800 rounded-full hover:bg-violet-50/50 transition-colors"
                                        title="Hantera grupper"
                                      >
                                        <Squares2X2Icon className="w-5 h-5" />
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

                              {/* Medlemsgrupper */}
                              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4 flex items-center">
                                <FolderIcon className="h-5 w-5 mr-2 text-violet-500" />
                                Grupper ({selectedMember.groups?.length || 0})
                              </h3>
                              <div className="space-y-2 mb-6">
                                {selectedMember.groups?.length > 0 ? (
                                  selectedMember.groups.map(group => (
                                    <div key={group.id} className="flex items-center justify-between p-3 bg-violet-50/50 rounded-lg border border-violet-200/30">
                                      <div>
                                        <p className="font-medium text-gray-900">{group.name}</p>
                                        {group.description && (
                                          <p className="text-sm text-gray-600">{group.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-4 bg-gray-50/50 rounded-lg border border-gray-200/30">
                                    <p className="text-gray-500 text-sm">Ingen grupp tilldelad</p>
                                  </div>
                                )}
                              </div>

                              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
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
            {course.progress?.is_completed ? 'Genomförd' : course.progress?.current_slide_index > 0 ? 'Påbörjad' : 'Ej påbörjad'}
          </div>
        </div>
        {course.progress?.score && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100/70 text-green-800 rounded-full border border-green-200/50">
            {course.progress.score.percentage}% ({course.progress.score.raw}/{course.progress.score.max})
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
            </motion.div>
          ) : (
            <motion.div
              key="groups-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {/* Groups filter och sök */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8"
              >
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Sök grupper..."
                    value={groupSearchTerm}
                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                  />
                </div>
              </motion.div>

              {/* Groups Grid */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredGroups.length === 0 ? (
                  <motion.div 
                    variants={itemVariants}
                    className="col-span-full text-center py-16 bg-white/60 rounded-2xl backdrop-blur-sm border border-white/50"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                      <FolderIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Inga grupper hittades</h3>
                    <p className="text-gray-500 mb-6">
                      {groups.length === 0 ? "Skapa din första grupp för att komma igång!" : "Prova att ändra dina sökkriterier."}
                    </p>
                    {groups.length === 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateGroupModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Skapa första gruppen
                      </motion.button>
                    )}
                  </motion.div>
                ) : (
                  filteredGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl transition-all"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-purple-100 to-violet-100 rounded-xl mr-4">
                              <FolderIconSolid className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                              <p className="text-sm text-gray-500">{group.members_count || 0} medlemmar</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewGroupDetails(group)}
                              className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50/50 transition-colors"
                              title="Visa grupp"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditGroupClick(group)}
                              className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50/50 transition-colors"
                              title="Redigera grupp"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteGroup(group.id)}
                              className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50/50 transition-colors"
                              title="Ta bort grupp"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                        
                        {group.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            {group.members_count || 0} medlemmar
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {group.created_at && new Date(group.created_at).toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {/* Enhanced Invite Modal with Multiple Emails and Group Assignment */}
          {showInviteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Bjud in medlemmar</h3>
                      <p className="text-gray-600 mt-1">Skicka inbjudningar till flera personer samtidigt</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmails(['']);
                        setSelectedInviteGroups([]);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Email Input Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      E-postadresser
                    </label>
                    <div className="space-y-3">
                      {inviteEmails.map((email, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex-1 relative">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => updateEmail(index, e.target.value)}
                              placeholder={`E-postadress ${index + 1}`}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          {inviteEmails.length > 1 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => removeEmailField(index)}
                              className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors"
                              title="Ta bort email"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addEmailField}
                      className="mt-3 inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Lägg till fler e-postadresser
                    </motion.button>
                  </div>

                  {/* Group Assignment Section */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Tilldela grupper (valfritt)
                    </label>
                    {groups.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500 text-sm text-center">
                          Inga grupper tillgängliga. Skapa en grupp först för att tilldela nya medlemmar.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groups.map((group) => (
                          <motion.div
                            key={group.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleInviteGroup(group.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedInviteGroups.includes(group.id)
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-gray-200 bg-gray-50 hover:border-violet-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${
                                  selectedInviteGroups.includes(group.id)
                                    ? 'bg-violet-200'
                                    : 'bg-gray-200'
                                }`}>
                                  <FolderIcon className={`h-4 w-4 ${
                                    selectedInviteGroups.includes(group.id)
                                      ? 'text-violet-600'
                                      : 'text-gray-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{group.name}</p>
                                  <p className="text-sm text-gray-500">{group.members_count || 0} medlemmar</p>
                                </div>
                              </div>
                              {selectedInviteGroups.includes(group.id) && (
                                <CheckCircleIconSolid className="h-6 w-6 text-violet-600" />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    {selectedInviteGroups.length > 0 && (
                      <div className="mt-3 p-3 bg-violet-50 rounded-lg border border-violet-200">
                        <p className="text-sm text-violet-800">
                          <strong>{selectedInviteGroups.length}</strong> grupp{selectedInviteGroups.length > 1 ? 'er' : ''} vald{selectedInviteGroups.length > 1 ? 'a' : ''}. 
                          Nya medlemmar kommer automatiskt att läggas till i dessa grupper.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmails(['']);
                        setSelectedInviteGroups([]);
                      }}
                      className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Avbryt
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendInvitations}
                      className="flex-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                    >
                      Skicka inbjudningar
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Notification Modal */}
          {showNotificationModal && selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
              >
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4">Meddela {selectedMember.full_name || selectedMember.email}</h3>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Skriv ditt meddelande..."
                  className="w-full p-3 border rounded-xl mb-4 focus:ring focus:ring-green-500"
                  rows={4}
                />
                <button
                  onClick={() => handleSendNotification(selectedMember.id)}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold"
                >
                  Skicka
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Create Group Modal */}
          {showCreateGroupModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
              >
                <button
                  onClick={() => setShowCreateGroupModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4">Skapa ny grupp</h3>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Gruppnamn"
                  className="w-full p-3 border rounded-xl mb-4"
                />
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Beskrivning (valfritt)"
                  className="w-full p-3 border rounded-xl mb-4"
                  rows={3}
                />
                <button
                  onClick={handleCreateGroup}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold"
                >
                  Skapa grupp
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Edit Group Modal */}
          {showEditGroupModal && selectedGroup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
              >
                <button
                  onClick={() => setShowEditGroupModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4">Redigera grupp</h3>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="Gruppnamn"
                  className="w-full p-3 border rounded-xl mb-4"
                />
                <textarea
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  placeholder="Beskrivning"
                  className="w-full p-3 border rounded-xl mb-4"
                  rows={3}
                />
                <button
                  onClick={handleEditGroup}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold"
                >
                  Uppdatera grupp
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Manage Groups Modal (för medlem) */}
          {showManageGroupsModal && selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
              >
                <button
                  onClick={() => setShowManageGroupsModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-6">
                  Hantera grupper för {selectedMember.full_name || selectedMember.email}
                </h3>
                <div className="space-y-3">
                  {groups.map(group => {
                    const isMember = selectedMemberGroups.some(g => g.id === group.id);
                    return (
                      <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span>{group.name}</span>
                        <button
                          onClick={() => handleUpdateMemberGroups(group.id, !isMember)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            isMember
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {isMember ? "Ta bort" : "Lägg till"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Group Details Modal */}
          {showGroupDetailsModal && selectedGroup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
              >
                <button
                  onClick={() => setShowGroupDetailsModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4">{selectedGroup.name}</h3>
                {selectedGroup.description && (
                  <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
                )}
                <h4 className="text-lg font-semibold mb-2">Medlemmar</h4>
                {selectedGroup.members && selectedGroup.members.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedGroup.members.map((name, i) => (
                      <li key={i} className="p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <p className='text-xs text-gray-500 font-bold'>Användare:</p> 
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Inga medlemmar i denna grupp</p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamPage;