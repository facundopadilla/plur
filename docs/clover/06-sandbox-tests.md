# 06 — Pruebas en Sandbox

## Resumen de resultados

Todas las pruebas se ejecutaron el **2026-03-21** contra los endpoints sandbox de Clover.

**Resultado general: todos los endpoints responden correctamente** (el sandbox está operativo). Los errores 401 son esperados ya que no tenemos credenciales API configuradas — confirman que los endpoints existen y requieren autenticación.

---

## Pruebas ejecutadas con Python

### Test 1 — Conectividad al Platform API

```python
import requests
r = requests.get('https://apisandbox.dev.clover.com')
print(r.status_code, r.text[:200])
```

**Resultado:**
```
404
<html><body><h1>404 Not Found</h1>
File not found.
</body></html>
```

✅ El servidor responde (404 en root es esperado — no hay endpoint en `/`).

---

### Test 2 — Tokenización con API key inválida

```python
import requests
r = requests.post(
    'https://token-sandbox.dev.clover.com/v1/tokens',
    headers={'apikey': 'INVALID_TEST', 'Content-Type': 'application/json'},
    json={
        'card': {
            'number': '4242424242424242',
            'exp_month': '12',
            'exp_year': '2026',
            'cvv': '123',
            'name': 'Test User'
        }
    }
)
print(r.status_code, r.json())
```

**Resultado:**
```
401
{"message": "401 Unauthorized"}
```

✅ Endpoint existe. Requiere PAKMS `apikey` válida.

---

### Test 3 — Charges sin autenticación

```python
import requests
r = requests.post(
    'https://scl-sandbox.dev.clover.com/v1/charges',
    headers={'Content-Type': 'application/json'},
    json={'amount': 1000, 'currency': 'usd', 'source': 'fake_token'}
)
print(r.status_code, r.json())
```

**Resultado:**
```
401
{"message": "401 Unauthorized"}
```

✅ Endpoint existe. Requiere `Authorization: Bearer {access_token}`.

---

### Test 4 — PAKMS sin autenticación

```python
import requests
r = requests.get('https://scl-sandbox.dev.clover.com/pakms/apikey')
print(r.status_code, r.text)
```

**Resultado:**
```
401
Unauthorized
```

✅ Endpoint existe. Nótese que este endpoint devuelve **plain text**, no JSON.

---

### Test 5 — OAuth token con credenciales inválidas

```python
import requests
r = requests.post(
    'https://apisandbox.dev.clover.com/oauth/v2/token',
    json={
        'client_id': 'TEST_APP_ID',
        'client_secret': 'TEST_SECRET',
        'code': 'TEST_CODE',
        'grant_type': 'authorization_code'
    }
)
print(r.status_code, r.json())
```

**Resultado:**
```
401
{"status": "Unauthorized", "message": "Failed to validate authentication code."}
```

✅ Endpoint existe. Formato de error del OAuth es diferente al Ecommerce Service.

---

### Test 6 — Exploración de rutas

```python
import requests

paths = ['/v1', '/v3', '/v1/charges', '/pakms/apikey']
for path in paths:
    r = requests.get(f'https://scl-sandbox.dev.clover.com{path}')
    print(f'GET {path}: {r.status_code} - {r.text[:100]}')
```

**Resultado:**
```
GET /v1:          404 - 404 Not Found
GET /v3:          404 - 404 Not Found
GET /v1/charges:  401 - {"message":"401 Unauthorized"}
GET /pakms/apikey: 401 - Unauthorized
```

✅ Confirma estructura de rutas: `/v1/charges` y `/pakms/apikey` existen, `/v1` y `/v3` no como paths raíz.

---

## Formatos de error por servicio

| Servicio | Código HTTP | Formato de error |
|----------|-------------|-----------------|
| Ecommerce (`scl-sandbox`) | 401 | `{"message": "401 Unauthorized"}` |
| Platform API (`apisandbox`) | 401 | `{"status": "Unauthorized", "message": "..."}` |
| PAKMS | 401 | `Unauthorized` (plain text) |

**Importante para el manejo de errores en Plur:** el cliente HTTP debe manejar los tres formatos.

---

## Próximos pasos para pruebas completas

Para hacer pruebas end-to-end reales se necesita:

### 1. Crear cuenta de desarrollador en sandbox

1. Ir a `https://sandbox.dev.clover.com/developer-home`
2. Registrarse con email
3. Confirmar email y configurar 2FA
4. Crear una app → obtener `APP_ID` y `APP_SECRET`
5. Crear un merchant de prueba → obtener `MERCHANT_ID`

