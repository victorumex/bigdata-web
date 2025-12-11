import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell 
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Zap, AlertTriangle, RefreshCw, Clock, DollarSign, Activity, GitCommit, Settings, Wind, X
} from 'lucide-react';

// --- ASUMSI IMPOR (Gantilah dengan path/komponen Anda yang sebenarnya) ---
// import { supabase } from './services/supabaseClient'; 
// import BentoCard from './components/BentoCard';
// import StockLogo from './components/StockLogo'; 
import { getIndoMonth } from './utils/formatters';

// --- KONSTANTA TEMA (Deep Navy & Neon) ---
const BG_DEEP_DARK = '#0A132C';
const CARD_BASE = '#1C294A';
const ACCENT_PRIMARY = '#05369D';
const ACCENT_NEON = '#4B8BF5'; 
const FORECAST_COLOR = '#FACC15'; 
const TEXT_LIGHT = '#E0E7FF';

// *** PERUBAHAN UTAMA: Warna Neon yang Kontras Tinggi untuk Key Information ***
const KEY_INFO_COLOR = '#00D5AA'; // Warna Teal Neon yang sangat kontras
const KEY_INFO_TEXT = '#0A132C'; // Teks berwarna gelap untuk kontras di atas Neon Teal

// --- KONSTANTA SAHAM & SIMULASI LOGO ---
const STOCKS_TO_FETCH = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA",
    "META", "NVDA", "NFLX", "AMD", "BABA", "CRM" 
];

const COMPANY_META = {
    "AAPL": { name: "Apple Inc.", logo: "https://logo.clearbit.com/apple.com" },
    "MSFT": { name: "Microsoft Corp.", logo: "https://logo.clearbit.com/microsoft.com" },
    "GOOGL": { name: "Alphabet Inc.", logo: "https://logo.clearbit.com/google.com" },
    "AMZN": { name: "Amazon.com Inc.", logo: "https://logo.clearbit.com/amazon.com" },
    "TSLA": { name: "Tesla Inc.", logo: "https://logo.clearbit.com/tesla.com" },
    "META": { name: "Meta Platforms Inc.", logo: "https://logo.clearbit.com/meta.com" },
    "NVDA": { name: "NVIDIA Corp.", logo: "https://logo.clearbit.com/nvidia.com" },
    "NFLX": { name: "Netflix Inc.", logo: "https://logo.clearbit.com/netflix.com" },
    "AMD": { name: "Advanced Micro Devices", logo: "https://logo.clearbit.com/amd.com" },
    "BABA": { name: "Alibaba Group Holding", logo: "https://logo.clearbit.com/alibaba.com" },
    "CRM": { name: "Salesforce", logo: "https://logo.clearbit.com/salesforce.com" },
};

// --- SIMULASI KOMPONEN (Untuk menjaga kode tetap utuh) ---
const BentoCard = ({ title, children, className, style, onClick }) => (
    <div 
        className={`rounded-xl shadow-2xl p-4 overflow-hidden relative ${className}`} 
        style={style} 
        onClick={onClick}
    >
        {title && <h3 className="text-md font-semibold mb-2 text-gray-300 border-b border-gray-700/50 pb-1">{title}</h3>}
        {children}
    </div>
);
const StockLogo = ({ imageUrl, className }) => (
    <img src={imageUrl} alt="Stock Logo" className={className} onError={(e) => { e.target.src = 'https://via.placeholder.com/40/FFFFFF/000000?text=S'; }} />
);

// Peningkatan MetricBox untuk mendukung warna teks gelap
const MetricBox = ({ label, value, color, icon: Icon, valueColor = 'text-white' }) => (
    <div className='flex flex-col items-center justify-center p-2 rounded-lg'>
        <div className={`flex items-center text-xs uppercase ${color}`}>
            <Icon className='w-4 h-4 mr-1'/> {label}
        </div>
        <p className={`text-xl font-bold mt-1 ${valueColor}`}>{value}</p>
    </div>
);
// --- AKHIR SIMULASI KOMPONEN ---

