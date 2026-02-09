import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = true }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -8, transition: { duration: 0.3 } } : {}}
      className={`glass-card rounded-2xl p-6 relative overflow-hidden group transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/20 ${className}`}
    >
      {hoverEffect && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent dark:from-white/0 dark:via-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      {children}
    </motion.div>
  );
};

export default Card;