### 2. Obtener access_token

```python
import webbrowser, urllib.parse

APP_ID = "your_app_id"
REDIRECT_URI = "http://localhost:8000/callback"

auth_url = (
    f"https://sandbox.dev.clover.com/oauth/v2/authorize"
    f"?client_id={APP_ID}"
    f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
    f"&response_type=code"
    f"&state=plur_test_123"
)
webbrowser.open(auth_url)
# El redirect_uri recibirá ?code=XXX&merchant_id=YYY
```

### 3. Intercambiar código por tokens

```python
import requests

APP_ID = "your_app_id"
APP_SECRET = "your_app_secret"
AUTH_CODE = "code_from_redirect"
REDIRECT_URI = "http://localhost:8000/callback"

r = requests.post(
    'https://apisandbox.dev.clover.com/oauth/v2/token',
    json={
        'client_id': APP_ID,
        'client_secret': APP_SECRET,
        'code': AUTH_CODE,
        'grant_type': 'authorization_code',
        'redirect_uri': REDIRECT_URI
    }
)
tokens = r.json()
ACCESS_TOKEN = tokens['access_token']
print("Access token:", ACCESS_TOKEN)
```

### 4. Obtener PAKMS key

```python
import requests

r = requests.get(
    'https://scl-sandbox.dev.clover.com/pakms/apikey',
    headers={'Authorization': f'Bearer {ACCESS_TOKEN}'}
)
PAKMS_KEY = r.json()['apiAccessKey']
print("PAKMS Key:", PAKMS_KEY)
```

### 5. Tokenizar tarjeta de prueba

```python
import requests

PAKMS_KEY = "your_pakms_key"

r = requests.post(
    'https://token-sandbox.dev.clover.com/v1/tokens',
    headers={
        'apikey': PAKMS_KEY,
        'Content-Type': 'application/json'
    },
    json={
        'card': {
            'number': '4242424242424242',  # Visa test card
            'exp_month': '12',
            'exp_year': '2026',
            'cvv': '123',
            'name': 'Test Plur User'
        }
    }
)
token_data = r.json()
CARD_TOKEN = token_data['id']
print("Card token:", CARD_TOKEN)  # clv_1XXXX...
```

### 6. Crear cobro de prueba

```python
import requests, uuid

ACCESS_TOKEN = "your_access_token"
CARD_TOKEN = "clv_1XXX..."

r = requests.post(
    'https://scl-sandbox.dev.clover.com/v1/charges',
    headers={
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json',
        'idempotency-key': str(uuid.uuid4()),
        'x-forwarded-for': '192.168.1.1'
    },
    json={
        'amount': 100000,  # ARS 1000.00
        'currency': 'ars',
        'source': CARD_TOKEN,
        'capture': True,
        'ecomind': 'ecom',
        'description': 'Test: 100 tokens PLR',
        'metadata': {
            'user_id': '1',
            'token_package': '100'
        }
    }
)
print(r.status_code, r.json())
```

---

## Tarjetas de prueba (Sandbox)

### Tarjetas que aprueban

| Marca | Número | Notas |
|-------|--------|-------|
| Visa | `4242 4242 4242 4242` | Aprobación estándar |
| Visa (débito) | `4000 0566 5566 5556` | Débito |
| Visa (aprobación parcial) | `4005 5780 0333 3335` | Código respuesta 2 |
| American Express | `3782 8224 6310 005` | Aprobación |
| Diners Club | `3056 9309 0259 04` | Aprobación |
| JCB | `3566 0020 2036 0505` | Aprobación |

### Tarjetas que rechazan

| Marca | Número | Código de respuesta |
|-------|--------|---------------------|
| Visa | `4005 5717 0222 2222` | 500 — Decline |
| Mastercard | `5424 1802 7333 3333` | Decline |

### Activar errores por monto

El sandbox tiene un truco especial: los **últimos 3 dígitos del monto** determinan el código de respuesta:
- `$1.16` (amount=116) → código de error 116
- `$45.67` → "No Host Response" (simula timeout)
- Montos **bajo** $100.00 → siempre aprobado
- Montos **sobre** $100.00 → error según últimos 3 dígitos

### CVV y vencimiento
- CVV/CVC: cualquier 3 dígitos (ej: `123`)
- Vencimiento: cualquier fecha futura (ej: `12/2026`)
