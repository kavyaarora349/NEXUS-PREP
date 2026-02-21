
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ 
  isLoading, 
  message, 
  subMessage
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#030712]/60 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`max-w-md w-full glass-card p-10 rounded-[2.5rem] text-center space-y-6 border border-white/10 shadow-2xl transition-all duration-500`}
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-10 h-10 text-indigo-400" />
                </motion.div>
              </div>
            </div>
            
            {(message || subMessage) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                {message && (
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {message}
                  </h3>
                )}
                {subMessage && (
                  <p className="text-gray-400 text-sm leading-relaxed px-4">
                    {subMessage}
                  </p>
                )}
              </motion.div>
            )}

            <div className="flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.4, 1], 
                    opacity: [0.2, 1, 0.2],
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
