# TeamPulse API - HTTP Requests Collection

Esta carpeta contiene colecciones de requests HTTP para probar la API de TeamPulse usando la extensión **REST Client** de VSCode.

## 📋 Prerequisitos

1. **Instalar la extensión REST Client**
   - Abre VSCode
   - Ve a Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Busca "REST Client" (por Huachao Mao)
   - Instala la extensión

2. **Iniciar el servidor de desarrollo**
   ```bash
   pnpm dev
   ```

3. **Asegúrate de tener usuarios de prueba creados**
   - Ejecuta seeds si es necesario
   - O crea usuarios manualmente usando los endpoints

## 📁 Estructura de Archivos

```
http/
├── auth.http               # Autenticación (login, logout, refresh)
├── users.http              # Gestión de usuarios
├── teams.http              # Gestión de equipos (CRUD completo)
├── health.http             # Health checks y métricas
├── .gitignore              # Ignora archivos sensibles
└── README.md               # Esta guía
```

## 🚀 Cómo Usar

### 1. Seleccionar Entorno

REST Client usa variables definidas en `.vscode/settings.json`. Para cambiar de entorno:

1. Mira la barra de estado de VSCode (abajo)
2. Click en el selector de entorno (dice "local", "staging", o "production")
3. Selecciona el entorno que quieras usar

