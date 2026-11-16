#!/bin/bash
# Career AutoApply · avvio guidato per macOS (senza ChatGPT Work)
set -euo pipefail

cd "$(dirname "$0")"

echo ""
echo "============================================="
echo "      Career AutoApply · MacBook Air"
echo "============================================="
echo ""
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js non e' installato."
  echo "Installa la versione LTS da https://nodejs.org/"
  echo "Poi riapri il Terminale e rilancia questo script."
  exit 1
fi
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0])>=20?0:1)'; then
  echo "Questa versione richiede Node.js 20 o superiore."
  echo "Aggiorna Node.js tramite https://nodejs.org/"
  exit 1
fi

echo "1/4 · Installazione dipendenze (se servono)"
npm install --no-audit --no-fund
echo ""
echo "2/4 · Verifica browser Chromium Playwright"
npx playwright install chromium
echo ""
if [[ ! -f "config.local.json" ]]; then
  echo "3/4 · Prima configurazione dei tuoi dati e CV"
  npm run setup
else
  echo "3/4 · Configurazione locale gia' presente"
fi
echo ""
echo "4/4 · Avvio assistente di compilazione"
echo "La candidatura va inviata manualmente sul sito."
echo ""
if (( $# == 0 )); then
  npm start -- --date=2026-11-16
else
  npm start -- "$@"
fi
