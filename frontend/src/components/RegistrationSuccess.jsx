import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

const RegistrationSuccess = () => {
  const navigate = useNavigate();
  const movingShapeRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    const movingShape = movingShapeRef.current;
    const logoElement = logoRef.current;

    if (movingShape && logoElement) {
      gsap.set(logoElement, { opacity: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        },
      });

      tl.to(movingShape, {
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'easeInOutCubic',
        force3D: true,
        clipPath: 'polygon(10% 50%, 90% 60%, 80% 70%, 40% 80%, 10% 50%)', // Exempel på slutform
      }, 0)
      .to(logoElement, {
        opacity: 1,
        duration: 2,
        delay: 1,
        ease: 'power2.inOut',
      }, 0);
    }
  }, [navigate]);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-white flex items-center justify-center z-50 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          ref={movingShapeRef}
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1 %)',
            opacity: 0.6, // Justera opaciteten (0.0 - 1.0)
            filter: 'blur(80px)', // Justera blur-värdet (i pixlar)
          }}
          className="movingShape relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-[#f3a701] to-[#ffae00] md:opacity-30 sm:opacity-60 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      <img ref={logoRef} src="/Logotyp-Agoge-white.png" alt="Logotyp" className="max-w-sm max-h-sm z-10" style={{ opacity: 0 }} />
    </div>
  );
};

export default RegistrationSuccess;