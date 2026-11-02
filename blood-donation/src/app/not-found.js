import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="container text-center" style={{ maxWidth: 520 }}>
        <h1 className="h3">Page not found</h1>
        <p className="text-muted">That link is not part of HayatLink.</p>
        <Link className="btn btn-primary" href="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
