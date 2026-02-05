import asyncio
import json
import os
import sys
from app.ai.chunker import atomize_text

async def main():
    if len(sys.argv) < 3:
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, 'r') as f:
        text = f.read()
        
    print(f"Procesando {input_file}...")
    result = await atomize_text(text)
    
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    print(f"Guardado en {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
