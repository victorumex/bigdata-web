import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Zap, AlertTriangle, ShieldHalf, RefreshCw, Menu, Wind, Clock, User, DollarSign, Activity, GitCommit
} from 'lucide-react';

// --- IMPORT DARI FOLDER LAIN ---
import { supabase } from './services/supabaseClient'; 
// Asumsi COMPANY_META sekarang ada di file ini atau sudah dimodifikasi
// import { COMPANY_META } from './config/constants';
import { formatFullDate, getIndoMonth } from './utils/formatters';
import BentoCard from './components/BentoCard';
// StockLogo sekarang menerima URL
import StockLogo from './components/StockLogo'; 

// --- KONSTANTA TEMA BARU (Deep Navy & Neon) ---
const BG_DEEP_DARK = '#0A132C'; // Latar Belakang Sangat Gelap
const CARD_BASE = '#1C294A'; // Warna Dasar Kartu (Biru Navy Gelap)
const ACCENT_PRIMARY = '#05369D'; // Navy Blue untuk Aksen Utama
const ACCENT_NEON = '#4B8BF5'; // Biru Neon untuk Garis/Highlight
const TEXT_LIGHT = '#E0E7FF'; // Warna Teks (Putih kebiruan)

// --- KONSTANTA SAHAM BARU & SIMULASI LOGO ---
const STOCKS_TO_FETCH = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA",
    "META", "NVDA", "NFLX", "AMD", "BABA", "CRM" // Tambahan
];

// Simulasi Data Meta (Gantilah dengan URL logo nyata jika ada)
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

