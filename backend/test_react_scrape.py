import asyncio
import json
import os
import sys
import time
from app.ai.chunker import atomize_text

async def main():
    input_file = "react_docs.txt"
    output_file = "react_atomized.json"
    
    # 1. Leer el texto guardado
    if not os.path.exists(input_file):
        print(f"Error: {input_file} no existe")
        return
        
    with open(input_file, 'r') as f:
        text = f.read()
        
    print(f"🚀 Iniciando atomización profunda de React Docs ({len(text)} caracteres)...")
    
    try:
        # 2. Ejecutar el flujo de 3 pasos (ahora con preservación de código)
        # El backend ya tiene las pausas de 10s entre pasos
        result = await atomize_text(text)
        
        # 3. Guardar resultado
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
            
        print(f"✅ Proceso completado. Resultado guardado en {output_file}")
        
    except Exception as e:
        print(f"❌ Error en el proceso: {e}")

if __name__ == "__main__":
    asyncio.run(main())
