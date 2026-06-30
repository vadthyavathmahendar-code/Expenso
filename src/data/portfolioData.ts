import civicConnectImg from '../assets/projects/civic-connect.jpg';
import expensoImg from '../assets/projects/expenso.jpg';
import youtubeCloneImg from '../assets/projects/youtube-clone.jpg';

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  image: string;
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
}

export interface Skill {
  name: string;
  category: 'Programming' | 'Web Development' | 'Databases' | 'Tools & Platforms';
  level: number; // 1-5
}

export const aboutData = {
  name: 'V Mahendar',
  nickname: 'Mahi',
  title: 'Software Engineer & Problem Solver',
  subtitle: 'Building scalable web applications and intelligent solutions',
  bio: "I'm a passionate Computer Science Engineering student who thrives on turning ideas into reality through code. With a strong foundation in JavaScript, Java, and C, I enjoy building full-stack applications that solve real-world problems. My flagship project, Civic Connect, is a community-focused platform that showcases my ability to architect and deliver impactful solutions from concept to deployment.",
  socials: {
    github: 'https://github.com/vadthyavathmahendar-code',
    linkedin: 'https://www.linkedin.com/in/vadthyavath-mahendar-2590073a0/',
    email: 'vadthyavathmahendar@gmail.com',
    twitter: 'https://twitter.com',
  }
};

export const projectsData: Project[] = [
  {
    id: 'civic-connect',
    title: 'Civic Connect',
    description: 'A community engagement platform empowering citizens to report local issues and connect with governance.',
    longDescription: 'A community engagement platform that empowers citizens to report local issues, participate in community decisions, and connect with local governance. Features real-time updates, interactive maps, and a robust discussion forum.',
    tags: ['React', 'Node.js', 'Express', 'Supabase'],
    image: civicConnectImg,
    githubUrl: 'https://github.com/vadthyavathmahendar-code/ccgovt',
    liveUrl: 'https://ccgovt-2026.vercel.app/',
    featured: true,
  },
  {
    id: 'youtube-clone',
    title: 'YouClone',
    description: 'A full-featured YouTube clone with video streaming, uploading, subscriptions, and Twilio SMS verification.',
    longDescription: 'A high-fidelity YouTube clone featuring responsive video streaming and uploading capabilities. Built with a React frontend and Node.js backend, it supports user authentication, channel subscriptions, likes/comments, and integrates Twilio for SMS-based user verification.',
    tags: ['React', 'Node.js', 'Express', 'MongoDB', 'Twilio'],
    image: youtubeCloneImg,
    githubUrl: 'https://github.com/vadthyavathmahendar-code/YouClone',
    liveUrl: 'https://you-clone-two.vercel.app',
    featured: true,
  },
  {
    id: 'expenso',
    title: 'Expenso',
    description: 'A privacy-focused personal finance manager to track expenses and visualize spending.',
    longDescription: 'A privacy-focused personal finance manager that enables users to track daily expenses, set budget limits, and visualize spending patterns. Features secure data synchronization, encrypted local storage, and automated monthly financial summaries.',
    tags: ['React Native', 'Firebase', 'Node.js', 'Context API'],
    image: expensoImg,
    githubUrl: 'https://github.com/vadthyavathmahendar-code/Expensoo',
    liveUrl: 'https://github.com/vadthyavathmahendar-code/Expensoo', // Fallback to GitHub since no live web URL
    featured: true,
  },
];

export const skillsData: Skill[] = [
  // Programming
  { name: 'Java', category: 'Programming', level: 5 },
  { name: 'JavaScript', category: 'Programming', level: 5 },
  { name: 'C', category: 'Programming', level: 4 },

  // Web Development
  { name: 'React', category: 'Web Development', level: 5 },
  { name: 'Node.js', category: 'Web Development', level: 4 },
  { name: 'Express', category: 'Web Development', level: 4 },
  { name: 'HTML5 & CSS3', category: 'Web Development', level: 5 },

  // Databases
  { name: 'MongoDB', category: 'Databases', level: 4 },
  { name: 'Supabase', category: 'Databases', level: 4 },
  { name: 'Firebase', category: 'Databases', level: 4 },

  // Tools & Platforms
  { name: 'Git', category: 'Tools & Platforms', level: 5 },
  { name: 'GitHub', category: 'Tools & Platforms', level: 5 },
  { name: 'VS Code', category: 'Tools & Platforms', level: 5 },
  { name: 'ServiceNow', category: 'Tools & Platforms', level: 4 },
];