const App = () => {
  // --- STATE MANAGEMENT ---
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [currentDate] = useState(new Date());

  // --- DATA FETCHING (DIREVISI UNTUK ANOMALI & LOGO) ---
  const fetchMarketData = useCallback(async () => {
    try {
      const codes = STOCKS_TO_FETCH;
      let tempStockList = [];

      for (const code of codes) {
        // --- SIMULASI DATA FETCHING ---
        // Asumsi data ini sudah diolah dengan IsolationForest di Backend/Python
        const price = Math.floor(Math.random() * 5000) + 1000;
        const change = Math.random() * 0.05 - 0.02;
        const volatility = Math.random() * 0.05;

        // Simulasi Anomali & Regim (Berdasarkan Logika IsolationForest/Volatilitas)
        const isAnomaly = Math.random() < 0.1; // 10% peluang Anomali
        const anomalyStatus = isAnomaly ? 'ANOMALI' : 'NORMAL';
        const volatilityRegime = volatility >= 0.03 ? 'HIGH VOL' : 'LOW VOL';

        tempStockList.push({
          code: code,
          name: COMPANY_META[code]?.name || 'Unknown Company',
          logoUrl: COMPANY_META[code]?.logo, // Tambahkan URL Logo
          price: price,
          change: change,
          volatility: volatility,
          anomaly_status: anomalyStatus, // Data Anomali
          volatility_regime: volatilityRegime // Data Regim
        });
      }
      
      setStockList(tempStockList);
      if (!selectedStock && tempStockList.length > 0) {
        setSelectedStock(tempStockList[0]);
      }
    } catch (err) { console.error(err); }
  }, [selectedStock]);

  const fetchChartData = useCallback(async () => {
      if (!selectedStock) return;
      const dummyData = Array(30).fill(0).map((_, i) => ({
          day: `${i + 1} ${getIndoMonth(new Date().getMonth()).substring(0, 3)}`,
          price: Math.round(selectedStock.price * (1 + (Math.random() - 0.5) * 0.1)), 
          forecast: null
      })).reverse();
      setChartData(dummyData);
  }, [selectedStock]);

  const fetchNews = useCallback(async () => {
      if (!selectedStock) return;
      const dummyNews = [
        { id: 1, title: `Harga ${selectedStock.code} diprediksi naik setelah rilis laporan Q3.`, source: 'News Source A', sentiment: 'positive' },
        { id: 2, title: `Volatilitas pasar menahan laju pertumbuhan sektor teknologi.`, source: 'Tech Daily', sentiment: 'neutral' },
        { id: 3, title: `Analisis teknikal menunjukkan sinyal jual kuat untuk ${selectedStock.code}.`, source: 'Market Insight', sentiment: 'negative' },
        { id: 4, title: `Regime pasar menunjukkan tren sideways jangka pendek.`, source: 'Algo Report', sentiment: 'neutral' },
        { id: 5, title: `Investor asing kembali melakukan aksi beli besar-besaran.`, source: 'IDX Watch', sentiment: 'positive' },
      ];
      setNewsData(dummyNews);
  }, [selectedStock]); 

  useEffect(() => { fetchMarketData(); }, []);
  useEffect(() => {
    if (selectedStock) { fetchChartData(); fetchNews(); }
  }, [selectedStock, fetchChartData, fetchNews]);

  // --- DERIVED DATA ---
  const volatilityData = useMemo(() => {
      if (!selectedStock) return { volatility: 0, regime: 'N/A' };
      return { 
          volatility: (selectedStock.volatility * 100).toFixed(2), 
          regime: selectedStock.volatility_regime 
      };
  }, [selectedStock]);

  const cnbcSentimentData = useMemo(() => {
    // Logika Sentimen (dipertahankan)
    if (!selectedStock || newsData.length === 0) return [];
    const pos = newsData.filter(n => n.sentiment === 'positive').length;
    const neg = newsData.filter(n => n.sentiment === 'negative').length;
    const neu = newsData.filter(n => n.sentiment === 'neutral').length;
    const total = pos + neg + neu || 1;
    return [
        { name: 'Pos', value: Math.round((pos/total)*100), color: '#34D399' }, 
        { name: 'Neg', value: Math.round((neg/total)*100), color: '#F87171' }, 
        { name: 'Neu', value: Math.round((neu/total)*100), color: '#60A5FA' }, 
    ];
  }, [selectedStock, newsData]);

  const priceForecastInterpretation = useMemo(() => {
    // Logika Sinyal (dipertahankan)
    const change = selectedStock?.change || 0;
    const signal = change > 0.01 ? 'BUY' : change < -0.01 ? 'SELL' : 'HOLD';
    const isPositive = change >= 0;

    return { 
      signal, 
      diff: (change * 100).toFixed(2), 
      endPrice: selectedStock?.price || 0,
      isPositive 
    };
  }, [selectedStock]);

  if (!selectedStock) return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: BG_DEEP_DARK, color: TEXT_LIGHT }}><RefreshCw className="animate-spin mr-2"/> Loading Dashboard...</div>;

  const signalColor = priceForecastInterpretation.signal === 'BUY' ? '#34D399' : 
                      priceForecastInterpretation.signal === 'SELL' ? '#F87171' : 
                      '#FACC15'; 
                      
  const isAnomaly = selectedStock.anomaly_status === 'ANOMALI';
  const anomalyColor = isAnomaly ? '#FBBF24' : '#34D399'; // Kuning/Oranye untuk Anomali, Hijau untuk Normal


  // --- Tooltip Kustom untuk Chart ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const priceValue = payload[0].value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return (
        <div className="p-3 rounded-lg shadow-lg text-sm" style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_NEON}80` }}>
          <p className="font-bold text-gray-300">{`Date : ${label}`}</p>
          <p className="text-white mt-1">
            <DollarSign className='w-3 h-3 inline mr-1 text-green-400'/>
            {`Price : $${priceValue}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // --- Komponen Pembantu untuk Metrik (Diperbarui) ---
  const MetricBox = ({ label, value, color, icon: Icon }) => (
      <div className='p-3 rounded-xl' style={{ backgroundColor: '#263353', border: `1px solid ${ACCENT_PRIMARY}` }}>
          <div className='flex items-center text-xs text-gray-400 uppercase'>
              <Icon className='w-3 h-3 mr-1'/> {label}
          </div>
          <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
  );

  return (
    <div className="h-screen w-full p-2 sm:p-4 font-sans overflow-hidden" style={{ backgroundColor: BG_DEEP_DARK, color: TEXT_LIGHT }}>
      
      {/* 0. STOCKS AVAILABLE (HEADER FULL-WIDTH) */}
      <BentoCard 
          className="w-full mb-4 px-4 py-2 flex items-center justify-start relative overflow-hidden" 
          title="Stocks Available"
          style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_PRIMARY}` }}
      >
        <div className="flex gap-6 overflow-x-auto w-full hide-scrollbar items-center">
            {stockList.map(stock => (
              <button 
                key={stock.code}
                onClick={() => setSelectedStock(stock)}
                className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 transform 
                            ${selectedStock.code === stock.code ? 'ring-2 ring-offset-2 ring-offset-[#0A132C] scale-105 shadow-xl' : 'opacity-70 hover:opacity-100'}`}
                style={{ 
                    borderColor: selectedStock.code === stock.code ? ACCENT_NEON : 'transparent', 
                    backgroundColor: selectedStock.code === stock.code ? ACCENT_PRIMARY : CARD_BASE, 
                    minWidth: '100px',
                    boxShadow: selectedStock.code === stock.code ? `0 0 15px ${ACCENT_NEON}50` : 'none'
                }}
              >
                {/* MENGGUNAKAN LOGO URL DARI COMPANY_META */}
                <StockLogo 
                    code={stock.code} 
                    imageUrl={stock.logoUrl} // Meneruskan URL Logo
                    className="w-10 h-10 rounded-full bg-white p-1 mb-1 shadow-md" 
                />
                <span className="font-bold text-sm mt-1">{stock.code.replace('.JK','')}</span>
              </button>
            ))}
        </div>
      </BentoCard>

      {/* GRID CONTAINER UTAMA (12 Kolom, 9 Baris tersisa) */}
      <div className="grid grid-cols-12 grid-rows-9 gap-4 h-[calc(100vh-120px)] w-full max-w-[1920px] mx-auto">
        
        {/* KIRI (8 KOLOM) */}
        
        {/* 1. JUDUL & DATA UTAMA (col-span-8 row-span-2) */}
        <BentoCard 
            className="col-span-8 row-span-2 p-6 flex flex-col justify-between relative overflow-hidden" 
            title={selectedStock.name}
            style={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_PRIMARY}80` }}
        >
          <div className="flex justify-between items-start z-20">
            <div>
              <p className="text-sm uppercase font-semibold text-gray-400">Selected Stock / {currentDate.getFullYear()}</p>
              <h1 className="text-5xl font-extrabold tracking-tight mt-1" style={{ color: ACCENT_NEON }}>
                {selectedStock.code.replace('.JK','')}
              </h1>
              <p className="text-lg font-medium text-gray-300">{selectedStock.name}</p>
            </div>
            <div className="text-right">
              <h2 className="text-5xl font-bold">
                ${selectedStock.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h2>
              <span className={`text-md font-bold px-3 py-1 rounded-full mt-1 inline-flex items-center ${priceForecastInterpretation.isPositive ? 'bg-green-700/50 text-green-300' : 'bg-red-700/50 text-red-300'}`}>
                {priceForecastInterpretation.isPositive ? <TrendingUp className='w-4 h-4 mr-1'/> : <TrendingDown className='w-4 h-4 mr-1'/>}
                {priceForecastInterpretation.diff}%
              </span>
            </div>
          </div>
          <div className="absolute inset-0 z-0 opacity-[0.1]" style={{ background: `radial-gradient(circle at 100% 100%, ${ACCENT_NEON} 0%, transparent 40%)` }}></div>
        </BentoCard>

        {/* 2. CHART AREA (col-span-8 row-span-5) */}
        <BentoCard 
            className="col-span-8 row-span-5 p-2 relative group" 
            title="Market Trend Analysis (30D)"
            style={{ backgroundColor: CARD_BASE }}
        >
          <div className="w-full h-full pt-4">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={ACCENT_NEON} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={ACCENT_NEON} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#555" tick={{fontSize: 10}} axisLine={false} tickLine={false}/>
                        <YAxis stroke="#555" tickFormatter={(v) => `$${v.toLocaleString()}`} domain={['auto', 'auto']} tick={{fontSize: 10}}/>
                        <CartesianGrid strokeDasharray="4 4" stroke="#333"/>
                        <Tooltip content={<CustomTooltip />} />
                        
                        <Area type="monotone" dataKey="price" stroke={ACCENT_NEON} fillOpacity={1} fill="url(#colorPrice)" dot={false} strokeWidth={3}/>
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-500">Fetching Historical Data...</div>
            )}
          </div>
        </BentoCard>

        {/* 3. SINYAL AI (col-span-4 row-span-2) */}
        <BentoCard 
            className="col-span-4 row-span-2 p-4 flex flex-col justify-between" 
            title="AI Forecast Signal"
            style={{ backgroundColor: ACCENT_PRIMARY, boxShadow: `0 0 20px ${ACCENT_NEON}50` }}
        >
            <div className='flex items-center justify-between mt-2'>
                <div className='flex flex-col'>
                    <p className="text-blue-200 text-sm uppercase mb-1">Recommended Action</p>
                    <h2 className="text-5xl font-black tracking-tighter" style={{ color: signalColor }}>
                        {priceForecastInterpretation.signal}
                    </h2>
                </div>
                <div className="h-20 w-20 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#fff' + '10', color: TEXT_LIGHT, border: `2px solid ${TEXT_LIGHT}80`, boxShadow: `0 0 10px ${TEXT_LIGHT}80` }}>
                    <Zap className='w-10 h-10 animate-pulse' style={{ color: signalColor }}/>
                </div>
            </div>
            
            <div className="flex justify-between items-end border-t border-blue-600 pt-3 mt-3 text-blue-100">
                <div className='flex items-center text-sm font-semibold'>
                    <Wind className='w-4 h-4 mr-1 text-blue-200' /> Volatility Regime
                </div>
                <span className={`text-sm px-2 py-0.5 rounded font-bold ${selectedStock.volatility_regime === 'HIGH VOL' ? 'bg-orange-700/50 text-orange-300' : 'bg-teal-700/50 text-teal-300'}`}>
                    {selectedStock.volatility_regime}
                </span>
            </div>
        </BentoCard>

        {/* 4. ANOMALY & REGIME BOXES (col-span-4 row-span-2) */}
        <BentoCard 
            className="col-span-4 row-span-2 p-4 grid grid-cols-2 gap-3" 
            title="Model Diagnostics"
            style={{ backgroundColor: CARD_BASE }}
        >
            <div className='p-3 rounded-xl col-span-2' style={{ backgroundColor: '#263353', border: `1px solid ${ACCENT_PRIMARY}` }}>
                <div className='flex items-center text-xs text-gray-400 uppercase'>
                    <Activity className='w-4 h-4 mr-1'/> Anomaly Detection (iForest)
                </div>
                <div className='flex justify-between items-center mt-1'>
                    <p className='text-3xl font-bold' style={{ color: anomalyColor }}>
                        {selectedStock.anomaly_status}
                    </p>
                    {isAnomaly && <AlertTriangle className='w-6 h-6 animate-pulse' style={{ color: anomalyColor }} />}
                </div>
            </div>
            
            <MetricBox label="Change (24H)" value={`${priceForecastInterpretation.diff}%`} color={priceForecastInterpretation.isPositive ? 'text-green-400' : 'text-red-400'} icon={DollarSign}/>
            <MetricBox label="Vol Index" value={`${volatilityData.volatility}%`} color="text-yellow-400" icon={Wind}/>
        </BentoCard>
        
        {/* 5. SENTIMEN CHART (col-span-4 row-span-3) */}
        <BentoCard 
            className="col-span-4 row-span-3 p-4" 
            title="News Sentiment Breakdown"
            style={{ backgroundColor: CARD_BASE }}
        >
          <div className="h-full w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cnbcSentimentData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#555" tick={{fill: TEXT_LIGHT, fontSize: 10}} axisLine={false} tickLine={false} width={40}/>
                <Tooltip 
                    cursor={{ fill: '#333' }} 
                    formatter={(value) => [`${value}% Sentimen`]}
                    contentStyle={{ backgroundColor: CARD_BASE, border: `1px solid ${ACCENT_NEON}`, color: TEXT_LIGHT }}
                />
                <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={15}>
                  {cnbcSentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* 6. LIST BERITA (col-span-8 row-span-2) */}
        <BentoCard 
            className="col-span-8 row-span-2 p-4 flex flex-col" 
            title="Recent Activities / News Feed"
            style={{ backgroundColor: CARD_BASE }}
        >
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-2 custom-scrollbar">
            {newsData.slice(0, 4).map((news, i) => (
              <div key={i} className="flex items-start p-3 rounded-lg hover:bg-[#32456C] transition-colors border-b border-gray-700 last:border-0">
                  <Clock className='w-4 h-4 flex-shrink-0 mt-1 text-gray-500'/>
                  <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold leading-snug hover:text-blue-300 cursor-pointer">{news.title}</p>
                      <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{news.source}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${news.sentiment === 'positive' ? 'bg-green-800/70 text-green-400' : news.sentiment === 'negative' ? 'bg-red-800/70 text-red-400' : 'bg-blue-800/70 text-blue-400'}`}>
                              {news.sentiment}
                          </span>
                      </div>
                  </div>
              </div>
            ))}
          </div>
        </BentoCard>

      </div>
      
      {/* GLOBAL STYLES (Agar scrollbar terlihat keren) */}
      <style jsx global>{`
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${BG_DEEP_DARK};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${ACCENT_NEON};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${ACCENT_NEON};
        }
      `}</style>
    </div>
  );
};

export default App;