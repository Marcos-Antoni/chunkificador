# 🧠 Segundo Cerebro Digital (Brain)

Un sistema de **Gestión de Conocimiento Aumentado por IA** que transforma notas desestructuradas en un Grafo de Conocimiento conectado y buscable vectorialmente.

![Status](https://img.shields.io/badge/Status-Active-success)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Gemini-orange)

## ✨ Características Principales

*   **Atomización Inteligente**: Usa IA (Gemini Flash) para romper párrafos largos en "Bloques de Ideas" autónomos.
*   **Auto-Conexión (Grafo)**: La IA detecta relaciones semánticas entre las ideas automáticamente.
*   **Búsqueda Híbrida**: Encuentra información no solo por palabras clave, sino por similitud de significado (Vectores/Embeddings).
*   **Etiquetado Automático**: Genera tags relevantes para cada bloque de conocimiento.

## 🚀 Cómo Iniciar

### Prerrequisitos
*   Docker instalado
*   Una API Key de Google Gemini (`GEMINI_API_KEY`)

### 🐳 Inicialización con Docker (Recomendado)

Esta es la forma más sencilla de arrancar el proyecto, ya que configura automáticamente la base de datos, el backend y el frontend.

**1. Arrancar el proyecto:**
```bash
docker-compose up --build
```
*Espera unos segundos hasta que veas "Cerebro digital online" en los logs.*

**2. Detener el proyecto:**
Presiona `Ctrl+C` o ejecuta:
```bash
docker-compose down
```

**3. Reiniciar desde cero (Borrar datos):**
Si necesitas reiniciar la base de datos (útil durante desarrollo):
```bash
# Borra el archivo de DB local
rm backend/data/brain.db  # (En PowerShell: del backend/data/brain.db)

# Reinicia el contenedor para que regenere la estructura
docker-compose restart backend
```

### Acceso
*   **Frontend (UI)**: [http://localhost:5173](http://localhost:5173)
*   **Backend (API)**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🛠️ Arquitectura Técnica

*   **Backend**: Python (FastAPI). Gestiona la lógica de IA y base de datos.
*   **Base de Datos**: SQLite (Local).
    *   `ideas`: Almacena el texto y el vector (embedding).
    *   `connections`: Almacena las relaciones del grafo.
*   **Frontend**: React + Vite. Interfaz minimalista para capturar y explorar pensamientos.

## 🧪 Tests
Los scripts de prueba se encuentran en la carpeta `tests/`.
```bash
# Probar flujo completo (Guardar + Buscar)
python tests/test_full_flow.py
```
