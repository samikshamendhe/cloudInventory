"""Request validation schemas for the public REST API."""

from pydantic import BaseModel, ConfigDict, Field


class ProductInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=160)
    sku: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=100)
    price: float = Field(ge=0)
    stock: int = Field(ge=0)


class OrderInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    customer_name: str = Field(alias="customerName", min_length=1, max_length=160)
    product_id: int = Field(alias="productId", gt=0)
    quantity: int = Field(gt=0)


class OrderStatusInput(BaseModel):
    status: str = Field(min_length=1, max_length=40)


class LoginInput(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=256)
