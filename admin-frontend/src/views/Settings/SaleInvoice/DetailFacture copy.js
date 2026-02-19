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
        }),
      );
    };

    loadData();
  }, [dispatch, id]);

  /* ================== NEW PDF EXPORT EXACT LIKE SAMPLE ================== */
  const convertNumberToFrench = (num) => {
    try {
      return new Intl.NumberFormat("fr-FR").format(num);
    } catch {
      return num.toString();
    }
  };
  const getTypeLabel = (type) => {
    const labels = {
      QUOTATION: "Devis",
      INVOICE: "Facture",
      DELIVERY_NOTE: "Bon de livraison",
      SALE_REFUND: "Avoir",
    };
    return labels[type] || type;
  };

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const margin = 20;
    const blue = [41, 128, 185];

    // Helper function to load image properly
    const addLogoToPDF = () => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = logo;
        img.onload = () => {
          try {
            doc.addImage(img, "PNG", margin, 10, 35, 15);
          } catch (e) {
            console.warn("Could not add logo:", e);
          }
          resolve();
        };
        img.onerror = () => {
          console.warn("Logo failed to load");
          resolve();
        };
      });
    };

    const generatePDF = async () => {
      await addLogoToPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(...blue);
      doc.setFont("helvetica", "bold");
      doc.text(getTypeLabel(type).toUpperCase(), pageWidth / 2, 25, {
        align: "center",
      });

      // Invoice number and date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`N°: ${invoiceNumber}`, margin, 40);
      doc.text(`Date: ${date}`, margin, 45);

      // Seller Information
      doc.setFontSize(11);
      doc.setTextColor(...blue);
      doc.setFont("helvetica", "bold");
      doc.text("Vendeur", margin, 60);

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      doc.text(companyInfo.name, margin, 67);
      doc.text(companyInfo.address, margin, 73);
      doc.text(companyInfo.city, margin, 79);
      doc.text(`Tél: ${companyInfo.phone}`, margin, 85);
      doc.text(`Email: ${companyInfo.email}`, margin, 91);
      doc.text(`SIRET: ${companyInfo.siret}`, margin, 97);

      // Client Information
      const clientX = pageWidth - margin - 80;

      doc.setFontSize(11);
      doc.setTextColor(...blue);
      doc.setFont("helvetica", "bold");
      doc.text("Client", clientX, 60);

      // Client box
      doc.setDrawColor(...blue);
      doc.setLineWidth(0.5);
      doc.rect(clientX - 2, 62, 84, 45);

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      doc.text(clientDetails?.name || "Nom du client", clientX, 70);
      doc.text(clientDetails?.address || "Adresse", clientX, 76);
      doc.text(
        `${clientDetails?.postalCode || ""} ${clientDetails?.city || "Ville"}`,
        clientX,
        82,
      );
      doc.text(`Tél: ${clientDetails?.phone || "Non renseigné"}`, clientX, 88);
      doc.text(`Email: ${clientDetails?.email || ""}`, clientX, 94);

      // Items Table
      const tableHeaders = [
        [
          { content: "Désignation", styles: { halign: "left" } },
          { content: "Qté", styles: { halign: "center" } },
          { content: "P.U. HT (TND)", styles: { halign: "right" } },
          { content: "TVA %", styles: { halign: "center" } },
          { content: "Total HT (TND)", styles: { halign: "right" } },
          { content: "Total TTC (TND)", styles: { halign: "right" } },
        ],
      ];

      const tableBody = invoiceItems.map((item) => [
        { content: item.productName, styles: { halign: "left" } },
        { content: item.quantity.toString(), styles: { halign: "center" } },
        { content: item.price.toFixed(3), styles: { halign: "right" } },
        { content: `${item.vatRate}%`, styles: { halign: "center" } },
        { content: item.totalHT.toFixed(3), styles: { halign: "right" } },
        { content: item.totalTTC.toFixed(3), styles: { halign: "right" } },
      ]);

      autoTable(doc, {
        startY: 115,
        head: tableHeaders,
        body: tableBody,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: 50,
        },
        headStyles: {
          fillColor: blue,
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
        },
      });

      // Totals
      const finalY = doc.lastAutoTable.finalY + 15;

      // Totals box
      doc.setDrawColor(...blue);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(pageWidth - margin - 70, finalY, 70, 40, 3, 3, "FD");

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Total HT:", pageWidth - margin - 62, finalY + 10);
      doc.text("TVA:", pageWidth - margin - 62, finalY + 20);
      doc.text("Total TTC:", pageWidth - margin - 62, finalY + 30);

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${totalHT.toFixed(3)} TND`,
        pageWidth - margin - 20,
        finalY + 10,
        {
          align: "right",
        },
      );
      doc.text(
        `${totalVAT.toFixed(3)} TND`,
        pageWidth - margin - 20,
        finalY + 20,
        {
          align: "right",
        },
      );
      doc.setTextColor(...blue);
      doc.setFontSize(12);
      doc.text(
        `${totalTTC.toFixed(3)} TND`,
        pageWidth - margin - 20,
        finalY + 30,
        {
          align: "right",
        },
      );

      // Payment Information
      const paymentY = finalY + 50;

      doc.setFontSize(10);
      doc.setTextColor(...blue);
      doc.setFont("helvetica", "bold");
      doc.text("Informations de paiement", margin, paymentY);

      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");

      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 30);

      doc.text(`Mode de paiement: Virement bancaire`, margin, paymentY + 7);
      doc.text(
        `Date d'échéance: ${dueDate.toLocaleDateString("fr-FR")}`,
        margin,
        paymentY + 14,
      );
      doc.text(
        `IBAN: FR76 1234 5678 9012 3456 7890 123`,
        margin,
        paymentY + 21,
      );
      doc.text(`BIC: ABCDEDFXXX`, margin, paymentY + 28);

      // Notes for quotations
      if (type === "QUOTATION") {
        doc.setDrawColor(255, 193, 7);
        doc.setFillColor(255, 243, 205);
        doc.roundedRect(
          margin,
          paymentY + 35,
          pageWidth - margin * 2,
          20,
          2,
          2,
          "FD",
        );

        doc.setFontSize(8);
        doc.setTextColor(133, 100, 4);
        doc.text(
          "Ce devis est valable 30 jours à compter de sa date d'émission. Les prix sont exprimés en euros hors taxes.",
          margin + 5,
          paymentY + 45,
        );
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Merci pour votre confiance.", pageWidth / 2, 285, {
        align: "center",
      });
      doc.text(
        `Document généré le ${new Date().toLocaleDateString("fr-FR")}`,
        pageWidth / 2,
        290,
        {
          align: "center",
        },
      );

      // Page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, 295, {
          align: "center",
        });
      }

      // Save PDF
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

    generatePDF();
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
              {type} - {invoiceNumber}
            </Card.Title>
            <small className="text-light">
              {date} | {status}
            </small>
          </div>
          <div>
            <span className="badge badge-light text-primary p-2">
              <i className="fas fa-euro-sign mr-1"></i>
              {totalTTC.toFixed(3)} TND
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
                            {item.price.toFixed(3)} TND
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
                            {item.totalHT.toFixed(3)} TND
                          </td>
                          <td className="text-right align-middle">
                            {item.vatAmount.toFixed(3)} TND
                          </td>
                          <td className="text-right align-middle font-weight-bold text-primary">
                            {item.totalTTC.toFixed(3)} TND
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
                      <p className="mb-2">{totalHT.toFixed(3)} TND</p>
                      <p className="mb-2">{totalVAT.toFixed(3)} TND</p>
                      <p className="mb-0 h4 text-primary font-weight-bold">
                        {totalTTC.toFixed(3)} TND
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
