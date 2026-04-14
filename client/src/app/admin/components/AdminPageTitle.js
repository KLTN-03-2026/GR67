export default function AdminPageTitle({ title, subtitle, children, className = "" }) {
  return (
    <div className={`admin-card mb-6 p-6 ${className}`.trim()}>
      <h1 className="admin-page-title">{title}</h1>
      {subtitle ? <div className="admin-page-subtitle">{subtitle}</div> : null}
      {children}
    </div>
  );
}
