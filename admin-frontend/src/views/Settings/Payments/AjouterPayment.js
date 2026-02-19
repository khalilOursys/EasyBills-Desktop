// src/components/Payments/AjouterPayment.js
import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import validator from "validator";
import {
  Button,
  Card,
  Form,
  Container,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import {
  addPayment,
  fetchPaymentById,
  updatePayment,
} from "../../../Redux/paymentsSlice";
import { fetchSuppliers } from "../../../Redux/suppliersSlice";
import { fetchClients } from "../../../Redux/clientsSlice";
import { fetchPurchaseInvoices } from "../../../Redux/purchaseInvoiceSlice";
import { fetchSaleInvoices } from "../../../Redux/saleInvoiceSlice";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

function AjouterPayment() {
  const notify = (type, msg) => {
    if (type === 1)
      toast.success(
        <strong>
          <i className="fas fa-check-circle"></i>
          {msg}
        </strong>
      );
    else
      toast.error(
        <strong>
          <i className="fas fa-exclamation-circle"></i>
          {msg}
        </strong>
      );
  };

  const dispatch = useDispatch();
  const navigate = useHistory();
  const location = useParams();

  // Form states
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [paymentType, setPaymentType] = useState("purchase");
  const [invoiceId, setInvoiceId] = useState("");
  const [entityId, setEntityId] = useState("");
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [id, setId] = useState(0);

  // Options
  const [suppliers, setSuppliers] = useState([]);
  const [clients, setClients] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [saleInvoices, setSaleInvoices] = useState([]);

  // Selected options
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState(null);
  const [selectedSaleInvoice, setSelectedSaleInvoice] = useState(null);

  const paymentMethods = [
    { value: "CASH", label: "Espèces" },
    { value: "CHECK", label: "Chèque" },
    { value: "BANK_TRANSFER", label: "Virement Bancaire" },
    { value: "CREDIT_CARD", label: "Carte Bancaire" },
    { value: "MOBILE_PAYMENT", label: "Paiement Mobile" },
  ];

  const paymentTypes = [
    { value: "purchase", label: "Paiement Fournisseur" },
    { value: "sale", label: "Paiement Client" },
  ];

  // Use useMemo for invoice options to prevent unnecessary re-renders
  const invoiceOptions = useMemo(() => {
    console.log(
      "Generating invoice options:",
      paymentType,
      purchaseInvoices.length,
      saleInvoices.length
    );

    if (paymentType === "purchase") {
      return purchaseInvoices.map((inv) => ({
        value: inv.id,
        label: `Facture #${inv.invoiceNumber} - ${inv.totalTTC.toFixed(2)} DH`,
        data: inv,
      }));
    } else {
      return saleInvoices.map((inv) => ({
        value: inv.id,
        label: `Facture #${inv.invoiceNumber} - ${inv.totalTTC.toFixed(2)} DH`,
        data: inv,
      }));
    }
  }, [paymentType, purchaseInvoices, saleInvoices]);

  // Use useMemo for entity options
  const entityOptions = useMemo(() => {
    if (paymentType === "purchase") {
      return suppliers.map((s) => ({
        value: s.id,
        label: `${s.company || s.name} (${s.code || "N/A"})`,
      }));
    } else {
      return clients.map((c) => ({
        value: c.id,
        label: `${c.company || c.name} (${c.code || "N/A"})`,
      }));
    }
  }, [paymentType, suppliers, clients]);

  // Get current selected entity
  const selectedEntity = useMemo(() => {
    if (paymentType === "purchase") {
      return selectedSupplier;
    } else {
      return selectedClient;
    }
  }, [paymentType, selectedSupplier, selectedClient]);

  // Get current selected invoice
  const selectedInvoice = useMemo(() => {
    if (paymentType === "purchase") {
      return selectedPurchaseInvoice;
    } else {
      return selectedSaleInvoice;
    }
  }, [paymentType, selectedPurchaseInvoice, selectedSaleInvoice]);

  const loadData = async () => {
    console.log("Loading suppliers and clients...");
    try {
      // Load suppliers and clients
      const suppliersRes = await dispatch(fetchSuppliers());
      const clientsRes = await dispatch(fetchClients());

      console.log("Suppliers loaded:", suppliersRes.payload?.length || 0);
      console.log("Clients loaded:", clientsRes.payload?.length || 0);

      setSuppliers(suppliersRes.payload || []);
      setClients(clientsRes.payload || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadInvoices = async (type, entityId) => {
    console.log("Loading invoices for:", type, entityId);
    if (!entityId) {
      console.log("No entity ID provided, clearing invoices");
      if (type === "purchase") {
        setPurchaseInvoices([]);
      } else {
        setSaleInvoices([]);
      }
      return [];
    }

    try {
      if (type === "purchase") {
        const invoicesRes = await dispatch(
          fetchPurchaseInvoices({ supplierId: entityId })
        );

        console.log("Purchase invoices response:", invoicesRes);
        const filteredInvoices = (invoicesRes.payload || []).filter(
          (inv) => inv.status === "DRAFT" || inv.status === "VALIDATED"
        );
        console.log("Filtered purchase invoices:", filteredInvoices.length);
        setPurchaseInvoices(filteredInvoices);
        return filteredInvoices;
      } else {
        const invoicesRes = await dispatch(
          fetchSaleInvoices({ clientId: entityId })
        );
        console.log("Sale invoices response:", invoicesRes);
        const filteredInvoices = (invoicesRes.payload || []).filter(
          (inv) => inv.status === "DRAFT" || inv.status === "VALIDATED"
        );
        console.log("Filtered sale invoices:", filteredInvoices.length);
        setSaleInvoices(filteredInvoices);
        return filteredInvoices;
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
      return [];
    }
  };

  const calculateRemainingBalance = (invoice) => {
    if (!invoice) {
      console.log("No invoice provided for balance calculation");
      return 0;
    }

    // Calculate total payments for this invoice
    const totalPaid =
      invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = invoice.totalTTC - totalPaid;
    console.log(
      "Calculated remaining balance:",
      remaining,
      "for invoice",
      invoice.invoiceNumber
    );
    setRemainingBalance(remaining);
    setInvoiceNumber(invoice.invoiceNumber);
    return remaining;
  };

  useEffect(() => {
    console.log("Component mounted or location.id changed:", location.id);
    loadData();

    // Load payment if editing
    if (location.id && !isNaN(location.id)) {
      console.log("Loading payment for editing, ID:", location.id);
      dispatch(fetchPaymentById(location.id))
        .then((response) => {
          const payment = response.payload;
          console.log("Payment loaded:", payment);

          if (!payment) {
            console.error("No payment data received");
            return;
          }

          setAmount(payment.amount?.toString() || "");
          setMethod(payment.method || "CASH");
          setId(location.id);

          const loadPaymentData = async () => {
            if (payment.purchaseInvoiceId) {
              console.log("Loading purchase payment data");
              setPaymentType("purchase");
              setInvoiceId(payment.purchaseInvoiceId);
              setEntityId(payment.supplierId);

              // Wait for suppliers to load
              await loadData();

              // Find and set supplier
              const supplier = suppliers.find(
                (s) => s.id === payment.supplierId
              );
              if (supplier) {
                const supplierOption = {
                  value: supplier.id,
                  label: `${supplier.company || supplier.name} (${
                    supplier.code || "N/A"
                  })`,
                };
                console.log("Setting selected supplier:", supplierOption);
                setSelectedSupplier(supplierOption);
              }

              // Load invoices and find the specific one
              const invoices = await loadInvoices(
                "purchase",
                payment.supplierId
              );
              const invoice = invoices?.find(
                (i) => i.id === payment.purchaseInvoiceId
              );
              if (invoice) {
                const invoiceOption = {
                  value: invoice.id,
                  label: `Facture #${
                    invoice.invoiceNumber
                  } - ${invoice.totalTTC.toFixed(2)} DH`,
                  data: invoice,
                };
                console.log(
                  "Setting selected purchase invoice:",
                  invoiceOption
                );
                setSelectedPurchaseInvoice(invoiceOption);
                calculateRemainingBalance(invoice);
              }
            } else if (payment.saleInvoiceId) {
              console.log("Loading sale payment data");
              setPaymentType("sale");
              setInvoiceId(payment.saleInvoiceId);
              setEntityId(payment.clientId);

              // Wait for clients to load
              await loadData();

              // Find and set client
              const client = clients.find((c) => c.id === payment.clientId);
              if (client) {
                const clientOption = {
                  value: client.id,
                  label: `${client.company || client.name} (${
                    client.code || "N/A"
                  })`,
                };
                console.log("Setting selected client:", clientOption);
                setSelectedClient(clientOption);
              }

              // Load invoices and find the specific one
              const invoices = await loadInvoices("sale", payment.clientId);
              const invoice = invoices?.find(
                (i) => i.id === payment.saleInvoiceId
              );
              if (invoice) {
                const invoiceOption = {
                  value: invoice.id,
                  label: `Facture #${
                    invoice.invoiceNumber
                  } - ${invoice.totalTTC.toFixed(2)} DH`,
                  data: invoice,
                };
                console.log("Setting selected sale invoice:", invoiceOption);
                setSelectedSaleInvoice(invoiceOption);
                calculateRemainingBalance(invoice);
              }
            }
          };

          loadPaymentData();
        })
        .catch((error) => {
          console.error("Error loading payment:", error);
        });
    }
  }, [location.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    let isValid = true;
    const requiredFields = document.getElementsByClassName("required");

    /* for (let i = 0; i < requiredFields.length; i++) {
      if (requiredFields[i]) {
        document.getElementsByClassName("error")[i].innerHTML = "";
        requiredFields[i].style.borderColor = "#ccc";

        if (validator.isEmpty(requiredFields[i].value)) {
          requiredFields[i].style.borderColor = "red";
          document.getElementsByClassName("error")[i].innerHTML =
            requiredFields[i].name + " est obligatoire";
          notify(2, requiredFields[i].name + " doit être non vide");
          isValid = false;
        }
      }
    } */

    if (!amount || parseFloat(amount) <= 0) {
      notify(2, "Le montant doit être positif");
      isValid = false;
    }

    if (!entityId) {
      notify(2, "Veuillez sélectionner un fournisseur ou client");
      isValid = false;
    }

    if (!invoiceId) {
      notify(2, "Veuillez sélectionner une facture");
      isValid = false;
    }

    if (parseFloat(amount) > remainingBalance) {
      notify(
        2,
        `Le montant dépasse le solde restant (${remainingBalance.toFixed(
          2
        )} DH)`
      );
      isValid = false;
    }

    if (isValid) {
      const paymentData = {
        amount: parseFloat(amount),
        method,
        ...(paymentType === "purchase"
          ? {
              purchaseInvoiceId: parseInt(invoiceId),
              supplierId: parseInt(entityId),
            }
          : {
              saleInvoiceId: parseInt(invoiceId),
              clientId: parseInt(entityId),
            }),
      };

      console.log("Submitting payment data:", paymentData);

      try {
        let result;
        if (location.id && !isNaN(location.id)) {
          result = await dispatch(
            updatePayment({
              id: parseInt(location.id),
              ...paymentData,
            })
          );
        } else {
          result = await dispatch(addPayment(paymentData));
        }

        if (result.payload) {
          notify(
            1,
            location.id
              ? "Paiement modifié avec succès"
              : "Paiement enregistré avec succès"
          );
          setTimeout(() => {
            navigate.push("/payments/list");
          }, 1500);
        }
      } catch (error) {
        console.error("Payment submission error:", error);
        notify(2, "Erreur lors de l'enregistrement du paiement");
      }
    }
  };

  const goToList = () => {
    navigate.push("/payments/list");
  };

  const handleEntityChange = async (selectedOption) => {
    console.log("Entity changed:", selectedOption);
    const newEntityId = selectedOption?.value || "";
    setEntityId(newEntityId);
    setInvoiceId("");
    setRemainingBalance(0);
    setInvoiceNumber("");

    if (paymentType === "purchase") {
      setSelectedSupplier(selectedOption);
      setSelectedPurchaseInvoice(null);
    } else {
      setSelectedClient(selectedOption);
      setSelectedSaleInvoice(null);
    }

    if (newEntityId) {
      await loadInvoices(paymentType, newEntityId);
    } else {
      // Clear invoices if no entity selected
      if (paymentType === "purchase") {
        setPurchaseInvoices([]);
      } else {
        setSaleInvoices([]);
      }
    }
  };

  const handleInvoiceChange = (selectedOption) => {
    console.log("Invoice changed:", selectedOption);
    const newInvoiceId = selectedOption?.value || "";
    setInvoiceId(newInvoiceId);

    if (paymentType === "purchase") {
      setSelectedPurchaseInvoice(selectedOption);
    } else {
      setSelectedSaleInvoice(selectedOption);
    }

    if (selectedOption?.data) {
      calculateRemainingBalance(selectedOption.data);
    } else {
      setRemainingBalance(0);
      setInvoiceNumber("");
    }
  };

  const handlePaymentTypeChange = (selectedOption) => {
    console.log("Payment type changed to:", selectedOption.value);
    const newType = selectedOption.value;
    setPaymentType(newType);
    setEntityId("");
    setInvoiceId("");
    setRemainingBalance(0);
    setInvoiceNumber("");
    setSelectedSupplier(null);
    setSelectedClient(null);
    setSelectedPurchaseInvoice(null);
    setSelectedSaleInvoice(null);

    // Clear the appropriate invoices array
    if (newType === "purchase") {
      setSaleInvoices([]);
    } else {
      setPurchaseInvoices([]);
    }
  };

  return (
    <>
      <Container fluid>
        <ToastContainer />
        <div className="section-image">
          <Container>
            <Row>
              <Col md="12">
                <Button
                  className="btn-wd btn-outline mr-1 float-left"
                  type="button"
                  variant="info"
                  onClick={goToList}
                >
                  <span className="btn-label">
                    <i className="fas fa-list"></i>
                  </span>
                  Retour à la liste {console.log(purchaseInvoices)}
                </Button>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <Form onSubmit={handleSubmit}>
                  <Card>
                    <Card.Header>
                      <Card.Title as="h4">
                        {location.id ? "Modifier Paiement" : "Ajouter Paiement"}
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md="6">
                          <Form.Group>
                            <label>Type de Paiement*</label>
                            <Select
                              placeholder="Sélectionner le type"
                              className="react-select primary"
                              classNamePrefix="react-select"
                              value={paymentTypes.find(
                                (pt) => pt.value === paymentType
                              )}
                              onChange={handlePaymentTypeChange}
                              options={paymentTypes}
                            />
                          </Form.Group>
                        </Col>
                        <Col md="6">
                          <Form.Group>
                            <label>Méthode de Paiement*</label>
                            <Select
                              placeholder="Sélectionner la méthode"
                              className="react-select primary"
                              classNamePrefix="react-select"
                              value={paymentMethods.find(
                                (pm) => pm.value === method
                              )}
                              onChange={(value) => setMethod(value.value)}
                              options={paymentMethods}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md="6">
                          <Form.Group>
                            <label>
                              {paymentType === "purchase"
                                ? "Fournisseur*"
                                : "Client*"}
                            </label>
                            <Select
                              placeholder={
                                paymentType === "purchase"
                                  ? "Sélectionner un fournisseur"
                                  : "Sélectionner un client"
                              }
                              className="react-select primary required"
                              classNamePrefix="react-select"
                              value={selectedEntity}
                              onChange={handleEntityChange}
                              options={entityOptions}
                              name={
                                paymentType === "purchase"
                                  ? "Fournisseur"
                                  : "Client"
                              }
                              isClearable
                            />
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                        <Col md="6">
                          <Form.Group>
                            <label>Facture*</label>
                            <Select
                              placeholder="Sélectionner une facture"
                              className="react-select primary required"
                              classNamePrefix="react-select"
                              value={selectedInvoice}
                              onChange={handleInvoiceChange}
                              options={invoiceOptions}
                              isDisabled={
                                !entityId || invoiceOptions.length === 0
                              }
                              name="Facture"
                              isClearable
                            />
                            <div className="error"></div>
                            {entityId && invoiceOptions.length === 0 && (
                              <small className="text-muted">
                                Aucune facture impayée trouvée pour{" "}
                                {paymentType === "purchase"
                                  ? "ce fournisseur"
                                  : "ce client"}
                              </small>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      {invoiceNumber && (
                        <Row>
                          <Col md="12">
                            <Alert variant="info">
                              <strong>Facture #{invoiceNumber}</strong>
                              <br />
                              Solde restant:{" "}
                              <strong>{remainingBalance.toFixed(2)} DH</strong>
                            </Alert>
                          </Col>
                        </Row>
                      )}

                      <Row>
                        <Col md="6">
                          <Form.Group>
                            <label>Montant (DH)*</label>
                            <Form.Control
                              value={amount}
                              placeholder="0.00"
                              name="Montant"
                              className="required"
                              type="number"
                              step="0.01"
                              min="0"
                              max={remainingBalance}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                            <div className="error"></div>
                            {remainingBalance > 0 && (
                              <small className="text-muted">
                                Maximum: {remainingBalance.toFixed(2)} DH
                              </small>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md="6">
                          <Form.Group>
                            <label>Date</label>
                            <Form.Control
                              type="datetime-local"
                              defaultValue={new Date()
                                .toISOString()
                                .slice(0, 16)}
                              onChange={(e) => {
                                // You can handle date changes here if needed
                                console.log("Date changed:", e.target.value);
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md="12">
                          <Form.Group>
                            <Form.Check
                              type="checkbox"
                              label="Enregistrer comme paiement complet"
                              checked={parseFloat(amount) === remainingBalance}
                              onChange={(e) => {
                                if (e.target.checked && remainingBalance > 0) {
                                  setAmount(remainingBalance.toString());
                                } else if (!e.target.checked) {
                                  setAmount("");
                                }
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button
                        className="btn-fill pull-right"
                        type="submit"
                        variant="info"
                        disabled={!entityId || !invoiceId || !amount}
                      >
                        {location.id ? "Modifier" : "Enregistrer"}
                      </Button>
                      <div className="clearfix"></div>
                    </Card.Body>
                  </Card>
                </Form>
              </Col>
            </Row>
          </Container>
        </div>
      </Container>
    </>
  );
}

export default AjouterPayment;
