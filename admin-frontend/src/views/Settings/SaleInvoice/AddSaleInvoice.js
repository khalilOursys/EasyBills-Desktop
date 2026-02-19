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
  Badge,
} from "react-bootstrap";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  addSaleInvoice,
  updateSaleInvoice,
  getSaleInvoice,
  fetchSaleInvoices,
} from "../../../Redux/saleInvoiceSlice";
import { fetchProducts } from "../../../Redux/productsSlice";
import { fetchClients } from "../../../Redux/clientsSlice";
import { fetchDrivers } from "../../../Redux/driversSlice";

function AddSaleInvoice() {
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
      { type: type === 1 ? toast.TYPE.SUCCESS : toast.TYPE.ERROR },
    );
  };

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  const [date, setDate] = useState(dateString);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dispatch = useDispatch();
  const navigate = useHistory();
  const location = useLocation();

  const { id: paramId } = useParams();
  const id = !isNaN(paramId) ? paramId : null;
  const typeFromURL = isNaN(paramId) ? location.pathname.split("/").pop() : "";

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [client, setClient] = useState(null);
  const [driver, setDriver] = useState(null);
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [type, setType] = useState(typeFromURL || "SALE_INVOICE");
  const [status, setStatus] = useState("DRAFT");

  // State for fetched delivery notes
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [loadingDeliveryNotes, setLoadingDeliveryNotes] = useState(false);

  const calculateTotals = useCallback(() => {
    let ht = 0;
    let vat = 0;
    let ttc = 0;

    invoiceItems.forEach((item) => {
      const itemHT = item.price * item.quantity;
      const itemVAT = itemHT * (item.vatRate / 100);
      const itemTTC = itemHT + itemVAT;

      ht += itemHT;
      vat += itemVAT;
      ttc += itemTTC;
    });

    setTotalHT(ht);
    setTotalVAT(vat);
    setTotalTTC(ttc);
  }, [invoiceItems]);

  useEffect(() => {
    const fetchData = async () => {
      const [clientRes, productRes, driverRes] = await Promise.all([
        dispatch(fetchClients()),
        dispatch(fetchProducts()),
        dispatch(fetchDrivers()),
      ]);
      setClients(clientRes.payload || []);
      setProducts(productRes.payload || []);
      setDrivers(driverRes.payload || []);
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      const fetchInvoice = async () => {
        const response = await dispatch(getSaleInvoice(id));
        const data = response.payload;
        setInvoiceNumber(data.invoiceNumber);
        setDate(data.date.split("T")[0]);
        setStartDate(data.startDate ? data.startDate.split("T")[0] : "");
        setEndDate(data.endDate ? data.endDate.split("T")[0] : "");
        setType(data.type);
        setStatus(data.status);
        setTotalHT(data.totalHT);
        setTotalTTC(data.totalTTC);

        // Set client only if it's not DELIVERY_NOTE_OUT
        if (data.type !== "DELIVERY_NOTE_OUT" && data.client) {
          setClient({
            value: data.client.id,
            label: data.client.name,
            client: data.client,
          });
        }

        // Set driver for DELIVERY_NOTE_OUT
        if (data.driver) {
          setDriver({
            value: data.driver.id,
            label: `${data.driver.firstName} ${data.driver.lastName}`,
            driver: data.driver,
          });
        }

        setInvoiceItems(
          data.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            vatRate: item.vatRate,
            vatAmount: item.vatAmount,
            totalHT: item.price * item.quantity,
            totalTTC: item.price * item.quantity * (1 + item.vatRate / 100),
          })),
        );
      };
      fetchInvoice();
    }
  }, [id, dispatch]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  // Fetch delivery notes for SALE_INVOICE type
  useEffect(() => {
    const fetchDeliveryNotes = async () => {
      if (type === "SALE_INVOICE" && client?.value) {
        setLoadingDeliveryNotes(true);
        try {
          const response = await dispatch(
            fetchSaleInvoices({
              type: "DELIVERY_NOTE",
            }),
          );
          const filteredInvoices = (response.payload || []).filter(
            (inv) => inv.client.id === client.value,
          );
          setDeliveryNotes(filteredInvoices);
        } catch (error) {
          notify(2, "Erreur lors du chargement des bons de livraison");
          setDeliveryNotes([]);
        } finally {
          setLoadingDeliveryNotes(false);
        }
      }
    };

    fetchDeliveryNotes();
  }, [type, client, dispatch]);

  const handleItemChange = (index, field, value) => {
    const newItems = invoiceItems.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };

        if (field === "productId") {
          const selectedProduct = products.find((p) => p.id === value);
          if (selectedProduct) {
            updatedItem.price =
              selectedProduct.salePrice || selectedProduct.price || 0;
          }
        }

        const itemHT = updatedItem.price * updatedItem.quantity;
        const itemVAT = itemHT * (updatedItem.vatRate / 100);

        updatedItem.totalHT = itemHT;
        updatedItem.vatAmount = itemVAT;
        updatedItem.totalTTC = itemHT + itemVAT;

        return updatedItem;
      }
      return item;
    });
    setInvoiceItems(newItems);
  };

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        productId: "",
        quantity: 1,
        price: 0,
        vatRate: 19,
        vatAmount: 0,
        totalHT: 0,
        totalTTC: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(newItems);
  };

  const loadDeliveryNoteData = (deliveryNote) => {
    if (
      window.confirm("Voulez-vous charger les données de ce bon de livraison ?")
    ) {
      setInvoiceNumber(deliveryNote.invoiceNumber);
      setDate(deliveryNote.date.split("T")[0]);
      setTotalHT(deliveryNote.totalHT);
      setTotalTTC(deliveryNote.totalTTC);

      setClient({
        value: deliveryNote.client.id,
        label: deliveryNote.client.name,
        client: deliveryNote.client,
      });

      setInvoiceItems(
        deliveryNote.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount,
          totalHT: item.price * item.quantity,
          totalTTC: item.price * item.quantity * (1 + item.vatRate / 100),
        })),
      );
    }
  };

  const submitForm = async () => {
    // Basic validations
    if (validator.isEmpty(invoiceNumber)) {
      notify(2, "Numéro de facture est obligatoire");
      return;
    }

    // Client validation (required for all types except DELIVERY_NOTE_OUT)
    if (type !== "DELIVERY_NOTE_OUT" && !client) {
      notify(2, "Client est obligatoire");
      return;
    }

    // Driver validation for DELIVERY_NOTE_OUT
    if (type === "DELIVERY_NOTE_OUT" && !driver) {
      notify(2, "Chauffeur est obligatoire pour les factures de sortie");
      return;
    }

    // Date range validation for DELIVERY_NOTE_OUT
    if (type === "DELIVERY_NOTE_OUT") {
      if (!startDate) {
        notify(2, "Date de début est obligatoire pour les factures de sortie");
        return;
      }
      if (!endDate) {
        notify(2, "Date de fin est obligatoire pour les factures de sortie");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        notify(2, "La date de début doit être antérieure à la date de fin");
        return;
      }
    }

    if (invoiceItems.length === 0) {
      notify(2, "Au moins un article est obligatoire");
      return;
    }

    for (let i = 0; i < invoiceItems.length; i++) {
      if (!invoiceItems[i].productId) {
        notify(2, `L'article ${i + 1} doit avoir un produit sélectionné`);
        return;
      }
    }

    const items = invoiceItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      vatRate: item.vatRate,
      vatAmount: item.vatAmount,
    }));

    try {
      const invoiceData = {
        invoiceNumber,
        date,
        type,
        status,
        items,
        totalHT,
        totalTTC,
      };

      // Add clientId only if not DELIVERY_NOTE_OUT
      if (type !== "DELIVERY_NOTE_OUT" && client) {
        invoiceData.clientId = client.value;
      }

      // Add driver and dates for DELIVERY_NOTE_OUT
      if (type === "DELIVERY_NOTE_OUT") {
        if (driver) invoiceData.driverId = driver.value;
        if (startDate) invoiceData.startDate = startDate;
        if (endDate) invoiceData.endDate = endDate;
      }

      if (id) {
        await dispatch(updateSaleInvoice({ id, ...invoiceData }));
        notify(1, "Facture de vente mise à jour avec succès");
      } else {
        await dispatch(addSaleInvoice(invoiceData));
        notify(1, "Facture de vente ajoutée avec succès");
      }

      setTimeout(() => navigate.push("/sale-invoices/list/" + type), 1500);
    } catch (error) {
      notify(2, "Erreur lors de l'enregistrement de la facture");
    }
  };

  const typeOptions = [
    { value: "QUOTATION", label: "Devis" },
    { value: "DELIVERY_NOTE", label: "Bon de livraison" },
    { value: "SALE_INVOICE", label: "Facture vente" },
    { value: "SALE_REFUND", label: "Avoir client" },
    { value: "DELIVERY_NOTE_OUT", label: "Facture de sortie" },
  ];

  const statusOptions = [
    { value: "DRAFT", label: "Brouillon" },
    { value: "VALIDATED", label: "Validée" },
    { value: "PAID", label: "Payée" },
    { value: "CANCELLED", label: "Annulée" },
  ];

  const vatRateOptions = [
    { value: 0, label: "0%" },
    { value: 7, label: "7%" },
    { value: 19, label: "19%" },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { bg: "secondary", text: "Brouillon" },
      VALIDATED: { bg: "success", text: "Validée" },
      PAID: { bg: "primary", text: "Payée" },
      CANCELLED: { bg: "danger", text: "Annulée" },
    };
    const config = statusConfig[status] || { bg: "light", text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
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
            onClick={() => navigate.push("/sale-invoices/list/" + type)}
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
              {!id ? "Ajouter facture de vente" : "Modifier facture de vente"}
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
                  <label>Type de facture* </label>
                  <Form.Control
                    value={
                      typeOptions.find((opt) => opt.value === type)?.label ||
                      type
                    }
                    placeholder="Type de facture"
                    readOnly
                  />
                  {/* <Select
                    value={typeOptions.find((opt) => opt.value === type)}
                    options={typeOptions}
                    onChange={(e) => {
                      setType(e.value);
                      // Reset client and driver when type changes
                      setClient(null);
                      setDriver(null);
                      setStartDate("");
                      setEndDate("");
                    }}
                  /> */}
                </Form.Group>
              </Col>
              <Col md="4">
                <Form.Group>
                  <label>Statut </label>
                  <Select
                    value={statusOptions.find((opt) => opt.value === status)}
                    options={statusOptions}
                    onChange={(e) => setStatus(e.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
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

              {/* Show Client for all types except DELIVERY_NOTE_OUT */}
              {type !== "DELIVERY_NOTE_OUT" && (
                <Col md="4">
                  <Form.Group>
                    <label>Client* </label>
                    <Select
                      placeholder="Sélectionner un client"
                      value={client}
                      options={clients.map((client) => ({
                        label: client.name,
                        value: client.id,
                        client: client,
                      }))}
                      onChange={(e) => setClient(e)}
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Show Driver only for DELIVERY_NOTE_OUT */}
              {type === "DELIVERY_NOTE_OUT" && (
                <>
                  <Col md="4">
                    <Form.Group>
                      <label>Chauffeur* </label>
                      <Select
                        placeholder="Sélectionner un chauffeur"
                        value={driver}
                        options={drivers
                          .filter((d) => d.active !== false)
                          .map((driver) => ({
                            label: `${driver.firstName} ${driver.lastName} ${driver.phone ? `(${driver.phone})` : ""}`,
                            value: driver.id,
                            driver: driver,
                          }))}
                        onChange={(e) => setDriver(e)}
                      />
                      <small className="text-muted">
                        Chauffeur assigné à la livraison
                      </small>
                    </Form.Group>
                  </Col>

                  <Col md="4">
                    <label>Voiture* </label>
                    <Form.Control
                      value={
                        driver?.driver?.car?.registration ||
                        "Il y a pas voiture pour ce cheffeur"
                      }
                      readOnly
                    />
                  </Col>
                </>
              )}
            </Row>

            {/* Date range for DELIVERY_NOTE_OUT */}
            {type === "DELIVERY_NOTE_OUT" && (
              <Row className="mt-3">
                <Col md="6">
                  <Form.Group>
                    <label>Date de début* </label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={date}
                    />
                  </Form.Group>
                </Col>
                <Col md="6">
                  <Form.Group>
                    <label>Date de fin* </label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || date}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            {/* Delivery Notes Section - Only for SALE_INVOICE */}
            {type === "SALE_INVOICE" && client?.value && (
              <Row className="mt-3">
                <Col md="12">
                  <Card className="bg-light">
                    <Card.Header>
                      <Card.Title as="h6">
                        <i className="fas fa-file-invoice mr-2"></i>
                        Bons de livraison disponibles
                        {loadingDeliveryNotes && (
                          <span className="ml-2">
                            <i className="fas fa-spinner fa-spin"></i>
                          </span>
                        )}
                        <Badge bg="info" className="ml-2">
                          {deliveryNotes.length}
                        </Badge>
                      </Card.Title>
                    </Card.Header>
                    <Card.Body
                      style={{ maxHeight: "250px", overflowY: "auto" }}
                    >
                      {deliveryNotes.length > 0 ? (
                        <Table size="sm" striped bordered hover>
                          <thead>
                            <tr>
                              <th>N° Bon</th>
                              <th>Date</th>
                              <th>Total TTC</th>
                              <th>Statut</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deliveryNotes.map((note) => (
                              <tr key={note.id}>
                                <td>{note.invoiceNumber}</td>
                                <td>
                                  {new Date(note.date).toLocaleDateString()}
                                </td>
                                <td className="text-right">
                                  {note.totalTTC?.toFixed(2)} TND
                                </td>
                                <td>{getStatusBadge(note.status)}</td>
                                <td>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => loadDeliveryNoteData(note)}
                                  >
                                    <i className="fas fa-download"></i>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-muted text-center mb-0">
                          Aucun bon de livraison trouvé
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            <br />

            {/* Items Table */}
            <Row>
              <Col md="12">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button variant="success" onClick={handleAddItem}>
                    <i className="fas fa-plus mr-2"></i>
                    Ajouter un article
                  </Button>
                </div>

                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire (TND)</th>
                      <th>TVA %</th>
                      <th>Montant TVA</th>
                      <th>Total HT</th>
                      <th>Total TTC</th>
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
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </td>
                        <td>
                          <Form.Control
                            value={item.price}
                            type="number"
                            step="0.01"
                            min="0"
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </td>
                        <td>
                          <Select
                            value={vatRateOptions.find(
                              (opt) => opt.value === item.vatRate,
                            )}
                            options={vatRateOptions}
                            onChange={(e) =>
                              handleItemChange(index, "vatRate", e.value)
                            }
                          />
                        </td>
                        <td className="text-right">
                          {item.vatAmount?.toFixed(2) || "0.00"}
                        </td>
                        <td className="text-right">
                          {item.totalHT?.toFixed(2) || "0.00"}
                        </td>
                        <td className="text-right">
                          {item.totalTTC?.toFixed(2) || "0.00"}
                        </td>
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
                    {invoiceItems.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">
                          Aucun article ajouté
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>

            {/* Totals */}
            <Row className="mt-3">
              <Col md="3" className="offset-md-6">
                <Form.Group>
                  <label>Total HT</label>
                  <Form.Control
                    value={totalHT.toFixed(2)}
                    readOnly
                    className="text-right font-weight-bold"
                  />
                </Form.Group>
              </Col>
              <Col md="3">
                <Form.Group>
                  <label>Total TVA</label>
                  <Form.Control
                    value={totalVAT.toFixed(2)}
                    readOnly
                    className="text-right"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md="3" className="offset-md-9">
                <Form.Group>
                  <label>Total TTC</label>
                  <Form.Control
                    value={totalTTC.toFixed(2)}
                    readOnly
                    className="text-right font-weight-bold text-primary"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Information badge for DELIVERY_NOTE_OUT */}
            {type === "DELIVERY_NOTE_OUT" && (
              <Row className="mt-3">
                <Col md="12">
                  <Badge bg="info" className="p-2 w-100">
                    <i className="fas fa-truck mr-2"></i>
                    Facture de sortie - Chauffeur et période requis
                  </Badge>
                </Col>
              </Row>
            )}
          </Card.Body>
          <Card.Footer>
            <Button
              className="btn-wd btn-outline mr-1 float-left"
              variant="primary"
              onClick={submitForm}
            >
              <i className={`fas ${id ? "fa-sync" : "fa-save"} mr-2`}></i>
              {id ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </Card.Footer>
        </Card>
      </Form>
    </Container>
  );
}

export default AddSaleInvoice;
