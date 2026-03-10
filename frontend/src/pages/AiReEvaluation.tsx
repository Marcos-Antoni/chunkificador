import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { Sparkles, Save, XCircle, CheckCircle2, AlertCircle, Bot, Network, Loader2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConnectionProposal } from '../types';

// Initialize mermaid
mermaid.initialize({ startOnLoad: false, theme: 'dark' });

export default function AiReEvaluation() {
    const [batchIdsInput, setBatchIdsInput] = useState("");
    const [originalMermaid, setOriginalMermaid] = useState("");
    const [proposals, setProposals] = useState<ConnectionProposal[]>([]);

    const [loadingGraph, setLoadingGraph] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Dynamic combinations
    const [previewMermaid, setPreviewMermaid] = useState("");

    // Re-render mermaid when previewMermaid changes
    useEffect(() => {
        if (previewMermaid) {
            const renderGraph = async () => {
                const element = document.getElementById('mermaid-preview');
                if (element) {
                    element.removeAttribute('data-processed');
                    element.innerHTML = previewMermaid;
                    try {
                        await mermaid.run({ nodes: [element] });
                    } catch (err) {
                        console.error("Mermaid parsing error:", err);
                    }
                }
            };
            renderGraph();
        }
    }, [previewMermaid]);

    // Construct preview graph
    useEffect(() => {
        if (!originalMermaid) {
            setPreviewMermaid("");
            return;
        }

        let combined = originalMermaid;
        if (proposals.length > 0) {
            let newEdges = "\n    %% Proposed Connections\n";
            proposals.forEach((p) => {
                newEdges += `    node${p.from_idea_id}-. "${p.connection_type}" .->node${p.to_idea_id};\n`;
            });
            combined += newEdges;
        }

        setPreviewMermaid(combined);
    }, [originalMermaid, proposals]);

    const handleFetchGraph = async () => {
        if (!batchIdsInput.trim()) return;
        setLoadingGraph(true);
        setError(null);
        setSuccessMsg(null);
        setOriginalMermaid("");
        setProposals([]);

        try {
            const res = await fetch('/api/ideas/mermaid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_id: batchIdsInput.trim() })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error loading graph');

            setOriginalMermaid(data.mermaid);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoadingGraph(false);
        }
    };

    const handleReEvaluate = async () => {
        if (!batchIdsInput.trim()) return;
        setLoadingAi(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch('/api/ai/re-evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_ids: batchIdsInput.trim() })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error al re-evaluar');

            setProposals(data.proposals);
            if (data.proposals.length === 0) {
                setSuccessMsg("La IA analizó los lotes pero no encontró nuevas conexiones relevantes.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoadingAi(false);
        }
    };

    const handleApply = async () => {
        if (proposals.length === 0) return;
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/connections/apply-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposals })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error al guardar');

            setSuccessMsg(`Se guardaron exitosamente ${data.connections_added} conexiones.`);
            setProposals([]);

            // Refresh graph to show the new permanent connections
            handleFetchGraph();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setSaving(false);
        }
    };

    const removeProposal = (index: number) => {
        setProposals(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}
            >
                <div style={{
                    background: 'rgba(255, 215, 0, 0.15)',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Bot color="var(--warning-color)" size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>Reevaluación por Inteligencia Artificial</h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Analiza lotes de ideas y descubre nuevas conexiones ocultas</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
                style={{ marginBottom: '2rem' }}
            >
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Batch IDs (separados por comas):
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Ej: lote1-abc, lote2-def"
                        value={batchIdsInput}
                        onChange={(e) => setBatchIdsInput(e.target.value)}
                        className="input-field"
                        style={{ flexGrow: 1, minWidth: '250px' }}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchGraph()}
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleFetchGraph}
                        disabled={loadingGraph || loadingAi || saving || !batchIdsInput.trim()}
                        className="btn btn-primary"
                        style={{ minWidth: '160px' }}
                    >
                        {loadingGraph ? <><Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Cargando...</> : <><Network size={18} /> Ver Grafo Actual</>}
                    </motion.button>
                </div>

                {originalMermaid && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(255,215,0,0.3)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReEvaluate}
                            disabled={loadingAi || saving}
                            className="btn"
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#fff',
                                minWidth: '250px',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                fontSize: '1.1rem'
                            }}
                        >
                            {loadingAi ? (
                                <><Bot size={20} className="animate-bounce" style={{ animationDuration: '1s' }} /> Analizando relaciones...</>
                            ) : (
                                <><Sparkles size={20} /> Pedir propuestas a la IA</>
                            )}
                        </motion.button>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes customBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                    .animate-bounce { animation: customBounce 1s infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                    
                    /* Mermaid dark theme tweaks */
                    .mermaid .node rect { fill: var(--bg-tertiary) !important; stroke: var(--border-color) !important; }
                    .mermaid .node text { fill: var(--text-primary) !important; }
                    .mermaid .edgeLabel { background-color: var(--bg-color) !important; color: var(--text-secondary) !important; font-size: 11px !important; }
                    .mermaid .edgePath .path { stroke: var(--text-secondary) !important; }
                    .mermaid .edgePath[stroke-dasharray] .path { stroke: var(--warning-color) !important; stroke-width: 2px !important; }
                `}} />
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error-color)', background: 'rgba(239, 68, 68, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <AlertCircle size={24} />
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>Operación Fallida</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <CheckCircle2 size={24} />
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>¡Éxito!</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{successMsg}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Graph */}
            <AnimatePresence mode="wait">
                {previewMermaid && (
                    <motion.div
                        key="preview-graph"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ padding: '1.5rem', marginBottom: '2rem' }}
                    >
                        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                            <Network size={20} />
                            {proposals.length > 0 ? 'Previsualización del Grafo con Propuestas' : 'Grafo Actual'}
                        </h3>
                        {proposals.length > 0 && (
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Las nuevas propuestas aparecen en correlaciones punteadas o con color advertencia en la simulación. Al descartarlas abajo, desaparecen de aquí.
                            </p>
                        )}

                        <div
                            id="mermaid-preview"
                            className="mermaid"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '2rem',
                                borderRadius: 'var(--radius-md)',
                                border: proposals.length > 0 ? '1px solid var(--warning-color)' : '1px solid var(--border-color)',
                                minHeight: '300px',
                                overflowX: 'auto',
                                boxShadow: proposals.length > 0 ? 'inset 0 0 20px rgba(255, 215, 0, 0.05)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {/* Mermaid content injected via useEffect */}
                        </div>

                        {proposals.length > 0 && (
                            <details style={{ marginTop: '1rem' }}>
                                <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ver script (Mermaid)</summary>
                                <pre style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', fontSize: '0.75rem', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                                    {previewMermaid}
                                </pre>
                            </details>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Proposals List */}
            <AnimatePresence mode="wait">
                {proposals.length > 0 && (
                    <motion.div
                        key="proposals"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255, 215, 0, 0.2)', color: 'var(--warning-color)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {proposals.length}
                                </div>
                                <h3 style={{ color: 'var(--warning-color)', margin: 0 }}>Nuevas Conexiones Propuestas</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleReEvaluate}
                                    disabled={saving || loadingAi}
                                    className="btn"
                                    style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.6rem 1rem' }}
                                    title="Volver a solicitar propuestas a la IA"
                                >
                                    <RotateCcw size={18} /> Reintentar
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleApply}
                                    disabled={saving}
                                    className="btn"
                                    style={{ background: 'var(--success-color)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem' }}
                                >
                                    {saving ? 'Guardando...' : <><Save size={18} /> Aprobar Todas</>}
                                </motion.button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <AnimatePresence>
                                {proposals.map((prop, idx) => (
                                    <motion.div
                                        key={`${prop.from_idea_id}-${prop.to_idea_id}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'var(--bg-tertiary)',
                                            padding: '1.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: '4px solid var(--warning-color)',
                                            borderTop: '1px solid var(--border-color)',
                                            borderRight: '1px solid var(--border-color)',
                                            borderBottom: '1px solid var(--border-color)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '1.5rem'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', fontWeight: 600, fontSize: '1.05rem', marginBottom: '1rem' }}>
                                                <span style={{ background: 'var(--bg-color)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>ID {prop.from_idea_id}</span>
                                                <span style={{ color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                                    <span style={{ height: '2px', width: '20px', background: 'var(--warning-color)', display: 'inline-block' }}></span>
                                                    {prop.connection_type}
                                                    <span style={{ width: '0', height: '0', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid var(--warning-color)', display: 'inline-block', marginLeft: '-2px' }}></span>
                                                </span>
                                                <span style={{ background: 'var(--bg-color)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>ID {prop.to_idea_id}</span>

                                                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '0.2rem 0.8rem', borderRadius: '999px' }}>
                                                    Fuerza: <strong style={{ color: 'var(--text-primary)' }}>{prop.weight}</strong>
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ height: '100%', position: 'relative' }}>
                                                    <span style={{ position: 'absolute', top: '-10px', left: '-5px', fontSize: '2rem', color: 'rgba(255,255,255,0.1)', fontFamily: 'serif' }}>"</span>
                                                    <span style={{ position: 'relative', zIndex: 1 }}>{prop.explanation}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => removeProposal(idx)}
                                            title="Descartar propuesta"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                transition: 'color 0.2s, background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <XCircle size={24} />
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
