'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { GlobeData, CountryStats } from '@/types';
import CountryCard from '@/components/CountryCard';
import StatsPanel from '@/components/StatsPanel';
import LoadingProgress from '@/components/LoadingProgress';
import CountryDetailModal from '@/components/CountryDetailModal';

// Dynamic import for Globe to avoid SSR issues
const Globe = dynamic(() => import('@/components/Globe'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">
    <div className="text-white/50">Initializing globe...</div>
  </div>
});

interface LoadingState {
  isLoading: boolean;
  progress: number;
  currentCountries: string[];
  totalCountries: number;
  loadedCountries: CountryStats[];
}

export default function Home() {
  const [data, setData] = useState<GlobeData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    currentCountries: [],
    totalCountries: 50,
    loadedCountries: []
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryStats | null>(null);
  const [modalCountry, setModalCountry] = useState<CountryStats | null>(null);
  const [colorMode, setColorMode] = useState<'builders' | 'rank'>('builders');
  const [ecosystem, setEcosystem] = useState<string | null>(null); // null = all, 'base' = Base ecosystem
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchDataWithProgress() {
      // Reset loading state
      setLoadingState({
        isLoading: true,
        progress: 0,
        currentCountries: [],
        totalCountries: 50,
        loadedCountries: []
      });
      setError(null);
      
      try {
        // If ecosystem is selected, use ecosystem endpoint (faster, no streaming)
        if (ecosystem) {
          console.log('Fetching ecosystem data for:', ecosystem);
          const response = await fetch(`/api/ecosystem?ecosystem=${ecosystem}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Ecosystem API error:', errorData);
            throw new Error(errorData.error || 'Failed to fetch ecosystem data');
          }
          
          const ecosystemData: GlobeData = await response.json();
          console.log('Ecosystem data received:', ecosystemData);
          setData(ecosystemData);
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            progress: 100,
            loadedCountries: ecosystemData.countries
          }));
          return;
        }
        
        // Use streaming endpoint for progress updates (all builders)
        const response = await fetch('/api/builders', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch builder data');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                
                switch (event.type) {
                  case 'start':
                    setLoadingState(prev => ({
                      ...prev,
                      totalCountries: event.totalCountries
                    }));
                    break;
                    
                  case 'progress':
                    setLoadingState(prev => ({
                      ...prev,
                      progress: event.percentage,
                      currentCountries: event.countries
                    }));
                    break;
                    
                  case 'country':
                    setLoadingState(prev => {
                      // Prevent duplicates by checking if country already exists
                      const exists = prev.loadedCountries.some(
                        c => c.countryCode === event.country.countryCode
                      );
                      if (exists) return prev;
                      
                      return {
                        ...prev,
                        loadedCountries: [...prev.loadedCountries, event.country]
                          .sort((a, b) => b.builderCount - a.builderCount)
                      };
                    });
                    break;
                    
                  case 'complete':
                    setData(event.data);
                    setLoadingState(prev => ({
                      ...prev,
                      isLoading: false,
                      progress: 100
                    }));
                    break;
                }
              } catch (e) {
                console.error('Error parsing SSE event:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoadingState(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchDataWithProgress();
  }, [ecosystem]);

  const handleCountryClick = useCallback((country: CountryStats | null) => {
    setSelectedCountry(country);
  }, []);

  const handleCountryDoubleClick = useCallback((country: CountryStats) => {
    setModalCountry(country);
  }, []);

  const handleCardClick = useCallback((country: CountryStats) => {
    if (selectedCountry?.countryCode === country.countryCode) {
      // If already selected, open the modal
      setModalCountry(country);
    } else {
      // Otherwise just select it
      setSelectedCountry(country);
    }
  }, [selectedCountry]);

  // Use loaded countries during loading, full data when complete
  const displayCountries = data?.countries || loadingState.loadedCountries;
  
  const sortedCountries = displayCountries.length > 0
    ? colorMode === 'builders'
      ? [...displayCountries].sort((a, b) => b.builderCount - a.builderCount)
      : [...displayCountries].sort((a, b) => b.rankScore - a.rankScore)
    : [];

  // Calculate stats from loaded countries during loading
  const displayData: GlobeData | null = data || (loadingState.loadedCountries.length > 0 ? {
    countries: loadingState.loadedCountries,
    totalBuilders: loadingState.loadedCountries.reduce((sum, c) => sum + c.builderCount, 0),
    maxBuilderCount: Math.max(1, ...loadingState.loadedCountries.map(c => c.builderCount)),
    maxRankScore: Math.max(1, ...loadingState.loadedCountries.map(c => c.rankScore))
  } : null);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Data</h1>
          <p className="text-white/60">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <div className="fixed inset-0 noise-overlay pointer-events-none" />

      {/* Mobile Menu Button - Top Left */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 glass rounded-xl hover:bg-blue-600/20 transition-all duration-300 pointer-events-auto group lg:top-6 lg:left-6 lg:p-3"
        title="Toggle menu"
      >
        <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </motion.button>

      {/* Header - Responsive */}
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-3 sm:py-4 pointer-events-none">
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 sm:gap-3 glass rounded-xl px-3 sm:px-4 py-2 pointer-events-auto max-w-full"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Builder Globe</h1>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] sm:text-[13px] text-white/60">Powered by</p>
                <svg className="h-3 sm:h-3.5" viewBox="0 0 384 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M349.731 94.5761C346.696 94.5761 344.268 93.6655 342.447 91.8444C340.693 90.0232 339.816 87.595 339.816 84.5598V53.4991H326.056V44.6969H339.816V28.2054H350.237V44.6969H365.11V53.4991H350.237V82.7386C350.237 84.7621 351.181 85.7739 353.07 85.7739H363.491V94.5761H349.731Z" fill="white" fillOpacity="0.5"/>
                  <path d="M274.196 94.5637V44.6845H284.414V52.1714H286.033C286.978 50.1479 288.664 48.2593 291.092 46.5056C293.52 44.7519 297.129 43.8751 301.918 43.8751C305.695 43.8751 309.034 44.7182 311.934 46.4044C314.902 48.0907 317.229 50.4852 318.915 53.5879C320.601 56.6231 321.444 60.2991 321.444 64.6159V94.5637H311.023V65.4253C311.023 61.1085 309.944 57.9384 307.786 55.9149C305.627 53.8239 302.66 52.7785 298.882 52.7785C294.566 52.7785 291.092 54.1949 288.461 57.0278C285.898 59.8607 284.617 63.9751 284.617 69.3711V94.5637H274.196Z" fill="white" fillOpacity="0.5"/>
                  <path d="M242.024 95.9845C236.965 95.9845 232.547 94.939 228.77 92.848C224.993 90.6896 222.025 87.6881 219.867 83.8435C217.776 79.9314 216.73 75.4123 216.73 70.2861V69.072C216.73 63.8783 217.776 59.3592 219.867 55.5145C221.958 51.6024 224.858 48.6009 228.568 46.51C232.345 44.3516 236.696 43.2724 241.619 43.2724C246.408 43.2724 250.59 44.3516 254.165 46.51C257.807 48.6009 260.64 51.535 262.664 55.3122C264.687 59.0894 265.699 63.5074 265.699 68.5661V72.5119H227.354C227.489 76.8961 228.939 80.4035 231.704 83.0341C234.537 85.5972 238.045 86.8787 242.226 86.8787C246.138 86.8787 249.073 86.0019 251.029 84.2482C253.052 82.4945 254.603 80.471 255.683 78.1777L264.283 82.6294C263.338 84.518 261.955 86.5078 260.134 88.5987C258.381 90.6896 256.054 92.4433 253.153 93.8598C250.253 95.2762 246.543 95.9845 242.024 95.9845ZM227.455 64.5191H255.076C254.806 60.7419 253.457 57.8078 251.029 55.7169C248.6 53.5585 245.43 52.4793 241.518 52.4793C237.606 52.4793 234.402 53.5585 231.907 55.7169C229.478 57.8078 227.994 60.7419 227.455 64.5191Z" fill="white" fillOpacity="0.5"/>
                  <path d="M197.32 94.568V23.7456H207.741V94.568H197.32Z" fill="white" fillOpacity="0.5"/>
                  <path d="M158.454 95.9845C154.879 95.9845 151.675 95.3774 148.842 94.1633C146.077 92.9492 143.851 91.1618 142.165 88.801C140.546 86.4403 139.736 83.5737 139.736 80.2012C139.736 76.7612 140.546 73.9284 142.165 71.7025C143.851 69.4092 146.11 67.6892 148.943 66.5426C151.844 65.396 155.115 64.8226 158.757 64.8226H173.933V61.585C173.933 58.6847 173.057 56.3577 171.303 54.604C169.549 52.8503 166.851 51.9734 163.209 51.9734C159.634 51.9734 156.902 52.8165 155.014 54.5028C153.125 56.189 151.877 58.3812 151.27 61.0792L141.557 57.9427C142.367 55.2447 143.648 52.8166 145.402 50.6582C147.223 48.4323 149.618 46.6449 152.586 45.2959C155.553 43.9469 159.128 43.2724 163.31 43.2724C169.785 43.2724 174.878 44.9249 178.587 48.23C182.297 51.535 184.152 56.2228 184.152 62.2933V82.8317C184.152 84.8552 185.096 85.867 186.985 85.867H191.234V94.568H183.444C181.083 94.568 179.161 93.961 177.677 92.7469C176.193 91.5328 175.451 89.8802 175.451 87.7893V87.4858H173.933C173.394 88.4975 172.584 89.6779 171.505 91.0269C170.426 92.3759 168.841 93.5563 166.75 94.568C164.659 95.5123 161.894 95.9845 158.454 95.9845ZM159.971 87.3846C164.153 87.3846 167.526 86.2042 170.089 83.8435C172.652 81.4153 173.933 78.1102 173.933 73.9283V72.9166H159.364C156.599 72.9166 154.373 73.5237 152.687 74.7377C151 75.8844 150.157 77.6044 150.157 79.8977C150.157 82.191 151.034 84.0121 152.788 85.3611C154.542 86.7101 156.936 87.3846 159.971 87.3846Z" fill="white" fillOpacity="0.5"/>
                  <path d="M119.498 94.5761C116.463 94.5761 114.034 93.6655 112.213 91.8444C110.46 90.0232 109.583 87.595 109.583 84.5598V53.4991H95.823V44.6969H109.583V28.2054H120.004V44.6969H134.876V53.4991H120.004V82.7386C120.004 84.7621 120.948 85.7739 122.837 85.7739H133.258V94.5761H119.498Z" fill="white" fillOpacity="0.5"/>
                  <path d="M8.41476 41.7788C10.2415 43.6002 12.6771 44.5109 15.7217 44.5109L46.86 44.5109L43.353 34.4933H18.5633C16.6689 34.4933 15.7217 33.4814 15.7217 31.4577L15.7217 6.81274L5.77613 3.42871L5.77612 34.4933C5.77612 37.5289 6.65567 39.9574 8.41476 41.7788Z" fill="white" fillOpacity="0.5"/>
                  <path d="M8.41476 91.8629C10.2415 93.6842 12.6771 94.5949 15.7217 94.5949H46.86L43.353 84.5773H18.5633C16.6689 84.5773 15.7217 83.5655 15.7217 81.5417L15.7217 56.8968L5.77613 53.5128L5.77612 84.5773C5.77612 87.613 6.65567 90.0415 8.41476 91.8629Z" fill="white" fillOpacity="0.6"/>
                </svg>
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/10 mx-3" />
            
            {/* Ecosystem Filter - Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-lg bg-white/5 hover:bg-blue-600/20 border border-white/10 text-white text-xs sm:text-sm transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-600/10 min-w-[100px] sm:min-w-[140px] text-left"
              >
                {ecosystem === 'base' ? 'Base' : 'All'}
                <span className="hidden sm:inline">{ecosystem === 'base' ? ' Ecosystem' : ' Builders'}</span>
              </button>
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <motion.svg 
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white/50" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute top-full mt-2 left-0 right-0 glass rounded-lg border border-white/10 overflow-hidden shadow-2xl z-50"
                  >
                    <button
                      onClick={() => {
                        setEcosystem(null);
                        setSelectedCountry(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm transition-all duration-200 ${
                        ecosystem === null
                          ? 'bg-blue-600/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      All Builders
                    </button>
                    <button
                      onClick={() => {
                        setEcosystem('base');
                        setSelectedCountry(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm transition-all duration-200 ${
                        ecosystem === 'base'
                          ? 'bg-blue-600/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Base Ecosystem
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Loading Progress Overlay */}
      <AnimatePresence>
        {loadingState.isLoading && (
          <LoadingProgress
            progress={loadingState.progress}
            currentCountries={loadingState.currentCountries}
            totalCountries={loadingState.totalCountries}
            loadedCount={loadingState.loadedCountries.length}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="min-h-screen flex">
        {/* Mobile Drawer - Country Rankings */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              />
              
              {/* Drawer */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-sm glass overflow-hidden flex flex-col z-50 lg:hidden shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-lg font-bold text-white">Country Rankings</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content wrapper with padding */}
                <div className="flex flex-col h-full p-4">
                  {/* Mode toggle */}
                  <div className="mb-4 p-1 bg-white/5 rounded-xl flex">
                    <button
                      onClick={() => setColorMode('builders')}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                        colorMode === 'builders'
                          ? 'bg-blue-600 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Builders
                    </button>
                    <button
                      onClick={() => setColorMode('rank')}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                        colorMode === 'rank'
                          ? 'bg-blue-600 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Avg Score
                    </button>
                  </div>

                  {/* Country list */}
                  <div className="flex-1 overflow-y-auto space-y-2.5">
                    {sortedCountries.length === 0 && loadingState.isLoading ? (
                      // Loading skeleton
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl shimmer" />
                      ))
                    ) : (
                      sortedCountries.map((country, index) => (
                        <div key={country.countryCode} onClick={() => setIsMobileMenuOpen(false)}>
                          <CountryCard
                            country={country}
                            rank={index + 1}
                            maxBuilderCount={displayData?.maxBuilderCount || 1}
                            maxRankScore={displayData?.maxRankScore || 1}
                            mode={colorMode}
                            onClick={() => handleCardClick(country)}
                            isSelected={selectedCountry?.countryCode === country.countryCode}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Left Panel - Country Rankings - Floating Liquid Glass */}
        <motion.aside
          initial={{ opacity: 0, x: -100, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ 
            type: 'spring', 
            damping: 30, 
            stiffness: 300,
            mass: 0.8
          }}
          className="hidden lg:flex fixed left-6 top-24 bottom-6 w-80 glass rounded-2xl overflow-hidden flex-col z-30 shadow-2xl"
        >
              {/* Content wrapper with padding */}
              <div className="flex flex-col h-full p-6 pt-4">
                {/* Mode toggle */}
                <div className="mb-6 p-1 bg-white/5 rounded-xl flex">
                  <button
                    onClick={() => setColorMode('builders')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      colorMode === 'builders'
                        ? 'bg-blue-600 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    By Builders
                  </button>
                  <button
                    onClick={() => setColorMode('rank')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      colorMode === 'rank'
                        ? 'bg-blue-600 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    By Avg Score
                  </button>
                </div>

                {/* Country list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {sortedCountries.length === 0 && loadingState.isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-28 rounded-xl shimmer" />
                    ))
                  ) : (
                    sortedCountries.map((country, index) => (
                      <CountryCard
                        key={country.countryCode}
                        country={country}
                        rank={index + 1}
                        maxBuilderCount={displayData?.maxBuilderCount || 1}
                        maxRankScore={displayData?.maxRankScore || 1}
                        mode={colorMode}
                        onClick={() => handleCardClick(country)}
                        isSelected={selectedCountry?.countryCode === country.countryCode}
                      />
                    ))
                  )}
                </div>
              </div>
            </motion.aside>

        {/* Globe Container */}
        <div className="flex-1 relative">
          {displayData && displayData.countries.length > 0 ? (
            <Globe
              countries={displayData.countries}
              maxBuilderCount={displayData.maxBuilderCount}
              maxRankScore={displayData.maxRankScore}
              onCountryClick={handleCountryClick}
              onCountryDoubleClick={handleCountryDoubleClick}
              colorMode={colorMode}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/30 text-lg">Loading globe data...</div>
            </div>
          )}

          {/* Legend - Centered at bottom - Single line on mobile */}
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3"
            >
            <div className="flex items-center gap-3 sm:gap-6 whitespace-nowrap">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs text-white/70">
                  {colorMode === 'builders' ? 'More' : 'Higher'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white/20 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs text-white/70">
                  {colorMode === 'builders' ? 'Fewer' : 'Lower'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-white/50">Double-click to view builders</span>
              </div>
            </div>
            </motion.div>
          </div>

          {/* Powered by Talent - Top Right */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-3 sm:top-6 right-2 sm:right-6 flex flex-col items-center gap-1 pointer-events-auto z-50"
          >
            <p className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap">Powered by</p>
            <a href="https://talent.app" target="_blank" rel="noopener noreferrer">
              <svg className="h-4 sm:h-5" viewBox="0 0 384 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M349.731 94.5761C346.696 94.5761 344.268 93.6655 342.447 91.8444C340.693 90.0232 339.816 87.595 339.816 84.5598V53.4991H326.056V44.6969H339.816V28.2054H350.237V44.6969H365.11V53.4991H350.237V82.7386C350.237 84.7621 351.181 85.7739 353.07 85.7739H363.491V94.5761H349.731Z" fill="white" fillOpacity="0.7"/>
                <path d="M274.196 94.5637V44.6845H284.414V52.1714H286.033C286.978 50.1479 288.664 48.2593 291.092 46.5056C293.52 44.7519 297.129 43.8751 301.918 43.8751C305.695 43.8751 309.034 44.7182 311.934 46.4044C314.902 48.0907 317.229 50.4852 318.915 53.5879C320.601 56.6231 321.444 60.2991 321.444 64.6159V94.5637H311.023V65.4253C311.023 61.1085 309.944 57.9384 307.786 55.9149C305.627 53.8239 302.66 52.7785 298.882 52.7785C294.566 52.7785 291.092 54.1949 288.461 57.0278C285.898 59.8607 284.617 63.9751 284.617 69.3711V94.5637H274.196Z" fill="white" fillOpacity="0.7"/>
                <path d="M242.024 95.9845C236.965 95.9845 232.547 94.939 228.77 92.848C224.993 90.6896 222.025 87.6881 219.867 83.8435C217.776 79.9314 216.73 75.4123 216.73 70.2861V69.072C216.73 63.8783 217.776 59.3592 219.867 55.5145C221.958 51.6024 224.858 48.6009 228.568 46.51C232.345 44.3516 236.696 43.2724 241.619 43.2724C246.408 43.2724 250.59 44.3516 254.165 46.51C257.807 48.6009 260.64 51.535 262.664 55.3122C264.687 59.0894 265.699 63.5074 265.699 68.5661V72.5119H227.354C227.489 76.8961 228.939 80.4035 231.704 83.0341C234.537 85.5972 238.045 86.8787 242.226 86.8787C246.138 86.8787 249.073 86.0019 251.029 84.2482C253.052 82.4945 254.603 80.471 255.683 78.1777L264.283 82.6294C263.338 84.518 261.955 86.5078 260.134 88.5987C258.381 90.6896 256.054 92.4433 253.153 93.8598C250.253 95.2762 246.543 95.9845 242.024 95.9845ZM227.455 64.5191H255.076C254.806 60.7419 253.457 57.8078 251.029 55.7169C248.6 53.5585 245.43 52.4793 241.518 52.4793C237.606 52.4793 234.402 53.5585 231.907 55.7169C229.478 57.8078 227.994 60.7419 227.455 64.5191Z" fill="white" fillOpacity="0.7"/>
                <path d="M197.32 94.568V23.7456H207.741V94.568H197.32Z" fill="white" fillOpacity="0.7"/>
                <path d="M158.454 95.9845C154.879 95.9845 151.675 95.3774 148.842 94.1633C146.077 92.9492 143.851 91.1618 142.165 88.801C140.546 86.4403 139.736 83.5737 139.736 80.2012C139.736 76.7612 140.546 73.9284 142.165 71.7025C143.851 69.4092 146.11 67.6892 148.943 66.5426C151.844 65.396 155.115 64.8226 158.757 64.8226H173.933V61.585C173.933 58.6847 173.057 56.3577 171.303 54.604C169.549 52.8503 166.851 51.9734 163.209 51.9734C159.634 51.9734 156.902 52.8165 155.014 54.5028C153.125 56.189 151.877 58.3812 151.27 61.0792L141.557 57.9427C142.367 55.2447 143.648 52.8166 145.402 50.6582C147.223 48.4323 149.618 46.6449 152.586 45.2959C155.553 43.9469 159.128 43.2724 163.31 43.2724C169.785 43.2724 174.878 44.9249 178.587 48.23C182.297 51.535 184.152 56.2228 184.152 62.2933V82.8317C184.152 84.8552 185.096 85.867 186.985 85.867H191.234V94.568H183.444C181.083 94.568 179.161 93.961 177.677 92.7469C176.193 91.5328 175.451 89.8802 175.451 87.7893V87.4858H173.933C173.394 88.4975 172.584 89.6779 171.505 91.0269C170.426 92.3759 168.841 93.5563 166.75 94.568C164.659 95.5123 161.894 95.9845 158.454 95.9845ZM159.971 87.3846C164.153 87.3846 167.526 86.2042 170.089 83.8435C172.652 81.4153 173.933 78.1102 173.933 73.9283V72.9166H159.364C156.599 72.9166 154.373 73.5237 152.687 74.7377C151 75.8844 150.157 77.6044 150.157 79.8977C150.157 82.191 151.034 84.0121 152.788 85.3611C154.542 86.7101 156.936 87.3846 159.971 87.3846Z" fill="white" fillOpacity="0.7"/>
                <path d="M119.498 94.5761C116.463 94.5761 114.034 93.6655 112.213 91.8444C110.46 90.0232 109.583 87.595 109.583 84.5598V53.4991H95.823V44.6969H109.583V28.2054H120.004V44.6969H134.876V53.4991H120.004V82.7386C120.004 84.7621 120.948 85.7739 122.837 85.7739H133.258V94.5761H119.498Z" fill="white" fillOpacity="0.7"/>
                <path d="M8.41476 41.7788C10.2415 43.6002 12.6771 44.5109 15.7217 44.5109L46.86 44.5109L43.353 34.4933H18.5633C16.6689 34.4933 15.7217 33.4814 15.7217 31.4577L15.7217 6.81274L5.77613 3.42871L5.77612 34.4933C5.77612 37.5289 6.65567 39.9574 8.41476 41.7788Z" fill="white" fillOpacity="0.7"/>
                <path d="M8.41476 91.8629C10.2415 93.6842 12.6771 94.5949 15.7217 94.5949H46.86L43.353 84.5773H18.5633C16.6689 84.5773 15.7217 83.5655 15.7217 81.5417L15.7217 56.8968L5.77613 53.5128L5.77612 84.5773C5.77612 87.613 6.65567 90.0415 8.41476 91.8629Z" fill="white" fillOpacity="0.8"/>
              </svg>
            </a>
          </motion.div>

        </div>

        {/* Mobile Stats - Bottom Sheet */}
        {displayData && selectedCountry && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/10 rounded-t-2xl max-h-[60vh] overflow-y-auto"
          >
            <div className="p-4">
              {/* Drag handle */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              
              <StatsPanel 
                data={displayData} 
                selectedCountry={selectedCountry}
                onViewBuilders={(country) => setModalCountry(country)}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Country Detail Modal */}
      <CountryDetailModal 
        country={modalCountry} 
        onClose={() => setModalCountry(null)}
        ecosystem={ecosystem || undefined}
      />
    </main>
  );
}
