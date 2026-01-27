'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { CountryStats, COUNTRY_COORDINATES } from '@/types';

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), { 
  ssr: false 
});

interface GlobeProps {
  countries: CountryStats[];
  maxBuilderCount: number;
  maxRankScore: number;
  onCountryClick: (country: CountryStats | null) => void;
  onCountryDoubleClick?: (country: CountryStats) => void;
  colorMode: 'builders' | 'rank';
}

export default function Globe({ 
  countries, 
  maxBuilderCount, 
  maxRankScore, 
  onCountryClick,
  onCountryDoubleClick,
  colorMode 
}: GlobeProps) {
  const globeEl = useRef<any>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const lastClickRef = useRef<{ time: number; country: string | null }>({ time: 0, country: null });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showHint, setShowHint] = useState(true);

  // Memoize points data to prevent unnecessary recalculations
  const pointsData = useMemo(() => {
    return countries.map(country => {
      const coords = COUNTRY_COORDINATES[country.countryCode];
      if (!coords) return null;

      const intensity = colorMode === 'builders' 
        ? country.builderCount / maxBuilderCount
        : country.rankScore / maxRankScore;

      return {
        lat: coords.lat,
        lng: coords.lng,
        size: 0.3 + (intensity * 1.2),
        color: getColorForIntensity(intensity, colorMode),
        country: country,
        label: country.country,
        altitude: 0.01 + (intensity * 0.15)
      };
    }).filter((point): point is NonNullable<typeof point> => point !== null);
  }, [countries, maxBuilderCount, maxRankScore, colorMode]);

  // Memoize arcs data
  const arcsData = useMemo(() => {
    const topCountries = countries.slice(0, 10);
    return topCountries.slice(0, 5).flatMap((source, i) => 
      topCountries.slice(i + 1, i + 3).map(target => {
        const sourceCoords = COUNTRY_COORDINATES[source.countryCode];
        const targetCoords = COUNTRY_COORDINATES[target.countryCode];
        if (!sourceCoords || !targetCoords) return null;
        
        return {
          startLat: sourceCoords.lat,
          startLng: sourceCoords.lng,
          endLat: targetCoords.lat,
          endLng: targetCoords.lng,
          color: ['rgba(99, 102, 241, 0.6)', 'rgba(34, 211, 238, 0.6)']
        };
      })
    ).filter((arc): arc is NonNullable<typeof arc> => arc !== null);
  }, [countries]);

  // Memoize rings data
  const ringsData = useMemo(() => {
    return countries.slice(0, 5).map(country => {
      const coords = COUNTRY_COORDINATES[country.countryCode];
      if (!coords) return null;
      
      return {
        lat: coords.lat,
        lng: coords.lng,
        maxR: 3,
        propagationSpeed: 1,
        repeatPeriod: 2000,
        color: 'rgba(99, 102, 241, 0.5)'
      };
    }).filter((ring): ring is NonNullable<typeof ring> => ring !== null);
  }, [countries]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide hint after 10 seconds
  useEffect(() => {
    if (globeReady) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [globeReady]);

  useEffect(() => {
    if (globeEl.current && globeReady) {
      try {
        const controls = globeEl.current.controls();
        const isMobile = window.innerWidth < 1024;
        
        if (isMobile) {
          // Mobile: Fixed position, rotation only - MUCH smaller globe
          controls.autoRotate = false;
          controls.enableZoom = false;
          controls.enablePan = false;
          controls.enableRotate = true;
          controls.rotateSpeed = 0.8;
          
          // Much higher altitude = much smaller globe that fits on screen
          globeEl.current.pointOfView({ 
            lat: 20, 
            lng: 0, 
            altitude: 4.5 
          }, 0);
          
          // Lock the distance completely - no zoom
          controls.minDistance = 450;
          controls.maxDistance = 450;
          controls.minPolarAngle = 0;
          controls.maxPolarAngle = Math.PI;
        } else {
          // Desktop: Full controls with auto-rotation
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.5;
          controls.enableZoom = true;
          controls.enablePan = true;
          controls.enableRotate = true;
          
          globeEl.current.pointOfView({ 
            lat: 20, 
            lng: 0, 
            altitude: 2.5 
          });
        }
      } catch (e) {
        console.warn('Globe controls not ready yet:', e);
      }
    }
  }, [globeReady]);

  const handlePointClick = useCallback((point: unknown) => {
    // Safety check - don't process clicks if globe isn't ready
    if (!globeReady) return;
    
    try {
      const p = point as { country?: CountryStats } | null;
      if (!p?.country) return;
      
      const now = Date.now();
      const lastClick = lastClickRef.current;
      
      // Check for double-click/double-tap (within 500ms on same country for better mobile UX)
      if (
        lastClick.country === p.country.countryCode && 
        now - lastClick.time < 500 &&
        onCountryDoubleClick
      ) {
        onCountryDoubleClick(p.country);
        lastClickRef.current = { time: 0, country: null };
      } else {
        onCountryClick(p.country);
        lastClickRef.current = { time: now, country: p.country.countryCode };
      }
    } catch (e) {
      console.warn('Error handling point click:', e);
    }
  }, [globeReady, onCountryClick, onCountryDoubleClick]);

  const handlePointHover = useCallback((point: unknown) => {
    try {
      const p = point as { label?: string } | null;
      setHoveredCountry(p?.label || null);
    } catch {
      setHoveredCountry(null);
    }
  }, []);

  // Callback ref to capture the globe instance
  const setGlobeRef = useCallback((node: any) => {
    globeEl.current = node;
  }, []);

  const handleGlobeReady = useCallback(() => {
    // Small delay to ensure everything is initialized
    setTimeout(() => setGlobeReady(true), 100);
  }, []);

  return (
    <div className="relative w-full h-full" style={{ touchAction: 'none' }}>
      {/* Glow effect behind globe */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[600px] lg:h-[600px] rounded-full bg-gradient-radial from-indigo-500/20 via-cyan-500/10 to-transparent blur-3xl" />
      </div>
      
      <div className="w-full h-full lg:w-full lg:h-full">
        <GlobeGL
          ref={globeEl as any}
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
          
          width={dimensions.width}
          height={dimensions.height}
        
        // Points (countries with builders)
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="altitude"
        pointRadius="size"
        pointColor="color"
        pointLabel={(d: unknown) => {
          const point = d as { country?: CountryStats };
          if (!point?.country) return '';
          return `
            <div class="globe-tooltip">
              <strong>${point.country.country}</strong><br/>
              <span>🏗️ ${point.country.builderCount.toLocaleString()} builders</span><br/>
              <span>🏆 ${point.country.rankedBuilders} in global top 100</span><br/>
              <span>⭐ Rank Score: ${point.country.rankScore}</span>
            </div>
          `;
        }}
        onPointClick={handlePointClick}
        onPointHover={handlePointHover}
        
        // Arcs connecting top countries
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        
        // Rings for emphasis
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        
        // Atmosphere
        atmosphereColor="#6366f1"
        atmosphereAltitude={0.25}
        
        // Settings
        animateIn={true}
        onGlobeReady={handleGlobeReady}
        />
      </div>

      {/* Hover indicator - Hidden on mobile for better UX */}
      {hoveredCountry && (
        <div className="hidden sm:block absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-indigo-500/30">
          <span className="text-white font-medium">{hoveredCountry}</span>
        </div>
      )}
      
      {/* Mobile touch hint - fades out after 10 seconds */}
      <AnimatePresence>
        {globeReady && showHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10"
          >
            <span className="text-white/70 text-xs">🔄 Drag to rotate • Tap to select</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading overlay while globe initializes */}
      {!globeReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm sm:text-base text-white/70">Initializing globe...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getColorForIntensity(intensity: number, mode: 'builders' | 'rank'): string {
  const i = Math.max(0, Math.min(1, intensity));
  
  if (mode === 'builders') {
    const r = Math.round(99 + (34 - 99) * i);
    const g = Math.round(102 + (211 - 102) * i);
    const b = Math.round(241 + (238 - 241) * i);
    return `rgba(${r}, ${g}, ${b}, ${0.7 + i * 0.3})`;
  } else {
    const r = Math.round(245 - (245 - 16) * i);
    const g = Math.round(158 + (185 - 158) * i);
    const b = Math.round(11 + (129 - 11) * i);
    return `rgba(${r}, ${g}, ${b}, ${0.7 + i * 0.3})`;
  }
}
