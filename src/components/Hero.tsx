import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight, Github, Linkedin, Mail, Download } from 'lucide-react';
import Magnetic from './Magnetic';
import { aboutData } from '../data/portfolioData';

export default function Hero() {
  // Cursor tracking for the ambient spotlight glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 120 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Framer Motion Animation Variants for Text Reveal
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 18,
        stiffness: 90,
      },
    },
  };

  const socialVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
        delay: 0.8,
      },
    },
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030303] px-6 py-20"
    >
      {/* Cinematic Spotlight Background */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${glowX}px ${glowY}px,
              rgba(56, 189, 248, 0.12),
              rgba(192, 132, 252, 0.05) 40%,
              transparent 80%
            )
          `,
        }}
      />

      {/* Grid Overlay for Tech Vibe */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl w-full text-center flex flex-col items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-accent mb-6"
          >
            {aboutData.title}
          </motion.p>

          {/* Bold Cinematic Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-8xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]"
          >
            HI, I'M <span className="bg-gradient-to-r from-accent via-indigo-400 to-accent-purple bg-clip-text text-transparent">{aboutData.name.toUpperCase()}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-base md:text-xl max-w-2xl mb-12 leading-relaxed font-light"
          >
            {aboutData.bio}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-6 mb-16">
            <Magnetic range={60} strength={0.35}>
              <a
                href="#projects"
                className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all duration-300"
              >
                {/* Background sliding effect */}
                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                  Explore Work
                </span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </a>
            </Magnetic>

            <Magnetic range={60} strength={0.35}>
              <a
                href={`${import.meta.env.BASE_URL}resume.pdf`}
                download="V_Mahendar_Resume.pdf"
                className="px-8 py-4 border border-white/20 hover:border-accent hover:text-white text-gray-300 font-semibold rounded-full bg-transparent hover:bg-accent/10 transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0)] hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]"
              >
                <span>Download Resume</span>
                <Download className="w-4 h-4" />
              </a>
            </Magnetic>

            <Magnetic range={60} strength={0.35}>
              <a
                href="#contact"
                className="px-8 py-4 border border-white/20 hover:border-white text-white font-semibold rounded-full bg-transparent hover:bg-white/5 transition-all duration-300"
              >
                Let's Talk
              </a>
            </Magnetic>
          </motion.div>
        </motion.div>

        {/* Social Icons */}
        <motion.div
          variants={socialVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-6"
        >
          <Magnetic range={40} strength={0.25}>
            <a
              href={aboutData.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-300"
            >
              <Github className="w-5 h-5" />
            </a>
          </Magnetic>
          <Magnetic range={40} strength={0.25}>
            <a
              href={aboutData.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-300"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </Magnetic>
          <Magnetic range={40} strength={0.25}>
            <a
              href={`mailto:${aboutData.socials.email}`}
              className="text-gray-500 hover:text-white transition-colors duration-300"
            >
              <Mail className="w-5 h-5" />
            </a>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}
