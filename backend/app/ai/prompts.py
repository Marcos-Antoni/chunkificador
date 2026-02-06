CHUNK_PROMPTS = [
    """
Actúa como un experto en análisis de discurso y lingüística cognitiva.
Tu tarea: Analizar el texto que te proporcionaré para identificar las "unidades de información" o ideas independientes que contiene.

Criterios de análisis:
1. Una "idea" se define como una proposición que contiene un sujeto, una acción y un contexto, que aporta información nueva o relevante.
2. PRESERVACIÓN PRÁCTICA: Identifica y extrae como unidades independientes las fórmulas matemáticas, bloques de código y demostraciones prácticas. NO los consideres relleno.
3. No cuentes oraciones, sino conceptos. Si una oración larga contiene dos hechos distintos, sepáralos.
4. No cuentes redundancias o frases de relleno como ideas nuevas.
5. Diferencia entre la Idea Central y las Ideas de Soporte.

Formato de respuesta:
- Resumen cuantitativo: "El texto contiene un total de [X] unidades de información (Teóricas + Prácticas)".
- Desglose enumerado: Una lista donde cada punto explique la idea encontrada o presente el código/fórmula íntegro.
- Estructura lógica: Organiza las ideas por su jerarquía (Principal vs. Secundaria).

Texto a analizar:
{input}
""",
    """
Rol: Actúa como un Arquitecto de Conocimiento y experto en Topología Semántica.
Contexto: Utilizando la lista de "unidades de información" (ideas) que acabamos de desglosar en el paso anterior.

Paso Anterior (Ideas):
{input}

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
""",
    """
Eres un Arquitecto de Conocimiento. Tu tarea final es consolidar el análisis previo en un formato JSON estructurado listo para ser consumido por un sistema de Second Brain.

Análisis Previo (Grafo y Conexiones):
{input}

REGLAS DE GENERACIÓN DE CHUNKS:
1. INTEGRIDAD: Si una idea contiene código, fórmulas o un ejemplo práctico clave, PRESERVALO íntegramente. El texto puede incluir bloques de código Markdown.
2. COHESIÓN: Cada chunk debe ser autónomo. Si no es código/fórmula, usa párrafos breves (2-4 oraciones).
3. DESCONTEXTUALIZACIÓN: No uses pronombres ambiguos (ej: "Su teoría" -> "La teoría de Einstein").
4. CONEXIONES: Usa los IDs generados (chunk_1, chunk_2...) y los related_ids identificados en el grafo anterior.

SALIDA ESPERADA (JSON):
Devuelve ÚNICAMENTE una lista de objetos JSON con esta estructura exacta:

[
  {{
    "id": "chunk_1",
    "text": "Texto explicativo o bloque de código/fórmula...",
    "related_ids": ["chunk_2", "chunk_5"] 
    "type": "Practical" | "Theoretical" esto ayuda a identificar si esto se tine que practicar o solo memorizar
  }},
  ...
]

NOTA SOBRE related_ids:
- Usa SOLO los IDs que tú mismo has generado en esta lista (chunk_X).
"""
]
