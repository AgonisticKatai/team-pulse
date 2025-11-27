#!/bin/bash

# Script helper para configurar GitHub Secrets
# Uso: ./setup-secrets.sh

set -e

echo "🔐 GitHub Secrets Setup Helper"
echo "================================"
echo ""
echo "Este script te ayudará a configurar los secrets necesarios para el CI/CD pipeline."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) no está instalado${NC}"
    echo ""
    echo "Instálalo con:"
    echo "  macOS: brew install gh"
    echo "  Linux: https://github.com/cli/cli#installation"
    echo ""
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: No estás autenticado con GitHub CLI${NC}"
    echo ""
    echo "Autentícate con: gh auth login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} GitHub CLI detectado y autenticado"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repositorio: $REPO"
echo ""

# Function to set secret
set_secret() {
    local name=$1
    local description=$2
    local example=$3
    local optional=$4

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔑 Secret: $name"
    echo "📝 Descripción: $description"

    if [ ! -z "$example" ]; then
        echo "💡 Ejemplo: $example"
    fi

    if [ "$optional" = "true" ]; then
        echo -e "${YELLOW}⚠️  Opcional${NC}"
        read -p "¿Quieres configurar este secret? (y/n): " configure
        if [ "$configure" != "y" ]; then
            echo "Saltando..."
            echo ""
            return
        fi
    fi

    read -sp "Ingresa el valor (oculto): " value
    echo ""

    if [ -z "$value" ]; then
        echo -e "${RED}❌ Valor vacío. Saltando...${NC}"
        echo ""
        return
    fi

    # Set the secret
    echo "$value" | gh secret set "$name" --repo "$REPO"
    echo -e "${GREEN}✓${NC} Secret '$name' configurado correctamente"
    echo ""
}

echo "Vamos a configurar los secrets necesarios..."
echo ""
sleep 1

# Required secrets
echo "═══════════════════════════════════════════"
echo "   SECRETS OBLIGATORIOS"
echo "═══════════════════════════════════════════"
echo ""

set_secret "DATABASE_URL" \
    "URL de conexión a PostgreSQL (Neon)" \
    "postgresql://user:password@host.neon.tech/dbname?sslmode=require"

set_secret "VERCEL_TOKEN" \
    "Token de autenticación de Vercel (vercel.com/account/tokens)" \
    "v1_xxxxxxxxxxxxxxxxxxxxxx"

set_secret "VERCEL_ORG_ID" \
    "Organization ID de Vercel (corre 'vercel link' y mira .vercel/project.json)" \
    "team_xxxxxxxxxxxxxxxxxxxx"

set_secret "VERCEL_PROJECT_ID" \
    "Project ID de Vercel (corre 'vercel link' y mira .vercel/project.json)" \
    "prj_xxxxxxxxxxxxxxxxxxxxx"

# Optional secrets
echo ""
echo "═══════════════════════════════════════════"
echo "   SECRETS OPCIONALES"
echo "═══════════════════════════════════════════"
echo ""

set_secret "CODECOV_TOKEN" \
    "Token de Codecov para reportes de cobertura (codecov.io)" \
    "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
    "true"

set_secret "SLACK_WEBHOOK_URL" \
    "Webhook URL para notificaciones en Slack" \
    "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX" \
    "true"

echo ""
echo "═══════════════════════════════════════════"
echo "   RESUMEN"
echo "═══════════════════════════════════════════"
echo ""

# List all secrets
echo "Secrets configurados:"
gh secret list --repo "$REPO"

echo ""
echo -e "${GREEN}✓${NC} Setup completado!"
echo ""
echo "Próximos pasos:"
echo "  1. Verifica los secrets en: https://github.com/$REPO/settings/secrets/actions"
echo "  2. Haz push a main para probar el pipeline"
echo "  3. Monitorea el progreso en: https://github.com/$REPO/actions"
echo ""
