import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_save():
    print("\n--- 1. GUARDANDO DATOS DE PRUEBA ---")
    payload = {
        "title": "Biografía de Colón",
        "chunks": [
            {
                "id": "chunk_1",
                "text": "Cristóbal Colón fue un navegante que sirvió a la Corona de Castilla y encabezó el Descubrimiento de América en 1492.",
                "tags": ["historia", "america"],
                "related_ids": ["chunk_2"]
            },
            {
                "id": "chunk_2",
                "text": "Se cree que Colón nació en Génova alrededor de 1451, aunque su origen exacto es debatido.",
                "tags": ["biografia", "genova"],
                "related_ids": ["chunk_1"]
            }
        ]
    }
    
    try:
        res = requests.post(f"{BASE_URL}/save", json=payload)
        print(f"Status Save: {res.status_code}")
        print(res.json())
    except Exception as e:
        print(f"Error saving: {e}")

def test_find():
    print("\n--- 2. BUSCANDO SIMILITUD ---")
    # Buscamos algo que debería coincidir con el chunk_1
    query = "el descubrimiento del nuevo mundo por parte de castilla" 
    
    payload = {
        "text": query,
        "threshold": 0.5 # Bajamos umbral para asegurar match
    }
    
    try:
        res = requests.post(f"{BASE_URL}/find_similar", json=payload)
        print(f"Status Find: {res.status_code}")
        if res.status_code == 200:
            results = res.json().get('similar', [])
            print(f"Encontrados: {len(results)}")
            for r in results:
                print(f" - [Match {r['similarity']:.2f}] {r['content'][:50]}... (Tags: {r.get('tags')})")
        else:
            print(res.text)
    except Exception as e:
        print(f"Error finding: {e}")

if __name__ == "__main__":
    test_save()
    time.sleep(1) # Dar un respiro a la DB
    test_find()
