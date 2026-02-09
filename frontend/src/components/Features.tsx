import React from 'react';
import Card from './ui/Card';
import AnimatedSection from './ui/AnimatedSection';
import { Database, Shield, TrendingUp, Users, Award, Lock } from 'lucide-react';

const features = [
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: "Verifiable Credibility",
    description: "Each certificate is uniquely ID-tagged. Recruiters can instantly verify your achievements on our platform."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-cta" />,
    title: "Skill Progression",
    description: "Workshops are categorized by difficulty. Track your growth from novice to expert in key technologies."
  },
  {
    icon: <Users className="w-6 h-6 text-accent" />,
    title: "Community Access",
    description: "Earning a certificate grants you access to exclusive advanced sessions and mentorship opportunities."
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Why Get Certified?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              More than just a piece of paper. Our certification program is designed to build real-world competence and professional credibility.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <Card className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-sm leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;