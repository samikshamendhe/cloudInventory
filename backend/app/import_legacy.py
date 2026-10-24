"""Import product and order JSON exported from the existing Spring Boot API.

Usage in the Python backend container:
  python -m app.import_legacy /tmp/products.json /tmp/orders.json

This command preserves IDs and the frontend's camelCase API data. It refuses
an import into non-empty tables so it cannot silently duplicate or overwrite data.
"""

import json
import sys
from pathlib import Path

from sqlalchemy import select

from app.database import Base, SessionLocal, create_tables, engine
from app.models import CustomerOrder, Product


def read_array(path: str) -> list[dict]:
    value = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(value, list) or any(not isinstance(row, dict) for row in value):
        raise ValueError(f"Expected a JSON array of objects in {path}")
    return value


def import_data(products_path: str, orders_path: str) -> tuple[int, int]:
    products = read_array(products_path)
    orders = read_array(orders_path)
    create_tables()

    with SessionLocal() as db:
        if db.scalar(select(Product.id).limit(1)) is not None or db.scalar(select(CustomerOrder.id).limit(1)) is not None:
            raise RuntimeError("Import stopped: database already contains product or order rows.")

        for item in products:
            db.add(
                Product(
                    id=int(item["id"]) if item.get("id") is not None else None,
                    name=str(item["name"]),
                    sku=str(item["sku"]),
                    category=str(item["category"]),
                    price=float(item["price"]),
                    stock=int(item["stock"]),
                )
            )
        db.flush()

        for item in orders:
            db.add(
                CustomerOrder(
                    id=int(item["id"]) if item.get("id") is not None else None,
                    customer_name=str(item.get("customerName", item.get("customer_name", "Unknown"))),
                    product_id=int(item.get("productId", item.get("product_id", 0))),
                    quantity=int(item["quantity"]),
                    amount=float(item.get("amount") or 0),
                    status=str(item.get("status") or "Pending"),
                )
            )
        db.commit()
    return len(products), len(orders)


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python -m app.import_legacy PRODUCTS_JSON ORDERS_JSON", file=sys.stderr)
        return 2
    try:
        products_count, orders_count = import_data(sys.argv[1], sys.argv[2])
    except (OSError, ValueError, KeyError, TypeError, RuntimeError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1
    print(f"Imported {products_count} products and {orders_count} orders.")
    print(f"Database: {engine.url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
