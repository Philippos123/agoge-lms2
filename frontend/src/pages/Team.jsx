import Navbar from "../components/navbar";
import TeamPage from "../components/TeamMembers";
import React from "react";
import {gsap} from "gsap";
import { useEffect } from "react";



export default function Team() {

    useEffect(() => {
        // Välj alla element som du vill att animationen ska gälla för.
        // Du kan behöva anpassa denna selector baserat på din HTML-struktur.
        const pages = document.querySelectorAll('.page-container, .main-content, #root > div');
    
        // Använd GSAP för att animera opaciteten från 0 till 1
        gsap.to(pages, {
          opacity: 1,
          duration: 2, // Justera animationens hastighet (i sekunder)
          ease: 'power2.out', // Justera easing-funktionen för animationen
          delay: 0.2, // Valfri fördröjning innan animationen startar
        });
    
        // Cleanup-funktion (valfri): Om komponenten avmonteras kan du
        // välja att återställa opaciteten (beroende på ditt behov).
        return () => {
          gsap.to(pages, {
            opacity: 0,
            duration: 1, // Adjust the duration for the exit animation
            ease: 'power2.in', // Add easing for the exit animation
          });
        };
      }, []);

    return (
        <>
        <Navbar />
        <div className="mx-auto px-4 page-container" style={{ opacity: 0 }}>
        <TeamPage />
        </div>
        </>
    );
    }