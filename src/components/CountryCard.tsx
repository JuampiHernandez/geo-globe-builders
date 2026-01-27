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
}

export default function CountryCard({
  country,
  rank,
  maxBuilderCount,
  maxRankScore,
  mode,
  onClick,
  isSelected
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
        relative overflow-hidden rounded-xl p-3 sm:p-4 cursor-pointer
        transition-all duration-300 ease-out touch-manipulation
        ${isSelected 
          ? 'bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 border-2 border-indigo-400 scale-[1.02]' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:bg-white/15'
        }
      `}
    >
      {/* Rank badge */}
      <div className={`
        absolute -top-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center
        rounded-br-xl text-[10px] sm:text-xs font-bold
        ${rank <= 3 
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black' 
          : 'bg-white/10 text-white/60'
        }
      `}>
        #{rank}
      </div>

      <div className="ml-5 sm:ml-6">
        {/* Country name and flag */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
          <span className="text-xl sm:text-2xl">{getCountryFlag(country.countryCode)}</span>
          <h3 className="text-sm sm:text-base text-white font-semibold truncate">{country.country}</h3>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Builders</span>
            <span className={`text-base sm:text-lg font-bold ${mode === 'builders' ? 'text-cyan-400' : 'text-white/80'}`}>
              {country.builderCount.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Avg Score</span>
            <span className={`text-base sm:text-lg font-bold ${mode === 'rank' ? 'text-emerald-400' : 'text-white/80'}`}>
              {country.rankScore}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: rank * 0.05, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              mode === 'builders'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                : 'bg-gradient-to-r from-amber-500 to-emerald-400'
            }`}
          />
        </div>

        {/* Top builders preview */}
        {country.topBuilders.length > 0 && (
          <div className="mt-2 sm:mt-3 flex -space-x-1.5 sm:-space-x-2">
            {country.topBuilders.slice(0, 4).map((builder, i) => (
              <div
                key={i}
                className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-black/50 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600"
                title={`${builder.name} - ${builder.score} pts`}
              >
                {builder.image_url ? (
                  <img 
                    src={builder.image_url} 
                    alt={builder.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold">
                    {builder.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {country.topBuilders.length > 4 && (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-black/50 bg-white/10 flex items-center justify-center text-[9px] sm:text-[10px] text-white/70">
                +{country.topBuilders.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Glow effect for selected */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 pointer-events-none" />
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
