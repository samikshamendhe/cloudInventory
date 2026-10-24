"""Keep API JSON field names compatible with the existing React frontend."""

from app.models import CustomerOrder, Product


def product_to_dict(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "category": product.category,
        "price": float(product.price),
        "stock": product.stock,
    }


def order_to_dict(order: CustomerOrder) -> dict:
    return {
        "id": order.id,
        "customerName": order.customer_name,
        "productId": order.product_id,
        "quantity": order.quantity,
        "amount": float(order.amount),
        "status": order.status,
    }
