import React from "react";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface DashboardPanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({
  title,
  subtitle,
  children,
  className = "",
  loading = false,
}) => {
  return (
    <section className={`dashboard-panel ${className}`}>
      <header className="dashboard-panel__header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      <div className="dashboard-panel__body">
        {loading ? (
          <div className="dashboard-chart-empty">Cargando información...</div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export default DashboardPanel;