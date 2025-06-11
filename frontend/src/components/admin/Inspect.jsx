import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundGradient } from "../ui/background-gradient";

export default function Inspect() {
  const { courseId } = useParams();
  const [users, setUsers] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
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

  const getStatus = (progress) => {
    if (!progress || Object.keys(progress).length === 0) {
      return {
        label: "Ej påbörjad",
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        tooltip: "Användaren har inte startat kursen.",
        color: "bg-red-100/50 text-red-800"
      };
    }
    if (progress["cmi.completion_status"] === "completed") {
      return {
        label: "Genomförd",
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        tooltip: "Kursen är slutförd.",
        color: "bg-green-100/50 text-green-800"
      };
    }
    if (progress["cmi.core.total_session_time"] || progress["cmi.core.session_time"] || progress["cmi.exit"] === "suspend") {
      return {
        label: "Påbörjad",
        icon: <ExclamationCircleIcon className="h-5 w-5 text-orange-500" />,
        tooltip: "Användaren har påbörjat kursen men inte slutfört.",
        color: "bg-orange-100/50 text-orange-800"
      };
    }
    return {
      label: "Ej påbörjad",
      icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
      tooltip: "Användaren har inte startat kursen.",
      color: "bg-red-100/50 text-red-800"
    };
  };

  const getScore = (progress) => {
    if (!progress) {
      return fallbackScore("Ingen poängdata tillgänglig.");
    }
  
    let raw = parseFloat(progress["cmi.score.raw"]);
    let max = parseFloat(progress["cmi.score.max"]);
  
    // Fallback till completion_history[0] om raw/max saknas eller är ogiltiga
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
      bgColor = "bg-green-100/50";
      tooltip = `Hög poäng: ${Math.round(percentage)}% (${raw}/${max})`;
    } else if (percentage >= 50) {
      color = "text-yellow-600";
      bgColor = "bg-yellow-100/50";
      tooltip = `Medelpoäng: ${Math.round(percentage)}% (${raw}/${max})`;
    } else {
      color = "text-red-600";
      bgColor = "bg-red-100/50";
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
    bgColor: "bg-gray-100/50",
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
    const sec = parseFloat(seconds + (fraction || ".00")).toFixed(2);
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
      <motion.div 
        initial="hidden"
        animate="show"
        variants={container}
        className="max-w-6xl mx-auto p-8"
      >
        <div className="space-y-6">
          <div className="h-8 bg-gradient-to-r from-gray-200/30 to-gray-100/20 rounded-full w-1/4 animate-pulse"></div>
          <div className="h-64 bg-gradient-to-br from-gray-200/30 to-gray-100/20 rounded-xl animate-pulse"></div>
          <p className="text-gray-600 text-center">Laddar användarprogress...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto p-8 text-center"
      >
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
          {error}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
        >
          Försök igen
        </motion.button>
      </motion.div>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Kurs {courseId} - Användarprogress
          </h1>
          <motion.div whileHover={{ x: -2 }}>
            <Link
              to="/admin/course-overview"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors group"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
              Tillbaka till översikt
            </Link>
          </motion.div>
        </motion.header>

        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
        >
          <motion.h2 
            variants={item}
            className="text-xl font-semibold text-gray-800 mb-6"
          >
            Användarprogress
          </motion.h2>
          
          {users.length === 0 ? (
            <motion.p 
              variants={item}
              className="text-gray-600"
            >
              Inga användare tillgängliga.
            </motion.p>
          ) : (
            <BackgroundGradient className="rounded-[22px] p-1">
              <div className="bg-white rounded-[18px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Användare</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poäng</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total tid</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user, index) => {
                        const status = getStatus(user.progress_data);
                        const score = getScore(user.progress_data);
                        const isExpanded = expandedUserId === user.user_id;
                        
                        return (
                          <motion.tr
                            key={user.user_id}
                            variants={item}
                            onClick={() => toggleExpand(user.user_id)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {user.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm px-3 py-1 rounded-full inline-flex items-center ${status.color}`}>
                                {status.icon}
                                <span className="ml-2">{status.label}</span>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm px-3 py-1 rounded-full inline-flex items-center ${score.bgColor} ${score.color}`}>
                                {score.display}
                                {score.rawScore && (
                                  <span className="ml-2 text-xs text-gray-500">{score.rawScore}</span>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatSessionTime(user.progress_data?.["cmi.core.session_time"] || user.progress_data?.["cmi.core.session_time"])}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {isExpanded ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <AnimatePresence>
                  {expandedUserId && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50"
                    >
                      <td colSpan="5" className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Slutförande för {users.find(u => u.user_id === expandedUserId)?.name}
                          </h4>
                          {users.find(u => u.user_id === expandedUserId)?.progress_data?.["completion_history"]?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {users.find(u => u.user_id === expandedUserId)?.progress_data["completion_history"].map((entry, idx) => (
                                <motion.div 
                                  key={idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      Försök {idx + 1}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(entry.timestamp)}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Poäng:</span>
                                        <span className="font-medium" title={parseFloat(entry.score_max) === 0 ? "Kursen saknade poängsättning vid detta försök" : ""}>
                                          {entry.score_raw && entry.score_max && !isNaN(parseFloat(entry.score_raw)) && !isNaN(parseFloat(entry.score_max)) && parseFloat(entry.score_max) > 0
                                            ? `${entry.score_raw}/${entry.score_max} (${Math.round((parseFloat(entry.score_raw) / parseFloat(entry.score_max)) * 100)}%)`
                                            : "Ingen poäng (kurs utan poängsättning)"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Tid:</span>
                                        <span className="font-medium">
                                          {formatSessionTime(entry.session_time)}
                                        </span>
                                      </div>
                                    </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">Inga genomföranden registrerade.</p>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </div>
            </BackgroundGradient>
          )}
        </motion.div>
      </div>
    </section>
  );
}