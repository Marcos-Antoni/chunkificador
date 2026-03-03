import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Loader2, ArrowRight, ChevronLeft, ChevronRight, Hash, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvancedSearch() {
    const [searchParams, setSearchParams] = useSearchParams();

    // State for inputs (synced with URL)
    const [searchText, setSearchText] = useState(searchParams.get('q') || '');
    const [threshold, setThreshold] = useState(parseFloat(searchParams.get('t')) || 0.6);
    const [batchId, setBatchId] = useState(searchParams.get('batch') || '');
    const [selectedSubjects, setSelectedSubjects] = useState(
        searchParams.get('subjects') ? searchParams.get('subjects').split(',').map(Number) : []
    );
    const [ideaId, setIdeaId] = useState(searchParams.get('id') || '');
    const [ideaType, setIdeaType] = useState(searchParams.get('type') || '');
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

    // Results state
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState({ total_pages: 1, total_results: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Fetch subjects on mount
    useEffect(() => {
        fetch('/api/subjects')
            .then(res => res.json())
            .then(data => setAvailableSubjects(data.subjects || []))
            .catch(err => console.error("Error fetching subjects:", err));
    }, []);

    // Effect to trigger search when searchParams changes
    useEffect(() => {
        performSearch();
    }, [searchParams]);

    const performSearch = async () => {
        setLoading(true);
        setError(null);
        setHasSearched(true);

        const currentParams = {
            text: searchParams.get('q') || '',
            threshold: parseFloat(searchParams.get('t')) || 0.6,
            batch_id: searchParams.get('batch') || null,
            subject_ids: searchParams.get('subjects') ? searchParams.get('subjects').split(',').map(Number) : [],
            idea_id: searchParams.get('id') ? parseInt(searchParams.get('id')) : null,
            type: searchParams.get('type') || null,
            page: parseInt(searchParams.get('page')) || 1,
            limit: 10
        };

        try {
            const res = await fetch('/api/ideas/advanced_search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentParams)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error en la búsqueda');

            setResults(data.results || []);
            setPagination({
                total_pages: data.total_pages || 1,
                total_results: data.total_results || 0
            });
            setPage(data.current_page || 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateFilters = (newFilters) => {
        const params = new URLSearchParams(searchParams);

        // Merge with existing params or set new ones
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key] === null || newFilters[key] === '') {
                params.delete(key);
            } else {
                params.set(key, newFilters[key]);
            }
        });

        // Reset to page 1 if changing filters (unless we are specifically paging)
        if (!newFilters.page) {
            params.set('page', '1');
        }

        setSearchParams(params);
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        updateFilters({
            q: searchText,
            t: threshold,
            batch: batchId,
            subjects: selectedSubjects.length > 0 ? selectedSubjects.join(',') : null,
            id: ideaId,
            type: ideaType,
            page: 1
        });
    };

    const toggleSubject = (id) => {
        const newSubjects = selectedSubjects.includes(id)
            ? selectedSubjects.filter(s => s !== id)
            : [...selectedSubjects, id];

        setSelectedSubjects(newSubjects);
        // We don't update URL immediately for subjects to allow multiple selection before search
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            updateFilters({ page: newPage });
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
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
                    <Search color="var(--accent-color)" size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>Explorador de Ideas</h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filtra, busca y navega por tu conocimiento</p>
                </div>
            </motion.div>

            <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleSubmit}
                className="card"
                style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
                {/* Search Text (Semantic) */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Búsqueda Semántica (Opcional):
                    </label>
                    <textarea
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Escribe un concepto o pregunta para buscar por significado..."
                        className="input-field"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                </div>

                {/* Main Filters Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {/* ID Filter */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <Hash size={14} /> ID Idea:
                        </label>
                        <input
                            type="number"
                            placeholder="Ej: 42"
                            value={ideaId}
                            onChange={(e) => setIdeaId(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* Type Filter */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <Layers size={14} /> Tipo:
                        </label>
                        <select
                            value={ideaType}
                            onChange={(e) => setIdeaType(e.target.value)}
                            className="input-field"
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="Theoretical">Teórico</option>
                            <option value="Practical">Práctico</option>
                        </select>
                    </div>

                    {/* Batch Filter */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Lote (Batch ID):
                        </label>
                        <input
                            type="text"
                            placeholder="ID del lote..."
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>

                {/* Similarity Threshold (Only visible if searching by text) */}
                <AnimatePresence>
                    {searchText.trim() && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <span>Umbral de Similitud:</span>
                                <span style={{ color: 'var(--accent-color)' }}>{threshold}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={threshold}
                                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent-color)' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Subjects Filter */}
                {availableSubjects.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <Filter size={16} /> Filtrar por Materias:
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {availableSubjects.map(sub => {
                                const isSelected = selectedSubjects.includes(sub.id);
                                return (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => toggleSubject(sub.id)}
                                        style={{
                                            background: isSelected ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                                            color: isSelected ? 'white' : 'var(--text-secondary)',
                                            border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                            padding: '6px 14px',
                                            borderRadius: '999px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {sub.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
                >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Buscando...</> : <><Search size={18} /> Aplicar Filtros</>}
                </motion.button>
            </motion.form>

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
                {results.length > 0 ? (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                Resultados <span style={{ background: 'var(--bg-tertiary)', padding: '2px 10px', borderRadius: '999px', fontSize: '1rem' }}>{pagination.total_results}</span>
                            </h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Página {page} de {pagination.total_pages}</span>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                            {results.map((idea, index) => {
                                // Create clean query params for navigation without semantic text
                                const navParams = new URLSearchParams(searchParams);
                                navParams.delete('q'); // Exclude semantic text as requested
                                const detailQuery = navParams.toString();
                                const detailUrl = `/idea/${idea.id}${detailQuery ? `?${detailQuery}` : ''}`;

                                return (
                                    <Link
                                        key={idea.id}
                                        to={detailUrl}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="card"
                                            style={{ borderLeft: '4px solid var(--accent-color)', cursor: 'pointer' }}
                                            whileHover={{ x: 5 }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                                        ID: {idea.id}
                                                    </span>
                                                    {idea.similarity && (
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success-color)' }}>
                                                            {(idea.similarity * 100).toFixed(1)}% Similitud
                                                        </span>
                                                    )}
                                                </div>
                                                <ArrowRight size={18} color="var(--border-color)" />
                                            </div>

                                            <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                                                {idea.content}
                                            </p>

                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {idea.subjects && idea.subjects.map((sub, idx) => (
                                                    <span key={idx} style={{ fontSize: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '999px' }}>
                                                        {sub}
                                                    </span>
                                                ))}
                                                {idea.type && (
                                                    <span className={`badge ${idea.type === 'Theoretical' ? 'badge-theoretical' : 'badge-practical'}`}>
                                                        {idea.type}
                                                    </span>
                                                )}
                                                {idea.batch_id && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault(); // Prevent triggering the card's Link
                                                            e.stopPropagation(); // Stop event from bubbling up

                                                            // Navigate to the same page but with the new batch filter
                                                            const newParams = new URLSearchParams(searchParams);
                                                            newParams.set('batch', idea.batch_id);
                                                            newParams.set('page', '1');
                                                            setSearchParams(newParams);
                                                        }}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            background: 'rgba(124, 58, 237, 0.1)',
                                                            border: '1px solid var(--accent-color)',
                                                            color: 'var(--accent-color)',
                                                            padding: '4px 10px',
                                                            borderRadius: 'var(--radius-sm)',
                                                            cursor: 'pointer',
                                                            fontFamily: 'inherit'
                                                        }}
                                                    >
                                                        Lote: {typeof idea.batch_id === 'string' && idea.batch_id.length > 8 ? idea.batch_id.substring(0, 8) + '...' : idea.batch_id}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {pagination.total_pages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1 || loading}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    <ChevronLeft size={20} /> <span className="hide-mobile">Anterior</span>
                                </button>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[...Array(pagination.total_pages)].map((_, i) => {
                                        const pNum = i + 1;
                                        // Show 5 pages around the current one
                                        if (Math.abs(pNum - page) <= 2 || pNum === 1 || pNum === pagination.total_pages) {
                                            return (
                                                <button
                                                    key={pNum}
                                                    onClick={() => handlePageChange(pNum)}
                                                    className={`btn ${page === pNum ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{ width: '40px', height: '40px', padding: 0 }}
                                                >
                                                    {pNum}
                                                </button>
                                            );
                                        }
                                        if (Math.abs(pNum - page) === 3) return <span key={pNum}>...</span>;
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === pagination.total_pages || loading}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    <span className="hide-mobile">Siguiente</span> <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                ) : !loading && !error && hasSearched ? (
                    <motion.div
                        key="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card"
                        style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                    >
                        <Search size={48} color="var(--border-color)" />
                        <h3 style={{ color: 'var(--text-secondary)', margin: 0 }}>Sin Coincidencias</h3>
                        <p style={{ margin: 0, maxWidth: '400px' }}>
                            No encontramos ideas que coincidan con tus filtros. Intenta ajustar la búsqueda.
                        </p>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @media (max-width: 480px) { .hide-mobile { display: none; } }
            `}} />
        </div>
    );
}
