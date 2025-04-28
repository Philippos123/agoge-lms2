// src/pages/Dashboard.js
import Navbar from "../components/navbar"; // Justera sökvägen för Navbar-importen
import React from "react";
import Dashboard from "../components/Dashboard";
import { useEffect, useState } from "react";
import { gsap } from "gsap"; // Importera GSAP för animationer



export default function Dashboards() {

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
      <div  >
      <Dashboard/>
      {/* Här kan du lägga till resten av Dashboard-komponentens innehåll */}
      </div>
      </>
  );
}// src/pages/Login.js
