import { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Github, ExternalLink } from 'lucide-react';
import { projectsData } from '../data/portfolioData';
import type { Project } from '../data/portfolioData';

export default function Projects() {
  return (
    <section id="projects" className="py-32 px-6 bg-[#030303] relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

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
            SELECTED PROJECTS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
            className="text-gray-400 max-w-lg mx-auto font-light"
          >
            A curated showcase of full-stack systems, interactive web applications, and developer tools.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsData.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse position relative to card, mapped to rotation
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map to degrees of rotation (-12 to 12 degrees)
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12]);

  // Butter-smooth spring physics
  const springConfig = { damping: 20, stiffness: 150, mass: 0.4 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate normalized mouse positions (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    // Snap back to center
    x.set(0);
    y.set(0);
  };

  // Overlay animations triggered by parent hover state
  const overlayVariants: Variants = {
    initial: { opacity: 0, backdropFilter: 'blur(0px)' },
    hover: { 
      opacity: 1, 
      backdropFilter: 'blur(12px)',
      transition: { duration: 0.3 } 
    }
  };

  const overlayContentVariants: Variants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    hover: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', damping: 15, stiffness: 120, delay: 0.05 } 
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: index * 0.1 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', damping: 18, stiffness: 140 }}
        className="relative h-[420px] rounded-3xl bg-zinc-950 border border-white/5 overflow-hidden group cursor-pointer"
      >
        {/* Project Image */}
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity duration-500"
        />

        {/* Dynamic Gradient Shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />

        {/* Card Footer (Visible by Default) */}
        <div className="absolute bottom-0 left-0 w-full p-6 z-20 group-hover:translate-y-4 group-hover:opacity-0 transition-all duration-300 ease-out">
          <div className="flex flex-wrap gap-2 mb-3">
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-1 rounded-md text-gray-300">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{project.title}</h3>
        </div>

        {/* Cinematic Hover Overlay */}
        <motion.div
          variants={overlayVariants}
          initial="initial"
          whileHover="hover"
          className="absolute inset-0 bg-black/75 flex flex-col justify-between p-8 z-30"
          style={{ transform: 'translateZ(30px)' }} // Lift overlay off the card for 3D depth
        >
          {/* Top part of overlay: Title and Description */}
          <motion.div variants={overlayContentVariants} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {project.tags.map(tag => (
                <span key={tag} className="text-[9px] uppercase tracking-widest bg-accent-glow border border-accent/20 px-2 py-1 rounded text-accent">
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-1">{project.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-light">{project.longDescription}</p>
          </motion.div>

          {/* Bottom part: Action Buttons */}
          <motion.div variants={overlayContentVariants} className="flex gap-4">
            <a 
              href={project.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-3 px-4 bg-white/10 border border-white/15 hover:bg-white text-white hover:text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
            >
              <Github className="w-4 h-4" />
              <span>View Code</span>
            </a>
            <a 
              href={project.liveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="py-3 px-4 bg-accent hover:bg-accent/80 text-black font-semibold rounded-xl flex items-center justify-center transition-colors duration-300"
            >
              <ExternalLink className="w-4.5 h-4.5" />
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
