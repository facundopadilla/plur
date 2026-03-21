# 02 — Autenticación y OAuth 2.0

## Flujos disponibles

### A. Authorization Code Flow (apps de servidor — recomendado para Plur)

El más seguro. El `client_secret` se guarda en el servidor y nunca se expone al cliente.

```
1. Redirigir al usuario a la URL de autorización de Clover
2. Clover redirige de vuelta con un código de autorización
3. El servidor intercambia el código por tokens (access_token + refresh_token)
4. Usar access_token para llamadas a la API
5. Cuando expira, usar refresh_token para obtener uno nuevo
```

#### Paso 1 — URL de autorización

```
GET https://sandbox.dev.clover.com/oauth/v2/authorize
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT_URI}
  &response_type=code
  &state={STATE_ALEATORIO}
```

**Producción LATAM:**
```
GET https://www.la.clover.com/oauth/v2/authorize
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT_URI}
  &response_type=code
  &state={STATE_ALEATORIO}
```

#### Paso 2 — Clover redirige con el código

```
https://tu-app.com/callback?code={AUTHORIZATION_CODE}&merchant_id={MERCHANT_ID}
```

#### Paso 3 — Intercambiar código por tokens

```
POST https://apisandbox.dev.clover.com/oauth/v2/token
Content-Type: application/json

{
  "client_id": "{APP_ID}",
  "client_secret": "{APP_SECRET}",
  "code": "{AUTHORIZATION_CODE}",
  "grant_type": "authorization_code",
  "redirect_uri": "{REDIRECT_URI}"
}
```

**Respuesta:**
```json
{
  "access_token": "ab86a5e8-48f3-b3bd-8c45-d415e9867833",
  "refresh_token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

#### Paso 4 — Renovar el access_token

```
POST https://apisandbox.dev.clover.com/oauth/v2/refresh
Authorization: Bearer {refresh_token}
```

---

### B. PKCE Flow (apps móviles / SPA — sin client_secret)

Para cuando el `client_secret` no puede guardarse de forma segura.

```python
import hashlib, base64, secrets

# Generar code_verifier (random string)
code_verifier = secrets.token_urlsafe(64)

# Derivar code_challenge = SHA256(code_verifier) en base64url
digest = hashlib.sha256(code_verifier.encode()).digest()
code_challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()
```

```
# Paso 1: Autorización incluye code_challenge
GET https://sandbox.dev.clover.com/oauth/v2/authorize
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT_URI}
  &response_type=code
  &code_challenge={code_challenge}
  &code_challenge_method=SHA256

# Paso 2: Exchange incluye code_verifier en lugar de client_secret
POST /oauth/v2/token
{
  "client_id": "{APP_ID}",
  "code": "{AUTHORIZATION_CODE}",
  "code_verifier": "{code_verifier}",
  "grant_type": "authorization_code"
}
```

---

## Formato del header de autenticación

Todas las llamadas al servidor usan:

```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
x-forwarded-for: {ip_del_cliente}  # recomendado para antifraude
```

---

## PAKMS — Clave pública para tokenización

La tokenización de tarjetas en el cliente requiere una clave pública diferente al `access_token`. Se obtiene con:

```
GET https://scl-sandbox.dev.clover.com/pakms/apikey
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
{
  "apiAccessKey": "1a2b3c4d5e6f..."
}
```

Esta `apiAccessKey` se usa en el frontend/cliente para tokenizar la tarjeta sin exponer datos sensibles al servidor.

---

## URLs de autenticación por entorno

| Entorno | Authorize | Token | Refresh |
|---------|-----------|-------|---------|
| **Sandbox** | `https://sandbox.dev.clover.com/oauth/v2/authorize` | `https://apisandbox.dev.clover.com/oauth/v2/token` | `https://apisandbox.dev.clover.com/oauth/v2/refresh` |
| **Producción NA** | `https://www.clover.com/oauth/v2/authorize` | `https://api.clover.com/oauth/v2/token` | `https://api.clover.com/oauth/v2/refresh` |
| **Producción LATAM** | `https://www.la.clover.com/oauth/v2/authorize` | `https://api.la.clover.com/oauth/v2/token` | `https://api.la.clover.com/oauth/v2/refresh` |
| **Producción EU** | `https://www.eu.clover.com/oauth/v2/authorize` | `https://api.eu.clover.com/oauth/v2/token` | `https://api.eu.clover.com/oauth/v2/refresh` |

---

## Notas importantes

- Apps creadas **después de octubre 2023** deben usar v2 OAuth con par de tokens (access + refresh). El token único legacy está deprecado.
- El `state` en OAuth es para contexto de sesión — nunca poner datos sensibles ahí.
- Clover limita la cantidad de refresh tokens activos por merchant por app.
- El `merchant_id` viene en el redirect de OAuth — es el ID único del comercio en Clover.
