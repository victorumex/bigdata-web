import React from 'react';

const BentoCard = ({ children, className = "", title }) => (
  <div className={`rounded-xl overflow-hidden relative shadow-sm ${className}`}>
    {title && (
      <div className="absolute top-2 left-3 z-10">
        <span className="text-[10px] uppercase tracking-wider font-bold text-white/60 bg-black/20 px-2 py-0.5 rounded backdrop-blur-sm">
          {title}
        </span>
      </div>
    )}
    {children}
  </div>
);

export default BentoCard;