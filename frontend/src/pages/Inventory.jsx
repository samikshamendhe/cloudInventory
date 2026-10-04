import { useCallback, useEffect, useState } from "react";
import { Plus, Minus, Package } from "lucide-react";

import {
  getProducts,
  updateProduct,
} from "../services/api";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = useCallback(async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadInventory();
}, [loadInventory]);

  const adjustStock = async (product, change) => {
    const newStock = Math.max(
      0,
      product.stock + change
    );

    try {
      await updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        stock: newStock,
      });

      await loadInventory();
    } catch (error) {
      console.error("Stock update failed:", error);
      alert("Unable to update stock.");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Inventory</h1>
            <p>Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Monitor and adjust current stock levels.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Stock Adjustment</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-name">
                      <Package size={18} />
                      {product.name}
                    </div>
                  </td>

                  <td>{product.sku}</td>
                  <td><strong>{product.stock}</strong></td>

                  <td>
                    {product.stock === 0
                      ? "Out of Stock"
                      : product.stock <= 5
                        ? "Low Stock"
                        : "In Stock"}
                  </td>

                  <td>
                    <button
                      className="icon-button"
                      onClick={() =>
                        adjustStock(product, -1)
                      }
                    >
                      <Minus size={17} />
                    </button>

                    <button
                      className="icon-button"
                      onClick={() =>
                        adjustStock(product, 1)
                      }
                    >
                      <Plus size={17} />
                    </button>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan="5">No inventory found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Inventory;