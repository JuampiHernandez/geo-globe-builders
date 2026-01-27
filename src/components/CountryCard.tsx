'use client';

import { motion } from 'framer-motion';
import { CountryStats } from '@/types';

interface CountryCardProps {
  country: CountryStats;
  rank: number;
  maxBuilderCount: number;
  maxRankScore: number;
  mode: 'builders' | 'rank';
  onClick: () => void;
  isSelected: boolean;
  theme?: 'dark' | 'light';
}

export default function CountryCard({
  country,
  rank,
  maxBuilderCount,
  maxRankScore,
  mode,
  onClick,
  isSelected,
  theme = 'dark'
}: CountryCardProps) {
  const intensity = mode === 'builders'
    ? country.builderCount / maxBuilderCount
    : country.rankScore / Math.max(1, maxRankScore);

  const barWidth = Math.max(10, intensity * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl p-4 cursor-pointer
        transition-all duration-300 ease-out
        ${isSelected 
          ? 'bg-blue-600/20 border-2 border-blue-500 scale-[1.02]' 
          : theme === 'dark' 
            ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
            : 'bg-white/50 border border-gray-200 hover:bg-white/70 hover:border-gray-300'
        }
      `}
    >
      {/* Rank badge */}
      <div className={`
        absolute -top-1 -left-1 w-8 h-8 flex items-center justify-center
        rounded-br-xl text-xs font-bold
        ${rank <= 3 
          ? 'bg-blue-600 text-white' 
          : theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-600'
        }
      `}>
        #{rank}
      </div>

      <div className="ml-6">
        {/* Country name and flag */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{getCountryFlag(country.countryCode)}</span>
          <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{country.country}</h3>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col">
            <span className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-white/50' : 'text-gray-600'}`}>Builders</span>
            <span className={`text-lg font-bold ${mode === 'builders' ? 'text-blue-500' : theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>
              {country.builderCount.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-white/50' : 'text-gray-600'}`}>Avg Score</span>
            <span className={`text-lg font-bold ${mode === 'rank' ? 'text-blue-500' : theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>
              {country.rankScore}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-300'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: rank * 0.05, ease: 'easeOut' }}
            className="h-full rounded-full bg-blue-600"
          />
        </div>

        {/* Top builders preview */}
        {country.topBuilders.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {country.topBuilders.slice(0, 4).map((builder, i) => (
              <div
                key={i}
                className={`relative w-7 h-7 rounded-full border-2 overflow-hidden bg-blue-600 ${
                  theme === 'dark' ? 'border-black/50' : 'border-white'
                }`}
                title={`${builder.name} - ${builder.score} pts`}
              >
                {builder.image_url ? (
                  <img 
                    src={builder.image_url} 
                    alt={builder.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold">
                    {builder.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {country.topBuilders.length > 4 && (
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] ${
                theme === 'dark' 
                  ? 'border-black/50 bg-white/10 text-white/70' 
                  : 'border-white bg-gray-200 text-gray-600'
              }`}>
                +{country.topBuilders.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Glow effect for selected */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
      )}
    </motion.div>
  );
}

function getCountryFlag(code: string): string {
  // Convert country code to flag emoji
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
