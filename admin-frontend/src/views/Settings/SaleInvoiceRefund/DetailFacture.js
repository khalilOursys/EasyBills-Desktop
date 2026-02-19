import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/img/logo.png";
import {
  Button,
  Card,
  Form,
  Container,
  Row,
  Col,
  Table,
  Badge,
} from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getSaleInvoice } from "../../../Redux/saleInvoiceSlice";
import { fetchProducts } from "../../../Redux/productsSlice";
import { fetchClients } from "../../../Redux/clientsSlice";

function SaleInvoiceDetails() {
  const dispatch = useDispatch();
  const navigate = useHistory();
  const { id } = useParams();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [client, setClient] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [clientDetails, setClientDetails] = useState({});
  const [companyInfo, setCompanyInfo] = useState({
    name: "MedicaCom",
    address: "123 Rue du Commerce",
    city: "75000 Paris, France",
    phone: "01 23 45 67 89",
    email: "contact@medicacom.fr",
    siret: "123 456 789 00012",
    vatNumber: "FR12 123456789",
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      const [clientsRes, productsRes] = await Promise.all([
        dispatch(fetchClients()),
        dispatch(fetchProducts()),
      ]);

      setClients(clientsRes.payload || []);
      setProducts(productsRes.payload || []);

      const invoiceRes = await dispatch(getSaleInvoice(id));
      const data = invoiceRes.payload;

      setInvoiceNumber(data.invoiceNumber);
      setDate(data.date?.split("T")[0] || "");
      setType(data.type);
      setStatus(data.status);
      setTotalHT(data.totalHT || 0);
      setTotalTTC(data.totalTTC || 0);
      setTotalVAT((data.totalTTC || 0) - (data.totalHT || 0));

      // Store client details for PDF
      setClientDetails(data.client || {});

      setClient({
        label: data.client?.name || "",
        value: data.client?.id,
        client: data.client,
      });

      // Map invoice items with VAT calculation
      setInvoiceItems(
        (data.items || []).map((item) => {
          const product =
            productsRes.payload?.find((p) => p.id === item.productId) || {};
          const itemHT = item.price * item.quantity;
          const itemVAT = item.vatRate ? itemHT * (item.vatRate / 100) : 0;
          const vatRate = item.vatRate || (data.type === "QUOTATION" ? 0 : 19);

          return {
            productId: item.productId,
            productName: product?.name || "Produit inconnu",
            quantity: item.quantity,
            price: item.price,
            vatRate: vatRate,
            vatAmount: item.vatAmount || itemVAT,
            totalHT: itemHT,
            totalTTC: itemHT + itemVAT,
          };
        })
      );
    };

    loadData();
  }, [dispatch, id]);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return <Badge variant="success">Payée</Badge>;
      case "VALIDATED":
        return <Badge variant="info">Validée</Badge>;
      case "DRAFT":
        return <Badge variant="warning">Brouillon</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "QUOTATION":
        return "Devis";
      case "DELIVERY_NOTE":
        return "Bon de livraison";
      case "SALE_INVOICE":
        return "Facture vente";
      case "SALE_REFUND":
        return "Avoir client";
      default:
        return type;
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    // A4 dimensions: 210mm x 297mm
    const pageWidth = 210;
    const marginLeft = 14;
    const marginRight = 14;
    const tableWidth = pageWidth - marginLeft - marginRight; // 182mm

    // But we need to account for content width - let's use 175mm to be safe
    const safeTableWidth = 175;

    /* ================= LOGO ================= */
    doc.addImage(logo, "PNG", marginLeft, 10, 40, 15);

    /* ================= TITLE ================= */
    const invoiceTitle = getTypeLabel(type).toUpperCase();
    doc.setFontSize(16);
    doc.text(invoiceTitle, pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(10);
    doc.text(`N° de document : ${invoiceNumber}`, marginLeft, 32);
    doc.text(`Date : ${date}`, marginLeft, 38);
    doc.text(`Statut : ${status}`, pageWidth - marginRight, 32, {
      align: "right",
    });

    /* ================= SELLER ================= */
    doc.setFontSize(11);
    doc.text("VOTRE ENTREPRISE", marginLeft, 48);

    doc.setFontSize(10);
    doc.text(companyInfo.name, marginLeft, 55);
    doc.text(companyInfo.address, marginLeft, 61);
    doc.text(companyInfo.city, marginLeft, 67);
    doc.text(`Tél: ${companyInfo.phone}`, marginLeft, 73);
    doc.text(`SIRET: ${companyInfo.siret}`, marginLeft, 79);

    /* ================= CLIENT (WITH BORDER) ================= */
    const clientBoxX = pageWidth - marginRight - 75; // 210 - 14 - 75 = 121
    doc.setFontSize(11);
    doc.text("CLIENT", clientBoxX + 2, 48);
    doc.rect(clientBoxX, 52, 75, 35);

    doc.setFontSize(10);
    doc.text(clientDetails?.name || "Nom du client", clientBoxX + 4, 58);
    doc.text(clientDetails?.address || "Adresse", clientBoxX + 4, 64);
    doc.text(clientDetails?.city || "Ville", clientBoxX + 4, 70);
    doc.text(clientDetails?.country || "France", clientBoxX + 4, 76);
    doc.text(
      `Tél: ${clientDetails?.phone || "Non renseigné"}`,
      clientBoxX + 4,
      82
    );

    /* ================= TABLE ================= */
    const tableStartY = 100;

    // Create table data
    const tableData = [
      ["Désignation", "Quantité", "P.U. H.T.", "T.V.A.", "Montant H.T."],
      ...invoiceItems.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return [
          product?.name || item.productName || "",
          item.quantity.toString(),
          `${item.price.toFixed(2)} €`,
          `${item.vatRate} %`,
          `${item.totalHT.toFixed(2)} €`,
        ];
      }),
    ];

    // Draw table using autoTable
    autoTable(doc, {
      startY: tableStartY,
      head: [tableData[0]],
      body: tableData.slice(1),
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        lineWidth: 0, // No internal borders
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: "bold",
        lineWidth: 0,
      },
      bodyStyles: {
        lineWidth: 0,
      },
      // Adjusted column widths to fit within 175mm
      columnStyles: {
        0: { cellWidth: 78 }, // Désignation: 80mm
        1: { cellWidth: 22, halign: "center" }, // Quantité: 20mm
        2: { cellWidth: 25, halign: "right" }, // P.U. H.T.: 25mm
        3: { cellWidth: 20, halign: "center" }, // T.V.A.: 20mm
        4: { cellWidth: 30, halign: "right" }, // Montant H.T.: 30mm
        // Total: 80 + 20 + 25 + 20 + 30 = 175mm
      },
      margin: { left: marginLeft, right: marginRight },
      tableWidth: safeTableWidth,
      theme: "plain",
    });

    /* ================= DRAW TABLE BORDERS ================= */
    const tableEndY = doc.lastAutoTable.finalY;
    const tableHeight = tableEndY - tableStartY;

    // Draw blue border around table
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);

    // Top border (adjust X position to center within margins)
    const tableX = marginLeft + (tableWidth - safeTableWidth) / 2;
    doc.line(tableX, tableStartY, tableX + safeTableWidth, tableStartY);

    // Bottom border
    doc.line(tableX, tableEndY, tableX + safeTableWidth, tableEndY);

    // Left border
    doc.line(tableX, tableStartY, tableX, tableEndY);

    // Right border
    doc.line(
      tableX + safeTableWidth,
      tableStartY,
      tableX + safeTableWidth,
      tableEndY
    );

    // Draw header bottom border (separator)
    const headerBottomY = tableStartY + 8;
    doc.line(tableX, headerBottomY, tableX + safeTableWidth, headerBottomY);

    /* ================= TOTALS + PAYMENT INFO ================= */
    const y = tableEndY + 15;

    /* LEFT: PAYMENT INFO */
    doc.setFontSize(11);
    doc.setTextColor(41, 128, 185);
    doc.text("CONDITIONS DE PAIEMENT", marginLeft, y);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text("Mode de règlement :", marginLeft, y + 8);
    doc.text("Virement bancaire", marginLeft + 41, y + 8);

    doc.text("Date d'échéance :", marginLeft, y + 16);
    const dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toLocaleDateString("fr-FR");
    doc.text(dueDateStr, marginLeft + 41, y + 16);

    doc.text("IBAN :", marginLeft, y + 24);
    doc.text("FR76 1234 5678 9012 3456 7890 123", marginLeft + 41, y + 24);

    doc.text("BIC :", marginLeft, y + 32);
    doc.text("ABCDEDFXXX", marginLeft + 41, y + 32);

    /* RIGHT: TOTALS (WITH BORDER) */
    const totalsX = pageWidth - marginRight - 60; // Right aligned with margin
    const totalsY = y - 6;
    const totalsWidth = 60;
    const totalsHeight = 45;

    // Draw totals box
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.rect(totalsX, totalsY, totalsWidth, totalsHeight);

    doc.setFillColor(245, 245, 245);
    doc.rect(totalsX, totalsY, totalsWidth, totalsHeight, "F");

    doc.setDrawColor(41, 128, 185);
    doc.rect(totalsX, totalsY, totalsWidth, totalsHeight);

    doc.setFontSize(10);
    doc.text(`Total H.T. : ${totalHT.toFixed(2)} €`, totalsX + 3, y);
    doc.text(`Total T.V.A. : ${totalVAT.toFixed(2)} €`, totalsX + 3, y + 7);

    doc.setFontSize(12);
    doc.text(`Total T.T.C. : ${totalTTC.toFixed(2)} €`, totalsX + 3, y + 16);

    /* ================= NOTES ================= */
    const notesY = y + 30;

    if (type === "QUOTATION") {
      doc.setFontSize(9);
      doc.setTextColor(128, 0, 0);
      doc.text(
        "⚠️ Ce devis est valable 30 jours à compter de sa date d'émission.",
        marginLeft,
        notesY
      );
      doc.text(
        "Les prix sont exprimés en euros hors taxes.",
        marginLeft,
        notesY + 5
      );
    }

    /* ================= FOOTER ================= */
    const footerY = 285;
    doc.setFontSize(9);
    doc.text("Merci pour votre confiance", pageWidth / 2, footerY, {
      align: "center",
    });

    /* ================= SAVE ================= */
    const fileName =
      type === "QUOTATION"
        ? `Devis_${invoiceNumber}.pdf`
        : type === "DELIVERY_NOTE"
        ? `BL_${invoiceNumber}.pdf`
        : type === "SALE_REFUND"
        ? `Avoir_${invoiceNumber}.pdf`
        : `Facture_${invoiceNumber}.pdf`;

    doc.save(fileName);
  };

  /* ================= RENDER ================= */
  return (
    <Container fluid>
      <Row>
        <Col md="12">
          <Button
            className="btn-wd btn-outline mr-1 float-left"
            variant="secondary"
            onClick={() => navigate.push("/sale-invoices/list")}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour à la liste
          </Button>

          <Button variant="danger" className="float-right" onClick={exportPDF}>
            <i className="fas fa-file-pdf mr-2"></i>
            Exporter PDF
          </Button>

          {status === "DRAFT" && (
            <Button
              variant="warning"
              className="float-right mr-2"
              onClick={() => navigate.push(`/sale-invoices/edit/${id}`)}
            >
              <i className="fas fa-edit mr-2"></i>
              Modifier
            </Button>
          )}
        </Col>
      </Row>

      <Card className="mt-4 shadow">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <Card.Title as="h4" className="mb-0">
              <i className="fas fa-file-invoice-dollar mr-2"></i>
              {getTypeLabel(type)} - {invoiceNumber}
            </Card.Title>
            <small className="text-light">
              {date} | {getStatusBadge(status)}
            </small>
          </div>
          <div>
            <span className="badge badge-light text-primary p-2">
              <i className="fas fa-euro-sign mr-1"></i>
              {totalTTC.toFixed(2)} €
            </span>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Company and Client Info */}
          <Row className="mb-4">
            <Col md="6">
              <Card className="border-primary">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 text-primary">
                    <i className="fas fa-store mr-2"></i>
                    Vendeur
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">
                    <strong>{companyInfo.name}</strong>
                  </p>
                  <p className="mb-1">{companyInfo.address}</p>
                  <p className="mb-1">{companyInfo.city}</p>
                  <p className="mb-1">
                    <i className="fas fa-phone-alt mr-2 text-muted"></i>
                    {companyInfo.phone}
                  </p>
                  <p className="mb-0">
                    <i className="fas fa-envelope mr-2 text-muted"></i>
                    {companyInfo.email}
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md="6">
              <Card className="border-primary">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 text-primary">
                    <i className="fas fa-user mr-2"></i>
                    Client
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">
                    <strong>{clientDetails?.name || "Nom du client"}</strong>
                  </p>
                  <p className="mb-1">{clientDetails?.address || "Adresse"}</p>
                  <p className="mb-1">
                    {clientDetails?.postalCode || ""}{" "}
                    {clientDetails?.city || "Ville"}
                  </p>
                  <p className="mb-1">
                    <i className="fas fa-phone-alt mr-2 text-muted"></i>
                    {clientDetails?.phone || "Non renseigné"}
                  </p>
                  <p className="mb-0">
                    <i className="fas fa-envelope mr-2 text-muted"></i>
                    {clientDetails?.email || "Email non renseigné"}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Invoice Items */}
          <Row>
            <Col md="12">
              <div className="table-responsive">
                <Table striped hover className="table-invoice">
                  <thead className="thead-dark">
                    <tr>
                      <th>Produit</th>
                      <th className="text-center">Quantité</th>
                      <th className="text-right">Prix unitaire HT</th>
                      <th className="text-center">TVA</th>
                      <th className="text-right">Montant HT</th>
                      <th className="text-right">Montant TVA</th>
                      <th className="text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.length > 0 ? (
                      invoiceItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="mr-3 text-primary">
                                <i className="fas fa-cube"></i>
                              </div>
                              <div>
                                <strong>{item.productName}</strong>
                                <br />
                                <small className="text-muted">
                                  Réf: {item.productId}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center align-middle">
                            <span className="badge badge-primary p-2">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="text-right align-middle">
                            {item.price.toFixed(2)} €
                          </td>
                          <td className="text-center align-middle">
                            <span
                              className={`badge ${
                                item.vatRate === 0
                                  ? "badge-secondary"
                                  : item.vatRate <= 10
                                  ? "badge-info"
                                  : "badge-warning"
                              }`}
                            >
                              {item.vatRate}%
                            </span>
                          </td>
                          <td className="text-right align-middle">
                            {item.totalHT.toFixed(2)} €
                          </td>
                          <td className="text-right align-middle">
                            {item.vatAmount.toFixed(2)} €
                          </td>
                          <td className="text-right align-middle font-weight-bold text-primary">
                            {item.totalTTC.toFixed(2)} €
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          <i className="fas fa-exclamation-circle fa-2x mb-3"></i>
                          <p>Aucun article dans cette facture</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>

          {/* Totals and Payment Info */}
          <Row className="mt-5">
            <Col md="6">
              <Card className="border-light">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 text-primary">
                    <i className="fas fa-info-circle mr-2"></i>
                    Informations de paiement
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md="6">
                      <p className="mb-2">
                        <small className="text-muted">Mode de paiement</small>
                        <br />
                        <strong>Virement bancaire</strong>
                      </p>
                      <p className="mb-0">
                        <small className="text-muted">Date d'échéance</small>
                        <br />
                        <strong>
                          {(() => {
                            const dueDate = new Date(date);
                            dueDate.setDate(dueDate.getDate() + 30);
                            return dueDate.toLocaleDateString("fr-FR");
                          })()}
                        </strong>
                      </p>
                    </Col>
                    <Col md="6">
                      <p className="mb-2">
                        <small className="text-muted">IBAN</small>
                        <br />
                        <strong>FR76 1234 5678 9012 3456 7890 123</strong>
                      </p>
                      <p className="mb-0">
                        <small className="text-muted">BIC</small>
                        <br />
                        <strong>ABCDEDFXXX</strong>
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col md="6">
              <Card className="bg-light border-primary">
                <Card.Body>
                  <Row>
                    <Col md="6" className="text-right">
                      <p className="mb-2">
                        <strong>Total HT :</strong>
                      </p>
                      <p className="mb-2">
                        <strong>Total TVA :</strong>
                      </p>
                      <p className="mb-0 h5">
                        <strong>Total TTC :</strong>
                      </p>
                    </Col>
                    <Col md="6" className="text-right">
                      <p className="mb-2">{totalHT.toFixed(2)} €</p>
                      <p className="mb-2">{totalVAT.toFixed(2)} €</p>
                      <p className="mb-0 h4 text-primary font-weight-bold">
                        {totalTTC.toFixed(2)} €
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Notes */}
          {type === "QUOTATION" && (
            <Row className="mt-3">
              <Col md="12">
                <Card className="border-warning">
                  <Card.Header className="bg-warning text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Note importante
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0">
                      Ce devis est valable 30 jours à compter de sa date
                      d'émission. Les prix sont exprimés en euros hors taxes.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>

        <Card.Footer className="bg-light text-center">
          <Button
            variant="secondary"
            onClick={() => navigate.push("/sale-invoices/list")}
            className="mr-3"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour à la liste
          </Button>

          <Button variant="primary" onClick={exportPDF} className="mr-3">
            <i className="fas fa-print mr-2"></i>
            Imprimer
          </Button>

          <Button variant="success" onClick={exportPDF}>
            <i className="fas fa-download mr-2"></i>
            Télécharger PDF
          </Button>
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default SaleInvoiceDetails;
