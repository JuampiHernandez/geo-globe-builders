'use client';

import { motion } from 'framer-motion';
import { GlobeData, CountryStats } from '@/types';

interface StatsPanelProps {
  data: GlobeData;
  selectedCountry: CountryStats | null;
  onViewBuilders?: (country: CountryStats) => void;
}

export default function StatsPanel({ data, selectedCountry, onViewBuilders }: StatsPanelProps) {
  // Find country with highest rank score
  const topRankedCountry = data.countries.reduce((best, c) => 
    c.rankScore > (best?.rankScore || 0) ? c : best, 
    data.countries[0]
  );

  const stats = [
    {
      label: 'Total Builders',
      value: data.totalBuilders.toLocaleString(),
      icon: '🏗️',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      label: 'Countries',
      value: data.countries.length.toString(),
      icon: '🌍',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      label: 'Top Country',
      value: data.countries[0]?.country || 'N/A',
      icon: '🏆',
      color: 'from-amber-500 to-orange-500'
    },
    {
      label: 'Highest Avg',
      value: topRankedCountry?.country || 'N/A',
      icon: '👑',
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Global Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
            <div className="relative">
              <span className="text-2xl mb-1 block">{stat.icon}</span>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white truncate">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Country Detail */}
      {selectedCountry && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-400/30 p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{getCountryFlag(selectedCountry.countryCode)}</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{selectedCountry.country}</h3>
              <p className="text-sm text-white/60">Selected Country</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{selectedCountry.builderCount.toLocaleString()}</p>
              <p className="text-xs text-white/50">Builders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{selectedCountry.rankScore.toLocaleString()}</p>
              <p className="text-xs text-white/50">Avg Points</p>
            </div>
          </div>

          {/* Top Builders Preview */}
          {selectedCountry.topBuilders.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Top Builders</p>
              <div className="space-y-2">
                {selectedCountry.topBuilders.slice(0, 3).map((builder, i) => (
                  <div key={i} className="flex items-center gap-3 bg-black/20 rounded-lg p-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
                      {builder.image_url ? (
                        <img src={builder.image_url} alt={builder.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-white font-bold">
                          {builder.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{builder.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-cyan-400">
                      <span className="text-xs">⭐</span>
                      <span className="text-sm font-bold">{builder.score}</span>
                      <span className="text-xs text-white/40">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View All Builders Button */}
          {onViewBuilders && (
            <button
              onClick={() => onViewBuilders(selectedCountry)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>View Top Builders</span>
              <svg 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </motion.div>
      )}

      {/* No selection hint */}
      {!selectedCountry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-white/5 border border-white/10 border-dashed p-6 text-center"
        >
          <div className="text-4xl mb-3">👆</div>
          <p className="text-white/60 text-sm">
            Click on a country marker on the globe or select from the list to see details
          </p>
        </motion.div>
      )}
    </div>
  );
}

function getCountryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
