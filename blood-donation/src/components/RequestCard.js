function timeAgo(iso) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(delta / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function RequestCard({ request }) {
  const donorHref = `/donors?blood_group=${encodeURIComponent(request.blood_group)}&city=${encodeURIComponent(request.city)}&hospital=${encodeURIComponent(request.hospital_name)}`;

  return (
    <article
      className="request-card p-4"
      data-urgency={request.urgency_level}
    >
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <span className={`badge rounded-pill urgency-pill urgency-${request.urgency_level}`}>
          {request.urgency_level}
        </span>
        <time className="small text-muted" dateTime={request.created_at}>
          {timeAgo(request.created_at)}
        </time>
      </div>
      <div className="d-flex align-items-center gap-3 mb-2">
        <span className="blood-chip">{request.blood_group}</span>
        <h3 className="h5 mb-0">{request.hospital_name}</h3>
      </div>
      <p className="text-muted mb-2">
        <i className="bi bi-geo-alt me-1" aria-hidden="true" />
        {request.area}, {request.city}
      </p>
      <p className="mb-2">
        <strong>Posted by:</strong> {request.requester_name}
      </p>
      {request.details ? <p className="mb-3">{request.details}</p> : null}
      <div className="d-flex flex-wrap gap-2">
        <a className="btn btn-primary" href={donorHref}>
          Find matching donors
        </a>
        <a className="btn btn-outline-secondary" href={`tel:${request.contact_info}`}>
          Call seeker
        </a>
      </div>
    </article>
  );
}
