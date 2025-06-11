import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../services/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

export default function AIDashboard() {
  const [aiData, setAIData] = useState(null);
    const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiActivated, setAIActivated] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [company_id, setCompanyId] = useState(null);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const fetchAIData = async () => {
    if (!company_id) {
      console.warn("Ingen companyId tillgänglig vid API-anrop");
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/ai/predict/all/?company_id=${company_id}&period=${selectedPeriod}`);
      setAIData(response.data);
    } catch (err) {
      console.error("Fel vid hämtning av AI-data:", err.response?.data || err.message);
      setError("AI:n behöver mera data för att kunna analysera. Försök igen senare.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.companyId) {
      setCompanyId(user.companyId);
    } else {
      console.warn("Ingen companyId hittades i localStorage-användaren", user);
    }
  }, []);

  useEffect(() => {
    if (aiActivated) {
      fetchAIData();
    }
  }, [aiActivated, selectedPeriod]);

  const handleActivateAI = () => {
    setAIActivated(true);
  };

  // Simple SVG icons to replace Heroicons
  const AcademicCapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />
      <path d="M12 6v7" />
      <path d="M9 9h6" />
      <path d="M2 19h20" />
    </svg>
  );

  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );

  const ExclamationTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

  const LightBulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );

  const TrendingUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );

  const TrendingDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );

  // Prepare chart data
  const overviewData = aiData ? [
    {
      name: "Slutförandegrad",
      value: aiData.overall?.completion_rate || 0,
      color: "#8B5CF6"
    },
    {
      name: "Motivation",
      value: (aiData.overall?.avg_motivation_score || 0),
      color: "#10B981"
    },
    {
      name: "Engagemang", 
      value: (aiData.overall?.avg_engagement_score || 0),
      color: "#F59E0B"
    }
  ] : [];

  const riskData = aiData ? [
    { name: "Låg Motivation", value: aiData.overall?.low_motivation_percentage || 0, color: "#EF4444" },
    { name: "Lågt Engagemang", value: aiData.overall?.low_engagement_percentage || 0, color: "#F97316" },
    { name: "Övrigt", value: 100 - (aiData.overall?.low_motivation_percentage || 0) - (aiData.overall?.low_engagement_percentage || 0), color: "#10B981" }
  ] : [];

  const COLORS = ['#EF4444', '#F97316', '#10B981'];

  const MetricCard = ({ title, value, icon: Icon, trend, color = "purple" }) => {
    const colorClasses = {
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      green: "bg-green-50 border-green-200 text-green-700", 
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      red: "bg-red-50 border-red-200 text-red-700"
    };

    return (
      <motion.div 
        variants={item}
        className={`p-6 rounded-xl border-2 ${colorClasses[color]} backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="flex items-center space-x-2">
            {trend && (
              trend > 0 ? 
                <TrendingUpIcon /> :
                <TrendingDownIcon />
            )}
            <Icon />
          </div>
        </div>
      </motion.div>
    );
  };

  const RecommendationCard = ({ recommendation }) => {
    const typeStyles = {
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      alert: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    };

    const typeIcons = {
      warning: ExclamationTriangleIcon,
      alert: ExclamationTriangleIcon,
      info: LightBulbIcon
    };

    const Icon = typeIcons[recommendation.type] || LightBulbIcon;

    return (
      <motion.div
        variants={item}
        className={`p-4 rounded-lg border-2 ${typeStyles[recommendation.type]} mb-4`}
      >
        <div className="flex items-start space-x-3">
          <Icon />
          <div>
            <h4 className="font-semibold text-sm">{recommendation.title}</h4>
            <p className="text-sm mt-1">{recommendation.message}</p>
            <p className="text-xs mt-2 font-medium">Rekommendation: {recommendation.action}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <motion.header initial="hidden" animate="show" variants={container} className="mb-12 text-center">
            
          <motion.h1 variants={item} className="text-4xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-violet-600">
            Agoge AI Dashboard
          </motion.h1>
          
          <motion.div variants={item} className="flex justify-center space-x-4">
            
            <button
              onClick={handleActivateAI}
              disabled={aiActivated}
              className={`px-6 py-2 font-medium rounded-lg shadow-md transition-all ${
                aiActivated ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700"
              }`}
            >
              {aiActivated ? "AI Aktiverad" : "Aktivera AI"}
            </button>
            {aiActivated && (
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="week">Veckovis</option>
                <option value="day">Dagligen</option>
              </select>
            )}
          </motion.div>
        </motion.header>
        {loading && (
          <motion.div initial="hidden" animate="show" variants={container} className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="text-gray-600 mt-2">Analyserar AI-data...</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
            {error}
            <button
              onClick={fetchAIData}
              className="ml-4 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Försök igen
            </button>
          </motion.div>
        )}

        {aiActivated && !loading && !error && aiData && (
          <motion.div initial="hidden" animate="show" variants={container} className="space-y-8">
            
            {/* Key Metrics Cards */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Totala Användare"
                value={aiData.overall?.total_users || 0}
                icon={AcademicCapIcon}
                color="purple"
              />
              <MetricCard
                title="Slutförandegrad"
                value={`${aiData.overall?.completion_rate || 0}%`}
                icon={ChartBarIcon}
                color="green"
              />
              <MetricCard
                title="Genomsnittlig Motivation"
                value={`${((aiData.overall?.avg_motivation_score || 0)).toFixed(1)}%`}
                icon={TrendingUpIcon}
                color="yellow"
              />
              <MetricCard
                title="Kurser per Användare"
                value={aiData.overall?.avg_courses_per_user?.toFixed(1) || 0}
                icon={ClockIcon}
                color="purple"
              />
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Overview Bar Chart */}
              <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Team Prestanda</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Procent (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="value" fill="#8B5CF6">
                      {overviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Risk Analysis Pie Chart */}
              <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Riskanalys</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Trends Section */}
            {aiData.trends && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Motivation Trends */}
                {aiData.trends.motivation_trends && aiData.trends.motivation_trends.length > 0 && (
                  <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Motivationstrend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={aiData.trends.motivation_trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[0, 1]} label={{ value: "Motivationspoäng", angle: -90, position: "insideLeft" }} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Line type="monotone" dataKey="avg_motivation_score" stroke="#10B981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Engagement Trends */}
                {aiData.trends.engagement_trends && aiData.trends.engagement_trends.length > 0 && (
                  <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Engagemangstrend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={aiData.trends.engagement_trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[0, 1]} label={{ value: "Engagemangspoäng", angle: -90, position: "insideLeft" }} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Line type="monotone" dataKey="avg_engagement_score" stroke="#F59E0B" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            )}

            {/* Recommendations Section */}
            {aiData.recommendations && aiData.recommendations.length > 0 && (
              <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <LightBulbIcon />
                  <span className="ml-2">AI Rekommendationer</span>
                </h3>
                <div>
                  {aiData.recommendations.map((recommendation, index) => (
                    <RecommendationCard key={index} recommendation={recommendation} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Completion Trends */}
            {aiData.trends?.completion_trends && aiData.trends.completion_trends.length > 0 && (
              <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Slutförandetrend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aiData.trends.completion_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis label={{ value: "Antal slutförda", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="completions" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Summary Stats */}
            <motion.div variants={item} className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Sammanfattning</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{aiData.overall?.total_users || 0}</p>
                  <p className="text-purple-100">Analyserade användare</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{aiData.overall?.completion_rate || 0}%</p>
                  <p className="text-purple-100">Genomsnittlig slutförandegrad</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {aiData.recommendations ? aiData.recommendations.length : 0}
                  </p>
                  <p className="text-purple-100">AI-rekommendationer</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {aiActivated && !loading && !error && !aiData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-gray-600">Ingen AI-data tillgänglig.</p>
            <button
              onClick={fetchAIData}
              className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Försök igen
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}