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
} from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getPurchaseInvoice } from "../../../Redux/purchaseInvoiceSlice";
import { fetchProducts } from "../../../Redux/productsSlice";
import { fetchSuppliers } from "../../../Redux/suppliersSlice";

function PurchaseInvoiceDetails() {
  const dispatch = useDispatch();
  const navigate = useHistory();
  const { id } = useParams();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      const [suppliersRes, productsRes] = await Promise.all([
        dispatch(fetchSuppliers()),
        dispatch(fetchProducts()),
      ]);

      setSuppliers(suppliersRes.payload || []);
      setProducts(productsRes.payload || []);

      const invoiceRes = await dispatch(getPurchaseInvoice(id));
      const data = invoiceRes.payload;

      setInvoiceNumber(data.invoiceNumber);
      setDate(data.date.split("T")[0]);
      setType(data.type);
      setStatus(data.status);
      setTotalHT(data.totalHT);
      setTotalTTC(data.totalTTC);

      setSupplier({
        label: data.supplier.name,
        value: data.supplier.id,
      });

      setInvoiceItems(
        data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }))
      );
    };

    loadData();
  }, [dispatch, id]);
  /* const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("FACTURE D'ACHAT", 14, 15);

    doc.setFontSize(10);
    doc.text(`Facture N° : ${invoiceNumber}`, 14, 25);
    doc.text(`Date : ${date}`, 14, 32);

    doc.text("FOURNISSEUR", 14, 45);
    doc.text(supplier?.label || "", 14, 52);

    const tableColumn = [
      "Désignation",
      "Quantité",
      "P.U. HT",
      "Montant HT",
    ];

    const tableRows = invoiceItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return [
        product?.name || "",
        item.quantity,
        item.price.toFixed(2),
        item.total.toFixed(2),
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 220, 220] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Total HT : ${totalHT.toFixed(2)} EUR`, 140, finalY);
    doc.text(
      `Total TVA : ${(totalTTC - totalHT).toFixed(2)} EUR`,
      140,
      finalY + 7
    );
    doc.setFontSize(11);
    doc.text(`Total TTC : ${totalTTC.toFixed(2)} EUR`, 140, finalY + 16);

    doc.save(`Facture_Achat_${invoiceNumber}.pdf`);
  }; */

  const exportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    /* ================= LOGO ================= */
    doc.addImage(logo, "PNG", 14, 10, 40, 15);

    /* ================= TITLE ================= */
    doc.setFontSize(16);
    doc.text("FACTURE", 105, 18, { align: "center" });

    doc.setFontSize(10);
    doc.text(`N° de facture : ${invoiceNumber}`, 14, 32);
    doc.text(`Date de facture : ${date}`, 14, 38);

    /* ================= SUPPLIER ================= */
    doc.setFontSize(11);
    doc.text("FOURNISSEUR", 14, 48);

    doc.setFontSize(10);
    doc.text(supplier?.label || "", 14, 55);
    doc.text("Adresse fournisseur", 14, 61);
    doc.text("Matricule fiscal / SIRET", 14, 67);

    /* ================= CLIENT (WITH BORDER) ================= */
    doc.setFontSize(11);
    doc.text("CLIENT", 120, 48);
    doc.rect(118, 52, 75, 22);

    doc.setFontSize(10);
    doc.text("Votre société", 122, 58);
    doc.text("Adresse client", 122, 64);
    doc.text("Pays", 122, 70);

    /* ================= TABLE ================= */
    autoTable(doc, {
      startY: 95,
      theme: "grid",
      head: [[
        "Désignation",
        "Quantité",
        "P.U. H.T.",
        "T.V.A.",
        "Montant H.T."
      ]],
      body: invoiceItems.map((item) => {
        const product = products.find(p => p.id === item.productId);
        return [
          product?.name || "",
          item.quantity,
          item.price.toFixed(2),
          "19 %",
          item.total.toFixed(2),
        ];
      }),
      styles: {
        fontSize: 9,
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: 0,
      },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "center" },
        4: { halign: "right" },
      },
    });

    /* ================= TOTALS + PAYMENT INFO ================= */
    const y = doc.lastAutoTable.finalY + 10;

    /* LEFT: PAYMENT INFO */
    doc.setFontSize(10);
    doc.text("Mode de règlement :", 14, y);
    doc.text("Virement", 55, y);

    doc.text("Date d'échéance :", 14, y + 8);
    doc.text("06/12/2025", 55, y + 8);

    /* RIGHT: TOTALS (WITH BORDER) */
    doc.rect(135, y - 6, 60, 28);

    doc.text(`Total H.T. : ${totalHT.toFixed(2)} EUR`, 138, y);
    doc.text(
      `Total T.V.A. : ${(totalTTC - totalHT).toFixed(2)} EUR`,
      138,
      y + 7
    );

    doc.setFontSize(12);
    doc.text(`Total T.T.C. : ${totalTTC.toFixed(2)} EUR`, 138, y + 16);

    /* ================= FOOTER ================= */
    doc.setFontSize(9);
    doc.text(
      "Merci pour votre confiance",
      105,
      285,
      { align: "center" }
    );

    /* ================= SAVE ================= */
    doc.save(`Facture_${invoiceNumber}.pdf`);
  };

  /* ================= RENDER ================= */
  return (
    <Container fluid>
      <Row>
        <Col md="12">
          <Button
            className="btn-wd btn-outline mr-1 float-left"
            variant="secondary"
            onClick={() => navigate.push("/purchase-invoices/list")}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour à la liste
          </Button>
        </Col>
      </Row>

      <Form className="form">
        <Card>
          <Card.Header>
            <Card.Title as="h4">Détails facture d'achat</Card.Title>
            <br></br>
            <Button
              variant="danger"
              className="mr-2"
              onClick={exportPDF}
            >
              <i className="fas fa-file-pdf mr-2"></i>
              Export PDF
            </Button>

          </Card.Header>

          <Card.Body>
            <Row>
              <Col md="4">
                <Form.Group>
                  <label>Numéro de facture</label>
                  <Form.Control value={invoiceNumber} readOnly />
                </Form.Group>
              </Col>

              <Col md="4">
                <Form.Group>
                  <label>Date</label>
                  <Form.Control type="date" value={date} readOnly />
                </Form.Group>
              </Col>

              <Col md="4">
                <Form.Group>
                  <label>Type</label>
                  <Form.Control value={type} readOnly />
                </Form.Group>
              </Col>

              <Col md="6">
                <Form.Group>
                  <label>Fournisseur</label>
                  <Form.Control value={supplier?.label || ""} readOnly />
                </Form.Group>
              </Col>

              <Col md="6">
                <Form.Group>
                  <label>Statut</label>
                  <Form.Control value={status} readOnly />
                </Form.Group>
              </Col>
            </Row>
            {/* <img src={logo} alt="medicacom" /> */}
            <hr />

            {/* ================= ITEMS TABLE ================= */}
            <Row>
              <Col md="12">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire (€)</th>
                      <th>Total (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, index) => {
                      const product = products.find(
                        (p) => p.id === item.productId
                      );

                      return (
                        <tr key={index}>
                          <td>{product?.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.price.toFixed(2)}</td>
                          <td>{item.total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Col>
            </Row>

            <hr />

            {/* ================= TOTALS ================= */}
            <Row>
              <Col md="4">
                <Form.Group>
                  <label>Total HT (€)</label>
                  <Form.Control value={totalHT.toFixed(2)} readOnly />
                </Form.Group>
              </Col>

              <Col md="4">
                <Form.Group>
                  <label>TVA (19%) (€)</label>
                  <Form.Control
                    value={(totalTTC - totalHT).toFixed(2)}
                    readOnly
                  />
                </Form.Group>
              </Col>

              <Col md="4">
                <Form.Group>
                  <label>Total TTC (€)</label>
                  <Form.Control value={totalTTC.toFixed(2)} readOnly />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>

          <Card.Footer>
            <Button
              variant="secondary"
              onClick={() => navigate.push("/purchase-invoices/list")}
            >
              Retour
            </Button>
          </Card.Footer>
        </Card>
      </Form>
    </Container>
  );
}

export default PurchaseInvoiceDetails;

