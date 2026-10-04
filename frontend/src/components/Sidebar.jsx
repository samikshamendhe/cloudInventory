import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Cloud,
} from "lucide-react";

function Sidebar() {
  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/products", label: "Products", icon: Package },
    { to: "/inventory", label: "Inventory", icon: Warehouse },
    { to: "/orders", label: "Orders", icon: ShoppingCart },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Cloud size={20} />
        </div>

        <div>
          <div className="brand-name">CloudInventory</div>
          <div className="brand-subtitle">Operations Platform</div>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <nav className="nav-menu">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="cloud-status">
          <span className="status-dot"></span>
          <div>
            <strong>System Operational</strong>
            <small>All services running</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;