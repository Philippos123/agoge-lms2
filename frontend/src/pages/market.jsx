import CourseList from '../components/CourseToBuy';
import Navbar from '../components/navbar';
import { useEffect, useState } from 'react';
import { CourseService } from '../services/api';
import RecommendedCourses from '../components/RecommendedCourses';
import { gsap } from 'gsap';

export default function Market() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [companyBransch, setCompanyBransch] = useState('industri'); // Default värde, kan hämtas från användarprofil

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const data = await CourseService.getCourses();
                setCourses(data);
            } catch (err) {
                console.error('Error fetching courses:', err);
                setError('Kunde inte hämta kurser. Försök igen senare.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchCourses();
    }, []);

    useEffect(() => {
        const pages = document.querySelectorAll('.page-container, .main-content, #root > div');
        
        // Start animation
        gsap.fromTo(pages, 
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power2.out',
                delay: 0.2
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
            <main className="container mx-auto px-4 page-container" style={{ opacity: 0 }}>
                {loading ? (
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