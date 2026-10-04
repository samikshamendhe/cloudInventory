function Header() {
  return (
    <header className="header">
      <div>
        <h2>CloudInventory</h2>
        <p>Inventory & Order Management</p>
      </div>

      <div className="user">
        <span>Admin</span>
        <div className="avatar">A</div>
      </div>
    </header>
  );
}

export default Header;