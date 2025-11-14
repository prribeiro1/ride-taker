import React, { useEffect, useState } from "react";

export const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 animate-in fade-in">
      <div className="text-center space-y-6 animate-in zoom-in duration-500">
        <div className="flex justify-center">
          <img 
            src="/bus-icon.jpg" 
            alt="Monitor Transporte Escolar" 
            className="w-48 h-48 rounded-3xl shadow-2xl"
          />
        </div>
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          Monitor Transporte Escolar
        </h1>
      </div>
    </div>
  );
};
