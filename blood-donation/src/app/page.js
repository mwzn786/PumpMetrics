import Link from "next/link";
import DonorSearchForm from "@/components/DonorSearchForm";
import { APP_NAME, COOLDOWN_DAYS } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <p className="hero-kicker">
                <i className="bi bi-heart-pulse-fill" aria-hidden="true" />
                Pakistan blood network
              </p>
              <h1 className="display-4 mt-3">Find a nearby donor before the next bag runs out.</h1>
              <p className="urdu-line mt-3 mb-3">اپنے شہر میں خون کے عطیہ دہندگان تلاش کریں</p>
              <p className="lead text-muted col-lg-11">
                {APP_NAME} connects active local donors with urgent hospital
                requests. Search by blood group and city, then reach a donor on
                WhatsApp — their number stays off the page.
              </p>
            </div>
            <div className="col-lg-6">
              <DonorSearchForm compact />
              <p className="small text-muted mt-3 mb-0">
                Tip: try <strong>O+</strong> in <strong>Lahore</strong> or{" "}
                <strong>A+</strong> in <strong>Karachi</strong> on the demo data.
              </p>
            </div>
          </div>
          <div className="row g-3 mt-4">
            <div className="col-md-4">
              <div className="stat-tile h-100">
                <div className="fw-bold">90-day safety cooldown</div>
                <p className="mb-0 text-muted small">
                  Anyone who donated in the last {COOLDOWN_DAYS} days is hidden
                  from search automatically.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-tile h-100">
                <div className="fw-bold">Standardized Pakistan cities</div>
                <p className="mb-0 text-muted small">
                  Karachi to Skardu — the same city list on search and
                  registration, so spellings never split the directory.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-tile h-100">
                <div className="fw-bold">Privacy-first WhatsApp</div>
                <p className="mb-0 text-muted small">
                  Cards show name, group, city, and area. Contact happens in a
                  pre-filled WhatsApp message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="pb-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <article className="surface-card h-100 p-4">
                <p className="text-crimson fw-bold mb-2">01</p>
                <h2 className="h5">Search</h2>
                <p className="mb-0 text-muted">
                  Choose a blood group and a Pakistani city. Only currently
                  available donors are returned.
                </p>
              </article>
            </div>
            <div className="col-md-4">
              <article className="surface-card h-100 p-4">
                <p className="fw-bold mb-2">02</p>
                <h2 className="h5">Connect</h2>
                <p className="mb-0 text-muted">
                  Open WhatsApp with a polite, urgent template that includes
                  hospital and blood needs when you came from an emergency post.
                </p>
              </article>
            </div>
            <div className="col-md-4">
              <article className="surface-card h-100 p-4">
                <p className="fw-bold mb-2">03</p>
                <h2 className="h5">Broadcast</h2>
                <p className="mb-0 text-muted">
                  Post a hospital request to the live feed so the whole network
                  can see Critical, Urgent, and Routine appeals.
                </p>
              </article>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link className="btn btn-primary btn-lg" href="/register">
              Register as a donor
            </Link>
            <Link className="btn btn-outline-primary btn-lg" href="/request">
              Post urgent request
            </Link>
            <Link className="btn btn-outline-secondary btn-lg" href="/feed">
              Open emergency feed
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
