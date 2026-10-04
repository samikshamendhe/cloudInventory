import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
} from "lucide-react";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
  });

  const loadProducts = useCallback(async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }, []);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadProducts();
}, [loadProducts]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
    });

    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      stock: product.stock,
    });

    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      if (editingId) {
        await updateProduct(editingId, productData);
      } else {
        await createProduct(productData);
      }

      await loadProducts();

      setShowForm(false);
      setEditingId(null);

      setForm({
        name: "",
        sku: "",
        category: "",
        price: "",
        stock: "",
      });
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Unable to save product.");
    }
  };

  const removeProduct = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Unable to delete product.");
    }
  };

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your product catalog and stock levels.</p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h2>{editingId ? "Edit Product" : "Add Product"}</h2>

            <button
              className="icon-button"
              onClick={() => setShowForm(false)}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <input
              name="name"
              placeholder="Product name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <input
              name="sku"
              placeholder="SKU"
              value={form.sku}
              onChange={handleChange}
              required
            />

            <input
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
              required
            />

            <input
              name="price"
              type="number"
              min="0"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              required
            />

            <input
              name="stock"
              type="number"
              min="0"
              placeholder="Stock"
              value={form.stock}
              onChange={handleChange}
              required
            />

            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingId ? "Update Product" : "Save Product"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>₹{Number(product.price).toLocaleString()}</td>
                  <td>{product.stock}</td>
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
                      onClick={() => openEditForm(product)}
                    >
                      <Edit size={17} />
                    </button>

                    <button
                      className="icon-button danger"
                      onClick={() => removeProduct(product.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;