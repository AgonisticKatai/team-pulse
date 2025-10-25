# ⚡ TeamPulse - Quick Start

## 🎯 Lo que acabamos de crear

✅ **Monorepo completo** con pnpm workspaces
✅ **Frontend moderno**: React 18 + TypeScript + Vite
✅ **Backend robusto**: Node.js + Express + TypeScript
✅ **Tipos compartidos**: Package común para frontend y backend
✅ **Hot reload** en ambos entornos
✅ **Linting y type checking** configurados
✅ **Responsive design** base implementado

## 🚀 3 Pasos para Empezar

```bash
# 1. Instalar pnpm (si no lo tienes)
npm install -g pnpm

# 2. Instalar dependencias
pnpm install

# 3. Iniciar servidores
pnpm dev
```

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 📁 Estructura Principal

```
team-pulse/
├── apps/
│   ├── web/        → React App (Puerto 5173)
│   └── api/        → Express API (Puerto 3000)
├── packages/
│   └── shared/     → Tipos TypeScript compartidos
└── package.json    → Scripts del monorepo
```

## ✨ Features Actuales

### Frontend (apps/web)
- ⚛️ React 18 con TypeScript
- ⚡ Vite para build ultrarrápido
- 🎨 CSS moderno con gradientes
- 📱 Diseño responsive
- 🔥 Hot Module Replacement

### Backend (apps/api)
- 🚀 Express con TypeScript
- 🔄 CORS configurado
- ✅ Health check endpoint
- 🔥 Watch mode con tsx
- 📝 Logging básico

### Shared (packages/shared)
- 🔷 Tipos TypeScript compartidos
- 👤 User types (admin/viewer)
- 🏟️ Match types (base)
- 📦 Exports organizados

## 🎨 Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Backend** | Node.js 20, Express, TypeScript |
| **Monorepo** | pnpm workspaces |
| **Dev Tools** | ESLint, tsx (watch mode) |
| **Arquitectura** | Hexagonal (próximamente) |

## 📝 Comandos Disponibles

```bash
pnpm dev          # Inicia frontend + backend
pnpm build        # Build de producción
pnpm lint         # Linting en todos los workspaces
pnpm type-check   # Verificación de tipos
```

## 🎯 Próximo Paso

**Deploy en Vercel** 🚀

1. Verificar que todo funciona localmente
2. Hacer commit y push a GitHub
3. Configurar proyecto en Vercel
4. Deploy automático

---

**¿Todo funcionando?** ¡Avísame para continuar con el deploy! 💪
