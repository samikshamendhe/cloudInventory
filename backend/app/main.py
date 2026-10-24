"""CloudInventory REST API implemented in Python with FastAPI."""

from contextlib import asynccontextmanager
import os
from collections.abc import AsyncIterator

from fastapi import Depends, FastAPI, HTTPException, Path, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, create_tables, get_db
from app.models import CustomerOrder, Product
from app.schemas import LoginInput, OrderInput, OrderStatusInput, ProductInput
from app.security import create_access_token, require_admin, verify_credentials
from app.serializers import order_to_dict, product_to_dict


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_tables()
    if os.getenv("AUTO_SEED", "true").strip().lower() in {"1", "true", "yes", "on"}:
        seed_demo_data()
    yield


app = FastAPI(
    title="CloudInventory API",
    description="Python REST API for inventory and order management.",
    version="2.0.0",
    lifespan=lifespan,
)


@app.exception_handler(HTTPException)
async def api_http_exception_handler(_, exc: HTTPException) -> JSONResponse:
    """Expose a simple message key that the existing React UI can display."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": "Invalid request data"},
    )


def seed_demo_data() -> None:
    """Add a small demo dataset only when the relevant tables are empty."""
    with SessionLocal() as db:
        if db.scalar(select(Product.id).limit(1)) is None:
            db.add_all(
                [
                    Product(name="MacBook Air M5", sku="LAP-001", category="Laptops", price=119999, stock=20),
                    Product(name="Mechanical Keyboard", sku="KEY-014", category="Accessories", price=7499, stock=5),
                    Product(name="4K Monitor", sku="MON-027", category="Displays", price=28999, stock=2),
                    Product(name="Wireless Mouse", sku="MOU-032", category="Accessories", price=2499, stock=46),
                ]
            )
            db.commit()

        if db.scalar(select(CustomerOrder.id).limit(1)) is None:
            db.add_all(
                [
                    CustomerOrder(customer_name="Rahul Sharma", product_id=1, quantity=1, amount=119999.0, status="Pending"),
                    CustomerOrder(customer_name="Ananya Mehta", product_id=4, quantity=2, amount=4998.0, status="Shipped"),
                    CustomerOrder(customer_name="Rohan Patil", product_id=3, quantity=1, amount=28999.0, status="Delivered"),
                    CustomerOrder(customer_name="Sneha Joshi", product_id=2, quantity=1, amount=7499.0, status="Processing"),
                ]
            )
            db.commit()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "UP", "service": "cloudinventory-python-backend"}


@app.post("/api/auth/login")
def login(credentials: LoginInput) -> dict[str, str]:
    role = verify_credentials(credentials.username.strip(), credentials.password)
    if role is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "token": create_access_token(credentials.username.strip(), role),
        "username": credentials.username.strip(),
        "role": role,
    }


@app.get("/api/products")
def list_products(db: Session = Depends(get_db)) -> list[dict]:
    products = db.scalars(select(Product).order_by(Product.id)).all()
    return [product_to_dict(product) for product in products]


@app.get("/api/products/{product_id}")
def get_product(
    product_id: int = Path(gt=0),
    db: Session = Depends(get_db),
) -> dict:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_dict(product)


@app.post("/api/products", status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductInput,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_dict(product)


@app.put("/api/products/{product_id}")
def update_product(
    payload: ProductInput,
    product_id: int = Path(gt=0),
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product_to_dict(product)


@app.delete("/api/products/{product_id}")
def delete_product(
    product_id: int = Path(gt=0),
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


@app.get("/api/inventory")
def get_inventory(db: Session = Depends(get_db)) -> list[dict]:
    products = db.scalars(select(Product).order_by(Product.id)).all()
    return [product_to_dict(product) for product in products]


@app.get("/api/orders")
def list_orders(db: Session = Depends(get_db)) -> list[dict]:
    orders = db.scalars(select(CustomerOrder).order_by(CustomerOrder.id)).all()
    return [order_to_dict(order) for order in orders]


@app.get("/api/orders/{order_id}")
def get_order(
    order_id: int = Path(gt=0),
    db: Session = Depends(get_db),
) -> dict:
    order = db.get(CustomerOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_dict(order)


@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderInput,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=400, detail="Product not found")
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    if product.stock < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    product.stock -= payload.quantity
    order = CustomerOrder(
        customer_name=payload.customer_name.strip(),
        product_id=product.id,
        quantity=payload.quantity,
        amount=round(float(product.price) * payload.quantity, 2),
        status="Pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order_to_dict(order)


@app.put("/api/orders/{order_id}/status")
def update_order_status(
    payload: OrderStatusInput,
    order_id: int = Path(gt=0),
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    order = db.get(CustomerOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status.strip()
    db.commit()
    db.refresh(order)
    return order_to_dict(order)
