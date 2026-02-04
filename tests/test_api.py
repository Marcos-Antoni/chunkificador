import requests
import json

# Leemos el archivo prueba.txt
try:
    with open("prueva.txt", "r", encoding="utf-8") as f:
        text_content = f.read()

    print(f"Texto leído ({len(text_content)} caracteres). Enviando al cerebro...")

    # Enviamos la petición
    response = requests.post(
        "http://localhost:8000/api/atomize",
        headers={"Content-Type": "application/json"},
        data=json.dumps({"text": text_content})
    )

    print(f"Status Code: {response.status_code}")
    print("--- RESPONSE BODY ---")
    data = response.json()
    if "detail" in data:
        print(data['detail'])
    else:
        print(data)
    print("---------------------")

except Exception as e:
    print(f"Error fatal en el script de prueba: {e}")
