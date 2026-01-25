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
  const [showPanel, setShowPanel] = useState<'left' | 'right' | 'both'>('both');

  useEffect(() => {
    async function fetchDataWithProgress() {
      try {
        // Use streaming endpoint for progress updates
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
  }, []);

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
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Data</h1>
          <p className="text-white/60">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors"
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
      
      {/* Gradient orbs */}
      <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header - Centered */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 pointer-events-none">
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 glass rounded-xl px-4 py-2 pointer-events-auto"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xl">
              🌍
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Builder Globe</h1>
              <p className="text-xs text-white/50">Powered by Talent Protocol</p>
            </div>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button
              onClick={() => setShowPanel(showPanel === 'both' ? 'right' : showPanel === 'right' ? 'left' : 'both')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Toggle panels"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
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
        {/* Left Panel - Country Rankings */}
        <AnimatePresence>
          {(showPanel === 'left' || showPanel === 'both') && (
            <motion.aside
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-80 flex-shrink-0 h-screen overflow-hidden flex flex-col pt-20 pb-6 px-4 z-10"
            >
              {/* Mode toggle */}
              <div className="mb-4 p-1 bg-white/5 rounded-xl flex">
                <button
                  onClick={() => setColorMode('builders')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    colorMode === 'builders'
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  🏗️ By Builders
                </button>
                <button
                  onClick={() => setColorMode('rank')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    colorMode === 'rank'
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  ⭐ By Avg Score
                </button>
              </div>

              {/* Instruction */}
              <p className="text-xs text-white/40 mb-3 px-1">
                Click a country to select • Click again to view builders
              </p>

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
            </motion.aside>
          )}
        </AnimatePresence>

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

          {/* Legend - Centered at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 glass rounded-xl px-6 py-3"
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  colorMode === 'builders' 
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500' 
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`} />
                <span className="text-xs text-white/70">
                  {colorMode === 'builders' ? 'More Builders' : 'Higher Avg Score'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <span className="text-xs text-white/70">
                  {colorMode === 'builders' ? 'Fewer Builders' : 'Lower Avg Score'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">💡 Double-click to view builders</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Stats */}
        <AnimatePresence>
          {(showPanel === 'right' || showPanel === 'both') && displayData && (
            <motion.aside
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-80 flex-shrink-0 h-screen overflow-y-auto pt-20 pb-6 px-4 z-10"
            >
              <StatsPanel 
                data={displayData} 
                selectedCountry={selectedCountry}
                onViewBuilders={(country) => setModalCountry(country)}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Country Detail Modal */}
      <CountryDetailModal 
        country={modalCountry} 
        onClose={() => setModalCountry(null)} 
      />
    </main>
  );
}
