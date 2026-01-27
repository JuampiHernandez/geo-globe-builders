'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountryStats, CountryDetailResponse, BuilderDetail } from '@/types';

interface CountryDetailModalProps {
  country: CountryStats | null;
  onClose: () => void;
  ecosystem?: string; // Add ecosystem prop
  theme?: 'dark' | 'light';
}

export default function CountryDetailModal({ country, onClose, ecosystem, theme = 'dark' }: CountryDetailModalProps) {
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
      if (!country) return; // Guard clause for TypeScript
      
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
  }, [country, ecosystem]);

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
          className={`relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-500 ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-black border-white/10'
          }`}
        >
          {/* Header */}
          <div className={`sticky top-0 z-10 pb-4 ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{getCountryFlag(country.countryCode)}</span>
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{country.country}</h2>
                  <p className={theme === 'light' ? 'text-gray-600' : 'text-white/60'}>
                    {country.builderCount.toLocaleString()} verified builders
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg border transition-colors ${
                  theme === 'light' 
                    ? 'bg-gray-100 hover:bg-gray-200 border-gray-300' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <svg className={`w-6 h-6 ${theme === 'light' ? 'text-gray-700' : 'text-white/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 px-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-white/70'}`}>
                  <span className="text-blue-500 font-bold">{country.builderCount.toLocaleString()}</span> total builders
                </span>
              </div>
              {data && data.builders && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-white/70'}`}>
                    Showing top <span className="text-blue-400 font-bold">{data.builders.length}</span> by points
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {loading ? (
              <LoadingState countryName={country.country} theme={theme} />
            ) : error ? (
              <ErrorState error={error} theme={theme} onRetry={() => {
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
                  <BuilderCard key={builder.id || index} builder={builder} countryRank={index + 1} theme={theme} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className={theme === 'light' ? 'text-gray-600' : 'text-white/60'}>No builders found for this country</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LoadingState({ countryName, theme = 'dark' }: { countryName: string; theme?: 'dark' | 'light' | 'glass' }) {
  return (
    <div className="space-y-6">
      {/* Loading header */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-16 h-16 mb-4">
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Loading top builders</p>
        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>Fetching data for {countryName}...</p>
      </div>
      
      {/* Skeleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`h-32 rounded-xl overflow-hidden ${
              theme === 'light' ? 'bg-gray-100' : 'bg-white/5'
            }`}
          >
            <div className="h-full w-full shimmer" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry, theme = 'dark' }: { error: string; onRetry: () => void; theme?: 'dark' | 'light' | 'glass' }) {
  return (
    <div className="text-center py-12">
      <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className={`mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

function BuilderCard({ builder, countryRank, theme = 'dark' }: { builder: BuilderDetail; countryRank: number; theme?: 'dark' | 'light' | 'glass' }) {
  return (
    <motion.a
      href={`https://talent.app${builder.relative_path || `/${builder.id}`}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(countryRank * 0.02, 0.5) }}
      className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
        theme === 'light' 
          ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-blue-500/50' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30'
      }`}
    >
      {/* Country rank badge */}
      <div className={`
        absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold
        ${countryRank <= 3 
          ? 'bg-blue-500 text-white' 
          : theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-white/10 text-white/60'
        }
      `}>
        #{countryRank}
      </div>

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-blue-500">
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
            <h3 className={`font-semibold truncate transition-colors ${
              theme === 'light' 
                ? 'text-gray-900 group-hover:text-blue-600' 
                : 'text-white group-hover:text-blue-300'
            }`}>
              {builder.name}
            </h3>
            {builder.human_checkmark && (
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          
          {builder.bio && (
            <p className={`text-sm line-clamp-2 mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>{builder.bio}</p>
          )}

          <div className="flex items-center gap-3">
            {/* Points */}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold text-blue-500">{builder.score}</span>
              <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>pts</span>
            </div>

            {/* Location */}
            {builder.location && (
              <div className={`flex items-center gap-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
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
                  className={`px-2 py-0.5 text-xs rounded-full border ${
                    theme === 'light' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {tag}
                </span>
              ))}
              {builder.tags.length > 3 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/50'
                }`}>
                  +{builder.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
