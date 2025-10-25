# ⚽ TeamPulse

Modern football team statistics platform with real-time match tracking, admin dashboard and analytics.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + TypeScript + Express
- **Architecture**: Hexagonal Architecture (Ports & Adapters)
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel

## 📦 Project Structure

```
team-pulse/
├── apps/
│   ├── web/          # Frontend React application
│   └── api/          # Backend API
├── packages/
│   └── shared/       # Shared types and domain logic
└── package.json      # Monorepo root
```

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm globally if you don't have it
npm install -g pnpm

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Development

- Frontend will run on: `http://localhost:5173`
- API will run on: `http://localhost:3000`

## 📝 Features (Coming Soon)

- [ ] Admin authentication
- [ ] Match management (create, edit, delete)
- [ ] Real-time match data entry
- [ ] Player statistics
- [ ] Team analytics dashboard
- [ ] Mobile-responsive design

## 🏗️ Architecture

This project follows **Hexagonal Architecture** principles with:
- Domain-driven design (DDD)
- Test-driven development (TDD)
- Clean separation of concerns
- Framework-agnostic business logic

## 📄 License

MIT
