export default function FormAlert({ error, info }) {
  if (!error && !info) return null;
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  return (
    <div className="alert alert-success" role="status">
      {info}
    </div>
  );
}
