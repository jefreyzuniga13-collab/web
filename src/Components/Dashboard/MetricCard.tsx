import React from "react";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "blue" | "green" | "purple" | "orange" | "cyan" | "teal" | "money";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = "blue",
}) => {
  return (
    <article className={`metric-card metric-card--${variant}`}>
      <div className="metric-card__icon">
        <span>{icon}</span>

        <p className="metric-card__title">{title}</p>
      </div>

      <div className="metric-card__content">
        <h2 className="metric-card__value">{value}</h2>
        {subtitle && <span className="metric-card__subtitle">{subtitle}</span>}
      </div>
    </article>
  );
};

export default MetricCard;