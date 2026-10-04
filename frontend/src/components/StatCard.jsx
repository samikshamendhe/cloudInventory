function StatCard({ title, value, change, icon: Icon, description }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-icon">
          <Icon size={20} />
        </div>

        <span className="stat-change">{change}</span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-title">{title}</div>

      <div className="stat-description">{description}</div>
    </div>
  );
}

export default StatCard;