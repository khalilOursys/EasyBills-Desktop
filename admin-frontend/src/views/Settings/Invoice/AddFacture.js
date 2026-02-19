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
  addPurchaseInvoice,
  updatePurchaseInvoice,
  getPurchaseInvoice,
} from "../../../Redux/purchaseInvoiceSlice";
import { fetchProducts } from "../../../Redux/productsSlice";
import { fetchSuppliers } from "../../../Redux/suppliersSlice";

function AddPurchaseInvoice() {
  const notify = (type, msg) => {
    toast(
      <strong>
        <i
          className={`fas ${
            type === 1 ? "fa-check-circle" : "fa-exclamation-circle"
          }`}
        ></i>
        {msg}
      </strong>,
      { type: type === 1 ? toast.TYPE.SUCCESS : toast.TYPE.ERROR }
    );
  };

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  const [date, setDate] = useState(dateString);

  const dispatch = useDispatch();
  const navigate = useHistory();
  const { id: paramId } = useParams();
  const id = !isNaN(paramId) ? paramId : null;

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [type, setType] = useState("PURCHASE");
  const [status, setStatus] = useState("DRAFT");

  const calculateTotals = useCallback(() => {
    let ht = invoiceItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    // Assuming 19% TVA
    const ttc = ht * 1.19;
    setTotalHT(ht);
    setTotalTTC(ttc);
  }, [invoiceItems]);

  useEffect(() => {
    const fetchData = async () => {
      const [supplierRes, productRes] = await Promise.all([
        dispatch(fetchSuppliers()),
        dispatch(fetchProducts()),
      ]);
      setSuppliers(supplierRes.payload);
      setProducts(productRes.payload);
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      const fetchInvoice = async () => {
        const response = await dispatch(getPurchaseInvoice(id));
        const data = response.payload;
        setInvoiceNumber(data.invoiceNumber);
        setDate(data.date.split("T")[0]);
        setType(data.type);
        setStatus(data.status);
        setTotalHT(data.totalHT);
        setTotalTTC(data.totalTTC);

        setSupplier({
          value: data.supplier.id,
          label: data.supplier.name,
          supplier: data.supplier,
        });

        setInvoiceItems(
          data.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          }))
        );
      };
      fetchInvoice();
    }
  }, [id, dispatch]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleItemChange = (index, field, value) => {
    const newItems = invoiceItems.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };

        if (field === "productId") {
          const selectedProduct = products.find((p) => p.id === value);
          updatedItem.price = selectedProduct ? selectedProduct.salePrice : 0;
        }

        updatedItem.total = updatedItem.price * updatedItem.quantity;
        return updatedItem;
      }
      return item;
    });
    setInvoiceItems(newItems);
  };

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { productId: "", quantity: 1, price: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(newItems);
  };

  const submitForm = async () => {
    // Validate form
    if (validator.isEmpty(invoiceNumber)) {
      notify(2, "Numéro de facture est obligatoire");
      return;
    }
    if (!supplier) {
      notify(2, "Fournisseur est obligatoire");
      return;
    }
    if (invoiceItems.length === 0) {
      notify(2, "Au moins un article est obligatoire");
      return;
    }

    const items = invoiceItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    try {
      const invoiceData = {
        invoiceNumber,
        date,
        type,
        status,
        supplierId: supplier.value,
        items,
        totalHT,
        totalTTC,
      };

      if (id) {
        await dispatch(updatePurchaseInvoice({ id, ...invoiceData }));
        notify(1, "Facture d'achat mise à jour avec succès");
      } else {
        await dispatch(addPurchaseInvoice(invoiceData));
        notify(1, "Facture d'achat ajoutée avec succès");
      }

      setTimeout(() => navigate.push("/purchase-invoices/list"), 1500);
    } catch (error) {
      notify(2, "Erreur lors de l'enregistrement de la facture");
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
            onClick={() => navigate.push("/purchase-invoice/list")}
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
              {isNaN(paramId)
                ? "Ajouter facture d'achat"
                : "Modifier facture d'achat"}
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md="4">
                <Form.Group>
                  <label>Numéro de facture* </label>
                  <Form.Control
                    value={invoiceNumber}
                    placeholder="Ex: FAC-2023-001"
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md="4">
                <Form.Group>
                  <label>Date* </label>
                  <Form.Control
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md="4">
                <Form.Group>
                  <label>Type* </label>
                  <Select
                    value={{ value: type, label: type }}
                    options={[
                      { value: "PURCHASE_ORDER", label: "Bon de commande" },
                      { value: "PURCHASE_INVOICE", label: "Facture achat" },
                      { value: "PURCHASE_REFUND", label: "Avoir fournisseur" },
                    ]}
                    onChange={(e) => setType(e.value)}
                  />
                </Form.Group>
              </Col>
              <Col md="6">
                <Form.Group>
                  <label>Fournisseur* </label>
                  <Select
                    placeholder="Sélectionner un fournisseur"
                    value={supplier}
                    options={suppliers.map((supplier) => ({
                      label: supplier.name,
                      value: supplier.id,
                      supplier: supplier,
                    }))}
                    onChange={(e) => setSupplier(e)}
                  />
                </Form.Group>
              </Col>
              <Col md="6">
                <Form.Group>
                  <label>Statut </label>
                  <Select
                    value={{ value: status, label: status }}
                    options={[
                      { value: "DRAFT", label: "Brouillon" },
                      { value: "VALIDATED", label: "Validée" },
                      { value: "PAID", label: "Payée" },
                      { value: "CANCELLED", label: "Annulée" },
                    ]}
                    onChange={(e) => setStatus(e.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <br></br>

            {/* Items Table */}
            <Row>
              <Col md="12">
                <Button
                  variant="success"
                  onClick={handleAddItem}
                  className="mb-3"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Ajouter un article
                </Button>

                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire (€)</th>
                      <th>Total (€)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <Select
                            placeholder="Sélectionner un produit"
                            value={products
                              .map((p) => ({
                                label: p.name,
                                value: p.id,
                              }))
                              .find((p) => p.value === item.productId)}
                            options={products.map((product) => ({
                              label: product.name,
                              value: product.id,
                            }))}
                            onChange={(e) =>
                              handleItemChange(index, "productId", e.value)
                            }
                          />
                        </td>
                        <td>
                          <Form.Control
                            value={item.quantity}
                            type="number"
                            min="1"
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                        <td>
                          <Form.Control
                            value={item.price}
                            type="number"
                            step="0.01"
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                        <td>{item.total.toFixed(2)}</td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>

            {/* Totals */}
            <Row>
              <Col md="4">
                <Form.Group>
                  <label>Total HT (€)</label>
                  <Form.Control
                    value={totalHT.toFixed(2)}
                    placeholder="Total HT"
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md="4">
                <Form.Group>
                  <label>TVA (19%) (€)</label>
                  <Form.Control
                    value={(totalTTC - totalHT).toFixed(2)}
                    placeholder="TVA"
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md="4">
                <Form.Group>
                  <label>Total TTC (€)</label>
                  <Form.Control
                    value={totalTTC.toFixed(2)}
                    placeholder="Total TTC"
                    readOnly
                  />
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
              {isNaN(paramId) ? "Enregistrer" : "Mettre à jour"}
            </Button>
          </Card.Footer>
        </Card>
      </Form>
    </Container>
  );
}

export default AddPurchaseInvoice;
