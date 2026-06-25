# beHuman — atajos de desarrollo del monorepo.
# Scaffolding: muchos targets son stubs hasta que implementemos cada parte.

.PHONY: help install setup-hooks web-dev contracts-build circuit-compile circuit-setup \
        circuit-prove deploy e2e test test-tdd pre-commit clean

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instala los workspaces JS (web, packages/*, issuer, api, curation)
	npm install

setup-hooks: ## Instala pre-commit en .venv e registra git hooks
	bash scripts/setup-pre-commit.sh

web-dev: ## Levanta el frontend React (web/)
	npm run dev --workspace web

contracts-build: ## Compila los contratos Soroban a wasm (ambas capas)
	stellar contract build

circuit-compile: ## Compila el circuito Circom (CAPA 1)
	bash identity/circuits/scripts/compile.sh

circuit-setup: ## Trusted setup (powers of tau + zkey)
	bash identity/circuits/scripts/setup.sh

circuit-prove: ## Genera una prueba de ejemplo
	bash identity/circuits/scripts/prove.sh

deploy: ## Despliega los contratos a testnet
	bash scripts/deploy_testnet.sh

e2e: ## Corre la demo end-to-end (lo que graba el video)
	bash scripts/e2e_demo.sh

test: ## Corre los tests de todos los componentes
	npm run test --workspaces --if-present
	cargo test

test-tdd: ## Tests del scope TDD (web + curation)
	npm run test:tdd

pre-commit: ## Quality gate local (typecheck + lint web + test:tdd)
	npm run pre-commit

clean: ## Limpia artefactos de build
	rm -rf node_modules **/node_modules **/dist target identity/circuits/build