**Entornos disponibles:**
- `local` - Desarrollo local (http://localhost:3000)
- `staging` - Servidor de staging (configúralo en settings.json)
- `production` - Servidor de producción (configúralo en settings.json)

### 2. Ejecutar Requests

1. Abre cualquier archivo `.http` (ej: `auth.http`)
2. Verás los requests separados por `###`
3. Haz click en **"Send Request"** que aparece encima de cada request
4. O usa el atajo: `Ctrl+Alt+R` (Windows/Linux) o `Cmd+Alt+R` (Mac)

### 3. Flujo de Trabajo Típico

#### Opción A: Usuario Normal (USER)
```http
1. Ejecutar "Login as USER" en auth.http
2. Ejecutar "Get current user info" para verificar
3. Ejecutar "List teams" en teams.http
4. Ejecutar "Get team by ID" en teams.http
```

#### Opción B: Administrador (ADMIN)
```http
1. Ejecutar "Login as ADMIN" en auth.http
2. Ejecutar "Create a new team" en teams.http
3. Ejecutar "Update team" en teams.http
4. Ejecutar "Create a new user" en users.http
```

#### Opción C: Super Admin (SUPER_ADMIN)
```http
1. Ejecutar "Login as SUPER_ADMIN" en auth.http
2. Ejecutar cualquier operación (acceso completo)
```

## 🔑 Autenticación

### Persistencia Automática de Tokens

REST Client usa **named requests** para referenciar automáticamente respuestas de requests anteriores:

```http
### Login as ADMIN
# @name loginAsAdmin
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}

### Usar el token automáticamente
GET {{baseUrl}}/api/teams
Authorization: Bearer {{loginAsAdmin.response.body.data.accessToken}}
```

**Cómo funciona:**
1. Ejecuta un request de login (ej: "Login as ADMIN")
2. El request está marcado con `# @name loginAsAdmin`
3. Otros requests referencian el token con `{{loginAsAdmin.response.body.data.accessToken}}`
4. ¡No necesitas copiar/pegar nada!

Después de login, todos los requests autenticados acceden automáticamente al token.

### Expiración de Tokens

Si recibes error 401:
1. Ejecuta "Refresh access token" en `auth.http`
2. O vuelve a hacer login

## 📝 Variables Disponibles

### Variables de Entorno (configuradas en .vscode/settings.json)
- `{{baseUrl}}` - URL base de la API (cambia según entorno seleccionado)
- `{{userEmail}}` - Email del usuario USER (compartido entre entornos)
- `{{userPassword}}` - Password del usuario USER
- `{{adminEmail}}` - Email del usuario ADMIN
- `{{adminPassword}}` - Password del usuario ADMIN
- `{{superAdminEmail}}` - Email del usuario SUPER_ADMIN
- `{{superAdminPassword}}` - Password del usuario SUPER_ADMIN

### Variables Dinámicas (Named Requests)

REST Client permite referenciar respuestas de requests anteriores usando named requests:

**Tokens de autenticación:**
- `{{loginAsUser.response.body.data.accessToken}}` - Token del usuario USER
- `{{loginAsAdmin.response.body.data.accessToken}}` - Token del usuario ADMIN
- `{{loginAsSuperAdmin.response.body.data.accessToken}}` - Token del usuario SUPER_ADMIN
- `{{loginAsAdmin.response.body.data.refreshToken}}` - Refresh token

**IDs de equipos:**
- `{{createTeam.response.body.data.id}}` - ID del equipo creado (Real Madrid)
- `{{createTestTeam.response.body.data.id}}` - ID del equipo de prueba

**Cualquier dato de respuesta:**
Puedes acceder a cualquier campo de la respuesta de un request nombrado:
```http
# @name myRequest
POST {{baseUrl}}/api/endpoint

### Luego úsalo
GET {{baseUrl}}/api/other/{{myRequest.response.body.data.someField}}
```

## 🎯 Casos de Uso Comunes

### Testing de un Nuevo Endpoint

1. Añade el request al archivo correspondiente:
```http
### Mi nuevo endpoint
POST {{baseUrl}}/api/mi-endpoint
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "campo": "valor"
}
```

2. Ejecuta el request
3. Verifica la respuesta

### Testing de Validaciones

Cada archivo incluye casos de error para probar validaciones:
- Campos requeridos faltantes
- Formatos inválidos
- Límites excedidos
- Autenticación/Autorización

### Testing de RBAC (Roles)

Prueba diferentes roles:
1. Login como USER → Intenta crear equipo → Debería fallar (403)
2. Login como ADMIN → Crea equipo → Debería funcionar (200)

## 🔧 Tips y Trucos

### Ver Historial de Requests
- REST Client guarda un historial
- Accede con `Ctrl+Shift+P` → "Rest Client: Request History"

### Guardar Responses
Las responses se muestran en un panel temporal. Para guardarlas:
1. Click en el icono de guardar en el panel de response
2. O copia manualmente el contenido

### Personalizar Variables

Para cambiar URLs, credenciales u otros valores, edita `.vscode/settings.json`:

```json
{
  "rest-client.environmentVariables": {
    "$shared": {
      // Variables compartidas entre todos los entornos
      "userEmail": "tu-usuario@test.com",
      "userPassword": "TuPassword123!"
    },
    "local": {
      "baseUrl": "http://localhost:3000"
    },
    "staging": {
      "baseUrl": "https://tu-staging.com"
    }
  }
}
```

**Estructura:**
- `$shared` - Variables globales para todos los entornos
- `local`, `staging`, `production` - Variables específicas de cada entorno
- Las variables específicas sobrescriben las de `$shared`

### Credenciales Personales

Para credenciales sensibles que NO deben commitearse:

1. Crea `.vscode/settings.local.json` (está en .gitignore)
2. Sobrescribe solo las variables que necesites:
```json
{
  "rest-client.environmentVariables": {
    "production": {
      "baseUrl": "https://api-real.com",
      "adminPassword": "PasswordReal123!"
    }
  }
}
```
3. VSCode mezclará automáticamente ambos settings

## 📚 Recursos

- [REST Client - Documentación Oficial](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [RFC 2616 - HTTP/1.1](https://www.rfc-editor.org/rfc/rfc2616)

## ⚠️ Seguridad

- **NUNCA** commitees tokens reales en git
- Usa archivos `*-custom.http` para datos sensibles
- Los archivos `*-custom.http` están en `.gitignore`
- Las credenciales por defecto son SOLO para desarrollo local

## 🤝 Compartir con el Equipo

Todo el equipo puede usar estos archivos:
1. Pull del repo
2. Instalar REST Client
3. Iniciar servidor local
4. Ejecutar requests

Sin necesidad de:
- Cuentas externas (Postman)
- Sincronización cloud
- Aplicaciones adicionales
- Configuración compleja
