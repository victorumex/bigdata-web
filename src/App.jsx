import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Zap, AlertTriangle, ShieldHalf, RefreshCw, Menu, Wind 
} from 'lucide-react';

// --- IMPORT DARI FOLDER LAIN ---
import { supabase } from './services/supabaseClient';
import { COMPANY_META, SENTIMENT_COLORS } from './config/constants';
import { formatFullDate, getIndoMonth, processSmartLabels } from './utils/formatters';
import BentoCard from './components/BentoCard';
import StockLogo from './components/StockLogo'; // Opsional jika mau dipakai di judul

const App = () => {
  // --- STATE MANAGEMENT ---
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  
  const [chartRange, setChartRange] = useState('1M');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- DATA FETCHING ---
  const fetchMarketData = useCallback(async () => {
    try {
        const codes = Object.keys(COMPANY_META);
        let tempStockList = [];

        for (const code of codes) {
            const { data } = await supabase
                .from('forecast_results') // <-- SESUAIKAN DENGAN NAMA TABEL ANDA (forecast_results)
                .select('*')
                .eq('symbol', code) // Sesuaikan symbol (AAPL vs AAPL.JK)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (data && data.length > 0) {
                const latest = data[0];
                const price = latest.predicted_price || latest.close_price|| 0;

                tempStockList.push({
                    code: code,
                    name: COMPANY_META[code].name,
                    type: COMPANY_META[code].type,
                    price: price,
                    change: 0.0,
                    volatility: 0.02
                });
            }
        }
        
        setStockList(tempStockList);
        if (!selectedStock && tempStockList.length > 0) {
            setSelectedStock(tempStockList[0]);
        }
    } catch (err) { console.error(err); }
  }, [selectedStock]);

    const fetchChartData = useCallback(async () => {
        if (!selectedStock) return;
        
        // 1. Ambil Data History (Harga Asli) dari tabel 'stock_prices'
        // Ambil 30 hari terakhir biar grafiknya enak dilihat
        const { data: historyData, error } = await supabase
            .from('stock_prices') 
            .select('date, close')
            .eq('symbol', selectedStock.code.replace('.JK', '')) // Pastikan simbol cocok (AAPL)
            .order('date', { ascending: false })
            .limit(30);

        if (error) console.error("Error chart:", error);

        if (historyData && historyData.length > 0) {
            // 2. Format Data agar dibaca Recharts
            // Kita perlu membalik urutan (.reverse) agar grafik jalan dari Kiri (Lama) ke Kanan (Baru)
            const mappedData = historyData.reverse().map(item => ({
                day: formatFullDate(item.date), // Format tanggal jadi "10 Des"
                price: item.close,              // Ini garis history (Solid)
                forecast: null                  // Ini garis putus-putus (kosongkan dulu)
            }));

            setChartData(mappedData);
        }
    }, [selectedStock, chartRange]);

  const fetchNews = useCallback(async () => {
    if (!selectedStock) return;
    const cleanCode = selectedStock.code.replace('.JK', '');
    
    // Ambil dari tabel news_sentiment yang sudah kita buat
    let { data } = await supabase
        .from('news_sentiment')
        .select('*')
        .eq('symbol', cleanCode) 
        .order('published_at', { ascending: false })
        .limit(6);

    const mappedNews = data ? data.map(n => ({
        id: n.id,
        title: n.title,
        source: n.source || 'News',
        sentiment: n.sentiment_label ? n.sentiment_label.toLowerCase() : 'neutral',
        code: n.symbol
    })) : [];
    setNewsData(mappedNews);
  }, [selectedStock]); 

  useEffect(() => { fetchMarketData(); }, []);
  useEffect(() => {
    if (selectedStock) { fetchChartData(); fetchNews(); }
  }, [selectedStock, fetchChartData, fetchNews]);

  // --- DERIVED DATA ---
  const volatilityData = useMemo(() => {
      if (!selectedStock) return { volatility: 0, regime: 'N/A' };
      const stockInfo = stockList.find(s => s.code === selectedStock.code);
      const vol = stockInfo && stockInfo.volatility ? stockInfo.volatility : 0;
      let regime = vol >= 0.03 ? 'High Volatility' : 'Low Volatility';
      return { volatility: (vol * 100).toFixed(2), regime };
  }, [selectedStock, stockList]);

  const cnbcSentimentData = useMemo(() => {
    if (!selectedStock || newsData.length === 0) return [];
    const pos = newsData.filter(n => n.sentiment === 'positive').length;
    const neg = newsData.filter(n => n.sentiment === 'negative').length;
    const neu = newsData.filter(n => n.sentiment === 'neutral').length;
    const total = pos + neg + neu || 1;
    return [
        { name: 'Pos', value: Math.round((pos/total)*100), color: SENTIMENT_COLORS.positive },
        { name: 'Neg', value: Math.round((neg/total)*100), color: SENTIMENT_COLORS.negative },
        { name: 'Neu', value: Math.round((neu/total)*100), color: SENTIMENT_COLORS.neutral },
    ];
  }, [selectedStock, newsData]);

  const priceForecastInterpretation = useMemo(() => {
    // Logika sederhana sinyal BUY/SELL
    return { signal: 'HOLD', diff: 0, endPrice: selectedStock?.price || 0 };
  }, [selectedStock]);

  if (!selectedStock) return <div className="h-screen bg-[#E0E5EC] flex items-center justify-center text-slate-600"><RefreshCw className="animate-spin mr-2"/> Initializing Grid...</div>;

  return (
    <div className="h-screen w-full bg-[#E8EFF5] p-2 sm:p-4 text-white font-sans overflow-hidden">
        {/* GRID CONTAINER UTAMA */}
        <div className="grid grid-cols-12 grid-rows-10 gap-2 sm:gap-4 h-full w-full max-w-[1920px] mx-auto">
            
            {/* 1. LOGO */}
            <BentoCard className="col-span-1 row-span-1 bg-[#2D3482] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                <Menu className="text-white w-6 h-6" />
            </BentoCard>

            {/* 2. JUDUL */}
            <BentoCard className="col-span-8 row-span-2 bg-[#5B7BF0] flex flex-col justify-center px-6 relative" title="Judul">
                <div className="flex justify-between items-end z-20">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{selectedStock.code.replace('.JK','')}</h1>
                        <p className="text-indigo-100 text-sm font-medium">{selectedStock.name}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold">${selectedStock.price.toLocaleString()}</h2>
                        <span className="text-sm font-bold px-2 py-0.5 rounded bg-emerald-400/30 text-white">
                            Forecast
                        </span>
                    </div>
                </div>
                <Zap className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/10" />
            </BentoCard>

            {/* 3. SIMULATOR */}
            <BentoCard className="col-span-3 row-span-2 bg-[#38BDF8] hover:bg-[#0EA5E9] transition-colors cursor-pointer group flex flex-col items-center justify-center text-center p-4">
                <ShieldHalf className="w-10 h-10 mb-2 text-white group-hover:scale-110 transition-transform"/>
                <h3 className="font-bold text-lg leading-tight">AI Status</h3>
                <p className="text-xs text-white/80 mt-1">Model Ready</p>
            </BentoCard>

            {/* 4. STATISTIK (KANAN) */}
            <BentoCard className="col-span-4 row-span-5 bg-[#180491] p-4 flex flex-col" title="Statistik Deskriptif">
                <div className="flex-1 overflow-y-auto mt-6 space-y-3 pr-1">
                    <div className="mb-4">
                        <p className="text-indigo-300 text-xs mb-1">Volatilitas</p>
                        <div className="text-2xl font-bold">{volatilityData.volatility}%</div>
                    </div>
                    
                    <div className="border-t border-white/20 pt-4">
                        <p className="text-indigo-300 text-xs mb-3 font-bold uppercase">Berita Terkait</p>
                        {newsData.slice(0, 5).map((news, i) => (
                            <div key={i} className="mb-3 pb-3 border-b border-white/10 last:border-0">
                                <p className="text-xs font-semibold leading-snug line-clamp-2 hover:text-indigo-300 cursor-pointer">{news.title}</p>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] opacity-60">{news.source}</span>
                                    <span className={`text-[10px] px-1 rounded ${news.sentiment === 'positive' ? 'bg-green-500' : news.sentiment === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                        {news.sentiment}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </BentoCard>

            {/* 5. TANGGAL */}
            <BentoCard className="col-span-1 row-span-1 bg-[#0047AB] flex flex-col items-center justify-center p-1">
                 <span className="text-xl font-bold">{currentDate.getDate()}</span>
                 <span className="text-[10px] uppercase">{getIndoMonth(currentDate.getMonth())}</span>
            </BentoCard>

            {/* 6 & 7. DETEKSI (ANOMALY & REGIME) */}
            <BentoCard className="col-span-2 row-span-2 bg-[#06B6D4] p-4 flex flex-col justify-between" title="Anomaly">
                <div className="mt-4">
                    <AlertTriangle className="w-8 h-8 text-white/80 mb-2"/>
                    <p className="font-bold text-lg leading-none">Normal</p>
                </div>
            </BentoCard>

            <BentoCard className="col-span-2 row-span-2 bg-[#5EEAD4] text-slate-800 p-4 flex flex-col justify-between" title="Regime">
                 <div className="mt-4">
                    <Wind className="w-8 h-8 text-teal-700 mb-2"/>
                    <p className="font-bold text-lg leading-none">{volatilityData.regime}</p>
                </div>
            </BentoCard>

            {/* 8. STOCK LIST SLIDER */}
            <BentoCard className="col-span-8 row-span-1 bg-[#0891B2] flex items-center px-2 relative" title="Saham Tersedia">
                <div className="flex gap-2 overflow-x-auto w-full hide-scrollbar items-center h-full pt-4">
                    {stockList.map(stock => (
                        <button 
                            key={stock.code}
                            onClick={() => setSelectedStock(stock)}
                            className={`flex-shrink-0 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs flex flex-col min-w-[80px] ${selectedStock.code === stock.code ? 'ring-2 ring-white bg-white/30' : ''}`}
                        >
                            <span className="font-bold">{stock.code.replace('.JK','')}</span>
                        </button>
                    ))}
                </div>
            </BentoCard>

            {/* 9. CHART */}
            <BentoCard className="col-span-8 row-span-5 bg-[#38BDF8] p-2 relative group" title="Chart">
                <div className="w-full h-full pt-4 flex items-center justify-center text-slate-800/50">
                   {/* Sementara Chart Placeholder sampai data forecast historis ready */}
                   <p>Chart Area (Menunggu Data Forecast Lengkap)</p>
                </div>
            </BentoCard>

            {/* 10. SINYAL */}
            <BentoCard className="col-span-4 row-span-2 bg-[#0047AB] p-4 flex items-center justify-between" title="Sinyal AI">
                <div className="mt-2">
                    <p className="text-white/60 text-xs uppercase mb-1">Prediction</p>
                    <h2 className="text-4xl font-black tracking-tighter text-yellow-300">
                        {priceForecastInterpretation.signal}
                    </h2>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <TrendingUp />
                </div>
            </BentoCard>

            {/* 11. SENTIMEN CHART */}
            <BentoCard className="col-span-4 row-span-2 bg-[#5B7BF0] p-4" title="Visualisasi Sentimen">
                <div className="h-full w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={cnbcSentimentData}>
                            <XAxis dataKey="name" tick={{fill:'#fff', fontSize: 10}} axisLine={false} tickLine={false}/>
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {cnbcSentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.5)" />
                                ))}
                            </Bar>
                         </BarChart>
                    </ResponsiveContainer>
                </div>
            </BentoCard>

        </div>
    </div>
  );
};

export default App;