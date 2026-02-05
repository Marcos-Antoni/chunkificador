import os
import google.generativeai as genai
import json
from typing import List, Dict

# El modelo Flash es rápido y eficiente
MODEL_NAME = "gemini-3-flash-preview"

PROMPT_1_UNITS = """
Actúa como un experto en análisis de discurso y lingüística cognitiva.
Tu tarea: Analizar el texto que te proporcionaré para identificar las "unidades de información" o ideas independientes que contiene.

Criterios de análisis:
1. Una "idea" se define como una proposición que contiene un sujeto, una acción y un contexto, que aporta información nueva o relevante.
2. No cuentes oraciones, sino conceptos. Si una oración larga contiene dos hechos distintos, sepáralos.
3. No cuentes redundancias o frases de relleno como ideas nuevas.
4. Diferencia entre la Idea Central y las Ideas de Soporte.

Formato de respuesta:
- Resumen cuantitativo: "El texto contiene un total de [X] ideas principales".
- Desglose enumerado: Una lista donde cada punto explique la idea encontrada de forma clara y breve.
- Estructura lógica: Organiza las ideas por su jerarquía (Principal vs. Secundaria).

Texto a analizar:
{text}
"""

PROMPT_2_GRAPH = """
Rol: Actúa como un Arquitecto de Conocimiento y experto en Topología Semántica.
Contexto: Utilizando la lista de "unidades de información" (ideas) que acabamos de desglosar en el paso anterior.

Paso Anterior (Ideas):
{units_analysis}

Tarea: Construye un Grafo de Conocimiento (Knowledge Graph) textual que conecte estas ideas basándose en su dependencia lógica, causal o contextual. Tu objetivo es crear una "ruta de lectura" donde saltar de un nodo a otro expanda la comprensión del tema.

Instrucciones precisas:
1. Nodos: Cada idea numerada anteriormente es un NODO.
2. Aristas (Conexiones): Identifica qué ideas están conectadas directamente.
3. Etiquetas de relación: Para cada conexión, define explícitamente el tipo de vínculo (ej. Causa, Define a, Contextualiza a, Contradice a, Expande a).
4. Valor de la transición: Explica brevemente por qué conectar la Idea A con la Idea B aporta valor al lector.

Formato de Salida requerido:
1. Representación Visual (Código Mermaid): Genera el código para un diagrama de flujo (graph TD) que visualice estas conexiones.
2. Lista de Adyacencia Explicada: Usa este formato para cada conexión clave: [Idea Origen] -> (Tipo de Relación) -> [Idea Destino]
Por qué seguir este camino: [Breve explicación de qué información ganamos al pasar de una a otra].
"""

PROMPT_3_JSON = """
Eres un Arquitecto de Conocimiento. Tu tarea final es consolidar el análisis previo en un formato JSON estructurado listo para ser consumido por un sistema de Second Brain.

Análisis Previo (Grafo y Conexiones):
{graph_analysis}

REGLAS DE GENERACIÓN DE CHUNKS:
1. COHESIÓN: Cada chunk debe ser un párrafo breve (2-4 oraciones) que explique una idea por sí mismo.
2. DESCONTEXTUALIZACIÓN: No uses pronombres ambiguos. Si el texto dice "Su teoría...", cámbialo a "La teoría de Einstein...".
3. CONEXIONES: Usa los IDs generados (chunk_1, chunk_2...) y los related_ids identificados en el grafo anterior.

SALIDA ESPERADA (JSON):
Devuelve ÚNICAMENTE una lista de objetos JSON con esta estructura exacta:

[
  {{
    "id": "chunk_1",
    "text": "Texto completo del párrafo explicando la idea...",
    "tags": ["tag1", "tag2"],
    "related_ids": ["chunk_2", "chunk_5"] 
  }},
  ...
]

NOTA SOBRE related_ids:
- Usa SOLO los IDs que tú mismo has generado en esta lista (chunk_X).
"""

import traceback

async def atomize_text(text: str) -> List[Dict]:
    """
    Envía el texto a Gemini en un flujo de 3 pasos para ser atomizado y conectado.
    """
    print(f"--- [DEBUG] Iniciando flujo de 3 pasos para {len(text)} caracteres ---")
    
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
             raise ValueError("GEMINI_API_KEY no está configurada")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
        
        # PASO 1: Identificación de Unidades de Información
        print("--- [DEBUG] Paso 1: Extracción de unidades ---")
        p1 = PROMPT_1_UNITS.format(text=text)
        response_1 = model.generate_content(p1)
        units_analysis = response_1.text
        
        # PASO 2: Construcción del Grafo
        print("--- [DEBUG] Paso 2: Topología Semántica ---")
        p2 = PROMPT_2_GRAPH.format(units_analysis=units_analysis)
        response_2 = model.generate_content(p2)
        graph_analysis = response_2.text

        # PASO 3: Formateo JSON Final
        print("--- [DEBUG] Paso 3: Consolidación JSON ---")
        p3 = PROMPT_3_JSON.format(graph_analysis=graph_analysis)
        response_3 = model.generate_content(p3)
        raw_content = response_3.text
        
        print(f"--- DEBUG STEP 3 RAW ---\n{raw_content}\n-------------------------")

        # Limpieza y parsing del JSON (Paso 3)
        try:
            start_idx = raw_content.find('[')
            end_idx = raw_content.rfind(']')
            if start_idx != -1 and end_idx != -1:
                json_str = raw_content[start_idx : end_idx + 1]
                return json.loads(json_str)
            else:
                 raise ValueError("No se encontró JSON en el paso final")
        except:
            clean_text = raw_content.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)

    except Exception as e:
        error_msg = f"ERROR en flujo de 3 pasos: {str(e)}"
        print(error_msg)
        traceback.print_exc() 
        return [{"error": error_msg}]
