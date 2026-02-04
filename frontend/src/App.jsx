import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Check } from 'lucide-react';
import Atomizer from './Atomizer';

function App() {
    const [status, setStatus] = useState('Conectando con el cerebro...');
    const [view, setView] = useState('welcome'); // 'welcome' | 'atomizer'

    useEffect(() => {
        // Prueba de conexión con el Backend
        fetch('/api/')
            .then(res => res.json())
            .then(data => setStatus(`Backend Online: ${data.message}`))
            .catch(err => setStatus('Error: No se puede conectar con el Backend (¿Está corriendo Docker?)'));
    }, []);

    if (view === 'atomizer') {
        return <Atomizer />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '2rem' }}>

            <div style={{ position: 'relative' }}>
                <Brain size={120} color="#a882ff" />
                <div style={{ position: 'absolute', top: -10, right: -10 }}>
                    <Sparkles size={40} color="#ffd700" />
                </div>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Chunkificador v1</h1>

            <div style={{ padding: '1rem 2rem', background: '#2f2f2f', borderRadius: '12px', border: '1px solid #444' }}>
                <code>{status}</code>
            </div>

            <button
                onClick={() => setView('atomizer')}
                style={{
                    marginTop: '20px',
                    padding: '12px 24px',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                <Check size={18} /> Iniciar Secuencia
            </button>

        </div>
    );
}

export default App;
