import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/img/logo44.png";
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
    name: "Orale Wave",
    address: "Route Sidi Mansour km 7 Sfax",
    city: "Sfax, Tunisie",
    phone: "27737857",
    email: "contact@oralwave.store",
    siret: "123 456 789 00012",
    vatNumber: "FR12 123456789",
    mf: "1920515/B/B/M/000",
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

      setInvoiceNumber(data.invoiceNumber || "");
      setDate(data.date?.split("T")[0] || "");
      setType(data.type || "");
      setStatus(data.status || "");
      setTotalHT(data.totalHT || 0);
      setTotalTTC(data.totalTTC || 0);
      setTotalVAT((data.totalTTC || 0) - (data.totalHT || 0));

      setClientDetails(data.client || {});

      setClient({
        label: data.client?.name || "",
        value: data.client?.id || "",
        client: data.client || {},
      });

      setInvoiceItems(
        (data.items || []).map((item) => {
          const product =
            productsRes.payload?.find((p) => p.id === item.productId) || {};
          const itemHT = item.price * item.quantity;
          const itemVAT = item.vatRate ? itemHT * (item.vatRate / 100) : 0;
          const vatRate = item.vatRate || (data.type === "QUOTATION" ? 0 : 0);

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

  /* ================== HELPER FUNCTIONS ================== */
  const formatNumber = (num) => {
    if (isNaN(num)) return "0.000";
    return num.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const numberToFrench = (num) => {
    if (num === 0) return "zéro";

    const units = [
      "",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
      "dix",
      "onze",
      "douze",
      "treize",
      "quatorze",
      "quinze",
      "seize",
      "dix-sept",
      "dix-huit",
      "dix-neuf",
    ];
    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante-dix",
      "quatre-vingt",
      "quatre-vingt-dix",
    ];

    function translate(n) {
      if (n < 20) return units[n];
      if (n < 100) {
        const u = n % 10;
        const t = Math.floor(n / 10);
        let s = tens[t];
        if (u === 1 && t < 8) s += " et " + units[u];
        else if (u > 0) s += "-" + units[u];
        if (u === 0 && t === 8) s += "s";
        return s;
      }
      if (n < 1000) {
        const h = Math.floor(n / 100);
        const r = n % 100;
        let s = "";
        if (h === 1) s = "cent";
        else if (h > 1) s = units[h] + (r === 0 ? " cents" : " cent");
        if (r > 0) s += (s ? " " : "") + translate(r);
        return s;
      }
      if (n < 1000000) {
        const th = Math.floor(n / 1000);
        const r = n % 1000;
        let s = th === 1 ? "mille" : translate(th) + " mille";
        if (r > 0) s += " " + translate(r);
        return s;
      }
      return "";
    }

    return translate(num);
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

  /* ================== NEW PDF EXPORT EXACT LIKE SAMPLE ================== */
  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const margin = 17; // Balanced margins
    const blue = [41, 128, 185];
    const footerLineY = 260;

    const addLogoToPDF = () => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = logo;
        img.onload = () => {
          try {
            doc.addImage(img, "PNG", margin, 8, 40, 12);
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

    const drawHeader = async (currentPage, totalPages) => {
      await addLogoToPDF();

      doc.setFillColor(...blue);
      doc.rect(0, 0, pageWidth, 5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);

      doc.setTextColor(...blue);
      doc.setFontSize(10);
      doc.text(companyInfo.name, pageWidth - margin, 12, { align: "right" });

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`MF: ${companyInfo.mf || ""}`, pageWidth - margin, 18, {
        align: "right",
      });

      doc.setDrawColor(...blue);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, 25, pageWidth - 2 * margin, 30, 5, 5, "D");

      doc.setFontSize(16);
      doc.setTextColor(...blue);
      doc.setFont("helvetica", "bold");
      /*  doc.text(getTypeLabel(type).toUpperCase(), margin + 5, 40); */
      doc.text("Facture ", margin + 5, 40);
      const clientX = pageWidth - margin - 100;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");

      doc.text("Client :", clientX, 37);
      doc.text("Téléphone :", clientX, 42);
      doc.text("M.F :", clientX, 47);
      doc.text("Adresse :", clientX, 52);

      doc.text(clientDetails.name || "", clientX + 25, 37);
      doc.text(clientDetails.phone || "", clientX + 25, 42);
      doc.text(clientDetails.taxNumber || "", clientX + 25, 47);
      doc.text(
        `${clientDetails.address || ""} ${clientDetails.city || ""}`,
        clientX + 25,
        52,
      );

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Numéro", margin + 5, 62);
      doc.text("Date", margin + 70, 62);
      doc.text("Page", margin + 135, 62);

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 64, pageWidth - margin, 64);

      doc.text(invoiceNumber, margin + 5, 70);
      doc.text(formatDate(date), margin + 70, 70);
      doc.text(`${currentPage}/${totalPages}`, margin + 135, 70);
    };

    const drawFooter = (typeLabel) => {
      doc.setDrawColor(...blue);
      doc.line(margin, footerLineY, pageWidth - margin, footerLineY);

      doc.setFontSize(9);
      doc.setTextColor(100);
      /* doc.text(
        `NB: Ce ${typeLabel} est valable 30 jour(s) a partir de la date de creation.`,
        pageWidth / 2,
        footerLineY + 7,
        { align: "center" },
      ); */

      doc.text(
        `Addresse: ${companyInfo.address}`,
        margin + 27,
        footerLineY + 13,
        {
          align: "center",
        },
      );
      doc.text(
        `Tel: ${companyInfo.phone || "93252121"}`,
        pageWidth / 2,
        footerLineY + 13,
        { align: "center" },
      );

      doc.text(
        `email: ${companyInfo.email}`,
        pageWidth - margin - 20,
        footerLineY + 13,
        {
          align: "center",
        },
      );
    };

    const generatePDF = async () => {
      const rowsPerPage = 15;
      const tableHeaders = [
        { content: "Désignation", styles: { halign: "left" } },
        { content: "Rem %", styles: { halign: "center" } },
        { content: "Qte", styles: { halign: "center" } },
        { content: "P.U HT", styles: { halign: "right" } },
        { content: "TVA %", styles: { halign: "center" } },
        { content: "P.HT", styles: { halign: "right" } },
        { content: "P.TTC", styles: { halign: "right" } },
      ];

      const tableBody = invoiceItems.map((item) => [
        { content: item.productName, styles: { halign: "left" } },
        { content: "0.00", styles: { halign: "center" } },
        { content: formatNumber(item.quantity), styles: { halign: "center" } },
        { content: formatNumber(item.price), styles: { halign: "right" } },
        { content: `${item.vatRate}`, styles: { halign: "center" } },
        { content: formatNumber(item.totalHT), styles: { halign: "right" } },
        { content: formatNumber(item.totalTTC), styles: { halign: "right" } },
      ]);

      const totalPages = Math.max(1, Math.ceil(tableBody.length / rowsPerPage));
      let currentPage = 1;

      await drawHeader(currentPage, totalPages);

      let startY = 75;

      for (let i = 0; i < tableBody.length; i += rowsPerPage) {
        let chunk = tableBody.slice(i, i + rowsPerPage);

        // Pad to full page height with empty rows
        const fullChunk = [...chunk];
        while (fullChunk.length < rowsPerPage) {
          fullChunk.push(["", "", "", "", "", "", ""]);
        }

        autoTable(doc, {
          head: [tableHeaders],
          body: fullChunk,
          startY: startY,
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            textColor: 50,
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: blue,
            textColor: 255,
            fontStyle: "bold",
          },
          bodyStyles: {
            lineWidth: { top: 0, bottom: 0, left: 0.1, right: 0.1 }, // No horizontal lines between rows
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 74 },
            1: { cellWidth: 15 },
            2: { cellWidth: 12 },
            3: { cellWidth: 20 },
            4: { cellWidth: 15 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
          },
        });

        // Add closing bottom line on EVERY page
        const tableBottomY = doc.lastAutoTable.finalY;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(margin, tableBottomY, pageWidth - margin, tableBottomY);

        if (i + rowsPerPage < tableBody.length) {
          currentPage++;
          doc.addPage();
          await drawHeader(currentPage, totalPages);
          startY = 75;
        }
      }

      // Bottom sections only on last page
      let blockStartY = doc.lastAutoTable.finalY + 10;
      const preferredBlockStartY = 200;
      if (blockStartY < preferredBlockStartY) {
        blockStartY = preferredBlockStartY;
      }

      // VAT groups
      const vatRates = [0, 7, 19];
      const vatGroups = {};
      invoiceItems.forEach((item) => {
        const rate = item.vatRate;
        if (!vatGroups[rate]) vatGroups[rate] = { base: 0, montant: 0 };
        vatGroups[rate].base += item.totalHT;
        vatGroups[rate].montant += item.vatAmount;
      });

      // Tax Table (left)
      const taxHeaders = [
        { content: "Taxe", styles: { halign: "left" } },
        { content: "Base", styles: { halign: "right" } },
        { content: "Montant", styles: { halign: "right" } },
      ];
      const taxBody = vatRates.map((rate) => [
        { content: `${rate}%`, styles: { halign: "left" } },
        {
          content: formatNumber(vatGroups[rate]?.base || 0),
          styles: { halign: "right" },
        },
        {
          content: formatNumber(vatGroups[rate]?.montant || 0),
          styles: { halign: "right" },
        },
      ]);

      autoTable(doc, {
        startY: blockStartY,
        head: [taxHeaders],
        body: taxBody,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        headStyles: { fillColor: blue, textColor: 255 },
        margin: { left: margin, right: 0 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
        },
      });

      // Signatures (middle)
      const middleX = margin + 55;
      doc.setDrawColor(...blue);
      doc.setLineWidth(0.5);
      doc.rect(middleX, blockStartY, 35, 30);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Signature Client", middleX + 17.5, blockStartY + 8, {
        align: "center",
      });

      doc.rect(middleX + 40, blockStartY, 35, 30);
      doc.text("Signature & Cachet", middleX + 57.5, blockStartY + 8, {
        align: "center",
      });

      // Totals (right)
      const rightX = middleX + 80;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("P.HT.T : ", rightX, blockStartY + 5);
      doc.text("Timbre fiscal : ", rightX, blockStartY + 10);
      doc.text("TVA : ", rightX, blockStartY + 15);
      doc.text("TTC : ", rightX, blockStartY + 20);
      doc.text("Net à payer : ", rightX, blockStartY + 25);

      doc.setTextColor(0);
      const valueOffset = 40;
      doc.text(
        formatNumber(totalHT) + " DT",
        rightX + valueOffset,
        blockStartY + 5,
        { align: "right" },
      );
      doc.text(
        formatNumber(1) + " DT",
        rightX + valueOffset,
        blockStartY + 10,
        { align: "right" },
      );
      doc.text(
        formatNumber(totalVAT) + " DT",
        rightX + valueOffset,
        blockStartY + 15,
        { align: "right" },
      );
      doc.text(
        formatNumber(totalTTC) + " DT",
        rightX + valueOffset,
        blockStartY + 20,
        { align: "right" },
      );
      doc.text(
        formatNumber(totalTTC + 1) + " DT",
        rightX + valueOffset,
        blockStartY + 25,
        { align: "right" },
      );

      // Amount in words (only on last page)
      const wordsY = blockStartY + 45;
      const integerPart = Math.floor(totalTTC);
      const millimes = Math.round((totalTTC - integerPart) * 1000);
      const millimesText = millimes === 0 ? "zéro" : numberToFrench(millimes);
      const typeLabel = getTypeLabel(type).toLowerCase();
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(
        `Le présent facture a la somme de : ${numberToFrench(integerPart)} Dinars et ${millimesText} Millimes`,
        margin,
        wordsY,
      );

      // Add footers to all pages
      const pageCount = doc.internal.getNumberOfPages();
      const typeLabelLower = getTypeLabel(type).toLowerCase();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawFooter(typeLabelLower);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, 290, {
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
