import React from 'react';
import { motion } from 'framer-motion';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <motion.div
      className={`${className} relative`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Only PNG */}
      <img
        src="/groveml_logo.png"
        alt="GroveML Logo"
        className="w-full h-full object-contain block relative z-0"
      />

      {/* Black is still there */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/30 to-black/0 rounded-lg blur-sm -z-10"></div>
    </motion.div>
  );
};
