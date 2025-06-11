import { Link} from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { ClockIcon, AcademicCapIcon, UsersIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { BackgroundGradient } from "../ui/background-gradient"; // You'll need to create this component

export default function AdminCourseOverview() {
  const [courses, setCourses] = useState([]);
  const [companyStats, setCompanyStats] = useState({ totalUsers: 0, completedCourses: 0, avgSessionTime: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

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

  const statItem = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  // Funktion för att parsa SCORM-sessionstid till sekunder
  const parseSessionTime = (sessionTime) => {
    try {
      if (!sessionTime || sessionTime === "0") return 0;
      // Hantera formatet HH:MM:SS.ss
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

        // Sätt kurser med uppdaterad completed_users
        setCourses(coursesData);

        // Beräkna genomsnittlig sessionstid
        const avgSessionTime = totalUsers > 0 ? totalSessionTime: 0;

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

  if (loading) {
    return (
      <motion.div 
        initial="hidden"
        animate="show"
        variants={container}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-8"
      >
        
        
        {[...Array(3)].map((_, index) => (
          <motion.div 
            key={index} 
            variants={item}
            className="bg-white/10 rounded-xl shadow-md overflow-hidden animate-pulse backdrop-blur-sm"
          >
            <div className="h-48 bg-gradient-to-br from-gray-200/30 to-gray-100/20"></div>
            <div className="p-6 space-y-4">
              <div className="h-6 bg-gray-200/30 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200/30 rounded w-full"></div>
              <div className="h-4 bg-gray-200/30 rounded w-5/6"></div>
              <div className="h-10 bg-gray-200/30 rounded mt-6"></div>
            </div>
          </motion.div>
        ))}
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
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Översikt */}
        <motion.header 
          initial="hidden"
          animate="show"
          variants={container}
          className="mb-12"
        >
          
          <motion.h1 
            variants={item}
            className="text-4xl font-bold text-gray-900 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            Administratörsöversikt
          </motion.h1>
          <Link to="/ai-dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 m-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-3xl shadow-2xl border hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Ai för oss nördar
            
          </motion.button>
          </Link>
          <motion.div 
            variants={container}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6" 
          >
            <motion.div 
              variants={statItem}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{companyStats.totalUsers}</h3>
              <p className="text-gray-600">Användare i företaget</p>
            </motion.div>
            
            <motion.div 
              variants={statItem}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-green-100 to-teal-100">
                <AcademicCapIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{companyStats.completedCourses}</h3>
              <p className="text-gray-600">Slutförda kurser</p>
            </motion.div>
            
            <motion.div 
              variants={statItem}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-100 to-violet-100">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{formatSessionTime(companyStats.avgSessionTime)}</h3>
              <p className="text-gray-600">Sammanställd sessionstid</p>
            </motion.div>
          </motion.div>
        </motion.header>

        {/* Kurslista */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {courses.map((course) => (
            <motion.article
              key={course.id}
              variants={item}
              className="relative group"
              onMouseEnter={() => setHoveredCard(course.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <BackgroundGradient className="rounded-[22px] p-4 h-full">
                <div className={`bg-white dark:bg-gray-900 p-6 rounded-[18px] h-full flex flex-col transition-all duration-300 ${
                  hoveredCard === course.id ? 'shadow-xl ring-1 ring-blue-500/20' : 'shadow-md'
                }`}>
                  <div className="relative h-48 overflow-hidden rounded-xl">
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <span className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs font-medium px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      {course.language}
                    </span>
                  </div>

                  <div className="pt-6 pb-2 flex-grow">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 mb-3">{course.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{course.description}</p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-5">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <span>{course.completed_users || 0} användare slutfört</span>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <Link
                      to={`/inspect/${course.id}`}
                      className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                    >
                      Inspektera kurs
                    </Link>
                  </div>
                </div>
              </BackgroundGradient>
              
            </motion.article>
            
          ))}
        </motion.div>
      </div>
    </section>
  );
}