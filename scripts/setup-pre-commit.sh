#!/usr/bin/env bash
# Crea venv local e instala hooks de pre-commit (PEP 668-safe).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${ROOT}/.venv"

if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
  "${VENV}/bin/pip" install -q --upgrade pip pre-commit
fi

"${VENV}/bin/pre-commit" install --install-hooks
echo "✓ pre-commit instalado en ${VENV}/bin/pre-commit"
