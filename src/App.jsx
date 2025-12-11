import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Zap, AlertTriangle, RefreshCw, Clock, DollarSign, Activity, GitCommit, Settings, Wind, Menu
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
const ACCENT_NEON = '#4B8BF5'; // Warna untuk Historical Data
const FORECAST_COLOR = '#FACC15'; // Kuning Neon untuk Forecast Data
const TEXT_LIGHT = '#E0E7FF';

// --- KONSTANTA SAHAM & SIMULASI LOGO ---
const STOCKS_TO_FETCH = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA",
    "META", "NVDA", "NFLX"
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
};

// --- SIMULASI KOMPONEN (Untuk menjaga kode tetap utuh) ---
const BentoCard = ({ title, children, className, style }) => (
    <div className={`rounded-xl shadow-2xl p-4 overflow-hidden relative ${className}`} style={style}>
        {title && <h3 className="text-md font-semibold mb-2 text-gray-300 border-b border-gray-700/50 pb-1">{title}</h3>}
        {children}
    </div>
);
const StockLogo = ({ imageUrl, className }) => (
    <img src={imageUrl} alt="Stock Logo" className={className} onError={(e) => { e.target.src = 'https://via.placeholder.com/40/FFFFFF/000000?text=S'; }} />
);
const MetricBox = ({ label, value, color, icon: Icon }) => (
    <div className='flex flex-col items-center justify-center p-2 rounded-lg'>
        <div className='flex items-center text-xs text-gray-500 uppercase'>
            <Icon className='w-4 h-4 mr-1'/> {label}
        </div>
        <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
);
// --- AKHIR SIMULASI KOMPONEN ---


