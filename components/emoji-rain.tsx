"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiRainProps {
  isActive: boolean;
  type: 'winner' | 'loser';
  duration?: number; // Duration in seconds
}

export function EmojiRain({ isActive, type, duration = 5 }: EmojiRainProps) {
  const [emojis, setEmojis] = useState<{ id: number; x: number; delay: number; scale: number; rotation: number }[]>([]);
  
  // Generate 30 emojis with distributed positions
  useEffect(() => {
    if (isActive) {
      // Create more evenly distributed emojis across the width
      const newEmojis = Array.from({ length: 30 }, (_, i) => {
        // Divide the width into sections to ensure even distribution
        // Each emoji gets assigned to a section (0-29) and then gets a random position within that section
        const sectionWidth = 100 / 30; // Width of each section as percentage
        const sectionStart = i * sectionWidth; // Start of this emoji's section
        const x = sectionStart + (Math.random() * sectionWidth); // Random position within the section
        
        return {
          id: i,
          x: x, // More evenly distributed horizontal position
          delay: Math.random() * 1.5, // Increased random delay range for more natural effect (0-1.5s)
          scale: 0.7 + Math.random() * 0.9, // Random size (0.7-1.6) - slightly larger
          rotation: Math.random() * 360, // Random initial rotation
        };
      });
      
      setEmojis(newEmojis);
      
      // Clean up emojis after animation completes
      const timer = setTimeout(() => {
        setEmojis([]);
      }, duration * 1000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, duration]);

  if (!isActive) return null;
  
  // Choose emoji based on type
  const emoji = type === 'winner' ? '😂' : '💀';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
      <AnimatePresence>
        {emojis.map((item) => (
          <motion.div
            key={item.id}
            className="absolute text-3xl sm:text-4xl emoji-animation"
            initial={{ 
              y: -100, // Start higher above the container
              x: `${item.x}%`,
              opacity: 0,
              scale: item.scale,
              rotate: item.rotation
            }}
            animate={{ 
              y: '120vh',
              opacity: [0, 1, 1, 0.8, 0], 
              rotate: item.rotation + 360 * 2,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration,
              delay: item.delay,
              ease: "easeInOut"
            }}
            style={{
              zIndex: 50,
              willChange: 'transform, opacity',
              position: 'absolute',
              left: `${item.x}%`,
              top: 0,
              transform: `translateX(-50%)` // Center the emoji on its x position
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 