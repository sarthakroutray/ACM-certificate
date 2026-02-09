import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Button from '../components/ui/Button';
import AnimatedSection from '../components/ui/AnimatedSection';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <Features />
      
      {/* Sticky Bottom CTA for Mobile or General CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center">
              {/* Background with glassmorphism and gradient */}
              <div className="absolute inset-0 bg-primary/90 backdrop-blur-md"></div>
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cta rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Prove Your Skills?</h2>
                <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto font-mono">
                  Browse upcoming workshops, register for events, and start building your certified portfolio today.
                </p>
                <Button href="/verify" variant="secondary" size="lg" className="shadow-2xl hover:shadow-white/20">
                  Get Certified Now
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;