import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

const RegistrationSuccess = () => {
  const navigate = useNavigate();
  const movingShapeRef = useRef(null);
  const logoRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const movingShape = movingShapeRef.current;
    const logo = logoRef.current;

    if (movingShape && logo) {
      gsap.set(logo, { opacity: 0 });
      
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      });

      tl.to(movingShape, {
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        clipPath: 'polygon(10% 50%, 90% 60%, 80% 70%, 40% 80%, 10% 50%)',
      }, 0)
      .to(logo, {
        opacity: 1,
        duration: 2,
        delay: 1,
        ease: 'power2.out'
      }, 0);
    }

    return () => gsap.killTweensOf([movingShape, logo]);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      {/* Background shape */}
      <div 
        ref={movingShapeRef}
        className="absolute inset-0 bg-gradient-to-tr from-[#f3a701] to-[#ffae00] opacity-60"
        style={{
          clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          filter: 'blur(80px)'
        }}
      />
      
      {/* Logo with error handling */}
      <img 
        ref={logoRef}
        src={imgError ? "/fallback-logo.png" : "/Logotyp-Agoge-white.png"} 
        alt="Agoge Logo"
        className="w-64 h-64 object-contain z-10"
        onError={() => setImgError(true)}
        style={{ opacity: 0 }} // Initial state for GSAP
      />
    </div>
  );
};

export default RegistrationSuccess;