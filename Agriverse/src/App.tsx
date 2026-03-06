import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, BookOpen, Download, Newspaper, User, 
  LogOut, Home, Search, ChevronLeft, Video, FileText, 
  Settings, Edit, Sun, Moon, X, CheckCircle2, Lock, EyeOff, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrowserRouter as Router, 
  Routes, Route, Navigate, useNavigate, useLocation 
} from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface UserData {
  fullName: string;
  mobile: string;
  email: string;
  college: string;
  regNo?: string;
  rollNo?: string;
  password?: string;
  role: 'student' | 'admin';
  lastProfileUpdate?: number;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'note' | 'news';
  url: string;
  date: string;
  fileSize?: string;
}

// Constants
const COLLEGES = [
  "Junagadh Agricultural University (JAU)",
  "Anand Agricultural University (AAU)",
  "Navsari Agricultural University (NAU)",
  "Sardar Krushinagar Dantiwada (SDAU)",
  "Other University"
];

const SEMESTERS = ["5th Sem", "6th Sem", "7th Sem", "8th Sem"];

// Main App Component
export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [violationCount, setViolationCount] = useState(0);

  // Initialize
  useEffect(() => {
    const savedUser = localStorage.getItem('agriverse_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedContents = localStorage.getItem('agriverse_contents');
    if (savedContents) setContents(JSON.parse(savedContents));

    const savedTheme = localStorage.getItem('agriverse_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('agriverse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('agriverse_theme', 'light');
    }
  }, [isDarkMode]);

  // Security Monitoring
  const logSecurityEvent = async (type: string) => {
    if (!user) return;
    
    const newCount = violationCount + 1;
    setViolationCount(newCount);
    
    const logMsg = `[${new Date().toLocaleTimeString()}] ${type}`;
    setDebugLog(prev => [logMsg, ...prev].slice(0, 10));

    try {
      const baseUrl = process.env.APP_URL || window.location.origin;
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/security-log`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.mobile,
          userName: user.fullName,
          email: user.email,
          phone: user.mobile,
          violationType: type,
          violationCount: newCount,
          timestamp: new Date().toLocaleString()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Security log failed:", error);
    }
  };

  // Keyboard Security
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U') ||
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p')
      ) {
        e.preventDefault();
        logSecurityEvent(`KEY_VIOLATION: ${e.key}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('agriverse_user');
    setUser(null);
    setIsMenuOpen(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginScreen onLogin={setUser} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterScreen onLogin={setUser} /> : <Navigate to="/" />} />
        <Route path="/privacy" element={<PrivacyPolicyScreen />} />
        
        <Route path="/*" element={
          user ? (
            <Layout 
              user={user} 
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              onLogout={handleLogout}
            >
              <Routes>
                <Route path="/" element={<HomeScreen user={user} setIsMenuOpen={setIsMenuOpen} isDarkMode={isDarkMode} />} />
                <Route path="/notes" element={<NotesScreen />} />
                <Route path="/notes/:sem" element={<SemesterNotesScreen />} />
                <Route path="/pyq" element={<PYQScreen />} />
                <Route path="/pyq/:sem" element={<SemesterPYQScreen />} />
                <Route path="/imp" element={<ImpScreen />} />
                <Route path="/books" element={<BooksScreen />} />
                <Route path="/news" element={<NewsScreen />} />
                <Route path="/contact" element={<ContactScreen />} />
                <Route path="/terms" element={<TermsScreen />} />
                <Route path="/downloads" element={<DownloadsScreen contents={contents} />} />
                <Route path="/profile" element={<ProfileScreen user={user} onUpdate={setUser} />} />
                <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard user={user} contents={contents} setContents={setContents} logSecurityEvent={logSecurityEvent} debugLog={debugLog} /> : <Navigate to="/" />} />
                <Route path="/pdf-viewer" element={<PDFViewerScreen />} />
                <Route path="/subscription" element={<SubscriptionScreen />} />
              </Routes>
            </Layout>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
        }

function Button({ children, onClick, className, variant = 'primary', type = 'button', disabled = false }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string, 
  variant?: 'primary' | 'outline' | 'ghost' | 'danger',
  type?: 'button' | 'submit',
  disabled?: boolean
}) {
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none",
    outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
    ghost: "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

function Input({ label, type = 'text', placeholder, value, onChange, required = false }: { 
  label: string, 
  type?: string, 
  placeholder?: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  required?: boolean
}) {
  return (
    <div className="space-y-1 w-full">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">{label}</label>
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 focus:border-emerald-500 outline-none transition-all dark:text-white"
      />
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (u: UserData) => void }) {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile === '9664984334' && password === 'admin') {
      const admin: UserData = { fullName: 'Admin MK AHIR', mobile, email: 'admin@agriverse.com', college: 'System Admin', role: 'admin' };
      localStorage.setItem('agriverse_user', JSON.stringify(admin));
      onLogin(admin);
    } else {
      const user: UserData = { fullName: 'Student User', mobile, email: 'student@test.com', college: COLLEGES[0], role: 'student' };
      localStorage.setItem('agriverse_user', JSON.stringify(user));
      onLogin(user);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl mb-4">
            <ShieldCheck size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-emerald-800 dark:text-emerald-400 tracking-tighter">AgriVerse</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Secure Learning Platform</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 space-y-6">
          <Input label="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="Enter registered mobile" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          <Button type="submit" className="w-full py-4 text-lg">Login to Portal</Button>
        </form>

        <p className="text-center text-gray-500">
          New student? <button onClick={() => navigate('/register')} className="text-emerald-600 font-bold hover:underline">Create Account</button>
        </p>
      </div>
    </motion.div>
  );
}

function RegisterScreen({ onLogin }: { onLogin: (u: UserData) => void }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', mobile: '', email: '', college: COLLEGES[0], password: '', confirmPassword: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: UserData = { ...formData, role: 'student' };
    localStorage.setItem('agriverse_user', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-6 bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-md mx-auto space-y-8 py-12">
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-emerald-600 font-bold"><ChevronLeft size={20} /> BACK</button>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Student Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
          <Input label="Mobile" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">College</label>
            <select className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 focus:border-emerald-500 outline-none dark:text-white" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})}>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          <Button type="submit" className="w-full py-4">Register Now</Button>
        </form>
      </div>
    </motion.div>
  );
}

function Layout({ children, user, isDarkMode, setIsDarkMode, isMenuOpen, setIsMenuOpen, onLogout }: any) {
  const navigate = useNavigate();
  return (
    <div className={cn("flex flex-col min-h-screen relative overflow-hidden", isDarkMode ? "bg-zinc-950 text-gray-100" : "bg-gray-50 text-gray-900")}>
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className={cn("fixed inset-y-0 left-0 w-80 z-50 shadow-2xl flex flex-col", isDarkMode ? "bg-zinc-950 border-r border-zinc-900" : "bg-white border-r border-gray-100")}>
              <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><User className="text-emerald-600" /></div>
                  <h3 className="font-bold truncate w-40">{user.fullName}</h3>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><X size={24} /></button>
              </div>
              <div className="flex-1 py-4">
                <MenuLink icon={<Home size={20} />} label="Home" onClick={() => { navigate('/'); setIsMenuOpen(false); }} />
                <MenuLink icon={<BookOpen size={20} />} label="Notes" onClick={() => { navigate('/notes'); setIsMenuOpen(false); }} />
                <MenuLink icon={<Download size={20} />} label="Downloads" onClick={() => { navigate('/downloads'); setIsMenuOpen(false); }} />
                <MenuLink icon={<Phone size={20} />} label="Contact" onClick={() => { navigate('/contact'); setIsMenuOpen(false); }} />
              </div>
              <div className="p-6 border-t border-gray-100 dark:border-zinc-800 space-y-4">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="flex items-center gap-3">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />} Mode</span>
                </button>
                <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"><LogOut size={20} /> Logout</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

function MenuLink({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full px-6 py-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors">
      {icon} <span className="font-semibold">{label}</span>
    </button>
  );
}

function Header({ title, onMenuClick, showBack = false }: any) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 text-emerald-600"><ChevronLeft size={24} /></button>
        ) : (
          <button onClick={onMenuClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900">
            <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-400 mb-1.5" />
            <div className="w-4 h-0.5 bg-gray-600 dark:bg-gray-400 mb-1.5" />
            <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-400" />
          </button>
        )}
        <h1 className="font-bold text-lg text-emerald-800 dark:text-emerald-400 truncate max-w-[150px]">{title}</h1>
      </div>
      <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border-2 border-emerald-500"><User size={20} className="text-emerald-600" /></button>
    </header>
  );
}

