import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MapPin, Send, Github, Linkedin, Twitter } from 'lucide-react';
import Magnetic from './Magnetic';
import { aboutData } from '../data/portfolioData';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formId = import.meta.env.VITE_FORMSPREE_FORM_ID || 'sample_id';

    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        // Hide success alert after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        const data = await response.json();
        if (data.errors) {
          setError(data.errors.map((err: any) => err.message).join(', '));
        } else {
          setError('Failed to send message. Please check your Formspree ID.');
        }
      }
    } catch (err) {
      setError('An error occurred while sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-32 px-6 bg-[#030303] relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* Left Column: Contact Info */}
          <div className="flex flex-col justify-between">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6"
              >
                LET'S BUILD <br />
                SOMETHING GREAT<span className="text-accent">.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
                className="text-gray-400 max-w-md font-light leading-relaxed mb-12"
              >
                Have an exciting project in mind? Or just want to say hello? Drop a message, and let's discuss how we can collaborate.
              </motion.p>

              <div className="space-y-6">
                <ContactInfoItem 
                  icon={<Mail className="w-5 h-5 text-accent" />} 
                  label="Email" 
                  value={aboutData.socials.email} 
                  href={`mailto:${aboutData.socials.email}`} 
                />
                <ContactInfoItem 
                  icon={<MapPin className="w-5 h-5 text-accent-purple" />} 
                  label="Location" 
                  value="India" 
                />
              </div>
            </div>

            {/* Social handles */}
            <div className="mt-16 lg:mt-0">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Follow Me</p>
              <div className="flex gap-4">
                <SocialIcon href={aboutData.socials.github} icon={<Github className="w-5 h-5" />} />
                <SocialIcon href={aboutData.socials.linkedin} icon={<Linkedin className="w-5 h-5" />} />
                <SocialIcon href={aboutData.socials.twitter} icon={<Twitter className="w-5 h-5" />} />
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', damping: 22, stiffness: 100 }}
            className="bg-zinc-950 border border-white/5 p-8 md:p-12 rounded-3xl relative"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {submitted && (
                  <motion.div
                    key="success-alert"
                    initial={{ opacity: 0, scale: 0.95, y: -15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 150 }}
                    className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-emerald-400 text-sm text-center font-medium shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  >
                    Thank you! Your message has been sent successfully. I'll get back to you shortly.
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    key="error-alert"
                    initial={{ opacity: 0, scale: 0.95, y: -15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 150 }}
                    className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 text-rose-400 text-sm text-center font-medium shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <GlowingInput 
                label="Your Name"
                type="text"
                value={formData.name}
                onChange={(val) => setFormData({ ...formData, name: val })}
                required
              />
              <GlowingInput 
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(val) => setFormData({ ...formData, email: val })}
                required
              />
              <GlowingInput 
                label="Your Message"
                type="textarea"
                value={formData.message}
                onChange={(val) => setFormData({ ...formData, message: val })}
                required
              />

              <div className="pt-4">
                <Magnetic range={50} strength={0.3}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-accent text-black hover:text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : submitted ? (
                      <span>Message Sent!</span>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </Magnetic>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function ContactInfoItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-4 group">
      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors duration-300">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">{label}</p>
        <p className="text-gray-200 font-medium group-hover:text-white transition-colors duration-300">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block">{content}</a>;
  }
  return content;
}

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Magnetic range={45} strength={0.35}>
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
      >
        {icon}
      </a>
    </Magnetic>
  );
}

function GlowingInput({ label, type, value, onChange, required }: { label: string; type: 'text' | 'email' | 'textarea'; value: string; onChange: (val: string) => void; required?: boolean }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-2 relative">
      <span className={`text-xs uppercase tracking-widest font-semibold transition-colors duration-300 ${isFocused ? 'text-accent' : 'text-gray-500'}`}>
        {label}
      </span>
      
      {/* Input container with active glowing border animation */}
      <div className="relative rounded-2xl p-[1px] transition-all duration-300">
        {/* Background glow gradient */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent via-indigo-400 to-accent-purple pointer-events-none z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            filter: 'blur(1px) drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))',
          }}
        />

        {/* Backdrop border */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none z-0" />

        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={required}
            rows={5}
            className="w-full relative z-10 bg-zinc-950 text-white placeholder-gray-600 rounded-2xl p-4 outline-none border-0 transition-all duration-300 resize-none font-light text-sm"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={required}
            className="w-full relative z-10 bg-zinc-950 text-white placeholder-gray-600 rounded-2xl px-4 py-3.5 outline-none border-0 transition-all duration-300 font-light text-sm"
          />
        )}
      </div>
    </div>
  );
}
