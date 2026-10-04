import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the administrator JWT whenever one exists.
// Public GET requests work without a token.
// Protected POST/PUT/DELETE requests use the token after admin login.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("cloudinventory_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function App() {
  // The application is public by default.
  // Authentication is only stored after administrator access is granted.
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("cloudinventory_auth") || "null"
      );
    } catch {
      return null;
    }
  });

  // Administrator login popup fields.
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Controls administrator authentication popup.
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Stores the operation that requested administrator authentication.
  const [pendingAdminAction, setPendingAdminAction] = useState(null);

  const [page, setPage] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  // Product add/edit form.
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // Order creation form.
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    productId: "",
    quantity: 1,
  });

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = auth?.role === "ADMIN";

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  // Exit administrator mode.
  const handleLogout = () => {
    sessionStorage.removeItem("cloudinventory_token");
    sessionStorage.removeItem("cloudinventory_auth");

    setAuth(null);

    setShowAdminLogin(false);
    setPendingAdminAction(null);

    setLoginForm({
      username: "",
      password: "",
    });

    setLoginError("");

    setShowProductForm(false);
    setEditingId(null);

    clearAlerts();
  };

  // Request administrator authentication before a write operation.
  //
  // If the administrator is already authenticated, the operation
  // executes immediately.
  //
  // Otherwise the login popup opens and the operation is stored
  // until authentication succeeds.
  const requireAdmin = (action) => {
    if (isAdmin) {
      action();
      return;
    }

    setLoginForm({
      username: "",
      password: "",
    });

    setLoginError("");

    setPendingAdminAction(() => action);
    setShowAdminLogin(true);
  };

  // Retrieve products.
  // This endpoint is public and therefore does not require a JWT.
  const loadProducts = async () => {
    const response = await api.get("/products");
    setProducts(response.data);
  };

  // Retrieve orders.
  // This endpoint is public and therefore does not require a JWT.
  const loadOrders = async () => {
    const response = await api.get("/orders");
    setOrders(response.data);
  };

  // Load all dashboard information.
  const loadData = async () => {
    try {
      setLoading(true);
      clearAlerts();

      await Promise.all([
        loadProducts(),
        loadOrders(),
      ]);
    } catch (err) {
      console.error("Unable to load application data:", err);

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "";

      setError(
        backendMessage ||
          "Could not load application data."
      );
    } finally {
      setLoading(false);
    }
  };

  // Dashboard is public, so data should load immediately.
  useEffect(() => {
    loadData();
  }, []);

  // Authenticate the administrator.
  const handleAdminLogin = async (event) => {
    event.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await api.post(
        "/auth/login",
        {
          username: loginForm.username.trim(),
          password: loginForm.password,
        }
      );

      // Only ADMIN users can unlock modification operations.
      if (response.data.role !== "ADMIN") {
        setLoginError(
          "Administrator credentials are required for this action."
        );
        return;
      }

      const session = {
        username: response.data.username,
        role: response.data.role,
      };

      sessionStorage.setItem(
        "cloudinventory_token",
        response.data.token
      );

      sessionStorage.setItem(
        "cloudinventory_auth",
        JSON.stringify(session)
      );

      setAuth(session);

      const action = pendingAdminAction;

      setPendingAdminAction(null);
      setShowAdminLogin(false);

      setLoginForm({
        username: "",
        password: "",
      });

      setLoginError("");

      // Execute the operation that requested authentication.
      if (action) {
        action();
      }
    } catch (err) {
      console.error("Administrator login failed:", err);

      setLoginError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid administrator username or password."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Save a product.
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
        await api.post(
          "/products",
          product
        );

        setMessage(
          "Product added successfully."
        );
      }

      resetProductForm();

      await loadProducts();
    } catch (err) {
      console.error("Product save failed:", err);

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      if (err?.response?.status === 403) {
        setError(
          "Administrator access is required to modify products."
        );
        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to save product."
      );
    }
  };

  // Reset product form.
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

  // Begin editing a product.
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

  // Delete a product.
  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      clearAlerts();

      await api.delete(
        `/products/${id}`
      );

      setMessage(
        "Product deleted successfully."
      );

      await loadProducts();
    } catch (err) {
      console.error("Product deletion failed:", err);

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      if (err?.response?.status === 403) {
        setError(
          "Administrator access is required to delete products."
        );
        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to delete product."
      );
    }
  };

  // Change inventory stock.
  const changeStock = async (
    product,
    change
  ) => {
    try {
      clearAlerts();

      const newStock = Math.max(
        0,
        Number(product.stock) + change
      );

      await api.put(
        `/products/${product.id}`,
        {
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          stock: newStock,
        }
      );

      await loadProducts();

      setMessage(
        "Stock updated successfully."
      );
    } catch (err) {
      console.error("Stock update failed:", err);

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      if (err?.response?.status === 403) {
        setError(
          "Administrator access is required to change stock."
        );
        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to update stock."
      );
    }
  };

  // Submit the order after administrator authentication.
  const submitOrder = async () => {
    try {
      clearAlerts();

      const customerName =
        orderForm.customerName.trim();

      const productId =
        Number(orderForm.productId);

      const quantity =
        Number(orderForm.quantity);

      if (!customerName) {
        setError(
          "Please enter the customer name."
        );
        return;
      }

      if (!productId) {
        setError(
          "Please select a product."
        );
        return;
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        setError(
          "Quantity must be a positive whole number."
        );
        return;
      }

      const selectedProduct =
        products.find(
          (product) =>
            Number(product.id) ===
            productId
        );

      if (!selectedProduct) {
        setError(
          "Selected product could not be found."
        );
        return;
      }

      if (
        Number(selectedProduct.stock) <
        quantity
      ) {
        setError(
          `Insufficient stock. Available stock: ${selectedProduct.stock}.`
        );
        return;
      }

      const payload = {
        customerName,
        productId,
        quantity,
      };

      console.log(
        "Creating order:",
        payload
      );

      const response = await api.post(
        "/orders",
        payload
      );

      console.log(
        "Order creation response:",
        response.data
      );

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
      console.error(
        "Order creation failed:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      if (err?.response?.status === 403) {
        setError(
          "Administrator access is required to create orders."
        );
        return;
      }

      let backendMessage = "";

      if (
        typeof err?.response?.data ===
        "string"
      ) {
        backendMessage =
          err.response.data;
      } else if (
        err?.response?.data?.message
      ) {
        backendMessage =
          err.response.data.message;
      } else if (
        err?.response?.data?.error
      ) {
        backendMessage =
          err.response.data.error;
      } else if (
        err?.response?.data?.detail
      ) {
        backendMessage =
          err.response.data.detail;
      }

      setError(
        backendMessage ||
          "Unable to create order."
      );
    }
  };

  // Order form submission.
  const createOrder = (event) => {
    event.preventDefault();

    requireAdmin(
      submitOrder
    );
  };

  // Update order status.
  const changeOrderStatus = async (
    id,
    status
  ) => {
    try {
      clearAlerts();

      await api.put(
        `/orders/${id}/status`,
        {
          status,
        }
      );

      setMessage(
        "Order status updated."
      );

      await loadOrders();
    } catch (err) {
      console.error(
        "Order status update failed:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      if (err?.response?.status === 403) {
        setError(
          "Administrator access is required to update order status."
        );
        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to update order status."
      );
    }
  };

  // Get a product name from a product ID.
  const getProductName = (
    productId
  ) => {
    const product =
      products.find(
        (item) =>
          Number(item.id) ===
          Number(productId)
      );

    return product
      ? product.name
      : `Product #${productId}`;
  };

  // Filter products using the search box.
  const filteredProducts =
    products.filter(
      (product) => {
        const text =
          `${product.name} ${product.sku} ${product.category}`
            .toLowerCase();

        return text.includes(
          search.toLowerCase()
        );
      }
    );

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (sum, product) =>
        sum +
        Number(product.stock),
      0
    );

  const inventoryValue =
    products.reduce(
      (sum, product) =>
        sum +
        Number(product.price) *
          Number(product.stock),
      0
    );

  const lowStock =
    products.filter(
      (product) =>
        Number(product.stock) <= 5
    );

  const totalOrders =
    orders.length;

  const totalSales =
    orders.reduce(
      (sum, order) =>
        sum +
        Number(order.amount || 0),
      0
    );

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">

          <div className="brand-icon">
            CI
          </div>

          <div>
            <h1>
              CloudInventory
            </h1>

            <span>
              Inventory Management
            </span>
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

      {/* Main application area */}
      <main className="main">

        {/* Top navigation */}
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
              {isAdmin
                ? "Administrator mode is active."
                : "Public read-only view."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent:
                "flex-end",
            }}
          >

            <div
              style={{
                fontSize:
                  "13px",
                color:
                  "#4b5563",
                background:
                  "#f3f4f6",
                padding:
                  "7px 10px",
                borderRadius:
                  "8px",
              }}
            >
              {auth
                ? `${auth.username} · ${auth.role}`
                : "Public View"}
            </div>

            <button
              className="secondary-btn"
              onClick={
                loadData
              }
            >
              Refresh
            </button>

            {auth && (
              <button
                className="secondary-btn"
                onClick={
                  handleLogout
                }
              >
                Exit Admin Mode
              </button>
            )}

          </div>

        </header>

        {/* Success/error messages */}
        {(message || error) && (
          <div
            className={
              error
                ? "alert error"
                : "alert success"
            }
          >
            <span>
              {error || message}
            </span>

            <button
              onClick={
                clearAlerts
              }
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

              {/* Dashboard */}
              {page === "dashboard" && (
                <>
                  <div className="page-title">

                    <h3>
                      Business Overview
                    </h3>

                    <p>
                      Live information from your inventory system.
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

                    {orders.length === 0 ? (
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
                                        order.amount ||
                                          0
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

              {/* Products */}
              {page === "products" && (
                <>
                  <div className="page-header-row">

                    <div className="page-title">

                      <h3>
                        Product Catalog
                      </h3>

                      <p>
                        Anyone can view products.
                        Modification requires administrator access.
                      </p>

                    </div>

                    <button
                      className="primary-btn"
                      onClick={() =>
                        requireAdmin(
                          () => {
                            setEditingId(
                              null
                            );

                            setProductForm(
                              {
                                name: "",
                                sku: "",
                                category:
                                  "",
                                price: "",
                                stock: "",
                              }
                            );

                            setShowProductForm(
                              true
                            );
                          }
                        )
                      }
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
                                    ) === 0
                                      ? "Out of Stock"
                                      : Number(
                                          product.stock
                                        ) <= 5
                                      ? "Low Stock"
                                      : "In Stock"}
                                  </span>
                                </td>

                                <td>

                                  <button
                                    className="small-btn"
                                    onClick={() =>
                                      requireAdmin(
                                        () =>
                                          startEdit(
                                            product
                                          )
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="small-btn danger"
                                    onClick={() =>
                                      requireAdmin(
                                        () =>
                                          deleteProduct(
                                            product.id
                                          )
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

              {/* Inventory */}
              {page === "inventory" && (
                <>
                  <div className="page-title">

                    <h3>
                      Inventory Management
                    </h3>

                    <p>
                      View stock publicly.
                      Stock changes require administrator authentication.
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
                                    ) <= 5
                                      ? "Low Stock"
                                      : "In Stock"}
                                  </span>
                                </td>

                                <td>

                                  <button
                                    className="stock-btn"
                                    onClick={() =>
                                      requireAdmin(
                                        () =>
                                          changeStock(
                                            product,
                                            -1
                                          )
                                      )
                                    }
                                  >
                                    −
                                  </button>

                                  <button
                                    className="stock-btn"
                                    onClick={() =>
                                      requireAdmin(
                                        () =>
                                          changeStock(
                                            product,
                                            1
                                          )
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

              {/* Orders */}
              {page === "orders" && (
                <>
                  <div className="page-title">

                    <h3>
                      Order Management
                    </h3>

                    <p>
                      View orders publicly.
                      Creating and updating orders requires administrator authentication.
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
                          setOrderForm({
                            ...orderForm,
                            customerName:
                              e.target.value,
                          })
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
                          setOrderForm({
                            ...orderForm,
                            productId:
                              e.target.value,
                          })
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
                        step="1"
                        name="quantity"
                        value={
                          orderForm.quantity
                        }
                        onChange={(e) =>
                          setOrderForm({
                            ...orderForm,
                            quantity:
                              e.target.value,
                          })
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
                                    order.amount ||
                                      0
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
                                      requireAdmin(
                                        () =>
                                          changeOrderStatus(
                                            order.id,
                                            e.target
                                              .value
                                          )
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

      {/* Administrator login popup */}
      {showAdminLogin && (
        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h3>
                  Administrator Access
                </h3>

                <p>
                  Administrator credentials are required for this action.
                </p>

              </div>

              <button
                className="close-btn"
                onClick={() => {
                  setShowAdminLogin(
                    false
                  );

                  setPendingAdminAction(
                    null
                  );

                  setLoginError("");

                  setLoginForm({
                    username: "",
                    password: "",
                  });
                }}
              >
                ×
              </button>

            </div>

            {loginError && (
              <div
                style={{
                  marginBottom:
                    "18px",
                  padding:
                    "12px 14px",
                  borderRadius:
                    "10px",
                  background:
                    "#fef2f2",
                  color:
                    "#b91c1c",
                  fontSize:
                    "14px",
                }}
              >
                {loginError}
              </div>
            )}

            <form
              className="product-form"
              onSubmit={
                handleAdminLogin
              }
            >

              <label>
                Username

                <input
                  className="input"
                  type="text"
                  value={
                    loginForm.username
                  }
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      username:
                        e.target.value,
                    })
                  }
                  autoComplete="username"
                  required
                />

              </label>

              <label>
                Password

                <input
                  className="input"
                  type="password"
                  value={
                    loginForm.password
                  }
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      password:
                        e.target.value,
                    })
                  }
                  autoComplete="current-password"
                  required
                />

              </label>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setShowAdminLogin(
                      false
                    );

                    setPendingAdminAction(
                      null
                    );

                    setLoginError("");

                    setLoginForm({
                      username: "",
                      password: "",
                    });
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    loginLoading
                  }
                >
                  {loginLoading
                    ? "Checking..."
                    : "Continue"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Add/Edit Product modal */}
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
              className="product-form"
              onSubmit={
                saveProduct
              }
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
                    step="0.01"
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
                    step="1"
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