'use client';

import { motion } from 'framer-motion';
import { GlobeData, CountryStats } from '@/types';

interface StatsPanelProps {
  data: GlobeData;
  selectedCountry: CountryStats | null;
  onViewBuilders?: (country: CountryStats) => void;
  theme?: 'dark' | 'light';
}

export default function StatsPanel({ data, selectedCountry, onViewBuilders, theme = 'dark' }: StatsPanelProps) {
  // Find country with highest rank score
  const topRankedCountry = data.countries.reduce((best, c) => 
    c.rankScore > (best?.rankScore || 0) ? c : best, 
    data.countries[0]
  );

  const stats = [
    {
      label: 'Total Builders',
      value: data.totalBuilders.toLocaleString(),
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      label: 'Countries',
      value: data.countries.length.toString(),
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Top Country',
      value: data.countries[0]?.country || 'N/A',
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      label: 'Highest Avg',
      value: topRankedCountry?.country || 'N/A',
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
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
            className={`relative overflow-hidden rounded-xl border p-4 transition-colors duration-500 ${
              theme === 'light' 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="relative">
              <div className="mb-2">{stat.icon}</div>
              <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>{stat.label}</p>
              <p className={`text-xl font-bold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Country Detail */}
      {selectedCountry && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl border p-5 transition-colors duration-500 ${
            theme === 'light' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-blue-500/20 border-blue-400/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{getCountryFlag(selectedCountry.countryCode)}</span>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedCountry.country}</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>Selected Country</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{selectedCountry.builderCount.toLocaleString()}</p>
              <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>Builders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{selectedCountry.rankScore.toLocaleString()}</p>
              <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>Avg Points</p>
            </div>
          </div>

          {/* Top Builders Preview */}
          {selectedCountry.topBuilders.length > 0 && (
            <div className="mb-4">
              <p className={`text-xs uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>Top Builders</p>
              <div className="space-y-2">
                {selectedCountry.topBuilders.slice(0, 3).map((builder, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg p-2 ${theme === 'light' ? 'bg-white/50' : 'bg-black/20'}`}>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 flex-shrink-0">
                      {builder.image_url ? (
                        <img src={builder.image_url} alt={builder.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-white font-bold">
                          {builder.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{builder.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-bold">{builder.score}</span>
                      <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>pts</span>
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
              className="w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 group"
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
          className={`rounded-xl border border-dashed p-6 text-center transition-colors duration-500 ${
            theme === 'light' 
              ? 'bg-gray-50 border-gray-300' 
              : 'bg-white/5 border-white/10'
          }`}
        >
          <svg className="w-12 h-12 mx-auto mb-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>
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
