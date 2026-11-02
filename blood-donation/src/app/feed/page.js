import Link from "next/link";
import RequestCard from "@/components/RequestCard";
import { listBloodRequests } from "@/lib/data/requests";

export const metadata = {
  title: "Active Emergency Feed",
};

export default async function FeedPage({ searchParams }) {
  const params = await searchParams;
  const posted = Array.isArray(params.posted) ? params.posted[0] : params.posted;
  const requests = await listBloodRequests();

  return (
    <div className="page-shell">
      <div className="container">
        <header className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
          <div>
            <h1 className="h2 mb-1">Active emergency feed</h1>
            <p className="text-muted mb-0">
              Live hospital appeals from across Pakistan, newest first.
            </p>
          </div>
          <Link className="btn btn-primary align-self-start" href="/request">
            Post a request
          </Link>
        </header>
        {posted ? (
          <div className="alert alert-success" role="status">
            Your request is now on the public feed.
          </div>
        ) : null}
        {requests.length === 0 ? (
          <p className="text-muted">No open requests yet.</p>
        ) : (
          <div className="row g-3">
            {requests.map((request) => (
              <div className="col-lg-6" key={request.id}>
                <RequestCard request={request} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
