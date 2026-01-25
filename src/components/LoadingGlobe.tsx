'use client';

import { motion } from 'framer-motion';

export default function LoadingGlobe() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Animated globe placeholder */}
      <div className="relative w-48 h-48">
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
          className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-500/40"
        />
        
        {/* Inner ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-8 rounded-full border-2 border-dashed border-purple-500/50"
        />
        
        {/* Center globe */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/50"
        />
        
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 3 + i, 
              repeat: Infinity, 
              ease: 'linear',
              delay: i * 0.5
            }}
            className="absolute inset-0"
          >
            <div 
              className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
              style={{ 
                top: '50%', 
                left: '0%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Loading text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-bold text-white mb-2">Loading Builder Data</h2>
        <p className="text-white/50 text-sm">Fetching builders from around the world...</p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
              className="w-2 h-2 rounded-full bg-indigo-500"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
