import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

function App() {
  const [page, setPage] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);

  const [orderForm, setOrderForm] = useState({
    customerName: "",
    productId: "",
    quantity: 1,
  });

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const loadProducts = async () => {
    const response = await api.get("/products");
    setProducts(response.data);
  };

  const loadOrders = async () => {
    const response = await api.get("/orders");
    setOrders(response.data);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      clearAlerts();

      await Promise.all([
        loadProducts(),
        loadOrders(),
      ]);
    } catch (err) {
      console.error(err);
      setError("Could not load application data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveProduct = async (event) => {
    event.preventDefault();

    try {
      clearAlerts();

      const product = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        category: productForm.category.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      };

      if (
        !product.name ||
        !product.sku ||
        !product.category
      ) {
        setError("Please fill all product fields.");
        return;
      }

      if (
        product.price < 0 ||
        product.stock < 0
      ) {
        setError(
          "Price and stock cannot be negative."
        );
        return;
      }

      if (editingId) {
        await api.put(
          `/products/${editingId}`,
          product
        );

        setMessage(
          "Product updated successfully."
        );
      } else {
        await api.post("/products", product);

        setMessage(
          "Product added successfully."
        );
      }

      resetProductForm();
      await loadProducts();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Unable to save product."
      );
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
    });

    setEditingId(null);
    setShowProductForm(false);
  };

  const startEdit = (product) => {
    setEditingId(product.id);

    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      stock: product.stock,
    });

    setShowProductForm(true);
    setPage("products");
  };

  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      clearAlerts();

      await api.delete(`/products/${id}`);

      setMessage(
        "Product deleted successfully."
      );

      await loadProducts();
    } catch (err) {
      console.error(err);
      setError("Unable to delete product.");
    }
  };

  const changeStock = async (product, change) => {
    try {
      clearAlerts();

      const newStock = Math.max(
        0,
        Number(product.stock) + change
      );

      await api.put(`/products/${product.id}`, {
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        stock: newStock,
      });

      await loadProducts();
    } catch (err) {
      console.error(err);
      setError("Unable to update stock.");
    }
  };

  const createOrder = async (event) => {
    event.preventDefault();

    try {
      clearAlerts();

      const quantity = Number(
        orderForm.quantity
      );

      if (!orderForm.customerName.trim()) {
        setError(
          "Please enter the customer name."
        );
        return;
      }

      if (!orderForm.productId) {
        setError("Please select a product.");
        return;
      }

      if (quantity <= 0) {
        setError(
          "Quantity must be greater than zero."
        );
        return;
      }

      await api.post("/orders", {
        customerName:
          orderForm.customerName.trim(),
        productId: Number(
          orderForm.productId
        ),
        quantity,
      });

      setMessage(
        "Order created successfully."
      );

      setOrderForm({
        customerName: "",
        productId: "",
        quantity: 1,
      });

      await Promise.all([
        loadProducts(),
        loadOrders(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to create order."
      );
    }
  };

  const changeOrderStatus = async (
    id,
    status
  ) => {
    try {
      clearAlerts();

      await api.put(
        `/orders/${id}/status`,
        { status }
      );

      setMessage(
        "Order status updated."
      );

      await loadOrders();
    } catch (err) {
      console.error(err);
      setError(
        "Unable to update order status."
      );
    }
  };

  const getProductName = (productId) => {
    const product = products.find(
      (item) =>
        Number(item.id) ===
        Number(productId)
    );

    return product
      ? product.name
      : `Product #${productId}`;
  };

  const filteredProducts =
    products.filter((product) => {
      const text =
        `${product.name} ${product.sku} ${product.category}`
          .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock),
    0
  );

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.price) *
        Number(product.stock),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) <= 5
  );

  const totalOrders = orders.length;

  const totalSales = orders.reduce(
    (sum, order) =>
      sum + Number(order.amount || 0),
    0
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            CI
          </div>

          <div>
            <h1>CloudInventory</h1>
            <span>Inventory Management</span>
          </div>
        </div>

        <nav className="nav">
          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className={
              page === "products"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("products")
            }
          >
            Products
          </button>

          <button
            className={
              page === "inventory"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("inventory")
            }
          >
            Inventory
          </button>

          <button
            className={
              page === "orders"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("orders")
            }
          >
            Orders
          </button>
        </nav>

        <div className="system-status">
          <span className="status-dot" />
          System Online
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>
              {page === "dashboard"
                ? "Dashboard"
                : page === "products"
                ? "Products"
                : page === "inventory"
                ? "Inventory"
                : "Orders"}
            </h2>

            <p>
              Manage your inventory and
              customer orders.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={loadData}
          >
            Refresh
          </button>
        </header>

        {(message || error) && (
          <div
            className={
              error
                ? "alert error"
                : "alert success"
            }
          >
            {error || message}

            <button
              onClick={clearAlerts}
            >
              ×
            </button>
          </div>
        )}

        <section className="content">
          {loading ? (
            <div className="loading">
              Loading CloudInventory...
            </div>
          ) : (
            <>
              {page === "dashboard" && (
                <>
                  <div className="page-title">
                    <h3>
                      Business Overview
                    </h3>

                    <p>
                      Live information from
                      your inventory system.
                    </p>
                  </div>

                  <div className="stats">
                    <div className="stat">
                      <span>
                        Total Products
                      </span>
                      <strong>
                        {totalProducts}
                      </strong>
                    </div>

                    <div className="stat">
                      <span>
                        Total Stock
                      </span>
                      <strong>
                        {totalStock}
                      </strong>
                    </div>

                    <div className="stat">
                      <span>
                        Total Orders
                      </span>
                      <strong>
                        {totalOrders}
                      </strong>
                    </div>

                    <div className="stat">
                      <span>
                        Low Stock
                      </span>
                      <strong>
                        {lowStock.length}
                      </strong>
                    </div>
                  </div>

                  <div className="two-column">
                    <div className="card">
                      <span className="muted">
                        Inventory Value
                      </span>

                      <strong className="money">
                        ₹
                        {inventoryValue.toLocaleString()}
                      </strong>
                    </div>

                    <div className="card">
                      <span className="muted">
                        Total Sales
                      </span>

                      <strong className="money">
                        ₹
                        {totalSales.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="card">
                    <h3>
                      Recent Orders
                    </h3>

                    {orders.length ===
                    0 ? (
                      <p className="empty">
                        No orders yet.
                      </p>
                    ) : (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>
                                Order
                              </th>
                              <th>
                                Customer
                              </th>
                              <th>
                                Product
                              </th>
                              <th>
                                Amount
                              </th>
                              <th>
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {orders
                              .slice(0, 5)
                              .map(
                                (order) => (
                                  <tr
                                    key={
                                      order.id
                                    }
                                  >
                                    <td>
                                      #
                                      {
                                        order.id
                                      }
                                    </td>

                                    <td>
                                      {
                                        order.customerName
                                      }
                                    </td>

                                    <td>
                                      {getProductName(
                                        order.productId
                                      )}
                                    </td>

                                    <td>
                                      ₹
                                      {Number(
                                        order.amount
                                      ).toLocaleString()}
                                    </td>

                                    <td>
                                      <span className="badge">
                                        {
                                          order.status
                                        }
                                      </span>
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {page === "products" && (
                <>
                  <div className="page-header-row">
                    <div className="page-title">
                      <h3>
                        Product Catalog
                      </h3>

                      <p>
                        Add, update and delete
                        products.
                      </p>
                    </div>

                    <button
                      className="primary-btn"
                      onClick={() => {
                        setEditingId(null);

                        setProductForm({
                          name: "",
                          sku: "",
                          category: "",
                          price: "",
                          stock: "",
                        });

                        setShowProductForm(
                          true
                        );
                      }}
                    >
                      + Add Product
                    </button>
                  </div>

                  <div className="card">
                    <input
                      className="search"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                    />

                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>
                              Product
                            </th>
                            <th>
                              SKU
                            </th>
                            <th>
                              Category
                            </th>
                            <th>
                              Price
                            </th>
                            <th>
                              Stock
                            </th>
                            <th>
                              Status
                            </th>
                            <th>
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredProducts.map(
                            (product) => (
                              <tr
                                key={
                                  product.id
                                }
                              >
                                <td>
                                  <strong>
                                    {
                                      product.name
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    product.sku
                                  }
                                </td>

                                <td>
                                  {
                                    product.category
                                  }
                                </td>

                                <td>
                                  ₹
                                  {Number(
                                    product.price
                                  ).toLocaleString()}
                                </td>

                                <td>
                                  {
                                    product.stock
                                  }
                                </td>

                                <td>
                                  <span className="badge">
                                    {Number(
                                      product.stock
                                    ) ===
                                    0
                                      ? "Out of Stock"
                                      : Number(
                                          product.stock
                                        ) <=
                                        5
                                      ? "Low Stock"
                                      : "In Stock"}
                                  </span>
                                </td>

                                <td>
                                  <button
                                    className="small-btn"
                                    onClick={() =>
                                      startEdit(
                                        product
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="small-btn danger"
                                    onClick={() =>
                                      deleteProduct(
                                        product.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {page === "inventory" && (
                <>
                  <div className="page-title">
                    <h3>
                      Inventory Management
                    </h3>

                    <p>
                      Adjust and monitor stock
                      levels.
                    </p>
                  </div>

                  <div className="card">
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>
                              Product
                            </th>
                            <th>
                              SKU
                            </th>
                            <th>
                              Stock
                            </th>
                            <th>
                              Status
                            </th>
                            <th>
                              Adjustment
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {products.map(
                            (product) => (
                              <tr
                                key={
                                  product.id
                                }
                              >
                                <td>
                                  <strong>
                                    {
                                      product.name
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    product.sku
                                  }
                                </td>

                                <td>
                                  {
                                    product.stock
                                  }
                                </td>

                                <td>
                                  <span className="badge">
                                    {Number(
                                      product.stock
                                    ) <=
                                    5
                                      ? "Low Stock"
                                      : "In Stock"}
                                  </span>
                                </td>

                                <td>
                                  <button
                                    className="stock-btn"
                                    onClick={() =>
                                      changeStock(
                                        product,
                                        -1
                                      )
                                    }
                                  >
                                    −
                                  </button>

                                  <button
                                    className="stock-btn"
                                    onClick={() =>
                                      changeStock(
                                        product,
                                        1
                                      )
                                    }
                                  >
                                    +
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {page === "orders" && (
                <>
                  <div className="page-title">
                    <h3>
                      Order Management
                    </h3>

                    <p>
                      Create orders and manage
                      order status.
                    </p>
                  </div>

                  <div className="card">
                    <h3>
                      Create Order
                    </h3>

                    <form
                      className="order-form"
                      onSubmit={
                        createOrder
                      }
                    >
                      <input
                        className="input"
                        name="customerName"
                        placeholder="Customer name"
                        value={
                          orderForm.customerName
                        }
                        onChange={(e) =>
                          setOrderForm(
                            {
                              ...orderForm,
                              customerName:
                                e.target
                                  .value,
                            }
                          )
                        }
                        required
                      />

                      <select
                        className="input"
                        name="productId"
                        value={
                          orderForm.productId
                        }
                        onChange={(e) =>
                          setOrderForm(
                            {
                              ...orderForm,
                              productId:
                                e.target
                                  .value,
                            }
                          )
                        }
                        required
                      >
                        <option value="">
                          Select product
                        </option>

                        {products.map(
                          (product) => (
                            <option
                              key={
                                product.id
                              }
                              value={
                                product.id
                              }
                              disabled={
                                Number(
                                  product.stock
                                ) === 0
                              }
                            >
                              {
                                product.name
                              }{" "}
                              — Stock:{" "}
                              {
                                product.stock
                              }
                            </option>
                          )
                        )}
                      </select>

                      <input
                        className="input"
                        type="number"
                        min="1"
                        name="quantity"
                        value={
                          orderForm.quantity
                        }
                        onChange={(e) =>
                          setOrderForm(
                            {
                              ...orderForm,
                              quantity:
                                e.target
                                  .value,
                            }
                          )
                        }
                        required
                      />

                      <button
                        className="primary-btn"
                        type="submit"
                      >
                        Create Order
                      </button>
                    </form>
                  </div>

                  <div className="card">
                    <h3>
                      Orders
                    </h3>

                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>
                              Order
                            </th>
                            <th>
                              Customer
                            </th>
                            <th>
                              Product
                            </th>
                            <th>
                              Quantity
                            </th>
                            <th>
                              Amount
                            </th>
                            <th>
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {orders.map(
                            (order) => (
                              <tr
                                key={
                                  order.id
                                }
                              >
                                <td>
                                  #
                                  {
                                    order.id
                                  }
                                </td>

                                <td>
                                  {
                                    order.customerName
                                  }
                                </td>

                                <td>
                                  {getProductName(
                                    order.productId
                                  )}
                                </td>

                                <td>
                                  {
                                    order.quantity
                                  }
                                </td>

                                <td>
                                  ₹
                                  {Number(
                                    order.amount
                                  ).toLocaleString()}
                                </td>

                                <td>
                                  <select
                                    className="status-select"
                                    value={
                                      order.status ||
                                      "Pending"
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      changeOrderStatus(
                                        order.id,
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                  >
                                    <option>
                                      Pending
                                    </option>

                                    <option>
                                      Processing
                                    </option>

                                    <option>
                                      Shipped
                                    </option>

                                    <option>
                                      Delivered
                                    </option>

                                    <option>
                                      Cancelled
                                    </option>
                                  </select>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>

      {showProductForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3>
                  {editingId
                    ? "Edit Product"
                    : "Add Product"}
                </h3>

                <p>
                  Enter the product details.
                </p>
              </div>

              <button
                className="close-btn"
                onClick={
                  resetProductForm
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveProduct}
              className="product-form"
            >
              <label>
                Product Name
                <input
                  className="input"
                  name="name"
                  value={
                    productForm.name
                  }
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      name:
                        e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                SKU
                <input
                  className="input"
                  name="sku"
                  value={
                    productForm.sku
                  }
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      sku:
                        e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Category
                <input
                  className="input"
                  name="category"
                  value={
                    productForm.category
                  }
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      category:
                        e.target.value,
                    })
                  }
                  required
                />
              </label>

              <div className="two-inputs">
                <label>
                  Price
                  <input
                    className="input"
                    type="number"
                    min="0"
                    name="price"
                    value={
                      productForm.price
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        price:
                          e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Stock
                  <input
                    className="input"
                    type="number"
                    min="0"
                    name="stock"
                    value={
                      productForm.stock
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock:
                          e.target.value,
                      })
                    }
                    required
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    resetProductForm
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                >
                  {editingId
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;