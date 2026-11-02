export default function DonorCard({ donor }) {
  return (
    <article className="donor-card p-4 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h3 className="h5 mb-1">{donor.full_name}</h3>
          <p className="text-muted mb-0">
            <i className="bi bi-geo-alt me-1" aria-hidden="true" />
            {donor.area}, {donor.city}
          </p>
        </div>
        <span className="blood-chip" aria-label={`Blood group ${donor.blood_group}`}>
          {donor.blood_group}
        </span>
      </div>
      <p className="small text-muted mb-4">
        Phone numbers stay private. HayatLink opens WhatsApp with a ready message
        so you can request help without scraping contacts.
      </p>
      {donor.whatsappUrl ? (
        <a
          className="btn btn-whatsapp mt-auto"
          href={donor.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="bi bi-whatsapp me-2" aria-hidden="true" />
          Connect via WhatsApp
          <span className="visually-hidden">
            {" "}
            with {donor.full_name} for {donor.blood_group} blood
          </span>
        </a>
      ) : (
        <p className="text-danger mb-0">WhatsApp link unavailable for this donor.</p>
      )}
    </article>
  );
}
