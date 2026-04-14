export default function AdminCard({ className = "", children, ...rest }) {
  return (
    <div className={`admin-card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