function HomeScreen({ user, setIsMenuOpen }: any) {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col">
      <Header title="AgriVerse" onMenuClick={() => setIsMenuOpen(true)} />
      <div className="p-4 space-y-6 pb-20">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <h2 className="text-2xl font-bold">Hello, {user.fullName.split(' ')[0]}!</h2>
          <p className="text-emerald-100 text-sm opacity-90">Welcome to your learning portal.</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold"><ShieldCheck size={14} /> {user.college}</div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <HomeButton icon={<BookOpen className="text-emerald-600" />} title="Lecture Notes" subtitle="Access your study materials" onClick={() => navigate('/notes')} />
          <HomeButton icon={<FileText className="text-amber-600" />} title="PYQ Papers" subtitle="Previous year questions" onClick={() => navigate('/pyq')} />
          <HomeButton icon={<Download className="text-blue-600" />} title="Downloads" subtitle="Saved offline content" onClick={() => navigate('/downloads')} />
        </div>
      </div>
    </div>
  );
}

function HomeButton({ icon, title, subtitle, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-900 flex items-center gap-4 hover:border-emerald-500 transition-all active:scale-[0.98] shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">{icon}</div>
      <div className="text-left"><h3 className="font-bold text-gray-900 dark:text-white">{title}</h3><p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p></div>
    </button>
  );
}