const App = () => {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [currentDate] = useState(new Date());
  
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
            setSelectedStock(tempStockList[0]);
        }
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

        // Harga bergerak sedikit di sekitar harga utama
        const price = Math.round(selectedStock.price * (1 + (Math.random() - 0.5) * 0.1)); 
        
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
      let lastPrice = history[history.length - 1].price;
      for (let i = 1; i <= forecastDays; i++) {
        // Harga forecast bergerak dari harga terakhir dengan tren sinyal
        lastPrice = Math.round(lastPrice * (1 + (Math.random() * 0.02 * (selectedStock.change > 0 ? 1 : -1))));
        forecast.push({
            day: getFutureDate(i),
            // Gunakan 'price' untuk historical dan 'forecast' untuk forecast data di chart
            price: null, 
            forecast: lastPrice, 
            type: 'Forecast'
        });
      }
      
      // Gabungkan data
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

  if (!selectedStock) return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: BG_DEEP_DARK, color: TEXT_LIGHT }}><RefreshCw className="animate-spin mr-2"/> Loading Dashboard...</div>;

  const signalColor = signal === 'BUY' ? '#34D399' : signal === 'SELL' ? '#F87171' : '#FACC15'; 
  const isAnomaly = selectedStock.anomaly_status === 'ANOMALI';
  const anomalyColor = isAnomaly ? '#FBBF24' : '#34D399';

  // --- Tooltip Kustom Chart (Diperbarui untuk menangani 2 dataKey) ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Ambil nilai dari price atau forecast (yang tidak null)
      const dataPoint = payload.find(p => p.value !== null);
      if (!dataPoint) return null;

      const priceValue = dataPoint.value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Tentukan apakah ini data forecast atau historical
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
    <div className="h-screen w-full p-2 sm:p-4 font-sans overflow-hidden" style={{ backgroundColor: BG_DEEP_DARK, color: TEXT_LIGHT }}>
      
      {/* 0. STOCKS AVAILABLE */}
      <div className="w-full mb-4 px-2 flex gap-4 overflow-x-auto hide-scrollbar">
          {stockList.map(stock => (
            <button 
              key={stock.code}
              onClick={() => setSelectedStock(stock)}
              className={`flex-shrink-0 flex items-center justify-center p-2 rounded-xl transition-all duration-300 
                          ${selectedStock.code === stock.code ? 'ring-2 ring-offset-2 ring-offset-[#0A132C]' : 'opacity-70 hover:opacity-100'}`}
              style={{ backgroundColor: selectedStock.code === stock.code ? ACCENT_PRIMARY : CARD_BASE, minWidth: '80px', boxShadow: selectedStock.code === stock.code ? `0 0 10px ${ACCENT_NEON}50` : 'none' }}
            >
              <StockLogo imageUrl={stock.logoUrl} className="w-8 h-8 rounded-full bg-white p-1" />
              <span className="font-bold text-sm ml-2">{stock.code}</span>
            </button>
          ))}
      </div>


      {/* GRID CONTAINER UTAMA (12 Kolom x 12 Baris) */}
      <div className="grid grid-cols-12 grid-rows-12 gap-3 h-[calc(100vh-100px)] w-full max-w-[1920px] mx-auto">
        
        {/* JUDUL + LOGO (col-span-8 row-span-2) */}
        <BentoCard className="col-span-8 row-span-2 p-6 flex items-center justify-between" 
          title={`${selectedStock.name} (${selectedStock.code})`}
          style={{ backgroundColor: ACCENT_PRIMARY, border: `1px solid ${ACCENT_NEON}50`, color: TEXT_LIGHT }}>
            <div className='flex items-center'>
                <StockLogo imageUrl={selectedStock.logoUrl} className="w-12 h-12 rounded-full bg-white p-1 mr-4 shadow-lg" />
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: TEXT_LIGHT }}>{selectedStock.code}</h1>
                    <p className="text-lg text-blue-200">{selectedStock.name}</p>
                </div>
            </div>
            <div className='text-right'>
                <p className="text-sm font-light text-blue-200">{currentDate.toDateString()}</p>
                <h2 className="text-4xl font-bold mt-1">${selectedStock.price.toLocaleString()}</h2>
                <span className={`text-md font-bold px-3 py-1 rounded-full mt-1 inline-flex items-center ${isPositive ? 'bg-green-700/50 text-green-300' : 'bg-red-700/50 text-red-300'}`}>
                    {isPositive ? <TrendingUp className='w-4 h-4 mr-1'/> : <TrendingDown className='w-4 h-4 mr-1'/>} {diff}%
                </span>
            </div>
        </BentoCard>

        {/* STRATEGY SIMULATOR (col-span-4 row-span-4) */}
        <BentoCard className="col-span-4 row-span-4 p-4" title="Strategy Simulator" style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_PRIMARY}` }}>
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

        {/* ANOMALY DETECTION (col-span-3 row-span-2) */}
        <BentoCard className="col-span-3 row-span-2 p-4 flex flex-col justify-between" title="Anomaly Detection" style={{ backgroundColor: '#00B8D9', color: '#0A132C', border: `1px solid ${anomalyColor}` }}>
            <div className='flex justify-between items-center'>
                <p className='text-2xl font-black'>{selectedStock.anomaly_status}</p>
                <AlertTriangle className='w-8 h-8' style={{ color: isAnomaly ? 'red' : 'green' }}/>
            </div>
            <p className='text-sm font-medium mt-1'>{isAnomaly ? 'Volume/Price Spike Terdeteksi.' : 'Perdagangan dalam batas normal.'}</p>
        </BentoCard>

        {/* REGIME DETECTION (col-span-5 row-span-2) */}
        <BentoCard className="col-span-5 row-span-2 p-4 flex flex-col justify-between" title="Regime Detection" style={{ backgroundColor: '#00C8FF', color: '#0A132C' }}>
            <div className='flex justify-between items-center'>
                <p className='text-2xl font-black'>{selectedStock.volatility_regime}</p>
                <Wind className='w-8 h-8'/>
            </div>
            <p className='text-sm font-medium mt-1'>Vol Index: **{selectedStock.volatility.toFixed(4)}**. {(selectedStock.volatility_regime === 'HIGH VOL' ? 'Waspada Volatilitas Tinggi.' : 'Volatilitas stabil.')}</p>
        </BentoCard>

        {/* KETERANGAN SAHAM / KEY INFO (col-span-8 row-span-2) */}
        <BentoCard className="col-span-8 row-span-2 p-4 flex items-center justify-around" title="Key Information" style={{ backgroundColor: '#00D5AA', color: '#0A132C' }}>
            <MetricBox label="Price" value={`$${selectedStock.price.toLocaleString()}`} color="text-gray-900" icon={DollarSign}/>
            <MetricBox label="Change" value={`${diff}%`} color={isPositive ? 'text-green-700' : 'text-red-700'} icon={GitCommit}/>
            <MetricBox label="Signal" value={signal} color={signalColor} icon={Zap}/>
        </BentoCard>
        
        {/* STATISTIK DESKRIPTIF (col-span-4 row-span-2) */}
        <BentoCard className="col-span-4 row-span-2 p-4" title="Statistik Deskriptif" style={{ backgroundColor: '#031742', border: `1px solid ${ACCENT_PRIMARY}` }}>
            <div className='grid grid-cols-2 gap-2 text-sm text-gray-300'>
                <p>Volume Rata-rata (20D):</p> <p className='font-bold text-right'>1.2 Juta</p>
                <p>RSI (14):</p> <p className='font-bold text-right text-green-400'>62.5 (Strong)</p>
                <p>Beta:</p> <p className='font-bold text-right'>1.15</p>
            </div>
        </BentoCard>

        {/* CHART UTAMA (col-span-8 row-span-6) */}
        <BentoCard className="col-span-8 row-span-6 p-2 relative" 
            title="Chart Historical & Forecast (30D + 5D)"
            style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_NEON}80` }}>
            
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

        {/* SINYAL (col-span-4 row-span-3) */}
        <BentoCard className="col-span-4 row-span-3 p-6 flex flex-col justify-between" 
            title="AI FORECAST SIGNAL"
            style={{ backgroundColor: ACCENT_PRIMARY, boxShadow: `0 0 20px ${ACCENT_NEON}50` }}>
            <div className='text-center'>
                <p className="text-sm uppercase text-blue-200">Recommended Action</p>
                <h2 className="text-6xl font-black tracking-tighter mt-2" style={{ color: signalColor }}>{signal}</h2>
                <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mt-4" style={{ backgroundColor: '#fff' + '10', color: TEXT_LIGHT, border: `2px solid ${signalColor}`, boxShadow: `0 0 15px ${signalColor}80` }}>
                    <Zap className='w-12 h-12 animate-pulse' style={{ color: signalColor }}/>
                </div>
            </div>
        </BentoCard>

        {/* SENTIMEN BERITA (col-span-4 row-span-3) */}
        <BentoCard className="col-span-4 row-span-3 p-4" 
            title="News Sentiment Breakdown"
            style={{ backgroundColor: '#4769c8', border: `1px solid #7394d9` }}>
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
      
      {/* GLOBAL STYLES */}
      <style jsx global>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${BG_DEEP_DARK}; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${ACCENT_NEON}; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${ACCENT_NEON}; }
      `}</style>
    </div>
  );
};

export default App;