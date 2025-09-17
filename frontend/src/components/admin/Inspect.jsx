import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XCircleIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  TrophyIcon,
  ClockIcon,
  CalendarIcon,
  UserCircleIcon,
  ChartBarIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  XCircleIcon as XCircleIconSolid
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundGradient } from "../ui/background-gradient";

export default function Inspect() {
  const { courseId } = useParams();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [stats, setStats] = useState({
    completed: 0,
    started: 0,
    notStarted: 0,
    averageScore: 0
  });

  // Förbättrade animationsvarianter
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

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const rowVariants = {
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
      scale: 1.01,
      backgroundColor: "rgba(59, 130, 246, 0.02)",
      transition: { duration: 0.2 }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const teamResponse = await api.get("/team/");
        const userList = teamResponse.data.map((user) => ({
          id: user.id,
          name: user.full_name && user.full_name.trim() ? user.full_name : user.email,
        }));

        const progressResponse = await api.get(`/scorm/get-data/?courseId=${courseId}`);
        const progressMap = {};
        (progressResponse.data || []).forEach((data) => {
          progressMap[data.user_id] = data.progress_data;
        });

        const enrichedUsers = userList
          .map((user) => ({
            user_id: user.id,
            name: user.name,
            progress_data: progressMap[user.id] || null,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setUsers(enrichedUsers);
        setProgressData(progressResponse.data || []);
        
        // Beräkna statistik
        calculateStats(enrichedUsers);
      } catch (err) {
        console.error("Fel vid hämtning av data:", err);
        setError("Kunde inte hämta data. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [courseId]);

  // Beräkna statistik
  const calculateStats = (userList) => {
    let completed = 0;
    let started = 0;
    let notStarted = 0;
    let totalScore = 0;
    let scoredUsers = 0;

    userList.forEach(user => {
      const status = getStatusType(user.progress_data);
      if (status === 'completed') completed++;
      else if (status === 'started') started++;
      else notStarted++;

      const score = getScore(user.progress_data);
      if (score.percentage > 0) {
        totalScore += score.percentage;
        scoredUsers++;
      }
    });

    setStats({
      completed,
      started,
      notStarted,
      averageScore: scoredUsers > 0 ? Math.round(totalScore / scoredUsers) : 0
    });
  };

  // Filtrera och sortera användare
  useEffect(() => {
    let filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        const status = getStatusType(user.progress_data);
        return status === statusFilter;
      });
    }

    // Sortera
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        const statusOrder = { completed: 0, started: 1, notStarted: 2 };
        const statusA = getStatusType(a.progress_data);
        const statusB = getStatusType(b.progress_data);
        return statusOrder[statusA] - statusOrder[statusB];
      } else if (sortBy === 'score') {
        const scoreA = getScore(a.progress_data).percentage;
        const scoreB = getScore(b.progress_data).percentage;
        return scoreB - scoreA;
      }
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, sortBy]);

  const getStatusType = (progress) => {
    if (!progress || Object.keys(progress).length === 0) {
      return 'notStarted';
    }
    if (progress["cmi.completion_status"] === "completed") {
      return 'completed';
    }
    if (progress["cmi.core.total_session_time"] || progress["cmi.core.session_time"] || progress["cmi.exit"] === "suspend") {
      return 'started';
    }
    return 'notStarted';
  };

  const getStatus = (progress) => {
    const type = getStatusType(progress);
    
    switch (type) {
      case 'completed':
        return {
          label: "Genomförd",
          icon: <CheckCircleIconSolid className="h-5 w-5 text-green-500" />,
          tooltip: "Kursen är slutförd.",
          color: "bg-green-100/70 text-green-800 border border-green-200/50",
          bgColor: "bg-green-50/50"
        };
      case 'started':
        return {
          label: "Påbörjad",
          icon: <ExclamationCircleIconSolid className="h-5 w-5 text-orange-500" />,
          tooltip: "Användaren har påbörjat kursen men inte slutfört.",
          color: "bg-orange-100/70 text-orange-800 border border-orange-200/50",
          bgColor: "bg-orange-50/50"
        };
      default:
        return {
          label: "Ej påbörjad",
          icon: <XCircleIconSolid className="h-5 w-5 text-red-500" />,
          tooltip: "Användaren har inte startat kursen.",
          color: "bg-red-100/70 text-red-800 border border-red-200/50",
          bgColor: "bg-red-50/50"
        };
    }
  };

  const getScore = (progress) => {
    if (!progress) {
      return fallbackScore("Ingen poängdata tillgänglig.");
    }
  
    let raw = parseFloat(progress["cmi.score.raw"]);
    let max = parseFloat(progress["cmi.score.max"]);
  
    if (
      (isNaN(raw) || isNaN(max) || max === 0) &&
      Array.isArray(progress.completion_history) &&
      progress.completion_history.length > 0
    ) {
      const latest = progress.completion_history[0];
      raw = parseFloat(latest.score_raw);
      max = parseFloat(latest.score_max);
    }
  
    if (isNaN(raw) || isNaN(max) || max === 0) {
      return fallbackScore("Ogiltig poängdata.");
    }
  
    const percentage = (raw / max) * 100;
    let color, bgColor, tooltip;
  
    if (percentage >= 80) {
      color = "text-green-600";
      bgColor = "bg-green-100/70 border border-green-200/50";
      tooltip = `Hög poäng: ${Math.round(percentage)}% (${raw}/${max})`;
    } else if (percentage >= 50) {
      color = "text-yellow-600";
      bgColor = "bg-yellow-100/70 border border-yellow-200/50";
      tooltip = `Medelpoäng: ${Math.round(percentage)}% (${raw}/${max})`;
    } else {
      color = "text-red-600";
      bgColor = "bg-red-100/70 border border-red-200/50";
      tooltip = `Låg poäng: ${Math.round(percentage)}% (${raw}/${max})`;
    }
  
    return {
      percentage,
      color,
      bgColor,
      display: `${Math.round(percentage)}%`,
      rawScore: `${raw}/${max}`,
      tooltip,
    };
  };
  
  const fallbackScore = (tooltipMessage) => ({
    percentage: 0,
    color: "text-gray-500",
    bgColor: "bg-gray-100/70 border border-gray-200/50",
    display: "-",
    tooltip: tooltipMessage || "Ingen poängdata.",
  });

  const formatSessionTime = (timeStr) => {
    if (!timeStr) return "-";
    const match = timeStr.match(/(\d+):(\d{2}):(\d{2})(\.\d{1,2})?/);
    if (!match) return timeStr;
    const [, hours, minutes, seconds, fraction] = match;
    const parts = [];
    if (parseInt(hours)) parts.push(`${parseInt(hours)}h`);
    if (parseInt(minutes)) parts.push(`${parseInt(minutes)}m`);
    const sec = parseFloat(seconds + (fraction || ".00")).toFixed(0);
    if (parseFloat(sec)) parts.push(`${sec}s`);
    return parts.join(" ") || "0s";
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("sv-SE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const toggleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  if (loading) {
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
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Laddar användarprogress...</h2>
            <p className="text-gray-600">Analyserar kursdata och prestationer</p>
          </motion.div>
          
          <div className="space-y-6">
            {[...Array(5)].map((_, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-16 bg-white/60 rounded-2xl animate-pulse backdrop-blur-sm border border-white/50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md mx-auto p-8 text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-100">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Något gick fel</h3>
            <p className="text-sm">{error}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            Försök igen
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Förbättrad header */}
        <motion.header 
          initial="hidden"
          animate="show"
          variants={headerVariants}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Kursanalys #{courseId}
                </h1>
                <p className="text-gray-600 mt-1">Detaljerad användaröversikt och prestationsanalys</p>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ x: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/admin/course-overview"
                className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/50 text-gray-700 rounded-full hover:bg-white hover:shadow-lg transition-all group shadow-md"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Tillbaka till översikt
              </Link>
            </motion.div>
          </div>
        </motion.header>

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
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-green-100 to-teal-100 group-hover:from-green-200 group-hover:to-teal-200 transition-all">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.completed}</h3>
            <p className="text-gray-600 text-sm">Genomförda</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 group-hover:from-orange-200 group-hover:to-yellow-200 transition-all">
              <ExclamationCircleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.started}</h3>
            <p className="text-gray-600 text-sm">Påbörjade</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-red-100 to-pink-100 group-hover:from-red-200 group-hover:to-pink-200 transition-all">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.notStarted}</h3>
            <p className="text-gray-600 text-sm">Ej påbörjade</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-to-r from-purple-100 to-violet-100 group-hover:from-purple-200 group-hover:to-violet-200 transition-all">
              <TrophyIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.averageScore}%</h3>
            <p className="text-gray-600 text-sm">Genomsnittlig poäng</p>
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
                placeholder="Sök användare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer backdrop-blur-sm"
                >
                  <option value="all">Alla status</option>
                  <option value="completed">Genomförda</option>
                  <option value="started">Påbörjade</option>
                  <option value="notStarted">Ej påbörjade</option>
                </select>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer backdrop-blur-sm"
              >
                <option value="name">Sortera efter namn</option>
                <option value="status">Sortera efter status</option>
                <option value="score">Sortera efter poäng</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Användartabell */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
          {filteredUsers.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-16 bg-white/60 rounded-2xl backdrop-blur-sm border border-white/50"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Inga användare hittades</h3>
              <p className="text-gray-500">Prova att ändra dina sökkriterier eller filter.</p>
            </motion.div>
          ) : (
            <BackgroundGradient className="rounded-[24px] p-1">
              <div className="bg-white/90 rounded-[20px] shadow-xl border border-white/50 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200/50">
                          Användare
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200/50">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200/50">
                          Poäng
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200/50">
                          Total tid
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200/50">
                          <span className="sr-only">Expandera</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50">
                      <AnimatePresence>
                        {filteredUsers.map((user, index) => {
                          const status = getStatus(user.progress_data);
                          const score = getScore(user.progress_data);
                          const isExpanded = expandedUserId === user.user_id;
                          
                          return (
                            <motion.tr
                              key={user.user_id}
                              variants={rowVariants}
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              custom={index}
                              whileHover="hover"
                              onClick={() => toggleExpand(user.user_id)}
                              className="cursor-pointer transition-all hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-600">
                                  <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="font-medium">
                                    {formatSessionTime(user.progress_data?.["cmi.core.session_time"] || user.progress_data?.["cmi.core.total_session_time"])}
                                  </span>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100/50 hover:bg-blue-100/50 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronUpIcon className="h-5 w-5 text-gray-500 hover:text-blue-600 transition-colors" />
                                  ) : (
                                    <ChevronDownIcon className="h-5 w-5 text-gray-500 hover:text-blue-600 transition-colors" />
                                  )}
                                </motion.div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Expanderade detaljer */}
                <AnimatePresence>
                  {expandedUserId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="bg-gradient-to-r from-gray-50/50 to-blue-50/30 backdrop-blur-sm border-t border-gray-200/50"
                    >
                      <div className="px-6 py-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex items-center mb-6">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg">
                              {users.find(u => u.user_id === expandedUserId)?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                <SparklesIcon className="h-5 w-5 mr-2 text-blue-500" />
                                Slutförande för {users.find(u => u.user_id === expandedUserId)?.name}
                              </h4>
                              <p className="text-sm text-gray-600">Detaljerad historik och prestationsdata</p>
                            </div>
                          </div>

                          {users.find(u => u.user_id === expandedUserId)?.progress_data?.["completion_history"]?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {users.find(u => u.user_id === expandedUserId)?.progress_data["completion_history"].map((entry, idx) => (
                                <motion.div 
                                  key={idx}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ 
                                    delay: idx * 0.1,
                                    type: "spring",
                                    stiffness: 100
                                  }}
                                  whileHover={{ 
                                    scale: 1.02,
                                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                                  }}
                                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
                                      <TrophyIcon className="h-3 w-3 mr-1" />
                                      Försök {idx + 1}
                                    </span>
                                    <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full">
                                      <CalendarIcon className="h-3 w-3 mr-1" />
                                      {formatDate(entry.timestamp)}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50/50 to-teal-50/50 rounded-lg border border-green-200/30">
                                      <div className="flex items-center">
                                        <TrophyIcon className="h-4 w-4 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-gray-700">Poäng:</span>
                                      </div>
                                      <span className="font-bold text-green-700" title={parseFloat(entry.score_max) === 0 ? "Kursen saknade poängsättning vid detta försök" : ""}>
                                        {entry.score_raw && entry.score_max && !isNaN(parseFloat(entry.score_raw)) && !isNaN(parseFloat(entry.score_max)) && parseFloat(entry.score_max) > 0
                                          ? `${entry.score_raw}/${entry.score_max} (${Math.round((parseFloat(entry.score_raw) / parseFloat(entry.score_max)) * 100)}%)`
                                          : "Ingen poäng"}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-200/30">
                                      <div className="flex items-center">
                                        <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
                                        <span className="text-sm font-medium text-gray-700">Tid:</span>
                                      </div>
                                      <span className="font-bold text-blue-700">
                                        {formatSessionTime(entry.session_time)}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-12 bg-white/60 rounded-2xl border border-gray-200/30"
                            >
                              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100/50">
                                <ExclamationCircleIcon className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-500 font-medium">Inga genomföranden registrerade</p>
                              <p className="text-sm text-gray-400 mt-1">Användaren har inte slutfört kursen än</p>
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </BackgroundGradient>
          )}
        </motion.div>
      </div>
    </div>
  );
}