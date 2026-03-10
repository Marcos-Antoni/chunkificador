import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { Network, Loader2, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

mermaid.initialize({ startOnLoad: true, theme: 'dark' });

export default function MermaidViewer() {
    const [inputIds, setInputIds] = useState("");
    const [mermaidCode, setMermaidCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGraph = async () => {
        if (!inputIds.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ideas/mermaid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_id: inputIds.trim() })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error loading graph');

            setMermaidCode(data.mermaid);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mermaidCode) {
            const element = document.getElementById('mermaid-output');
            if (element) {
                element.removeAttribute('data-processed');
                mermaid.contentLoaded();
            }
        }
    }, [mermaidCode]);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}
            >
                <div style={{
                    background: 'rgba(124, 58, 237, 0.2)',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Network color="var(--accent-color)" size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>Visualizador de Grafos</h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Generado vía Mermaid.js</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
                style={{ marginBottom: '2rem' }}
            >
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    ID del Lote (Batch ID):
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Ejemplo: 550e8400-e29b-41d4-a716-446655440000"
                        value={inputIds}
                        onChange={(e) => setInputIds(e.target.value)}
                        className="input-field"
                        style={{ flexGrow: 1, minWidth: '250px' }}
                        onKeyDown={(e) => e.key === 'Enter' && fetchGraph()}
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchGraph}
                        disabled={loading || !inputIds.trim()}
                        className="btn btn-primary"
                        style={{ minWidth: '160px' }}
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Dibujando...</> : <><Network size={18} /> Generar Grafo</>}
                    </motion.button>
                </div>
                <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Visualiza todo el sub-grafo de conocimiento de un lote específico ingresando su Batch ID.
                </p>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ color: 'var(--error-color)', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '1.5rem' }}
                    >
                        Error: {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {mermaidCode && (
                    <motion.div
                        key="graph"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ padding: '2rem' }}
                    >
                        <div
                            id="mermaid-output"
                            className="mermaid"
                            style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-color)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '300px', overflowX: 'auto' }}
                        >
                            {mermaidCode}
                        </div>

                        <details style={{ marginTop: '2rem' }}>
                            <summary style={{ cursor: 'pointer', color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', transition: 'background-color 0.2s' }}>
                                <Code size={18} /> Ver código Mermaid generado
                            </summary>
                            <pre style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                                {mermaidCode}
                            </pre>
                        </details>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin { 100% { transform: rotate(360deg); } }
                details[open] summary { background-color: var(--bg-tertiary); }
                summary:hover { background-color: var(--bg-tertiary); }
                /* Mermaid dark theme tweaks */
                .mermaid .node rect { fill: var(--bg-tertiary) !important; stroke: var(--border-color) !important; }
                .mermaid .node text { fill: var(--text-primary) !important; }
                .mermaid .edgeLabel { background-color: var(--bg-color) !important; color: var(--text-secondary) !important; }
                .mermaid .edgePath .path { stroke: var(--text-secondary) !important; }
            `}} />
        </div>
    );
}
