import React, { useState } from 'react';
import { Brain, ArrowRight, Loader, Trash2, Save, Plus, Search, Link as LinkIcon, ExternalLink } from 'lucide-react';

function Atomizer() {
    const [inputText, setInputText] = useState('');
    const [atoms, setAtoms] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);

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
                // Enriquecer átomos (la data ya viene con similarIdeas del backend si hubo suerte)
                let enrichedAtoms = data.atoms;

                // FILTRADO ESTRICTO SEGÚN PETICIÓN: "Dejar solo las ideas que se parecen"
                const onlySimilar = enrichedAtoms.filter(a => a.similarIdeas && a.similarIdeas.length > 0);

                if (onlySimilar.length > 0) {
                    setAtoms(onlySimilar);
                    setSaveStatus(`🔍 Modo Filtro: Mostrando ${onlySimilar.length} ideas con similitud > 85%.`);
                } else {
                    // Fallback UX: Si no hay NADA similar, mejor no mostrar una pantalla vacía confusa.
                    // Mostramos todo pero indicamos que son nuevas.
                    setAtoms(enrichedAtoms);
                    setSaveStatus("✨ Conocimiento 100% Nuevo (No se encontraron similitudes > 85%)");
                }
            } else {
                setError(data.detail || 'Error al atomizar el texto');
            }
        } catch (err) {
            setError('Error de conexión con el cerebro');
        } finally {
            setLoading(false);
        }
    };

    const findSimilar = async (index) => {
        const atom = atoms[index];
        const newAtoms = [...atoms];
        newAtoms[index].searchingSimilar = true;
        setAtoms(newAtoms);

        try {
            const response = await fetch('/api/find_similar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: atom.text || atom.statement || "" // Fallback robusto
                }),
            });
            const data = await response.json();
            if (response.ok) {
                newAtoms[index].similarIdeas = data.similar;
            }
        } catch (err) {
            console.error("Error buscando similares", err);
        } finally {
            newAtoms[index].searchingSimilar = false;
            setAtoms([...newAtoms]);
        }
    };

    const handleUpdateAtom = (index, field, value) => {
        const newAtoms = [...atoms];
        newAtoms[index][field] = value;
        setAtoms(newAtoms);
    };

    const handleDeleteAtom = (index) => {
        setAtoms(atoms.filter((_, i) => i !== index));
    };

    const handleAddAtom = () => {
        const newAtom = {
            id: `manual_${Date.now()}`,
            text: "Nueva idea...",
            tags: [],
            related_ids: [],
            similarIdeas: [],
            searchingSimilar: false
        };
        setAtoms([newAtom, ...atoms]);
    };

    const handleSaveToCerebro = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: inputText.split('\n')[0].substring(0, 40),
                    chunks: atoms // Changed from atoms to chunks
                }),
            });

            if (response.ok) {
                setSaveStatus('¡Conocimiento integrado en tu Cerebro Digital! 🧠🧬');
                setAtoms(null);
                setInputText('');
            } else {
                setError('Error al guardar en el servidor');
            }
        } catch (err) {
            setError('Error de conexión al intentar guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a882ff' }}>
                <Brain /> Chunkificador | Motor de Átomos
            </h2>

            {!atoms && (
                <div style={{ marginTop: '20px' }}>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Pega aquí tu flujo de pensamiento o nota..."
                        style={{
                            width: '100%', height: '350px', background: '#1a1a1a', border: '1px solid #333',
                            color: '#eee', padding: '1.5rem', borderRadius: '12px', resize: 'vertical',
                            fontSize: '1.1rem', lineHeight: '1.6', fontFamily: 'Inter, sans-serif'
                        }}
                    />
                    <button
                        onClick={handleAtomize}
                        disabled={loading || !inputText.trim()}
                        style={{
                            marginTop: '15px', padding: '14px 32px', background: loading ? '#444' : '#7c3aed',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600'
                        }}
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                        {loading ? 'Consultando al Cerebro...' : 'Atomizar Texto'}
                    </button>
                </div>
            )}

            {error && <div style={{ marginTop: '20px', padding: '1rem', background: '#4a1d1d', borderRadius: '8px', color: '#ffaaaa' }}>{error}</div>}
            {saveStatus && <div style={{ marginTop: '20px', padding: '1.5rem', background: '#166534', borderRadius: '12px', color: '#dcfce7', textAlign: 'center', fontSize: '1.2rem' }}>{saveStatus}</div>}

            {atoms && (
                <div style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h3>⚛️ Refinamiento Atómico ({atoms.length} bloques)</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleAddAtom} style={{ background: '#333', color: '#eee', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={18} /> Añadir Bloque
                            </button>
                            <button onClick={handleSaveToCerebro} style={{ background: '#7c3aed', color: 'white', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                <Save size={18} /> Persistir en Cerebro
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '25px' }}>
                        {atoms.map((atom, index) => (
                            <div key={index} style={{ background: '#252525', padding: '1.8rem', borderRadius: '16px', border: '1px solid #333', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', borderLeft: '6px solid #a882ff' }}>

                                {/* Header: ID y Acciones */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ background: '#333', color: '#aaa', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                        ID: {atom.id || 'N/A'}
                                    </span>
                                    <button onClick={() => handleDeleteAtom(index)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </div>

                                {/* Main Text */}
                                <div style={{ marginBottom: '15px' }}>
                                    <textarea
                                        value={atom.text || atom.statement} // Fallback to statement if text is missing during migration
                                        onChange={(e) => handleUpdateAtom(index, 'text', e.target.value)}
                                        style={{ width: '100%', minHeight: '80px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: '400', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                                        placeholder="Descripción de la idea..."
                                    />
                                </div>

                                {/* Metadata: Tags & Relations */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>

                                    {/* Tags */}
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>TAGS</label>
                                        <input
                                            value={Array.isArray(atom.tags) ? atom.tags.join(', ') : ''}
                                            onChange={(e) => handleUpdateAtom(index, 'tags', e.target.value.split(',').map(t => t.trim()))}
                                            placeholder="tag1, tag2..."
                                            style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#a882ff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    {/* Related IDs */}
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>CONEXIONES (IDs)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '8px', background: '#333', borderRadius: '6px', minHeight: '38px', alignItems: 'center' }}>
                                            {atom.related_ids && atom.related_ids.length > 0 ? (
                                                atom.related_ids.map(rid => (
                                                    <span key={rid} style={{ background: '#4c1d95', color: '#e9d5ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <LinkIcon size={10} /> {rid}
                                                    </span>
                                                ))
                                            ) : <span style={{ color: '#555', fontSize: '0.85rem' }}>Sin conexiones</span>}
                                        </div>
                                    </div>
                                </div>


                                {/* Similarity Section */}
                                <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                                    <button
                                        onClick={() => findSimilar(index)}
                                        disabled={atom.searchingSimilar}
                                        style={{ background: 'transparent', color: '#a882ff', border: '1px solid #a882ff', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        {atom.searchingSimilar ? <Loader className="animate-spin" size={14} /> : <Search size={14} />}
                                        {atom.searchingSimilar ? 'Buscando similares...' : 'Verificar duplicados'}
                                    </button>

                                    {atom.similarIdeas && atom.similarIdeas.length > 0 && (
                                        <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                                            <p style={{ fontSize: '0.8rem', color: '#888' }}>Ideas similares encontradas en tu Cerebro:</p>
                                            {atom.similarIdeas.map(sim => (
                                                <div key={sim.id} style={{ fontSize: '0.9rem', color: '#aaa', padding: '10px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{sim.content}</span>
                                                    <span style={{ fontSize: '0.7rem', background: '#333', padding: '2px 8px', borderRadius: '10px', color: '#a882ff' }}>
                                                        {(sim.similarity * 100).toFixed(0)}% match
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, textarea:focus { outline: 1px solid #a882ff; border-color: #a882ff; }
    `}</style>
        </div>
    );
}

export default Atomizer;
