#!/usr/bin/env bash
set -euo pipefail

echo "=============================================================="
echo "   Local AI Hardware Qualification Suite - Partner Test Station"
echo "   Shenzhen & Global OEM Factory Acceptance Runner"
echo "=============================================================="
echo ""

echo "[1/3] Probing Machine Hardware Topology..."
npx tsx src/cli/runner.ts env

echo ""
echo "Select Test Workload Archetype:"
echo "  1. Enterprise RAG & Document QA (Llama 3.1 8B, 8 streams)"
echo "  2. Customer Support Chatbot (Llama 3.2 3B, 32 streams)"
echo "  3. Developer Code Assistant (Qwen 2.5 14B INT8, 4 streams)"
echo "  4. Autonomous Agentic Reasoner (Llama 3.3 70B INT4, 2 streams)"
echo ""
read -r -p "Enter selection [1-4, default 1]: " choice
choice=${choice:-1}

ARCHETYPE="enterprise-rag"
case "$choice" in
  1) ARCHETYPE="enterprise-rag" ;;
  2) ARCHETYPE="customer-support" ;;
  3) ARCHETYPE="code-assistant" ;;
  4) ARCHETYPE="agentic-reasoner" ;;
  *) ARCHETYPE="enterprise-rag" ;;
esac

echo ""
echo "[2/3] Executing Automated Benchmark Suite for '${ARCHETYPE}'..."
echo "Telemetry sampling running in background at 100ms intervals..."
echo ""

mkdir -p ./factory_acceptance_reports
npx tsx src/cli/runner.ts run --archetype "${ARCHETYPE}" --profile "OEM Partner Factory Delivery Acceptance" --out ./factory_acceptance_reports

echo ""
echo "[3/3] Factory Acceptance Run Complete!"
echo "Qualification artifacts written to: ./factory_acceptance_reports/"
echo ""
