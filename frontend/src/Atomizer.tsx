import { useState, type ChangeEvent } from 'react';
import { Brain, Loader, Trash2, Save, Plus, Search, Link as LinkIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Atom, SimilarIdea } from './types';

function Atomizer() {
    const [inputText, setInputText] = useState('');
    const [globalTags, setGlobalTags] = useState('');
    const [atoms, setAtoms] = useState<Atom[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const handleAtomize = async () => {
        if (!inputText.trim()) return;

        setLoading(true);
        setError(null);
        setSaveStatus(null);
        setAtoms(null);

        try {
            const response = await fetch('/api/atomize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText }),
            });

            const data = await response.json();
            if (response.ok) {
                const enrichedAtoms: Atom[] = data.atoms;
                const onlySimilar = enrichedAtoms.filter(a => a.similarIdeas && a.similarIdeas.length > 0);

                if (onlySimilar.length > 0) {
                    setAtoms(onlySimilar);
                    setSaveStatus(`🔍 Modo Filtro: Mostrando ${onlySimilar.length} ideas con similitud > 85%.`);
                } else {
                    setAtoms(enrichedAtoms);
                    setSaveStatus("✨ Conocimiento 100% Nuevo (No se encontraron similitudes > 85%)");
                }
            } else {
                setError(data.detail || 'Error al atomizar el texto');
            }
        } catch {
            setError('Error de conexión con el cerebro');
        } finally {
            setLoading(false);
        }
    };

    const findSimilar = async (index: number) => {
        if (!atoms) return;
        const atom = atoms[index];
        const newAtoms = [...atoms];
        newAtoms[index] = { ...newAtoms[index], searchingSimilar: true };
        setAtoms(newAtoms);

        try {
            const response = await fetch('/api/find_similar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: atom.text || atom.statement || ""
                }),
            });
            const data = await response.json();
            if (response.ok) {
                newAtoms[index] = { ...newAtoms[index], similarIdeas: data.similar as SimilarIdea[] };
            }
        } catch (err) {
            console.error("Error buscando similares", err);
        } finally {
            newAtoms[index] = { ...newAtoms[index], searchingSimilar: false };
            setAtoms([...newAtoms]);
        }
    };

    const handleUpdateAtom = (index: number, field: keyof Atom, value: string) => {
        if (!atoms) return;
        const newAtoms = [...atoms];
        newAtoms[index] = { ...newAtoms[index], [field]: value };
        setAtoms(newAtoms);
    };

    const handleDeleteAtom = (index: number) => {
        if (!atoms) return;
        setAtoms(atoms.filter((_, i) => i !== index));
    };

    const handleAddAtom = () => {
        if (!atoms) return;
        const newAtom: Atom = {
            id: `manual_${Date.now()}`,
            text: "Nueva idea...",
            type: "Theoretical",
            related_ids: [],
            similarIdeas: [],
            searchingSimilar: false
        };
        setAtoms([newAtom, ...atoms]);
    };

    const handleSaveToCerebro = async () => {
        if (!atoms) return;
        setLoading(true);
        if (!globalTags.trim()) {
            setError("Por favor, ingresa al menos una materia (Global Tag).");
            setLoading(false);
            return;
        }

        try {
            const cleanChunks = atoms.map(a => ({
                id: a.id,
                text: a.text || a.statement,
                type: a.type || "Theoretical",
                related_ids: a.related_ids || []
            }));

            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    global_tags: globalTags.split(',').map(t => t.trim()).filter(t => t),
                    chunks: cleanChunks
                }),
            });

            if (response.ok) {
                setSaveStatus('¡Conocimiento integrado en tu Cerebro Digital! 🧠🧬');
                setAtoms(null);
                setInputText('');
                setGlobalTags('');
            } else {
                const data = await response.json();
                setError(data.detail || 'Error al guardar en el servidor');
            }
        } catch {
            setError('Error de conexión al intentar guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
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
                    <Brain color="var(--accent-color)" size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>Motor de Átomos</h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Convierte textos largos en ideas atómicas</p>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {!atoms && (
                    <motion.div
                        key="input-form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="card"
                    >
                        <textarea
                            value={inputText}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                            placeholder="Pega aquí tu flujo de pensamiento, artículo o nota detallada..."
                            className="input-field"
                            style={{ minHeight: '350px', fontSize: '1.1rem', lineHeight: '1.6', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAtomize}
                                disabled={loading || !inputText.trim()}
                                className="btn btn-primary"
                                style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                            >
                                {loading ? <><Loader className="animate-spin" size={20} /> Consultando al Cerebro...</> : <><Sparkles size={20} /> Atomizar Texto</>}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ color: 'var(--error-color)', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)', margin: '1.5rem 0' }}
                    >
                        {error}
                    </motion.div>
                )}
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', margin: '1.5rem 0', textAlign: 'center', fontWeight: '500' }}
                    >
                        {saveStatus}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {atoms && (
                    <motion.div
                        key="atoms-list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '2rem' }}
                    >
                        <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--accent-color)' }}>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>📚 Materias (Tags Globales)</label>
                            <input
                                value={globalTags}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setGlobalTags(e.target.value)}
                                placeholder="Ej: Física, Mecánica Cuántica, Apuntes 2024"
                                className="input-field"
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                                Estas materias se enlazarán automáticamente a todos los bloques generados.
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⚛️ Refinamiento Atómico <span style={{ background: 'var(--bg-tertiary)', padding: '2px 10px', borderRadius: '999px', fontSize: '0.9rem' }}>{atoms.length} bloques</span>
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAddAtom}
                                    className="btn btn-secondary"
                                >
                                    <Plus size={18} /> Añadir Bloque
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveToCerebro}
                                    className="btn btn-primary"
                                >
                                    <Save size={18} /> Persistir en Cerebro
                                </motion.button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <AnimatePresence>
                                {atoms.map((atom, index) => (
                                    <motion.div
                                        key={atom.id || index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="card"
                                        style={{ borderLeft: '4px solid var(--accent-color)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                            <span style={{ background: 'var(--bg-color)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontFamily: 'monospace', border: '1px solid var(--border-color)' }}>
                                                ID: {atom.id || 'N/A'}
                                            </span>
                                            <motion.button
                                                whileHover={{ scale: 1.1, color: '#ef4444' }}
                                                onClick={() => handleDeleteAtom(index)}
                                                style={{
                                                    color: 'var(--text-secondary)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </motion.button>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <textarea
                                                value={atom.text || atom.statement}
                                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleUpdateAtom(index, 'text', e.target.value)}
                                                className="input-field"
                                                style={{ minHeight: '100px', fontSize: '1.05rem', fontWeight: '400', fontFamily: 'inherit', resize: 'vertical' }}
                                                placeholder="Descripción de la idea..."
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>TIPO DE CONOCIMIENTO</label>
                                                <select
                                                    value={atom.type || "Theoretical"}
                                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateAtom(index, 'type', e.target.value)}
                                                    className="input-field"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <option value="Theoretical">🧠 Teórico (Conceptos)</option>
                                                    <option value="Practical">🛠️ Práctico (Ejercicios/Código)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>CONEXIONES (IDs)</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', minHeight: '42px', alignItems: 'center' }}>
                                                    {atom.related_ids && atom.related_ids.length > 0 ? (
                                                        atom.related_ids.map(rid => (
                                                            <span key={rid} style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                                                                <LinkIcon size={12} /> {rid}
                                                            </span>
                                                        ))
                                                    ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Sin conexiones</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                            <button
                                                onClick={() => findSimilar(index)}
                                                disabled={atom.searchingSimilar}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}
                                            >
                                                {atom.searchingSimilar ? <Loader className="animate-spin" size={14} /> : <Search size={14} />}
                                                {atom.searchingSimilar ? 'Buscando similares...' : 'Verificar duplicados'}
                                            </button>

                                            <AnimatePresence>
                                                {atom.similarIdeas && atom.similarIdeas.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        style={{ marginTop: '1rem', display: 'grid', gap: '10px' }}
                                                    >
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Ideas similares en el Cerebro:</p>
                                                        {atom.similarIdeas.map(sim => (
                                                            <div key={sim.id} style={{ fontSize: '0.95rem', color: 'var(--text-primary)', padding: '12px', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                                <span style={{ fontStyle: 'italic' }}>"{sim.content}"</span>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(124, 58, 237, 0.1)', padding: '4px 10px', borderRadius: '999px', color: 'var(--accent-color)', whiteSpace: 'nowrap' }}>
                                                                    {(sim.similarity * 100).toFixed(0)}% de coincidencia
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}} />
        </div>
    );
}

export default Atomizer;
