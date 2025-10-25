# 🚀 TeamPulse - Guía de Instalación Paso a Paso

## Estructura del Proyecto Creada

```
team-pulse/
├── apps/
│   ├── web/              # Frontend React + Vite + TypeScript
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── App.css
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── vite.config.ts
│   │
│   └── api/              # Backend Node + Express + TypeScript
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
│
├── packages/
│   └── shared/           # Tipos compartidos
│       ├── src/
│       │   ├── index.ts
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
│
├── .gitignore
├── package.json          # Root monorepo
├── pnpm-workspace.yaml
└── README.md
```

## Pasos de Instalación

### 1. Copiar archivos al proyecto

Todos los archivos están en la carpeta que te he compartido. Cópialos a tu repositorio:

```bash
cd ~/AgonisticKatai/team-pulse

# Copia todos los archivos (incluyendo los ocultos)
# Asegúrate de copiar: .gitignore, package.json, pnpm-workspace.yaml, etc.
```

### 2. Instalar pnpm (si no lo tienes)

```bash
npm install -g pnpm
```

### 3. Instalar dependencias

```bash
pnpm install
```

Esto instalará todas las dependencias de:
- Root del monorepo
- Frontend (apps/web)
- Backend (apps/api)
- Shared (packages/shared)

### 4. Configurar el backend

```bash
cd apps/api
cp .env.example .env
```

El `.env` ya tiene valores por defecto que funcionarán para desarrollo local.

### 5. Iniciar los servidores de desarrollo

Desde la raíz del proyecto:

```bash
pnpm dev
```

Este comando iniciará ambos servidores en paralelo:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

### 6. Verificar que todo funciona

**Frontend**: Abre tu navegador en http://localhost:5173
- Deberías ver la página de bienvenida de TeamPulse
- Prueba el botón de clicks para verificar que React funciona

**Backend**: Prueba el health check
```bash
curl http://localhost:3000/api/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "message": "TeamPulse API is running",
  "timestamp": "2025-10-25T...",
  "environment": "development"
}
```

### 7. Commit inicial

```bash
git add .
git commit -m "Initial project setup with React + TypeScript + Express"
git push origin main
```

## Comandos Útiles

```bash
# Desarrollo (ambos servidores)
pnpm dev

# Solo frontend
cd apps/web && pnpm dev

# Solo backend
cd apps/api && pnpm dev

# Build de producción
pnpm build

# Linting
pnpm lint

# Type checking
pnpm type-check
```

## Próximos Pasos

Una vez que todo funcione localmente:

1. ✅ Verificar que frontend y backend funcionan
2. 🚀 Deploy inicial en Vercel
3. 🔐 Configurar autenticación básica
4. 📊 Empezar con el primer feature

## Notas Importantes

- **Hot Reload**: Ambos servidores tienen hot reload activado
- **Proxy**: El frontend está configurado para hacer proxy de `/api/*` al backend
- **TypeScript**: Todo el código es TypeScript con strict mode
- **ESLint**: Configurado con reglas estrictas para mantener calidad de código
- **Monorepo**: pnpm workspaces gestiona las dependencias compartidas

## Solución de Problemas

### Puerto ocupado
Si el puerto 5173 o 3000 están ocupados:
```bash
# Mata el proceso en el puerto
npx kill-port 5173
npx kill-port 3000
```

### Error de dependencias
```bash
# Limpia e reinstala
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Error de TypeScript
```bash
# Verifica errores de tipos
pnpm type-check
```

---

¿Todo listo? ¡Avísame cuando lo tengas funcionando para pasar al siguiente paso! 🚀
