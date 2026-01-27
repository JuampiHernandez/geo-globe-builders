'use client';

import { motion } from 'framer-motion';

interface LoadingProgressProps {
  progress: number;
  currentCountries: string[];
  totalCountries: number;
  loadedCount: number;
  theme?: 'dark' | 'light';
}

export default function LoadingProgress({
  progress,
  currentCountries,
  totalCountries,
  loadedCount,
  theme = 'dark'
}: LoadingProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-colors duration-500 ${
        theme === 'light' 
          ? 'bg-gray-50/90' 
          : 'bg-[#030712]/90'
      }`}
    >
      <div className="w-full max-w-md mx-4">
        {/* Main card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`relative overflow-hidden rounded-2xl border p-8 transition-colors duration-500 ${
            theme === 'light' 
              ? 'bg-white border-gray-200' 
              : 'bg-black border-white/10'
          }`}
        >
          {/* Animated background gradient */}
          <div className={`absolute inset-0 animate-pulse ${
            theme === 'light' ? 'bg-blue-50/50' : 'bg-blue-500/10'
          }`} />
          
          {/* Content */}
          <div className="relative">
            {/* Globe animation */}
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                {/* Outer ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30"
                />
                
                {/* Middle ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-500/40"
                />
                
                {/* Inner globe */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
              </div>
            </div>

            {/* Title */}
            <h2 className={`text-xl font-bold text-center mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Loading Builder Data
            </h2>
            <p className={`text-sm text-center mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>
              Fetching builders from {totalCountries} countries...
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className={`flex justify-between text-xs mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>
                <span>{loadedCount} countries loaded</span>
                <span>{progress}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-full bg-blue-500 rounded-full relative"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            </div>

            {/* Currently loading countries */}
            {currentCountries.length > 0 && (
              <div className={`rounded-xl p-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-black/30'}`}>
                <p className={`text-xs uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/40'}`}>
                  Currently fetching:
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentCountries.map((country, i) => (
                    <motion.span
                      key={country}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-sm ${
                        theme === 'light' 
                          ? 'bg-blue-50 border-blue-200 text-gray-900' 
                          : 'bg-blue-500/20 border-blue-500/30 text-white/80'
                      }`}
                    >
                      <span>{getCountryFlag(country)}</span>
                      <span>{country}</span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      />
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats info */}
            <div className={`mt-4 p-3 rounded-lg space-y-1 ${theme === 'light' ? 'bg-gray-100' : 'bg-black/20'}`}>
              <p className={`text-xs text-center ${theme === 'light' ? 'text-gray-700' : 'text-white/40'}`}>
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Getting <span className="text-blue-500 font-semibold">total counts</span> + top <span className="text-blue-500 font-semibold">100</span> builders per country
              </p>
              <p className={`text-xs text-center ${theme === 'light' ? 'text-gray-600' : 'text-white/30'}`}>
                <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Avg Score = average builder score of top 100 builders
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Simple country name to flag (approximate)
function getCountryFlag(countryName: string): string {
  const countryToCode: Record<string, string> = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'India': 'IN',
    'Brazil': 'BR',
    'Japan': 'JP',
    'China': 'CN',
    'Canada': 'CA',
    'Australia': 'AU',
    'Spain': 'ES',
    'Italy': 'IT',
    'Netherlands': 'NL',
    'Portugal': 'PT',
    'Poland': 'PL',
    'Ukraine': 'UA',
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'South Africa': 'ZA',
    'Argentina': 'AR',
    'Mexico': 'MX',
    'Colombia': 'CO',
    'Chile': 'CL',
    'Peru': 'PE',
    'Singapore': 'SG',
    'South Korea': 'KR',
    'Indonesia': 'ID',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Philippines': 'PH',
    'Turkey': 'TR',
    'United Arab Emirates': 'AE',
    'Israel': 'IL',
    'Egypt': 'EG',
    'Morocco': 'MA',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Belgium': 'BE',
    'Ireland': 'IE',
    'Czech Republic': 'CZ',
    'Romania': 'RO',
    'Greece': 'GR',
    'Hungary': 'HU',
    'Russia': 'RU',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
  };

  const code = countryToCode[countryName];
  if (!code) return '🌍';
  
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
