import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, Sparkles, Zap, Network, Bot, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import './global.css'; // Global Styles

import Atomizer from './Atomizer';
import IdeaDetail from './pages/IdeaDetail';
import AdvancedSearch from './pages/AdvancedSearch';
import AiReEvaluation from './pages/AiReEvaluation';
import MermaidViewer from './pages/MermaidViewer';

function Home() {
    const [status, setStatus] = useState('Conectando con el cerebro...');
    const [isOnline, setIsOnline] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/')
            .then(res => res.json())
            .then(data => {
                setStatus(`Backend Online: ${data.message}`);
                setIsOnline(true);
            })
            .catch(() => {
                setStatus('Desconectado. Asegúrate de que Docker esté corriendo.');
                setIsOnline(false);
            });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem' }}
        >
            <div className="feature-icon-wrapper">
                <Brain size={140} color="var(--accent-color)" strokeWidth={1.5} />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    style={{ position: 'absolute', top: -15, right: -15 }}
                >
                    <Sparkles size={45} color="var(--warning-color)" />
                </motion.div>
            </div>

            <h1 style={{ textAlign: 'center', background: 'linear-gradient(90deg, #e2e8f0 0%, #a882ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sistema Cerebro v2.0
            </h1>

            <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                {status}
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ marginTop: '2rem' }}>
                <button
                    onClick={() => navigate('/atomizer')}
                    className="btn btn-primary"
                    style={{ fontSize: '1.2rem', padding: '1rem 2.5rem', borderRadius: 'var(--radius-lg)' }}
                >
                    <Zap size={20} /> Ingresar al Sistema
                </button>
            </motion.div>
        </motion.div>
    );
}

interface NavLinkCustomProps {
    to: string;
    icon: ReactNode;
    text: string;
}

function NavLinkCustom({ to, icon, text }: NavLinkCustomProps) {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    return (
        <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon} <span className="hide-mobile">{text}</span>
        </Link>
    );
}

interface LayoutProps {
    children: ReactNode;
}

function Layout({ children }: LayoutProps) {
    return (
        <div className="app-container">
            <nav className="navbar">
                <Link to="/" className="logo-container">
                    <Brain size={28} color="var(--accent-color)" />
                    <span>Cerebro</span>
                </Link>
                <div className="nav-links">
                    <NavLinkCustom to="/atomizer" icon={<Zap size={18} />} text="Atomizador" />
                    <NavLinkCustom to="/search" icon={<Search size={18} />} text="Búsqueda" />
                    <NavLinkCustom to="/graph" icon={<Network size={18} />} text="Grafo" />
                    <NavLinkCustom to="/ai-eval" icon={<Bot size={18} />} text="IA Eval" />
                </div>
            </nav>
            <main className="main-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={window.location.pathname}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter basename="/brain">
            <Routes>
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/atomizer" element={<Layout><Atomizer /></Layout>} />
                <Route path="/idea/:id" element={<Layout><IdeaDetail /></Layout>} />
                <Route path="/search" element={<Layout><AdvancedSearch /></Layout>} />
                <Route path="/graph" element={<Layout><MermaidViewer /></Layout>} />
                <Route path="/ai-eval" element={<Layout><AiReEvaluation /></Layout>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
