import requests
import json

url = "http://localhost:8000/api/atomize"
payload = {
    "text": "Cristóbal Colón (¿1451?–1506) fue un navegante y gobernante de las Indias Occidentales al servicio de la Corona de Castilla que encabezó el Descubrimiento de América en 1492. Aunque sus orígenes son discutidos, la hipótesis más extendida sugiere que Cristóbal Colón nació en Génova, posiblemente el 31 de octubre de 1451."
}

try:
    print(f"Enviando request a: {url}")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("--- RESPUESTA EXITOSA ---")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Excepción al conectar: {e}")