// Placeholder Screens
function NotesScreen() { return <div className="flex-1 flex flex-col"><Header title="Notes" showBack /><div className="p-6 text-center text-gray-500">Select semester to view notes.</div></div>; }
function SemesterNotesScreen() { return <div className="flex-1 flex flex-col"><Header title="Sem Notes" showBack /><div className="p-6 text-center text-gray-500">List of notes for this semester.</div></div>; }
function PYQScreen() { return <div className="flex-1 flex flex-col"><Header title="PYQ" showBack /><div className="p-6 text-center text-gray-500">Previous year papers.</div></div>; }
function SemesterPYQScreen() { return <div className="flex-1 flex flex-col"><Header title="Sem PYQ" showBack /><div className="p-6 text-center text-gray-500">Available papers.</div></div>; }
function ImpScreen() { return <div className="flex-1 flex flex-col"><Header title="IMP" showBack /><div className="p-6 text-center text-gray-500">Important questions.</div></div>; }
function BooksScreen() { return <div className="flex-1 flex flex-col"><Header title="Books" showBack /><div className="p-6 text-center text-gray-500">Reference books.</div></div>; }
function NewsScreen() { return <div className="flex-1 flex flex-col"><Header title="News" showBack /><div className="p-6 text-center text-gray-500">Agri updates.</div></div>; }
function ContactScreen() { return <div className="flex-1 flex flex-col"><Header title="Contact" showBack /><div className="p-6 text-center text-gray-500">Support details.</div></div>; }
function TermsScreen() { return <div className="flex-1 flex flex-col"><Header title="Terms" showBack /><div className="p-6 text-center text-gray-500">Terms and conditions.</div></div>; }
function DownloadsScreen() { return <div className="flex-1 flex flex-col"><Header title="Downloads" showBack /><div className="p-6 text-center text-gray-500">No downloads yet.</div></div>; }
function ProfileScreen() { return <div className="flex-1 flex flex-col"><Header title="Profile" showBack /><div className="p-6 text-center text-gray-500">User profile details.</div></div>; }
function AdminDashboard() { return <div className="flex-1 flex flex-col"><Header title="Admin" showBack /><div className="p-6 text-center text-gray-500">Admin controls.</div></div>; }
function PDFViewerScreen() { return <div className="flex-1 flex flex-col bg-zinc-900 text-white p-6"><button onClick={() => window.history.back()} className="mb-4 text-emerald-400">Close</button><div className="flex-1 flex items-center justify-center">PDF Viewer Active</div></div>; }
function SubscriptionScreen() { return <div className="flex-1 flex flex-col"><Header title="Subscription" showBack /><div className="p-6 text-center text-gray-500">Premium plans.</div></div>; }
function PrivacyPolicyScreen() { return <div className="p-6 max-w-2xl mx-auto"><h1 className="text-2xl font-bold mb-4">Privacy Policy</h1><p className="text-gray-600">Your privacy is important to us.</p></div>; }
