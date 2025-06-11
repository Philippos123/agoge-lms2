import CourseList from '../components/CourseToBuy';
import Navbar from '../components/navbar';
import { useEffect, useState } from 'react';
import { CourseService } from '../services/api';
import RecommendedCourses from '../components/RecommendedCourses';
import { gsap } from 'gsap';
import api from '../services/api'; // Importera api för att hämta köpta kurser

export default function Market() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [companyBransch, setCompanyBransch] = useState('industri');
    const [isUtbCompany, setIsUtbCompany] = useState(false);
    const [userLoaded, setUserLoaded] = useState(false);

 // Default värde, kan hämtas från användarprofil

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                // Hämta alla kurser från marketplace
                const allCourses = await CourseService.getCourses();

                // Hämta företagets köpta kurser
                const userCoursesResponse = await api.get('/user/courses/');
                const purchasedCourses = userCoursesResponse.data || [];

                // Filtrera bort köpta kurser
                const availableCourses = allCourses.filter(
                    (course) => !purchasedCourses.some((purchased) => purchased.id === course.id)
                );

                setCourses(availableCourses);
            } catch (err) {
                console.error('Fel vid hämtning av kurser:', err);
                setError('Kunde inte hämta kurser. Försök igen senare.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await api.get('/user/');
                const user = response.data[0]; // eller bara response.data om det inte är en lista
    
                if (user && user.company) {
                    setCompanyBransch(user.company.bransch_typ || 'industri');
                    setIsUtbCompany(user.company.is_utb_company || false);
                }
            } catch (err) {
                console.error("Kunde inte hämta användarprofil:", err);
            }
            setUserLoaded(true);
        };
    
        fetchUserProfile();
    }, []);
    

    useEffect(() => {
        const pages = document.querySelectorAll('.page-container, .main-content, #root > div');

        // Start animation
        gsap.fromTo(
            pages,
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power2.out',
                delay: 0.2,
            }
        );

        return () => {
            gsap.to(pages, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
            });
        };
    }, []);

    return (
        <>
          <Navbar />
          <main className="container mx-auto px-4 page-container min-h-screen bg-white" style={{ opacity: 0 }}>
            {isUtbCompany ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h1 className="text-2xl font-bold text-gray-800">Endast tillgängligt för företagskunder</h1>
                <p className="mt-3 text-gray-600 max-w-md">
                  Du har inte behörighet att se den här sidan. Marketplace är endast tillgängligt för våra företagskunder.
                </p>
                <a
                  href="/kontakt"
                  className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Kontakta oss
                </a>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Laddar kurser...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Fel! </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            ) : (
              <>
                <CourseList courses={courses} />
                <RecommendedCourses courses={courses} companyBransch={companyBransch} />
              </>
            )}
          </main>
        </>
      );
}