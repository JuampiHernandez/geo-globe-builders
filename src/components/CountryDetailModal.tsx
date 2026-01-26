'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountryStats, CountryDetailResponse, BuilderDetail } from '@/types';

interface CountryDetailModalProps {
  country: CountryStats | null;
  onClose: () => void;
  ecosystem?: string; // Add ecosystem prop
}

export default function CountryDetailModal({ country, onClose, ecosystem }: CountryDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CountryDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country) {
      setData(null);
      setError(null);
      return;
    }

    // Reset state when country changes
    setData(null);
    setError(null);
    setLoading(true);

    const controller = new AbortController();

    async function fetchCountryDetails() {
      try {
        const ecosystemParam = ecosystem && ecosystem !== 'all' ? `&ecosystem=${ecosystem}` : '';
        console.log(`Fetching top 1000 builders for ${country.country}${ecosystemParam ? ` (${ecosystem} ecosystem)` : ''}...`);
        
        const response = await fetch(`/api/builders?country=${country.countryCode}${ecosystemParam}`, {
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const result: CountryDetailResponse = await response.json();
        console.log(`Loaded ${result.builders?.length || 0} builders for ${country.country}`);
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCountryDetails();

    return () => {
      controller.abort();
    };
  }, [country]);

  if (!country) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 via-gray-900 to-transparent pb-4">
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{getCountryFlag(country.countryCode)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{country.country}</h2>
                  <p className="text-white/60">
                    {country.builderCount.toLocaleString()} verified builders
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 px-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-sm text-white/70">
                  <span className="text-cyan-400 font-bold">{country.builderCount.toLocaleString()}</span> total builders
                </span>
              </div>
              {data && data.builders && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-sm text-white/70">
                    Showing top <span className="text-indigo-400 font-bold">{data.builders.length}</span> by points
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {loading ? (
              <LoadingState countryName={country.country} />
            ) : error ? (
              <ErrorState error={error} onRetry={() => {
                setError(null);
                setLoading(true);
                const ecosystemParam = ecosystem && ecosystem !== 'all' ? `&ecosystem=${ecosystem}` : '';
                fetch(`/api/builders?country=${country.countryCode}${ecosystemParam}`)
                  .then(res => res.json())
                  .then(setData)
                  .catch(err => setError(err.message))
                  .finally(() => setLoading(false));
              }} />
            ) : data?.builders && data.builders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.builders.map((builder, index) => (
                  <BuilderCard key={builder.id || index} builder={builder} countryRank={index + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-white/60">No builders found for this country</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LoadingState({ countryName }: { countryName: string }) {
  return (
    <div className="space-y-6">
      {/* Loading header */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-16 h-16 mb-4">
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            👥
          </div>
        </div>
        <p className="text-white font-medium">Loading top builders</p>
        <p className="text-white/50 text-sm">Fetching data for {countryName}...</p>
      </div>
      
      {/* Skeleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="h-32 rounded-xl bg-white/5 overflow-hidden"
          >
            <div className="h-full w-full shimmer" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-white/60 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

function BuilderCard({ builder, countryRank }: { builder: BuilderDetail; countryRank: number }) {
  return (
    <motion.a
      href={`https://talent.app${builder.relative_path || `/${builder.id}`}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(countryRank * 0.02, 0.5) }}
      className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300"
    >
      {/* Country rank badge */}
      <div className={`
        absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold
        ${countryRank <= 3 
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black' 
          : 'bg-white/10 text-white/60'
        }
      `}>
        #{countryRank}
      </div>

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
            {builder.image_url ? (
              <img 
                src={builder.image_url} 
                alt={builder.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl text-white font-bold">
                {builder.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold truncate group-hover:text-indigo-300 transition-colors">
              {builder.name}
            </h3>
            {builder.human_checkmark && (
              <span className="text-emerald-400 text-sm" title="Verified Human">✓</span>
            )}
          </div>
          
          {builder.bio && (
            <p className="text-sm text-white/50 line-clamp-2 mb-2">{builder.bio}</p>
          )}

          <div className="flex items-center gap-3">
            {/* Points */}
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-xs">⭐</span>
              <span className="text-sm font-bold text-amber-400">{builder.score}</span>
              <span className="text-xs text-white/40">pts</span>
            </div>

            {/* Location */}
            {builder.location && (
              <div className="flex items-center gap-1 text-white/40">
                <span className="text-xs">📍</span>
                <span className="text-xs truncate max-w-[120px]">{builder.location}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {builder.tags && builder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {builder.tags.slice(0, 3).map((tag, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >
                  {tag}
                </span>
              ))}
              {builder.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/50">
                  +{builder.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </motion.a>
  );
}

function getCountryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
