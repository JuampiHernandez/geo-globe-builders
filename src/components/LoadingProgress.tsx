'use client';

import { motion } from 'framer-motion';

interface LoadingProgressProps {
  progress: number;
  currentCountries: string[];
  totalCountries: number;
  loadedCount: number;
}

export default function LoadingProgress({
  progress,
  currentCountries,
  totalCountries,
  loadedCount
}: LoadingProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-md mx-4">
        {/* Main card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 p-8"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-indigo-500/10 animate-pulse" />
          
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
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-3xl"
                >
                  🌍
                </motion.div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Loading Builder Data
            </h2>
            <p className="text-sm text-white/50 text-center mb-6">
              Fetching builders from {totalCountries} countries...
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>{loadedCount} countries loaded</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full relative"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            </div>

            {/* Currently loading countries */}
            {currentCountries.length > 0 && (
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                  Currently fetching:
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentCountries.map((country, i) => (
                    <motion.span
                      key={country}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-sm text-white/80"
                    >
                      <span>{getCountryFlag(country)}</span>
                      <span>{country}</span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      />
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats info */}
            <div className="mt-4 p-3 bg-black/20 rounded-lg space-y-1">
              <p className="text-xs text-white/40 text-center">
                📊 Getting <span className="text-cyan-400">total counts</span> + top <span className="text-cyan-400">100</span> builders per country
              </p>
              <p className="text-xs text-white/30 text-center">
                ⭐ Avg Score = average builder score of top 100 builders
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
