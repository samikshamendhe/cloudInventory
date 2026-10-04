import { useCallback, useEffect, useState } from "react";
import StatCard from "../components/StatCard";

import {
  Package,
  ShoppingCart,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";

import {
  getProducts,
  getOrders,
} from "../services/api";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const loadDashboard = useCallback(async () => {
    try {
      const [productsResponse, ordersResponse] =
        await Promise.all([
          getProducts(),
          getOrders(),
        ]);

      setProducts(productsResponse.data);
      setOrders(ordersResponse.data);
    } catch (error) {
      console.error(
        "Failed to load dashboard:",
        error
      );
    }
  }, []);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadDashboard();
}, [loadDashboard]);

  const totalProducts = products.length;

  const totalInventoryValue = products.reduce(
    (sum, product) =>
      sum + Number(product.price) * product.stock,
    0
  );

  const lowStockProducts = products.filter(
    (product) => product.stock <= 5
  ).length;

  const totalOrders = orders.length;

  const totalSales = orders.reduce(
    (sum, order) =>
      sum + Number(order.amount),
    0
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Overview of your inventory and orders.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={<Package size={20} />}
        />

        <StatCard
          title="Inventory Value"
          value={`₹${totalInventoryValue.toLocaleString()}`}
          icon={<IndianRupee size={20} />}
        />

        <StatCard
          title="Low Stock"
          value={lowStockProducts}
          icon={<AlertTriangle size={20} />}
        />

        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={<ShoppingCart size={20} />}
        />
      </div>

      <div className="card">
        <h2>Total Sales</h2>

        <h1>
          ₹{totalSales.toLocaleString()}
        </h1>
      </div>
    </div>
  );
}

export default Dashboard;