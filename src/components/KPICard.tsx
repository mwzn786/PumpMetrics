type KPICardProps = {
  title: string;
  value: string;
  icon: string;
  variant?: "primary" | "success" | "warning" | "info";
  subtitle?: string;
};

export default function KPICard({
  title,
  value,
  icon,
  variant = "primary",
  subtitle,
}: KPICardProps) {
  return (
    <div className="col-12 col-sm-6 col-xl-4">
      <div className={`card kpi-card border-0 shadow-sm h-100 kpi-${variant}`}>
        <div className="card-body d-flex align-items-center gap-3">
          <div className={`kpi-icon bg-${variant} bg-opacity-10 text-${variant}`}>
            <i className={`bi ${icon} fs-4`} />
          </div>
          <div>
            <p className="text-muted small mb-1">{title}</p>
            <h3 className="mb-0 fw-bold">{value}</h3>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
        </div>
      </div>
    </div>
  );
}
