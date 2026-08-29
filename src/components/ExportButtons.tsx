"use client";

type ExportButtonsProps = {
  onExportCSV: () => void;
  printTargetId?: string;
};

export default function ExportButtons({
  onExportCSV,
  printTargetId = "report-content",
}: ExportButtonsProps) {
  const handlePrint = () => {
    const content = document.getElementById(printTargetId);
    if (!content) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PumpMetrics Report</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body { padding: 24px; font-family: system-ui, sans-serif; }
            h2 { margin-bottom: 16px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="d-flex flex-wrap gap-2">
      <button type="button" className="btn btn-outline-success btn-sm" onClick={onExportCSV}>
        <i className="bi bi-download me-1" />
        Export CSV
      </button>
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlePrint}>
        <i className="bi bi-printer me-1" />
        Print
      </button>
    </div>
  );
}
