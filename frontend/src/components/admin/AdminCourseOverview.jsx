import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { 
  ClockIcon, 
  AcademicCapIcon, 
  UsersIcon,
  ChartBarIcon,
  SparklesIcon,
  EyeIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundGradient } from "../ui/background-gradient";

export default function AdminCourseOverview() {
  const [courses, setCourses] = useState([]);
  const [companyStats, setCompanyStats] = useState({ totalUsers: 0, completedCourses: 0, avgSessionTime: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Förbättrade animationsvarianter
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.6
      }
    }
  };

  const statVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    show: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 120,
        damping: 12
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

  // Funktion för att parsa SCORM-sessionstid till sekunder
  const parseSessionTime = (sessionTime) => {
    try {
      if (!sessionTime || sessionTime === "0") return 0;
      const match = sessionTime.match(/(\d+):(\d{2}):(\d{2})(\.\d+)?/);
      if (!match) return 0;
      const [, hours, minutes, seconds, decimals] = match;
      let totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
      if (decimals) totalSeconds += parseFloat(decimals);
      return totalSeconds;
    } catch (err) {
      console.error(`Fel vid parsning av sessionstid ${sessionTime}:`, err);
      return 0;
    }
  };

  // Funktion för att formatera sekunder till MM:SS
  const formatSessionTime = (seconds) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Filtrera och sortera kurser
  const getFilteredAndSortedCourses = () => {
    let filtered = courses;
    
    if (filter === 'popular') {
      filtered = courses.filter(course => course.completed_users > 0);
    } else if (filter === 'new') {
      filtered = courses.slice(0, 3); // Antag att de första är nyast
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'popular') return b.completed_users - a.completed_users;
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Hämta kurser
        const coursesResponse = await api.get("/courses/");
        let coursesData = coursesResponse.data;

        // Hämta team-data för totalUsers
        const teamResponse = await api.get("/team/");
        const totalUsers = teamResponse.data.length || 0;

        // Hämta SCORM-data för alla kurser
        let completedCourses = 0;
        let totalSessionTime = 0;

        // Lägg till completed_users för varje kurs
        coursesData = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const scormResponse = await api.get(`/scorm/get-data/?courseId=${course.id}`);
              const scormData = scormResponse.data || [];

              // Räkna unika användare med completed
              const completedUserIds = new Set(
                scormData
                  .filter((entry) => entry.progress_data?.["cmi.completion_status"] === "completed")
                  .map((entry) => entry.user_id)
              );
              const completedUsersCount = completedUserIds.size;

              // Uppdatera statistik
              scormData.forEach((entry) => {
                if (entry.progress_data?.["cmi.completion_status"] === "completed") {
                  completedCourses += 1;
                }
                const sessionTime = entry.progress_data?.["cmi.core.total_session_time"];
                if (sessionTime) {
                  totalSessionTime += parseSessionTime(sessionTime);
                }
              });

              return { ...course, completed_users: completedUsersCount };
            } catch (err) {
              console.error(`Fel vid hämtning av SCORM-data för kurs ${course.id}:`, err);
              return { ...course, completed_users: 0 };
            }
          })
        );

        setCourses(coursesData);

        const avgSessionTime = totalUsers > 0 ? totalSessionTime : 0;

        setCompanyStats({
          totalUsers,
          completedCourses,
          avgSessionTime: avgSessionTime || 0,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Kunde inte hämta data. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, []);

  // Förbättrad loading state
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
                <SparklesIcon className="h-8 w-8 text-blue-600" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Laddar administratörsöversikt...</h2>
            <p className="text-gray-600">Hämtar kursdata och statistik</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[...Array(6)].map((_, index) => (
              <motion.div 
                key={index} 
                variants={cardVariants}
                className="bg-white/60 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm border border-white/50"
              >
                <div className="h-48 bg-gradient-to-br from-gray-200/40 to-gray-100/30 animate-pulse"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200/40 rounded-lg animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200/40 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-200/40 rounded animate-pulse w-5/6"></div>
                  <div className="h-10 bg-gray-200/40 rounded-lg animate-pulse mt-6"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
              <ChartBarIcon className="h-6 w-6 text-red-600" />
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

  const filteredCourses = getFilteredAndSortedCourses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Förbättrad header */}
        <motion.header 
          initial="hidden"
          animate="show"
          variants={headerVariants}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xl">
            <ChartBarIcon className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            Administratörsöversikt
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Få en komplett översikt över kurser, användare och prestanda i din organisation
          </p>
          
          <Link to="/ai-dashboard">
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3)",
                y: -2
              }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full shadow-xl border border-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              AI för oss nördar
            </motion.button>
          </Link>
        </motion.header>

        {/* Förbättrade statistikkort */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16"
        >
          <motion.div 
            variants={statVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">{companyStats.totalUsers}</h3>
            <p className="text-gray-600 font-medium">Användare i företaget</p>
            <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              Aktiva användare
            </div>
          </motion.div>
          
          <motion.div 
            variants={statVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-green-100 to-teal-100 group-hover:from-green-200 group-hover:to-teal-200 transition-all">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">{companyStats.completedCourses}</h3>
            <p className="text-gray-600 font-medium">Slutförda kurser</p>
            <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              Totalt genomförda
            </div>
          </motion.div>
          
          <motion.div 
            variants={statVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 text-center hover:shadow-xl transition-all group"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-100 to-violet-100 group-hover:from-purple-200 group-hover:to-violet-200 transition-all">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">{formatSessionTime(companyStats.avgSessionTime)}</h3>
            <p className="text-gray-600 font-medium">Sammanställd sessionstid</p>
            <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              Total inlärningstid
            </div>
          </motion.div>
        </motion.div>

        {/* Filter och sortering */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Alla kurser
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('popular')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'popular' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Populära
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('new')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'new' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Nya kurser
            </motion.button>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/50 rounded-full font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">Sortera efter popularitet</option>
            <option value="alphabetical">Sortera alfabetiskt</option>
          </select>
        </motion.div>

        {/* Kurslista */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={filter + sortBy}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredCourses.map((course, index) => (
              <motion.article
                key={course.id}
                variants={cardVariants}
                custom={index}
                className="relative group"
                onMouseEnter={() => setHoveredCard(course.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <BackgroundGradient className="rounded-3xl p-1 h-full">
                  <motion.div 
                    className={`bg-white/90 backdrop-blur-sm p-6 rounded-[22px] h-full flex flex-col transition-all duration-500 ${
                      hoveredCard === course.id 
                        ? 'shadow-2xl ring-2 ring-blue-500/30 transform scale-[1.02]' 
                        : 'shadow-lg hover:shadow-xl'
                    }`}
                    whileHover={{ y: -5 }}
                  >
                    <div className="relative h-48 overflow-hidden rounded-2xl mb-6">
                      <motion.img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      />
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4"
                      >
                        <span className="text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                          Visa detaljer
                        </span>
                      </motion.div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                          {course.language}
                        </span>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1 text-green-600" />
                          <span className="font-medium">{course.completed_users || 0}</span>
                          <span className="ml-1">slutförda</span>
                        </div>
                        
                        {course.completed_users > 0 && (
                          <div className="flex items-center text-green-600">
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">Populär</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to={`/inspect/${course.id}`}
                        className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl group"
                      >
                        <EyeIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                        Inspektera kurs
                      </Link>
                    </motion.div>
                  </motion.div>
                </BackgroundGradient>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
              <AcademicCapIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Inga kurser hittades</h3>
            <p className="text-gray-500">Prova att ändra dina filter eller sökkriterier.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}