CHUNK_PROMPTS = [
"""
Rol: Eres un extractor de conocimiento puro y un experto en la Técnica de Feynman.

Tu tarea: Desglosar el texto en "unidades de información" independientes (ideas atómicas).

Reglas estrictas de extracción y lenguaje:

CERO CONOCIMIENTO EXTERNO (¡CRÍTICO!): Cíñete única y exclusivamente a la información proporcionada en el texto base. NO agregues datos, contexto histórico, definiciones adicionales ni explicaciones que no estén explícitamente en el material original, incluso si sabes que son correctos o están relacionados. Si no está en el texto, no existe.

Lenguaje Llano (Plain Language): Reescribe cada idea extraída asumiendo que el lector tiene cero conocimiento previo. Sustituye la jerga compleja por lenguaje cotidiano y directo, pero basándote solo en lo que el texto explica.

Atomicidad: Cada idea debe tener sujeto, acción y contexto. Si una oración tiene dos hechos, divídela.

Preservación: Mantén intactas las fórmulas matemáticas, bloques de código o comandos.

CERO PAJA (Ahorro de Tokens): No incluyas saludos, texto introductorio, ni resúmenes. Omite redundancias del texto original.

Formato de salida esperado:
Devuelve ÚNICAMENTE una lista enumerada.

[Idea reescrita de forma simple e independiente, estrictamente basada en el texto]

[Idea reescrita de forma simple e independiente, estrictamente basada en el texto]

Texto a analizar:
{input}
""",

"""
Rol: Eres un procesador de topología de datos.

Contexto: Analiza la siguiente lista de unidades de información numeradas.

Ideas:
{input}

Tu tarea: Mapear las conexiones lógicas directas entre estas ideas.

Reglas de mapeo:

Identifica qué idea (Nodo Origen) se conecta lógicamente con otra (Nodo Destino).

Usa un vocabulario estandarizado para la relación (ej. CAUSA, DEFINE_A, EXPANDE, CONTRADICE, EJEMPLIFICA_A).

CERO PAJA: No expliques por qué se conectan. No uses texto introductorio. No generes diagramas visuales.

Formato de Salida requerido:
Devuelve ÚNICAMENTE la lista de relaciones directas con este formato exacto:
[Número de Idea Origen] -> (RELACIÓN) -> [Número de Idea Destino]
""",

"""
Rol: Eres un formateador estricto de datos en JSON.

Contexto: Recibirás las ideas atómicas y sus conexiones mapeadas.

Análisis Previo (Ideas y Conexiones):
{input}

Reglas de generación:

Autonomía: El campo "text" debe entenderse por sí solo sin contexto externo (resuelve pronombres ambiguos).

Preservación: Si el texto es código o una fórmula, consérvalo tal cual dentro del string.

Mapeo de IDs: Asigna un ID secuencial (chunk_1, chunk_2, etc.) a cada idea. En el campo related_ids, incluye SOLO los IDs de los chunks con los que tiene conexión según el mapa proporcionado.

SALIDA ESPERADA:
Devuelve ÚNICAMENTE una lista de objetos JSON válida. NO incluyas formato Markdown (```json), no incluyas saludos ni explicaciones. Solo el array crudo:

[
{{
"id": "chunk_1",
"text": "el texto de la idea",
"related_ids": ["chunk_2", "chunk_5"],
"type": "Practical" | "Theoretical"
}}
]
"""
]
 