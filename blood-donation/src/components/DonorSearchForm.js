import BloodGroupSelect from "@/components/BloodGroupSelect";
import CitySelect from "@/components/CitySelect";

export default function DonorSearchForm({
  bloodGroup = "",
  city = "",
  hospital = "",
  compact = false,
}) {
  return (
    <form
      className="search-panel p-3 p-md-4"
      action="/donors"
      method="get"
      role="search"
      aria-label="Find blood donors by group and city"
    >
      {hospital ? <input type="hidden" name="hospital" value={hospital} /> : null}
      <div className={compact ? "d-grid gap-3" : "row g-3 align-items-end"}>
        <div className={compact ? "" : "col-md-4"}>
          <BloodGroupSelect
            id="search-blood-group"
            defaultValue={bloodGroup}
            required
          />
        </div>
        <div className={compact ? "" : "col-md-5"}>
          <CitySelect
            key={city || "city-empty"}
            id="search-city"
            defaultValue={city}
            required
            hideHelp={compact}
            helpText="Use the official city name to avoid missed matches."
          />
        </div>
        <div className={compact ? "d-grid" : "col-md-3 d-grid"}>
          <button className="btn btn-primary btn-lg" type="submit">
            Find donors
          </button>
        </div>
      </div>
    </form>
  );
}
