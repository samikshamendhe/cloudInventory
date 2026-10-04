import { useCallback, useEffect, useState } from "react";

import {
  getOrders,
  createOrder,
  updateOrderStatus,
  getProducts,
} from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    customerName: "",
    productId: "",
    quantity: 1,
  });

  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [ordersResponse, productsResponse] =
        await Promise.all([
          getOrders(),
          getProducts(),
        ]);

      setOrders(ordersResponse.data);
      setProducts(productsResponse.data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadData();
}, [loadData]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      alert("Please enter customer name.");
      return;
    }

    if (!form.productId) {
      alert("Please select a product.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    try {
      await createOrder({
        customerName: form.customerName,
        productId: Number(form.productId),
        quantity: Number(form.quantity),
      });

      setForm({
        customerName: "",
        productId: "",
        quantity: 1,
      });

      await loadData();

      alert("Order created successfully.");
    } catch (error) {
      console.error("Failed to create order:", error);

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to create order. Check stock availability.";

      alert(message);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      await loadData();
    } catch (error) {
      console.error(
        "Failed to update order status:",
        error
      );
      alert("Unable to update order status.");
    }
  };

  const getProductName = (productId) => {
    const product = products.find(
      (p) => p.id === productId
    );

    return product
      ? product.name
      : `Product #${productId}`;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Orders</h1>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Create and manage customer orders.</p>
        </div>
      </div>

      <div className="card">
        <h2>Create Order</h2>

        <form
          onSubmit={handleCreateOrder}
          className="form-grid"
        >
          <input
            type="text"
            placeholder="Customer name"
            value={form.customerName}
            onChange={(e) =>
              setForm({
                ...form,
                customerName: e.target.value,
              })
            }
            required
          />

          <select
            value={form.productId}
            onChange={(e) =>
              setForm({
                ...form,
                productId: e.target.value,
              })
            }
            required
          >
            <option value="">
              Select Product
            </option>

            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
                disabled={product.stock === 0}
              >
                {product.name} — Stock: {product.stock}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              setForm({
                ...form,
                quantity: e.target.value,
              })
            }
            required
          />

          <button
            type="submit"
            className="primary-button"
          >
            Create Order
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>All Orders</h2>
            <p>Manage your customer orders.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>

                  <td>{order.customerName}</td>

                  <td>
                    {getProductName(order.productId)}
                  </td>

                  <td>{order.quantity}</td>

                  <td>
                    ₹{Number(order.amount).toLocaleString()}
                  </td>

                  <td>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        changeStatus(
                          order.id,
                          e.target.value
                        )
                      }
                    >
                      <option value="Pending">
                        Pending
                      </option>
                      <option value="Processing">
                        Processing
                      </option>
                      <option value="Shipped">
                        Shipped
                      </option>
                      <option value="Delivered">
                        Delivered
                      </option>
                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </select>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan="6">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Orders;