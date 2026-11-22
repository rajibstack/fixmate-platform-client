function escapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateInput) {
  if (!dateInput) {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return String(dateInput);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolvePaidAmount(booking = {}) {
  const candidates = [
    booking.paidAmount,
    booking.finalAmount,
    booking.totalPrice,
    booking.totalAmount,
    booking.servicePrice,
    booking.startingPrice,
    booking.price,
    booking.amount,
    booking.cost,
    booking.service?.price,
  ];

  for (const val of candidates) {
    if (val === undefined || val === null || val === "") continue;
    const numeric = Number(val);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  for (const val of candidates) {
    if (val === undefined || val === null || val === "") continue;
    const numeric = Number(val);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return 0;
}

function resolveTransactionId(booking = {}) {
  if (booking?.transactionId) return String(booking.transactionId);
  if (booking?.paymentId) return String(booking.paymentId);
  const rawId = String(booking?._id || booking?.id || "").replace(
    /[^a-zA-Z0-9]/g,
    "",
  );
  if (!rawId) return "pi_FM000000";
  return `pi_${rawId.slice(-10).toUpperCase()}`;
}

export function downloadPaidJobInvoice(booking) {
  if (!booking || typeof window === "undefined") return false;

  const paymentStatus = String(booking.paymentStatus || booking.status || "")
    .toLowerCase()
    .trim();
  if (paymentStatus !== "paid") return false;

  const bookingId = String(booking._id || booking.id || "N/A");
  const cleanTail =
    bookingId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-8)
      .toUpperCase() || "000001";
  const invoiceNumber = `INV-${cleanTail}`;
  const transactionId = resolveTransactionId(booking);
  const paidDate = formatDate(
    booking.paidAt || booking.updatedAt || new Date(),
  );
  const serviceDate = formatDate(booking.preferredDate || booking.createdAt);

  const numericAmount = resolvePaidAmount(booking);
  const formattedAmount = Number.isInteger(numericAmount)
    ? `$${numericAmount}`
    : `$${numericAmount.toFixed(2)}`;

  const customerName =
    booking.customerName || booking.customer?.name || "Customer";
  const customerEmail = booking.customerEmail || booking.customer?.email || "";
  const customerPhone =
    booking.phone || booking.customerPhone || booking.customer?.phone || "";
  const customerAddress =
    booking.address || booking.customerAddress || booking.serviceArea || "";

  const technicianName =
    booking.technicianName || booking.technician?.name || "Verified Technician";
  const technicianEmail =
    booking.technicianEmail || booking.technician?.email || "";
  const technicianArea =
    booking.technicianArea ||
    booking.technician?.area ||
    booking.serviceArea ||
    "";
  const serviceMode = booking.serviceMode || booking.mode || "Home Visit";

  const serviceTitle =
    booking.serviceTitle || booking.title || "Repair Service";
  const serviceCategory = booking.serviceCategory || booking.category || "";
  const problemDescription =
    booking.problemDescription || booking.issue || booking.description || "";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FixMate Invoice - ${escapeHtml(invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      background: #f8fafc;
      color: #0f172a;
      padding: 32px 16px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
      gap: 16px;
    }
    .brand {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: #0284c7;
    }
    .brand span { color: #0f172a; }
    .badge-paid {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.14);
      color: #047857;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-size: 12px;
      font-weight: 600;
    }
    .inv-meta {
      text-align: right;
      font-size: 14px;
      color: #475569;
    }
    .inv-meta strong { color: #0f172a; font-weight: 600; }
    .parties {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
    }
    .box-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .box p { font-size: 14px; color: #334155; margin-bottom: 4px; }
    .box .name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      background: #f8fafc;
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 14px 16px;
      font-size: 14px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .num { text-align: right; }
    .summary {
      margin-left: auto;
      max-width: 340px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #475569;
      margin-bottom: 8px;
    }
    .summary-total {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 700;
      color: #0284c7;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 6px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .print-actions {
      max-width: 800px;
      margin: 0 auto 14px auto;
      display: flex;
      justify-content: flex-end;
    }
    .btn-print {
      background: #0ea5e9;
      color: #020617;
      border: none;
      padding: 10px 18px;
      border-radius: 12px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-actions { display: none; }
      .invoice-card { box-shadow: none; border: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn-print" onclick="window.print()">Save / Print PDF Invoice</button>
  </div>
  <div class="invoice-card">
    <div class="top-bar">
      <div>
        <div class="brand"><span>Fix</span>Mate</div>
        <div class="badge-paid">Paid</div>
      </div>
      <div class="inv-meta">
        <div><strong>Invoice #:</strong> ${escapeHtml(invoiceNumber)}</div>
        <div><strong>Paid on:</strong> ${escapeHtml(paidDate)}</div>
        <div><strong>Transaction ID:</strong> ${escapeHtml(transactionId)}</div>
        <div><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="box">
        <div class="box-title">Billed to</div>
        <p class="name">${escapeHtml(customerName)}</p>
        ${customerEmail ? `<p>Email: ${escapeHtml(customerEmail)}</p>` : ""}
        ${customerPhone ? `<p>Phone: ${escapeHtml(customerPhone)}</p>` : ""}
        ${customerAddress ? `<p>Address: ${escapeHtml(customerAddress)}</p>` : ""}
      </div>
      <div class="box">
        <div class="box-title">Technician</div>
        <p class="name">${escapeHtml(technicianName)}</p>
        ${technicianEmail ? `<p>Email: ${escapeHtml(technicianEmail)}</p>` : ""}
        ${technicianArea ? `<p>Area: ${escapeHtml(technicianArea)}</p>` : ""}
        <p>Mode: ${escapeHtml(serviceMode)}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Scheduled</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${escapeHtml(serviceTitle)}</strong>
            ${serviceCategory ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">Category: ${escapeHtml(serviceCategory)}</div>` : ""}
            ${problemDescription ? `<div style="font-size:14px;color:#475569;margin-top:6px;">${escapeHtml(problemDescription)}</div>` : ""}
          </td>
          <td>${escapeHtml(serviceDate)}</td>
          <td class="num"><strong>${escapeHtml(formattedAmount)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${escapeHtml(formattedAmount)}</span>
      </div>
      <div class="summary-row">
        <span>Payment</span>
        <span>Paid</span>
      </div>
      <div class="summary-total">
        <span>Total paid</span>
        <span>${escapeHtml(formattedAmount)}</span>
      </div>
    </div>

    <div class="footer">
      <span>FixMate Repair Services</span>
      <span>Payment receipt</span>
    </div>
  </div>
  <script>
    window.addEventListener("load", function() {
      setTimeout(function() {
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

  const printWin = window.open("", "_blank", "width=880,height=720");
  if (!printWin) return false;
  printWin.document.open();
  printWin.document.write(htmlContent);
  printWin.document.close();
  return true;
}
