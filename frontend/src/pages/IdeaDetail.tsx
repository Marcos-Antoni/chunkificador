import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Link as LinkIcon, ExternalLink, Tag } from 'lucide-react';
import type { IdeaData } from '../types';

export default function IdeaDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ideaData, setIdeaData] = useState<IdeaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/ideas/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Idea no encontrada o error del servidor');
                return res.json();
            })
            .then(data => {
                setIdeaData(data.idea);
                setLoading(false);
            })
            .catch((err: Error) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', width: '40px', height: '40px' }}
                />
            </div>
        );
    }

    if (error) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', borderColor: 'var(--error-color)' }}>
                <h3 style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>No se pudo cargar la idea</h3>
                <p>{error}</p>
                <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
                    <ArrowLeft size={16} /> Volver
                </button>
            </motion.div>
        );
    }

    if (!ideaData) return null;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}
        >
            {/* Header / Main Idea Card */}
            <motion.div variants={itemVariants} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Decorative background element */}
                <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', opacity: 0.5, pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} title="Volver">
                                <ArrowLeft size={16} />
                            </button>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '0.2rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                ID: {ideaData.id}
                            </span>
                            {ideaData.type && (
                                <Link
                                    to={`/search?type=${ideaData.type}`}
                                    className={`badge ${ideaData.type === 'Theoretical' ? 'badge-theoretical' : 'badge-practical'}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    {ideaData.type}
                                </Link>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Clock size={14} />
                            {new Date(ideaData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    <h2 style={{ fontSize: '1.75rem', lineHeight: '1.5', color: 'var(--text-primary)', marginBottom: '2rem', fontWeight: 600 }}>
                        {ideaData.content}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <Tag size={16} color="var(--text-secondary)" />
                        {ideaData.subjects.length > 0 ? (
                            ideaData.subjects.map(sub => (
                                <Link
                                    key={sub.id}
                                    to={`/search?subjects=${sub.id}`}
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-secondary)',
                                        padding: '4px 12px',
                                        borderRadius: '999px',
                                        fontSize: '0.85rem',
                                        border: '1px solid var(--border-color)',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                                >
                                    {sub.name}
                                </Link>
                            ))
                        ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin materias asignadas</span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Connections Grid */}
            <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Outgoing Connections */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--success-color)' }}>
                            <ExternalLink size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                            Conecta a <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '1rem' }}>({ideaData.outgoing_connections.length})</span>
                        </h3>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        {ideaData.outgoing_connections.length > 0 ? (
                            ideaData.outgoing_connections.map((conn, idx) => (
                                <motion.li
                                    key={conn.connection_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.05) }}
                                >
                                    <Link
                                        to={`/idea/${conn.to_idea_id}`}
                                        style={{ display: 'block', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textDecoration: 'none', transition: 'all 0.2s', color: 'var(--text-primary)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--success-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {conn.connection_type}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                                                Peso: {conn.weight}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                            {conn.to_content.length > 120 ? `${conn.to_content.substring(0, 120)}...` : conn.to_content}
                                        </p>
                                    </Link>
                                </motion.li>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
                                Esta idea no conecta hacia ninguna otra.
                            </div>
                        )}
                    </ul>
                </div>

                {/* Incoming Connections */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: '#60a5fa' }}>
                            <LinkIcon size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                            Referenciada por <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '1rem' }}>({ideaData.incoming_connections.length})</span>
                        </h3>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        {ideaData.incoming_connections.length > 0 ? (
                            ideaData.incoming_connections.map((conn, idx) => (
                                <motion.li
                                    key={conn.connection_id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.05) }}
                                >
                                    <Link
                                        to={`/idea/${conn.from_idea_id}`}
                                        style={{ display: 'block', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textDecoration: 'none', transition: 'all 0.2s', color: 'var(--text-primary)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {conn.connection_type}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                                                Peso: {conn.weight}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                            {conn.from_content.length > 120 ? `${conn.from_content.substring(0, 120)}...` : conn.from_content}
                                        </p>
                                    </Link>
                                </motion.li>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
                                Ninguna otra idea hace referencia a esta.
                            </div>
                        )}
                    </ul>
                </div>

            </motion.div>
        </motion.div>
    );
}
