
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import "./App.css";

const today = new Date().toISOString().split("T")[0];

const initialItem = () => ({
  description: "",
  quantity: 1,
  price: 0,
});

function App() {
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("Thank you for your business.");

  const [logo, setLogo] = useState("");
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef(null);

  const [items, setItems] = useState([initialItem()]);

  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB");
  };

  const addItem = () => {
    setItems((current) => [...current, initialItem()]);
  };

  const removeItem = (index) => {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index)
    );
  };

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setLogoError("Choose a PNG, JPG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Your logo must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        setLogo(reader.result);
        setLogoError("");
      };

      image.onerror = () => {
        setLogoError("This image could not be opened. Try another file.");
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      setLogoError("The logo could not be read. Please try again.");
    };

    reader.readAsDataURL(file);
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    const green = [24, 92, 54];
    const dark = [27, 41, 32];
    const muted = [70, 85, 74];
    const pale = [234, 242, 236];

    let y = 22;

    const addLogo = () => {
      if (!logo) return;

      try {
        const format = logo.startsWith("data:image/png")
          ? "PNG"
          : logo.startsWith("data:image/webp")
            ? "WEBP"
            : "JPEG";

        doc.addImage(
          logo,
          format,
          pageWidth - margin - 17,
          13,
          17,
          17,
          undefined,
          "FAST"
        );
      } catch {
        // Continue creating the invoice if the logo cannot be embedded.
      }
    };

    const addPageHeader = () => {
      doc.setFillColor(...green);
      doc.rect(0, 0, pageWidth, 3, "F");
      doc.setTextColor(...green);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(25);
      doc.text("Invoice", margin, 25);
      addLogo();
      doc.setDrawColor(197, 208, 199);
      doc.line(margin, 34, pageWidth - margin, 34);
    };

    const ensureSpace = (height) => {
      if (y + height > pageHeight - 24) {
        doc.addPage();
        addPageHeader();
        y = 45;
      }
    };

    addPageHeader();
    y = 45;

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("YOUR INFORMATION", margin, y);
    doc.text("CLIENT INFORMATION", pageWidth / 2 + 3, y);

    y += 7;
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(businessName || "Your business", 78), margin, y);
    doc.text(
      doc.splitTextToSize(customerName || "Client name", 78),
      pageWidth / 2 + 3,
      y
    );

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);

    const businessLines = [
      businessAddress,
      businessEmail,
      businessPhone,
    ].filter(Boolean);

    const clientLines = [
      customerAddress,
      customerEmail,
    ].filter(Boolean);

    let leftY = y;
    let rightY = y;

    businessLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 78);
      doc.text(wrapped, margin, leftY);
      leftY += wrapped.length * 4.5;
    });

    clientLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 78);
      doc.text(wrapped, pageWidth / 2 + 3, rightY);
      rightY += wrapped.length * 4.5;
    });

    y = Math.max(leftY, rightY) + 8;

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text("ISSUED ON", margin, y);
    doc.text("DUE DATE", pageWidth / 2 + 3, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(invoiceDate), margin, y);
    doc.text(formatDate(dueDate), pageWidth / 2 + 3, y);

    y += 8;
    doc.text(`Invoice number: ${invoiceNumber || "INV-001"}`, margin, y);
    y += 13;

    const col = {
      description: margin + 3,
      quantity: margin + contentWidth * 0.61,
      price: margin + contentWidth * 0.77,
      total: pageWidth - margin - 3,
    };

    const drawTableHeader = () => {
      doc.setFillColor(...green);
      doc.roundedRect(margin, y - 5, contentWidth, 10, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("ITEM DESCRIPTION", col.description, y + 1);
      doc.text("QUANTITY", col.quantity, y + 1, { align: "center" });
      doc.text("UNIT PRICE", col.price, y + 1, { align: "center" });
      doc.text("TOTAL PRICE", col.total, y + 1, { align: "right" });
      y += 11;
    };

    drawTableHeader();

    items.forEach((item) => {
      const description = doc.splitTextToSize(
        item.description || "Item description",
        contentWidth * 0.46
      );
      const rowHeight = Math.max(9, description.length * 4.5);

      ensureSpace(rowHeight + 3);

      doc.setTextColor(...dark);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      doc.text(description, col.description, y);
      doc.text(String(item.quantity || 0), col.quantity, y, {
        align: "center",
      });
      doc.text(
        Number(item.price || 0).toLocaleString("en-ZA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        col.price,
        y,
        { align: "center" }
      );
      doc.text(
        (Number(item.quantity || 0) * Number(item.price || 0)).toLocaleString(
          "en-ZA",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        ),
        col.total,
        y,
        { align: "right" }
      );

      y += rowHeight;
      doc.setDrawColor(214, 223, 215);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
      y += 3;
    });

    ensureSpace(30);
    y += 4;

    doc.setFillColor(...pale);
    doc.roundedRect(
      pageWidth - margin - 75,
      y - 5,
      75,
      17,
      2,
      2,
      "F"
    );

    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("TOTAL AMOUNT DUE", pageWidth - margin - 71, y + 1);

    doc.setTextColor(...green);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(formatCurrency(subtotal), pageWidth - margin - 4, y + 8, {
      align: "right",
    });

    y += 29;
    ensureSpace(42);

    const paymentLines = [
      ["Bank", bankName],
      ["Account holder", accountHolder],
      ["Account number", accountNumber],
      ["Branch code", branchCode],
      ["Payment reference", paymentReference || invoiceNumber],
    ].filter(([, value]) => value.trim());

    if (paymentLines.length > 0) {
      doc.setTextColor(...green);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("PAYMENT DETAILS", margin, y);
      y += 8;

      paymentLines.forEach(([label, value]) => {
        ensureSpace(8);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...dark);
        doc.text(`${label}:`, margin, y);

        doc.setFont("helvetica", "normal");
        doc.text(
          doc.splitTextToSize(value, contentWidth - 42),
          margin + 42,
          y
        );

        y += 7;
      });

      y += 5;
    }

    if (notes.trim()) {
      ensureSpace(20);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("NOTE", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...muted);
      doc.setFontSize(8.5);
      const noteLines = doc.splitTextToSize(notes.trim(), contentWidth);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4.5 + 10;
    }

    ensureSpace(22);
    doc.setDrawColor(154, 169, 157);
    doc.line(pageWidth - margin - 48, y + 5, pageWidth - margin, y + 5);
    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.text("Authorized signature", pageWidth - margin - 24, y + 10, {
      align: "center",
    });

    const pageCount = doc.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(197, 208, 199);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.setTextColor(...muted);
      doc.setFontSize(7);
      doc.text("Thank you for your business.", margin, pageHeight - 9);
      doc.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 9, {
        align: "right",
      });
    }

    const safeName = (invoiceNumber || "invoice").replace(
      /[^a-z0-9_-]/gi,
      "_"
    );

    doc.save(`${safeName}.pdf`);
  };

  return (
    <main className="app">
      <header className="page-header">
        <div className="brand-mark">IN</div>
        <div>
          <p className="eyebrow">BUSINESS TOOLS</p>
          <h1>Invoice Generator</h1>
          <p className="page-description">
            Create polished invoices for your business.
          </p>
        </div>
      </header>

      <div className="workspace">
        <section className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h2>Invoice details</h2>
            </div>
          </div>

          <div className="form-section">
            <h3>Business information</h3>

            <label className="field">
              <span>Business name</span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
              />
            </label>

            <label className="field">
              <span>Business address</span>
              <textarea
                rows="2"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Street, city, country"
              />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="field">
                <span>Phone number</span>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="Contact number"
                />
              </label>
            </div>

            <div className="logo-upload">
              <div className="logo-upload-copy">
                <strong>Business logo</strong>
                <span>PNG, JPG or WebP · Maximum 2 MB</span>
              </div>

              <input
                ref={logoInputRef}
                className="file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoUpload}
              />

              <button
                type="button"
                className="outline-button"
                onClick={() => logoInputRef.current?.click()}
              >
                {logo ? "Change logo" : "Upload logo"}
              </button>

              {logo && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setLogo("");
                    setLogoError("");
                    if (logoInputRef.current) {
                      logoInputRef.current.value = "";
                    }
                  }}
                >
                  Remove
                </button>
              )}

              {logoError && <p className="error-message">{logoError}</p>}
            </div>
          </div>

          <div className="form-section">
            <h3>Client information</h3>

            <label className="field">
              <span>Client or company name</span>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Client name"
              />
            </label>

            <label className="field">
              <span>Client address</span>
              <textarea
                rows="2"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Client address"
              />
            </label>

            <label className="field">
              <span>Client email</span>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </label>
          </div>

          <div className="form-section">
            <h3>Payment details</h3>

            <label className="field">
              <span>Bank name</span>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Your bank"
              />
            </label>

            <label className="field">
              <span>Account holder</span>
              <input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Name on the account"
              />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>Account number</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                />
              </label>

              <label className="field">
                <span>Branch code</span>
                <input
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="Branch code"
                />
              </label>
            </div>

            <label className="field">
              <span>Payment reference</span>
              <input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Defaults to invoice number"
              />
            </label>
          </div>

          <div className="form-section">
            <h3>Invoice information</h3>

            <div className="field-grid">
              <label className="field">
                <span>Invoice number</span>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                />
              </label>

              <label className="field">
                <span>Invoice date</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title-row">
              <h3>Items and services</h3>
              <button
                type="button"
                className="text-button"
                onClick={addItem}
              >
                + Add item
              </button>
            </div>

            {items.map((item, index) => (
              <div className="editable-item" key={index}>
                <label className="field">
                  <span>Description</span>
                  <input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    placeholder="Product or service"
                  />
                </label>

                <div className="item-input-grid">
                  <label className="field">
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Unit price (R)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="item-footer">
                  <span>
                    Line total:{" "}
                    {formatCurrency(
                      Number(item.quantity || 0) * Number(item.price || 0)
                    )}
                  </span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      className="text-button remove-button"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>Additional note</h3>
            <label className="field">
              <span>Message on invoice</span>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank your customer or add a short note"
              />
            </label>
          </div>

          <div className="editor-total">
            <span>Invoice total</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>

          <button
            type="button"
            className="download-button"
            onClick={downloadPDF}
          >
            Download invoice PDF
          </button>

          <p className="privacy-note">
            Your invoice is generated in your browser.
          </p>
        </section>

        <section className="preview-section">
          <div className="preview-toolbar">
            <div>
              <p className="eyebrow">LIVE DOCUMENT</p>
              <h2>Invoice preview</h2>
            </div>
            <span className="live-status">
              <span className="status-dot" />
              Live
            </span>
          </div>

          <article className="invoice-preview">
            <div className="preview-top-accent" />

            <header className="document-header">
              <div>
                <h2>Invoice</h2>
                <p>{businessName || "Your Business"}</p>
              </div>

              {logo ? (
                <img className="preview-logo" src={logo} alt="Business logo" />
              ) : (
                <div className="logo-placeholder">
                  <span>YOUR LOGO</span>
                </div>
              )}
            </header>

            <div className="document-divider" />

            <div className="document-parties">
              <div className="party-block">
                <h3>Your information</h3>
                <strong>{businessName || "Your business name"}</strong>
                {businessAddress && <p>{businessAddress}</p>}
                {businessEmail && <p>{businessEmail}</p>}
                {businessPhone && <p>{businessPhone}</p>}
              </div>

              <div className="party-block">
                <h3>Client information</h3>
                <strong>{customerName || "Client name"}</strong>
                {customerAddress && <p>{customerAddress}</p>}
                {customerEmail && <p>{customerEmail}</p>}
              </div>
            </div>

            <div className="document-meta">
              <div>
                <span>Issued on</span>
                <strong>{formatDate(invoiceDate)}</strong>
              </div>

              <div>
                <span>Due date</span>
                <strong>{formatDate(dueDate)}</strong>
              </div>
            </div>

            <div className="preview-items">
              <div className="document-table-header">
                <span>Item description</span>
                <span>Quantity</span>
                <span>Unit price</span>
                <span>Total price</span>
              </div>

              {items.map((item, index) => (
                <div className="document-table-row" key={index}>
                  <span>{item.description || "Item description"}</span>
                  <span>{item.quantity || 0}</span>
                  <span>{formatCurrency(Number(item.price || 0))}</span>
                  <span>
                    {formatCurrency(
                      Number(item.quantity || 0) * Number(item.price || 0)
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="document-total">
              <span>Total amount due</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>

            {(bankName ||
              accountHolder ||
              accountNumber ||
              branchCode ||
              paymentReference) && (
              <section className="preview-payment">
                <h3>Payment details</h3>

                {bankName && (
                  <p>
                    <strong>Bank:</strong> {bankName}
                  </p>
                )}

                {accountHolder && (
                  <p>
                    <strong>Account holder:</strong> {accountHolder}
                  </p>
                )}

                {accountNumber && (
                  <p>
                    <strong>Account number:</strong> {accountNumber}
                  </p>
                )}

                {branchCode && (
                  <p>
                    <strong>Branch code:</strong> {branchCode}
                  </p>
                )}

                {(paymentReference || invoiceNumber) && (
                  <p>
                    <strong>Payment reference:</strong>{" "}
                    {paymentReference || invoiceNumber}
                  </p>
                )}
              </section>
            )}

            <div className="document-signature">
              <div className="signature-line" />
              <span>Authorized signature</span>
            </div>

            <footer className="document-footer">
              <p>{notes || "Thank you for your business."}</p>
              <span>{invoiceNumber || "INV-001"}</span>
            </footer>
          </article>

          <p className="preview-hint">
            This preview updates automatically as you edit the invoice.
          </p>
        </section>
      </div>
    </main>
  );
}

export default App;




