import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import validator from "validator";
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
import { toast, ToastContainer } from "react-toastify";

import {
  getSaleInvoice,
  fetchSaleInvoices,
  updateRefundInvoice,
  addRefundInvoice,
  getRefundInvoice,
} from "../../../Redux/saleInvoiceSlice";

function AddRefundInvoice() {
  const notify = (type, msg) => {
    toast(
      <strong>
        <i
          className={`fas ${type === 1 ? "fa-check-circle" : "fa-exclamation-circle"}`}
        ></i>
        {msg}
      </strong>,
      { type: type === 1 ? toast.TYPE.SUCCESS : toast.TYPE.ERROR },
    );
  };

  const dispatch = useDispatch();
  const navigate = useHistory();
  const { id: paramId } = useParams(); // refundId in edit mode
  const refundId = !isNaN(paramId) ? paramId : null;

  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);

  const [refundItems, setRefundItems] = useState([]);
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);

  const calculateTotals = useCallback(() => {
    let ht = refundItems.reduce((total, item) => {
      if (item.selected && item.refundQty > 0) {
        return total + item.price * item.refundQty;
      }
      return total;
    }, 0);

    setTotalHT(ht);
    setTotalTTC(ht * 1.19);
  }, [refundItems]);

  // -------------------------------------------------
  // Load list of invoices for selection
  // -------------------------------------------------
  useEffect(() => {
    const loadInvoices = async () => {
      const res = await dispatch(fetchSaleInvoices({ type: "SALE_INVOICE" }));
      setInvoiceList(
        res.payload.map((inv) => ({
          value: inv.id,
          label: `${inv.invoiceNumber}`,
          /* label: `${inv.invoiceNumber} — ${inv.client.name}`, */
        })),
      );
    };
    if (!refundId) loadInvoices(); // in ADD mode only
  }, [dispatch, refundId]);

  // -------------------------------------------------
  // When ADD MODE: load invoice items
  // -------------------------------------------------
  const loadInvoiceData = async (invoiceId) => {
    const res = await dispatch(getSaleInvoice(invoiceId));
    const data = res.payload;

    setInvoiceDetails(data);

    const mapped = data.items.map((item) => ({
      itemId: item.id,
      productId: item.productId,
      designation: item.designation,
      qty: item.quantity,
      refundQty: 0,
      price: item.price,
      selected: false,
    }));

    setRefundItems(mapped);
  };

  // -------------------------------------------------
  // EDIT MODE: load refund items
  // -------------------------------------------------
  useEffect(() => {
    if (refundId) {
      const loadRefund = async () => {
        const res = await dispatch(getRefundInvoice(refundId));
        const refund = res.payload;

        const inv = refund.invoice;

        setSelectedInvoice({
          value: inv.id,
          label: `${inv.invoiceNumber}`,
          /* label: `${inv.invoiceNumber} — ${inv.client.name}`, */
        });

        setInvoiceDetails(inv);

        const mapped = inv.items.map((item) => {
          const existing = refund.items.find((r) => r.itemId === item.id);
          return {
            itemId: item.id,
            productId: item.productId,
            designation: item.designation,
            qty: item.quantity,
            refundQty: existing ? existing.quantity : 0,
            price: item.price,
            selected: existing ? true : false,
          };
        });

        setRefundItems(mapped);
      };
      loadRefund();
    }
  }, [dispatch, refundId]);

  useEffect(() => calculateTotals(), [calculateTotals]);

  // -------------------------------------------------
  // Handlers
  // -------------------------------------------------
  const toggleItem = (index) => {
    const updated = [...refundItems];
    updated[index].selected = !updated[index].selected;
    setRefundItems(updated);
  };

  const changeRefundQty = (index, value) => {
    const updated = [...refundItems];
    updated[index].refundQty = Math.min(Number(value), updated[index].qty);
    setRefundItems(updated);
  };

  // -------------------------------------------------
  // Submit
  // -------------------------------------------------
  const submitForm = async () => {
    if (!selectedInvoice) {
      notify(2, "Veuillez sélectionner une facture");
      return;
    }

    const selectedItems = refundItems
      .filter((i) => i.selected && i.refundQty > 0)
      .map((i) => ({
        productId: i.productId,
        quantity: i.refundQty,
        price: i.price,
      }));

    if (selectedItems.length === 0) {
      notify(2, "Veuillez sélectionner au moins un article");
      return;
    }

    const payload = {
      invoiceNumber: selectedInvoice.label,
      originalInvoiceId: selectedInvoice.value,
      items: selectedItems,
      totalHT,
      totalTTC,
    };

    try {
      if (refundId) {
        await dispatch(updateRefundInvoice({ refundId, ...payload }));
        notify(1, "Avoir mis à jour avec succès");
      } else {
        await dispatch(addRefundInvoice(payload));
        notify(1, "Avoir créé avec succès");
      }

      /* setTimeout(() => navigate.push("/refund-invoices/list"), 1200); */
    } catch (e) {
      notify(2, "Erreur lors de l’enregistrement");
    }
  };

  return (
    <Container fluid>
      <ToastContainer />

      <Row>
        <Col md="12">
          <Button
            className="btn-wd btn-outline mr-1 float-left"
            type="button"
            variant="info"
            onClick={() => navigate.push("/refund-invoices/list")}
          >
            <span className="btn-label">
              <i className="fas fa-list"></i>
            </span>
            Retour à la liste
          </Button>
        </Col>
      </Row>

      <Form className="form">
        <Card>
          <Card.Header>
            <Card.Title as="h4">
              {refundId ? "Modifier Avoir" : "Créer Avoir (Refund)"}
            </Card.Title>
          </Card.Header>

          <Card.Body>
            <Row>
              {!refundId && (
                <Col md="6">
                  <Form.Group>
                    <label>Facture d’origine*</label>
                    <Select
                      placeholder="Sélectionner une facture"
                      options={invoiceList}
                      onChange={(e) => {
                        setSelectedInvoice(e);
                        loadInvoiceData(e.value);
                      }}
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Invoice Details Already Selected */}
              {refundId && (
                <Col md="6">
                  <Form.Group>
                    <label>Facture d’origine</label>{" "}
                    <Form.Control value={selectedInvoice?.label} readOnly />
                  </Form.Group>
                </Col>
              )}
            </Row>

            {/* Items Table */}
            {invoiceDetails && (
              <Row>
                <Col md="12">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th></th>
                        <th>Désignation</th>
                        <th>Quantité</th>
                        <th>Rendre</th>
                        <th>Prix (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Form.Check
                              checked={item.selected}
                              onChange={() => toggleItem(index)}
                            />
                          </td>
                          <td>{item.designation}</td>
                          <td>{item.qty}</td>
                          <td>
                            <Form.Control
                              type="number"
                              disabled={!item.selected}
                              value={item.refundQty}
                              min="0"
                              max={item.qty}
                              onChange={(e) =>
                                changeRefundQty(index, e.target.value)
                              }
                            />
                          </td>
                          <td>{item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            )}

            {/* Totals */}
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
              className="btn-wd btn-outline mr-1 float-left"
              variant="primary"
              onClick={submitForm}
            >
              {refundId ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </Card.Footer>
        </Card>
      </Form>
    </Container>
  );
}

export default AddRefundInvoice;
