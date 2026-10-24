#!/usr/bin/env bash
# Run this on EC2 while the existing Java backend is still running.
# It writes private migration backups outside the Git repository.
set -euo pipefail

BASE_URL="${1:-http://localhost}"
OUT_DIR="${2:-$HOME/cloudinventory-migration-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT_DIR"
umask 077

curl --fail --silent --show-error "$BASE_URL/api/products" > "$OUT_DIR/products.json"
curl --fail --silent --show-error "$BASE_URL/api/orders" > "$OUT_DIR/orders.json"

python3 - "$OUT_DIR/products.json" "$OUT_DIR/orders.json" <<'PY'
import json, sys
for label, path in zip(("products", "orders"), sys.argv[1:]):
    with open(path, encoding="utf-8") as stream:
        rows = json.load(stream)
    if not isinstance(rows, list):
        raise SystemExit(f"Export failed: {label} response was not a JSON array")
    print(f"Exported {len(rows)} {label}")
PY
chmod 600 "$OUT_DIR/products.json" "$OUT_DIR/orders.json"
printf '\nMigration backup created in: %s\n' "$OUT_DIR"
printf 'Keep this folder private and do not commit it to Git.\n'
