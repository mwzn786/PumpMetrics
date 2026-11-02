import DonorCard from "@/components/DonorCard";
import DonorSearchForm from "@/components/DonorSearchForm";
import { searchAvailableDonors } from "@/lib/data/donors";
import { isPakistanCity } from "@/lib/cities";
import { BLOOD_GROUPS } from "@/lib/constants";

export const metadata = {
  title: "Find Donors",
};

function one(value) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function DonorsPage({ searchParams }) {
  const params = await searchParams;
  const bloodGroup = one(params.blood_group);
  const city = one(params.city);
  const hospital = one(params.hospital);
  const ready = BLOOD_GROUPS.includes(bloodGroup) && isPakistanCity(city);
  const donors = ready
    ? await searchAvailableDonors({ bloodGroup, city, hospital })
    : [];

  return (
    <div className="page-shell">
      <div className="container">
        <header className="mb-4">
          <h1 className="h2">Find donors</h1>
          <p className="text-muted mb-0">
            Filter by blood group and city. Results hide anyone in the 90-day
            cooldown or who turned availability off.
          </p>
        </header>
        <DonorSearchForm
          bloodGroup={bloodGroup}
          city={city}
          hospital={hospital}
        />
        <div className="mt-4" aria-live="polite">
          {!ready ? (
            <p className="text-muted">
              Choose a blood group and a Pakistani city to see matching donors.
            </p>
          ) : donors.length === 0 ? (
            <div className="alert alert-warning" role="status">
              No available {bloodGroup} donors in {city} right now. Try a nearby
              city or post a request on the emergency feed.
            </div>
          ) : (
            <>
              <p className="fw-semibold mb-3">
                {donors.length} available {bloodGroup} donor
                {donors.length === 1 ? "" : "s"} in {city}
                {hospital ? ` for ${hospital}` : ""}.
              </p>
              <div className="row g-3">
                {donors.map((donor) => (
                  <div className="col-md-6 col-xl-4" key={donor.id}>
                    <DonorCard donor={donor} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