// ===============================================
// MODAL KOMPONEN BARU
// ===============================================
const StockDetailModal = ({ isOpen, onClose, stock, chartData, signal, isPositive, diff }) => {
    if (!isOpen || !stock) return null;

    const signalColor = signal === 'BUY' ? 'text-green-400' : signal === 'SELL' ? 'text-red-400' : 'text-yellow-400'; 
    const isAnomaly = stock.anomaly_status === 'ANOMALI';

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm modal-bg"
            onClick={onClose} 
        >
            <div 
                className="w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 p-6 rounded-2xl shadow-neon scale-in-center custom-scrollbar"
                style={{ backgroundColor: CARD_BASE, border: `3px solid ${ACCENT_NEON}`, color: TEXT_LIGHT, maxHeight: '90vh', overflowY: 'auto' }}
                onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
            >
                <div className="flex justify-between items-start border-b pb-3 border-gray-700 sticky top-0" style={{ backgroundColor: CARD_BASE }}>
                    <h2 className="text-3xl font-extrabold flex items-center" style={{ color: ACCENT_NEON }}>
                        <StockLogo imageUrl={stock.logoUrl} className="w-8 h-8 rounded-full bg-white p-1 mr-3" />
                        {stock.code} Detailed Analysis
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    {/* Key Metrics */}
                    <div className="p-4 rounded-lg" style={{ backgroundColor: ACCENT_PRIMARY }}>
                        <h3 className="text-xl font-semibold mb-2">Real-time Metrics</h3>
                        <p className="text-4xl font-bold">${stock.price.toLocaleString()}</p>
                        <p className={`text-lg font-medium mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUp className='w-5 h-5 inline mr-1'/> : <TrendingDown className='w-5 h-5 inline mr-1'/>} {diff}% Change
                        </p>
                    </div>

                    {/* Signal & Regime - DISINGKIRKAN KARENA SUDAH ADA DI HEADER UTAMA */}
                    <div className="p-4 rounded-lg flex flex-col justify-between" style={{ backgroundColor: CARD_BASE, border: `1px solid ${FORECAST_COLOR}` }}>
                        <p className="text-sm uppercase text-gray-400">Volatility & Anomaly Status</p>
                        <p className="text-3xl font-black mt-1 text-blue-400">{stock.volatility_regime}</p>
                        <p className="text-sm text-gray-300">Anomaly: <span className={`font-bold ${isAnomaly ? 'text-yellow-500' : 'text-green-500'}`}>{stock.anomaly_status}</span></p>
                    </div>
                </div>

                {/* Interactive Chart (Jika Anda ingin menampilkan chart yang berbeda/lebih detail) */}
                <div className="mt-4 h-64 w-full p-4 rounded-lg" style={{ backgroundColor: CARD_BASE }}>
                    <h3 className="text-xl font-semibold mb-2 text-gray-300">Historical Trend (Zoomable/Interactive)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                             <defs>
                                <linearGradient id="modalHistorical" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT_NEON} stopOpacity={0.8}/><stop offset="95%" stopColor={ACCENT_NEON} stopOpacity={0}/></linearGradient>
                            </defs>
                            <XAxis dataKey="day" stroke="#555" tick={{fontSize: 10}} axisLine={false} tickLine={false}/>
                            <YAxis stroke="#555" tickFormatter={(v) => `$${v.toLocaleString()}`} domain={['auto', 'auto']} tick={{fontSize: 10}}/>
                            <CartesianGrid strokeDasharray="4 4" stroke="#333"/>
                            <Area type="monotone" dataKey="price" stroke={ACCENT_NEON} fillOpacity={1} fill="url(#modalHistorical)" dot={false} strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
// ===============================================

const App = () => {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [currentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Fungsi untuk mendapatkan tanggal di masa depan (untuk simulasi forecast)
  const getFutureDate = (days) => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + days);
    return `${d.getDate()} ${getIndoMonth(d.getMonth()).substring(0, 3)}`;
  };

  // --- 1. DATA FETCHING DARI SUPABASE (SIMULASI) ---
  const fetchData = useCallback(async () => {
    try {
        const codes = STOCKS_TO_FETCH;
        let tempStockList = [];
        for (const code of codes) {
            const price = Math.floor(Math.random() * 5000) + 1000;
            const change = Math.random() * 0.05 - 0.02;
            const volatility = Math.random() * 0.05;
            const isAnomaly = Math.random() < 0.1;
            tempStockList.push({
                code: code, name: COMPANY_META[code]?.name, logoUrl: COMPANY_META[code]?.logo,
                price: price, change: change, volatility: volatility,
                anomaly_status: isAnomaly ? 'ANOMALI' : 'NORMAL',
                volatility_regime: volatility >= 0.03 ? 'HIGH VOL' : 'LOW VOL'
            });
        }
        setStockList(tempStockList);
        if (!selectedStock && tempStockList.length > 0) {
            setSelectedStock(tempStockList[2]); // Memilih GOOGL sebagai default untuk simulasi gambar awal
        }
        setIsLoaded(true); 
    } catch (err) { console.error("Error fetching data:", err); }
  }, [selectedStock]);

  const fetchChartAndNews = useCallback(async () => {
      if (!selectedStock) return;
      
      // SIMULASI HISTORICAL DATA (30 Hari ke belakang)
      const historicalDays = 30;
      let history = [];
      for (let i = historicalDays; i >= 1; i--) {
        const d = new Date(currentDate);
        d.setDate(currentDate.getDate() - i);

        // Harga disimulasikan agar tidak terlalu acak dan mencerminkan perubahan harian
        const price = Math.round(selectedStock.price * (1 + (Math.random() - 0.5) * 0.05)); 
        
        history.push({
            day: `${d.getDate()} ${getIndoMonth(d.getMonth()).substring(0, 3)}`,
            price: price,
            type: 'Historical',
            forecast: null
        });
      }

      // SIMULASI FORECAST DATA (5 Hari ke depan)
      const forecastDays = 5;
      let forecast = [];
      // Ambil harga penutup terakhir untuk memulai forecast
      let lastPrice = history[history.length - 1]?.price || selectedStock.price;
      for (let i = 1; i <= forecastDays; i++) {
        // Forecast disimulasikan berdasarkan tren change saham
        lastPrice = Math.round(lastPrice * (1 + (Math.random() * 0.01 * (selectedStock.change > 0 ? 1 : -1))));
        forecast.push({
            day: getFutureDate(i),
            price: null, 
            forecast: lastPrice, 
            type: 'Forecast'
        });
      }
      
      setChartData([...history, ...forecast]);

      // SIMULASI NEWS DATA
      const dummyNews = [
        { id: 1, title: `Harga ${selectedStock.code} diprediksi naik setelah rilis laporan Q3.`, source: 'News Source A', sentiment: 'positive' },
        { id: 2, title: `Volatilitas pasar menahan laju pertumbuhan sektor teknologi.`, source: 'Tech Daily', sentiment: 'neutral' },
        { id: 3, title: `Analisis teknikal menunjukkan sinyal jual kuat untuk ${selectedStock.code}.`, source: 'Market Insight', sentiment: 'negative' },
      ];
      setNewsData(dummyNews);

  }, [selectedStock, currentDate]); 

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    fetchChartAndNews();
  }, [selectedStock, fetchChartAndNews]);

  // --- 2. DERIVED DATA & UTILITY ---
  const { diff, signal, isPositive } = useMemo(() => {
    const change = selectedStock?.change || 0;
    const signal = change > 0.01 ? 'BUY' : change < -0.01 ? 'SELL' : 'HOLD';
    return { diff: (change * 100).toFixed(2), signal, isPositive: change >= 0 };
  }, [selectedStock]);

  const cnbcSentimentData = useMemo(() => {
    if (newsData.length === 0) return [];
    const counts = newsData.reduce((acc, n) => ({ ...acc, [n.sentiment]: (acc[n.sentiment] || 0) + 1 }), {});
    const total = newsData.length || 1;
    return [
        { name: 'Pos', value: Math.round((counts.positive/total)*100), color: '#34D399' }, 
        { name: 'Neg', value: Math.round((counts.negative/total)*100), color: '#F87171' }, 
        { name: 'Neu', value: Math.round((counts.neutral/total)*100), color: '#60A5FA' }, 
    ].filter(d => d.value > 0);
  }, [newsData]);

  const handleCardClick = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  if (!selectedStock) return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: BG_DEEP_DARK, color: TEXT_LIGHT }}><RefreshCw className="animate-spin mr-2"/> Loading Dashboard...</div>;

  const signalColor = signal === 'BUY' ? '#34D399' : signal === 'SELL' ? '#F87171' : '#FACC15'; 
  const isAnomaly = selectedStock.anomaly_status === 'ANOMALI';
  const anomalyColor = isAnomaly ? '#FBBF24' : '#34D399';

  // --- Tooltip Kustom Chart ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload.find(p => p.value !== null);
      if (!dataPoint) return null;
      const priceValue = dataPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const isForecast = dataPoint.dataKey === 'forecast';

      return (
        <div className="p-3 rounded-lg shadow-lg text-sm" style={{ backgroundColor: CARD_BASE, border: `1px solid ${isForecast ? FORECAST_COLOR : ACCENT_NEON}80` }}>
          <p className="font-bold text-gray-300">
            {label} 
            <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded ${isForecast ? 'bg-yellow-600/50' : 'bg-blue-600/50'}`}>
                {isForecast ? 'Forecast' : 'Historical'}
            </span>
          </p>
          <p className="text-white mt-1">
            <DollarSign className='w-3 h-3 inline mr-1 text-green-400'/>
            {`Price : $${priceValue}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`h-screen w-full p-2 sm:p-4 font-sans overflow-hidden ${isLoaded ? 'fade-in' : 'opacity-0'}`} style={{ backgroundColor: BG_DEEP_DARK, color: TEXT_LIGHT }}>
      
      {/* 0. STOCKS AVAILABLE (HEADER FULL WIDTH) */}
      <div className="w-full mb-4 px-4 py-2 flex gap-4 overflow-x-auto hide-scrollbar" style={{ backgroundColor: CARD_BASE, borderRadius: '12px' }}>
          {stockList.map(stock => (
            <button 
              key={stock.code}
              onClick={() => setSelectedStock(stock)}
              className={`flex-shrink-0 flex items-center justify-center p-2 rounded-xl transition-all duration-300 
                          ${selectedStock.code === stock.code ? 'ring-2 ring-offset-2 ring-offset-[#1C294A]' : 'opacity-70 hover:opacity-100'}`}
              style={{ backgroundColor: selectedStock.code === stock.code ? ACCENT_PRIMARY : 'transparent', minWidth: '80px', boxShadow: selectedStock.code === stock.code ? `0 0 10px ${ACCENT_NEON}50` : 'none' }}
            >
              <StockLogo imageUrl={stock.logoUrl} className="w-8 h-8 rounded-full bg-white p-1" />
              <span className="font-bold text-sm ml-2">{stock.code}</span>
            </button>
          ))}
      </div>


      {/* GRID CONTAINER UTAMA (12 Kolom x 12 Baris) */}
      <div className="grid grid-cols-12 grid-rows-12 gap-3 h-[calc(100vh-100px)] w-full max-w-[1920px] mx-auto">
        
        {/* PERUBAHAN 1: JUDUL + LOGO + SINYAL DIATUR ULANG (col-span-8 row-span-2) */}
        <BentoCard 
            className="col-span-8 row-span-2 p-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow duration-300" 
            style={{ 
                backgroundColor: ACCENT_PRIMARY, 
                border: `3px solid ${ACCENT_NEON}`, // Border lebih tebal
                color: TEXT_LIGHT,
                boxShadow: `0 0 20px ${ACCENT_NEON}80` // Efek neon
            }}
            onClick={() => handleCardClick(selectedStock)}
        >
            {/* Kiri: Logo Saham */}
            <div className='flex items-center'>
                <StockLogo imageUrl={selectedStock.logoUrl} className="w-16 h-16 rounded-full bg-white p-1 mr-4 shadow-xl" />
            </div>

            {/* Tengah: Nama Perusahaan (Highlight) */}
            <div className='flex-1 text-left px-4'>
                <h1 className="text-xl font-light text-blue-200">{selectedStock.code}</h1>
                <p className="text-4xl font-black tracking-tight" style={{ color: TEXT_LIGHT }}>{selectedStock.name}</p>
            </div>

            {/* Kanan: Harga dan AI Signal */}
            <div className='text-right flex flex-col justify-center items-end'>
                <p className="text-sm font-light text-blue-200">{currentDate.toDateString()}</p>
                <h2 className="text-4xl font-bold mt-1">${selectedStock.price.toLocaleString()}</h2>
                <span className={`text-md font-bold px-3 py-1 rounded-full mt-1 inline-flex items-center ${isPositive ? 'bg-green-700/50 text-green-300' : 'bg-red-700/50 text-red-300'}`}>
                    {isPositive ? <TrendingUp className='w-4 h-4 mr-1'/> : <TrendingDown className='w-4 h-4 mr-1'/>} {diff}%
                </span>
            </div>
            
            {/* AI SIGNAL */}
            <div className='ml-6 text-center p-2 rounded-lg' style={{ backgroundColor: CARD_BASE, border: `2px solid ${signalColor}` }}>
                <p className="text-xs uppercase text-gray-400">AI Signal</p>
                <p className={`text-3xl font-black mt-1 ${signal === 'BUY' ? 'text-green-400' : signal === 'SELL' ? 'text-red-400' : 'text-yellow-400'}`}>{signal}</p>
            </div>

        </BentoCard>

        {/* STRATEGY SIMULATOR (col-span-4 row-span-4) - Tidak Berubah */}
        <BentoCard className="col-span-4 row-span-4 p-4 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-[#0A132C] hover:ring-blue-500 transition-all duration-300" title="Strategy Simulator" style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_PRIMARY}` }} onClick={() => handleCardClick(selectedStock)}>
            <div className='flex flex-col space-y-3'>
                <div className='flex justify-between items-center text-sm'>
                    <Settings className='w-5 h-5 text-gray-400'/>
                    <span className='font-semibold'>Backtest Setting</span>
                    <button className='bg-blue-600/50 hover:bg-blue-500/50 text-xs py-1 px-3 rounded-full'>Configure</button>
                </div>
                <div className='p-3 rounded-lg bg-gray-700/30'>
                    <p className='text-xs text-gray-400'>Last Simulation: **Trend Following (200D MA)**</p>
                    <p className='text-lg font-bold text-yellow-400 mt-1'>+12.5% Return (Sim.)</p>
                </div>
                <div className='text-center'>
                    <button className='w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center justify-center text-white'>
                        <RefreshCw className='w-4 h-4 mr-2'/> Run Simulation
                    </button>
                </div>
            </div>
        </BentoCard>

        {/* ANOMALY DETECTION (col-span-3 row-span-2) - Warna diubah ke base/primary agar tidak berebut fokus dengan Key Info*/}
        <BentoCard className="col-span-3 row-span-2 p-4 flex flex-col justify-between cursor-pointer hover:opacity-90 transition-opacity duration-300" title="Anomaly Detection" style={{ backgroundColor: CARD_BASE, color: TEXT_LIGHT, border: `1px solid ${anomalyColor}` }} onClick={() => handleCardClick(selectedStock)}>
            <div className='flex justify-between items-center'>
                <p className='text-2xl font-black' style={{ color: anomalyColor }}>{selectedStock.anomaly_status}</p>
                <AlertTriangle className='w-8 h-8' style={{ color: anomalyColor }}/>
            </div>
            <p className='text-sm font-medium mt-1'>{isAnomaly ? 'Volume/Price Spike Terdeteksi.' : 'Perdagangan dalam batas normal.'}</p>
        </BentoCard>

        {/* REGIME DETECTION (col-span-5 row-span-2) - Warna diubah ke base/primary agar tidak berebut fokus dengan Key Info */}
        <BentoCard className="col-span-5 row-span-2 p-4 flex flex-col justify-between cursor-pointer hover:opacity-90 transition-opacity duration-300" title="Regime Detection" style={{ backgroundColor: CARD_BASE, color: TEXT_LIGHT, border: `1px solid ${ACCENT_NEON}` }} onClick={() => handleCardClick(selectedStock)}>
            <div className='flex justify-between items-center'>
                <p className='text-2xl font-black' style={{ color: ACCENT_NEON }}>{selectedStock.volatility_regime}</p>
                <Wind className='w-8 h-8' style={{ color: ACCENT_NEON }}/>
            </div>
            <p className='text-sm font-medium mt-1'>Vol Index: **{selectedStock.volatility.toFixed(4)}**. {(selectedStock.volatility_regime === 'HIGH VOL' ? 'Waspada Volatilitas Tinggi.' : 'Volatilitas stabil.')}</p>
        </BentoCard>

        {/* PERUBAHAN 2: KETERANGAN SAHAM / KEY INFO (col-span-8 row-span-2) - Kontras Tinggi */}
        <BentoCard 
            className="col-span-8 row-span-2 p-4 flex items-center justify-around cursor-pointer hover:shadow-2xl transition-shadow duration-300" 
            title="Key Information" 
            style={{ 
                backgroundColor: KEY_INFO_COLOR, 
                color: KEY_INFO_TEXT, // Teks gelap
                border: `2px solid ${KEY_INFO_TEXT}` 
            }} 
            onClick={() => handleCardClick(selectedStock)}
        >
            <MetricBox label="Price" value={`$${selectedStock.price.toLocaleString()}`} color="text-gray-900" icon={DollarSign} valueColor="text-gray-900"/>
            <MetricBox label="Change" value={`${diff}%`} color="text-gray-900" icon={GitCommit} valueColor={isPositive ? 'text-green-700' : 'text-red-700'}/>
            <MetricBox label="Regime" value={selectedStock.volatility_regime} color="text-gray-900" icon={Zap} valueColor="text-gray-900"/>
        </BentoCard>
        
        {/* STATISTIK DESKRIPTIF (col-span-4 row-span-2) - Tidak Berubah */}
        <BentoCard className="col-span-4 row-span-2 p-4 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-[#0A132C] hover:ring-blue-500 transition-all duration-300" title="Statistik Deskriptif" style={{ backgroundColor: '#031742', border: `1px solid ${ACCENT_PRIMARY}` }} onClick={() => handleCardClick(selectedStock)}>
            <div className='grid grid-cols-2 gap-2 text-sm text-gray-300'>
                <p>Volume Rata-rata (20D):</p> <p className='font-bold text-right'>1.2 Juta</p>
                <p>RSI (14):</p> <p className='font-bold text-right text-green-400'>62.5 (Strong)</p>
                <p>Beta:</p> <p className='font-bold text-right'>1.15</p>
            </div>
        </BentoCard>

        {/* CHART UTAMA (col-span-8 row-span-6) - Tidak Berubah */}
        <BentoCard className="col-span-8 row-span-6 p-2 relative cursor-pointer hover:border-white transition-colors duration-300" 
            title="Chart Historical & Forecast (30D + 5D)"
            style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_NEON}80` }}
            onClick={() => handleCardClick(selectedStock)}
            >
            
            <div className="w-full h-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                        data={chartData} 
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            {/* Gradient untuk Historical Data */}
                            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT_NEON} stopOpacity={0.8}/><stop offset="95%" stopColor={ACCENT_NEON} stopOpacity={0}/></linearGradient>
                            {/* Gradient untuk Forecast Data */}
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={FORECAST_COLOR} stopOpacity={0.6}/><stop offset="95%" stopColor={FORECAST_COLOR} stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#555" tick={{fontSize: 10}} axisLine={false} tickLine={false}/>
                        <YAxis stroke="#555" tickFormatter={(v) => `$${v.toLocaleString()}`} domain={['auto', 'auto']} tick={{fontSize: 10}}/>
                        <CartesianGrid strokeDasharray="4 4" stroke="#333"/>
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Area Historical */}
                        <Area type="monotone" dataKey="price" stroke={ACCENT_NEON} fillOpacity={1} fill="url(#colorHistorical)" dot={false} strokeWidth={3} />
                        
                        {/* Area Forecast - Menggunakan garis putus-putus dan warna berbeda */}
                        <Area type="monotone" dataKey="forecast" stroke={FORECAST_COLOR} fillOpacity={1} fill="url(#colorForecast)" dot={false} strokeWidth={3} strokeDasharray="5 5" />

                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </BentoCard>

        {/* SINYAL (col-span-4 row-span-3) - Tidak Berubah */}
        <BentoCard className="col-span-4 row-span-3 p-6 flex flex-col justify-between cursor-pointer hover:shadow-neon-lg transition-shadow duration-300" 
            title="AI Trend Prediction" // Nama baru
            style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_NEON}50` }}
            onClick={() => handleCardClick(selectedStock)}
            >
            <div className='text-center'>
                <p className="text-sm uppercase text-gray-400">Trend Over 5 Days</p>
                <h2 className="text-6xl font-black tracking-tighter mt-2" style={{ color: signalColor }}>{signal === 'BUY' ? 'UP' : signal === 'SELL' ? 'DOWN' : 'FLAT'}</h2>
                <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mt-4" style={{ backgroundColor: '#fff' + '10', color: TEXT_LIGHT, border: `2px solid ${signalColor}`, boxShadow: `0 0 15px ${signalColor}80` }}>
                    <Zap className='w-12 h-12 animate-pulse' style={{ color: signalColor }}/>
                </div>
            </div>
        </BentoCard>


        {/* SENTIMEN BERITA (col-span-4 row-span-3) - Tidak Berubah */}
        <BentoCard className="col-span-4 row-span-3 p-4 cursor-pointer hover:opacity-90 transition-opacity duration-300" 
            title="News Sentiment Breakdown"
            style={{ backgroundColor: '#4769c8', border: `1px solid #7394d9` }}
            onClick={() => handleCardClick(selectedStock)}
            >
            <div className="h-full w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cnbcSentimentData}>
                        <XAxis dataKey="name" stroke="#AABFFD" tick={{fill: '#E0E7FF', fontSize: 10}} axisLine={false} tickLine={false}/>
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_NEON}`, color: TEXT_LIGHT }}/>
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {cnbcSentimentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </BentoCard>

      </div>
      
      {/* MODAL KOMPONEN */}
      <StockDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        stock={selectedStock} 
        chartData={chartData} 
        signal={signal} 
        isPositive={isPositive} 
        diff={diff} 
      />

      {/* GLOBAL STYLES & ANIMATIONS */}
      <style jsx global>{`
        /* Scrollbar Hiding */
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${BG_DEEP_DARK}; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${ACCENT_NEON}; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${ACCENT_NEON}; }

        /* Opening Animation (Fade In) */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
            animation: fadeIn 0.8s ease-out forwards;
        }

        /* Modal Animation */
        @keyframes scaleInCenter {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
            animation: scaleInCenter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        
        /* Neon Shadow for Modal */
        .shadow-neon {
            box-shadow: 0 0 15px rgba(75, 139, 245, 0.5), 0 0 30px rgba(75, 139, 245, 0.3);
        }
      `}</style>
    </div>
  );
};

export default App;