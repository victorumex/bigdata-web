import React, { useState } from 'react';

const StockLogo = ({ code, className = "w-8 h-8", fallbackClass = "" }) => {
    const [imgError, setImgError] = useState(false);
    const cleanCode = code ? code.replace('.JK', '') : 'XX';
    const logoUrl = `https://assets.stockbit.com/logos/companies/${cleanCode}.png`;

    if (imgError) {
        return (
            <div className={`${className} rounded-full flex items-center justify-center bg-slate-700 text-white font-bold text-[10px] ${fallbackClass}`}>
                {cleanCode.substring(0, 2)}
            </div>
        );
    }
    return (
        <img 
            src={logoUrl} 
            alt={code} 
            className={`${className} rounded-full object-contain bg-white p-0.5`}
            onError={() => setImgError(true)}
        />
    );
};

export default StockLogo;