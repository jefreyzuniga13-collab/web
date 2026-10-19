import React from "react";

type ExpandableFieldProps = {
  label: string;
  icon?: React.ReactNode;
  value: React.ReactNode;
  onExpand?: () => void;
  className?: string;
};

export const ExpandableField: React.FC<ExpandableFieldProps> = ({
  label,
  icon,
  value,
  onExpand,
  className,
}) => (
  <div
    className={className ?? "detailPanel-contactGroup"}
    onClick={onExpand}
    style={{ cursor: onExpand ? "pointer" : "default" }}
  >
    <p className="detailPanel-clientGroup__title">{label}</p>
    <span className="detailPanel-clientGroup__cliente">
      {icon}
      {value}
    </span>
  </div>
);

export const Trunc: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span
    title={children ? String(children) : "---"}
    style={{
      maxWidth: "100%",
      display: "inline-block",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      verticalAlign: "bottom",
    }}
  >
    {children ?? "---"}
  </span>
);

export const Row: React.FC<{
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, value, icon, className }) => (
  <div className={className ?? "detailPanel-row"}>
    <p className="detailPanel-row__label">{label}</p>
    <span className="detailPanel-row__value">
      {icon}
      <Trunc>{value}</Trunc>
    </span>
  </div>
);
