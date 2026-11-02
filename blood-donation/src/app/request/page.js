import RequestForm from "@/components/RequestForm";

export const metadata = {
  title: "Post Urgent Request",
};

export default function RequestPage() {
  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 820 }}>
        <RequestForm />
      </div>
    </div>
  );
}
