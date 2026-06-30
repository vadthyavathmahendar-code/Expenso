import { motion } from 'framer-motion';
import { skillsData } from '../data/portfolioData';
import type { Skill } from '../data/portfolioData';
import { Code, Terminal, Database, Layers } from 'lucide-react';

const categoryIcons = {
  Programming: <Terminal className="w-5 h-5 text-accent" />,
  'Web Development': <Code className="w-5 h-5 text-emerald-400" />,
  Databases: <Database className="w-5 h-5 text-accent-purple" />,
  'Tools & Platforms': <Layers className="w-5 h-5 text-amber-400" />,
};

export default function Skills() {
  // Group skills by category
  const categories = ['Programming', 'Web Development', 'Databases', 'Tools & Platforms'] as const;

  return (
    <section id="skills" className="py-32 px-6 bg-[#030303] relative">
      {/* Glow background */}
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-purple/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-20 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4"
          >
            TECHNICAL SKILLS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
            className="text-gray-400 max-w-lg mx-auto font-light"
          >
            A detailed map of my core engineering competencies, frameworks, and developer toolkits.
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, catIndex) => {
            const filteredSkills = skillsData.filter(s => s.category === category);
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ type: 'spring', damping: 22, stiffness: 120, delay: catIndex * 0.1 }}
                className="bg-zinc-950 border border-white/5 p-8 rounded-3xl relative overflow-hidden"
              >
                {/* Decorative subtle border glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-30 pointer-events-none" />

                {/* Category Title */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    {categoryIcons[category]}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{category}</h3>
                </div>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-3">
                  {filteredSkills.map((skill, skillIndex) => (
                    <SkillBadge key={skill.name} skill={skill} index={skillIndex} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SkillBadge({ skill, index }: { skill: Skill; index: number }) {
  // Generate random floating offset values for organic desynchronized motion
  const floatDuration = 3.5 + (index % 3) * 0.8;
  const floatDelay = (index % 4) * 0.4;

  return (
    <motion.div
      animate={{
        y: [0, -6, 0],
      }}
      transition={{
        duration: floatDuration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: floatDelay,
      }}
      whileHover={{ 
        scale: 1.15, 
        y: -4,
        boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.2)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 15
        }
      }}
      className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-2xl text-sm font-medium text-gray-300 hover:text-white cursor-default select-none flex items-center gap-2 transition-colors duration-200"
    >
      <span>{skill.name}</span>
      <div className="flex gap-0.5 ml-1.5 opacity-40 group-hover:opacity-100">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`w-1 h-1 rounded-full ${i < skill.level ? 'bg-accent' : 'bg-white/20'}`} 
          />
        ))}
      </div>
    </motion.div>
  );
}
