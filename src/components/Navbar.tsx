import Magnetic from './Magnetic';

export default function Navbar() {
  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Projects', href: '#projects' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Magnetic range={50} strength={0.25}>
          <a href="#home" className="text-xl font-bold tracking-widest text-white hover:text-accent transition-colors duration-300">
            MAHI<span className="text-accent">.</span>
          </a>
        </Magnetic>

        <div className="flex items-center space-x-8">
          {navLinks.map((link) => (
            <Magnetic key={link.label} range={40} strength={0.3}>
              <a
                href={link.href}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-300 relative py-2 px-1"
              >
                {link.label}
              </a>
            </Magnetic>
          ))}
        </div>
      </div>
    </nav>
  );
}
