import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import CourseList from "../components/lms/CourseDashboard";
import { gsap } from "gsap";

export default function CourseDashboard() {
  // Definiera state-variabler INUTI komponenten
  const [company_id, setCompanyId] = useState(null);
  const [user_id, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyName, setCompanyName] = useState(""); // Lägg till för företagsnamn

  useEffect(() => {
    // Hämta företagsnamnet från localStorage (eller API-anrop)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userObject = JSON.parse(storedUser);
        if (userObject && userObject.companyId) {
          setCompanyId(userObject.companyId); // Hämta companyId
        }
        if (userObject && userObject.companyName) {
          setCompanyName(userObject.companyName); // Hämta companyName
        }
      } catch (error) {
        console.error("Fel vid parsning av användardata från localStorage:", error);
      }
    }

    // GSAP animation
    const pages = document.querySelectorAll('.page-container, .main-content, #root > div');
    gsap.to(pages, { opacity: 1, duration: 1, ease: 'power2.out', delay: 0.2 });
    return () => {
      gsap.to(pages, { opacity: 0, duration: 1, ease: 'power2.in' });
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mx-auto page-container w-full" style={{ opacity: 0 }}>
        <h1 className="text-2xl font-bold my-6">Kurser för {companyName}</h1>
        <CourseList />
      </div>
    </>
  );
}