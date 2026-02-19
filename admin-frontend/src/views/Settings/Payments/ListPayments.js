// src/components/Payments/ListPayments.js
import React, { useEffect, useCallback } from "react";
import { Button, Card, Container, Row, Col, Badge } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { fetchPayments, deletePayment } from "../../../Redux/paymentsSlice";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";

function ListPayments({ obj }) {
  const [alert, setAlert] = React.useState(null);
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

  const navigate = useHistory();
  const dispatch = useDispatch();
  const [entities, setEntities] = React.useState([]);
  const [summary, setSummary] = React.useState(null);

  const paymentMethodColors = {
    CASH: "success",
    CHECK: "warning",
    BANK_TRANSFER: "info",
    CREDIT_CARD: "primary",
    MOBILE_PAYMENT: "secondary",
  };

  const paymentMethodLabels = {
    CASH: "Espèces",
    CHECK: "Chèque",
    BANK_TRANSFER: "Virement",
    CREDIT_CARD: "Carte",
    MOBILE_PAYMENT: "Mobile",
  };

  const [columns] = React.useState([
    {
      header: "Date",
      accessorKey: "createdAt",
      Cell: ({ cell }) =>
        new Date(cell.getValue()).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      header: "Type",
      accessorKey: "type",
      Cell: ({ row }) => (
        <Badge bg={row.original.purchaseInvoiceId ? "danger" : "success"}>
          {row.original.purchaseInvoiceId ? "Fournisseur" : "Client"}
        </Badge>
      ),
    },
    {
      header: "Montant",
      accessorKey: "amount",
      Cell: ({ cell }) => <strong>{cell.getValue().toFixed(2)} DH</strong>,
    },
    {
      header: "Méthode",
      accessorKey: "method",
      Cell: ({ cell }) => (
        <Badge bg={paymentMethodColors[cell.getValue()]}>
          {paymentMethodLabels[cell.getValue()]}
        </Badge>
      ),
    },
    {
      header: "Facture",
      accessorKey: "invoice",
      Cell: ({ row }) =>
        row.original.purchaseInvoice
          ? `FAC#${row.original.purchaseInvoice.invoiceNumber}`
          : `INV#${row.original.saleInvoice.invoiceNumber}`,
    },
    {
      header: "Entité",
      accessorKey: "entity",
      Cell: ({ row }) =>
        row.original.supplier
          ? row.original.supplier.company || row.original.supplier.name
          : row.original.client.company || row.original.client.name,
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ cell, row }) => {
        const paymentDate = new Date(row.original.createdAt);
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        const canDelete = paymentDate > twentyFourHoursAgo;

        return (
          <div className="actions-right block_action">
            <Button
              onClick={() => {
                navigate.push("/payments/update/" + cell.row.original.id);
              }}
              variant="warning"
              size="sm"
              className="text-warning btn-link edit"
            >
              <i className="fa fa-edit" />
            </Button>
            <Button
              onClick={(e) => {
                confirmMessage(cell.row.original.id, e);
              }}
              variant="danger"
              size="sm"
              className="text-danger btn-link delete"
              disabled={!canDelete}
              title={
                !canDelete
                  ? "Impossible de supprimer les paiements de plus de 24h"
                  : ""
              }
            >
              <i className="fa fa-trash" />
            </Button>
          </div>
        );
      },
    },
  ]);

  function ajouter() {
    navigate.push("/payments/add");
  }

  const getPayments = useCallback(async () => {
    var response = await dispatch(fetchPayments());
    setEntities(response.payload);

    // Calculate summary from payments
    if (response.payload && response.payload.length > 0) {
      const purchasePayments = response.payload.filter(
        (p) => p.purchaseInvoiceId
      );
      const salePayments = response.payload.filter((p) => p.saleInvoiceId);

      const totalPurchase = purchasePayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const totalSale = salePayments.reduce((sum, p) => sum + p.amount, 0);

      setSummary({
        totalPurchase,
        totalSale,
        netFlow: totalSale - totalPurchase,
        count: response.payload.length,
      });
    }
  }, [dispatch]);

  const confirmMessage = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer ce paiement?"
        onConfirm={() => deletePaymentHandler(id, e)}
        onCancel={() => hideAlert()}
        confirmBtnBsStyle="info"
        cancelBtnBsStyle="danger"
        confirmBtnText="Oui"
        cancelBtnText="Non"
        showCancel
      />
    );
  };

  const hideAlert = () => {
    setAlert(null);
  };

  function deletePaymentHandler(id, e) {
    dispatch(deletePayment(id)).then((val) => {
      notify(1, "Paiement supprimé avec succès");
      getPayments();
      hideAlert();
    });
  }

  useEffect(() => {
    getPayments();
  }, [getPayments]);

  function ListTable({ list }) {
    return (
      <MaterialReactTable
        columns={columns}
        data={list}
        enableColumnActions={true}
        enableColumnFilters={true}
        enablePagination={true}
        enableSorting={true}
        enableBottomToolbar={true}
        enableTopToolbar={true}
        muiTableBodyRowProps={{ hover: false }}
        initialState={{
          pagination: { pageSize: 10, pageIndex: 0 },
          sorting: [{ id: "createdAt", desc: true }],
        }}
      />
    );
  }

  return (
    <>
      <Container fluid>
        {alert}
        <ToastContainer />

        {/* Summary Cards - Similar to your other listing pages */}
        {summary && (
          <Row>
            <Col md="3">
              <Card className="card-stats">
                <Card.Body>
                  <Row>
                    <Col md="4" xs="5">
                      <div className="icon-big text-center icon-warning">
                        <i className="nc-icon nc-money-coins text-danger"></i>
                      </div>
                    </Col>
                    <Col md="8" xs="7">
                      <div className="numbers">
                        <p className="card-category">Paiements Fournisseurs</p>
                        <Card.Title as="h4">
                          {summary.totalPurchase.toFixed(2)} DH
                        </Card.Title>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col md="3">
              <Card className="card-stats">
                <Card.Body>
                  <Row>
                    <Col md="4" xs="5">
                      <div className="icon-big text-center icon-warning">
                        <i className="nc-icon nc-money-coins text-success"></i>
                      </div>
                    </Col>
                    <Col md="8" xs="7">
                      <div className="numbers">
                        <p className="card-category">Paiements Clients</p>
                        <Card.Title as="h4">
                          {summary.totalSale.toFixed(2)} DH
                        </Card.Title>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col md="3">
              <Card className="card-stats">
                <Card.Body>
                  <Row>
                    <Col md="4" xs="5">
                      <div className="icon-big text-center icon-warning">
                        <i className="nc-icon nc-chart-bar-32 text-info"></i>
                      </div>
                    </Col>
                    <Col md="8" xs="7">
                      <div className="numbers">
                        <p className="card-category">Flux Net</p>
                        <Card.Title as="h4">
                          <span
                            className={
                              summary.netFlow >= 0
                                ? "text-success"
                                : "text-danger"
                            }
                          >
                            {summary.netFlow.toFixed(2)} DH
                          </span>
                        </Card.Title>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col md="3">
              <Card className="card-stats">
                <Card.Body>
                  <Row>
                    <Col md="4" xs="5">
                      <div className="icon-big text-center icon-warning">
                        <i className="nc-icon nc-paper text-warning"></i>
                      </div>
                    </Col>
                    <Col md="8" xs="7">
                      <div className="numbers">
                        <p className="card-category">Total Paiements</p>
                        <Card.Title as="h4">{summary.count}</Card.Title>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Row>
          <Col md="8">
            <Button
              id="saveBL"
              className="btn-wd mr-1 float-left"
              type="button"
              variant="success"
              onClick={ajouter}
            >
              <span className="btn-label">
                <i className="fas fa-plus"></i>
              </span>
              Ajouter un paiement
            </Button>
          </Col>
          <Col md="12">
            <h4 className="title">Liste des paiements</h4>
            <Card>
              <Card.Body>
                <ListTable list={entities}></ListTable>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default ListPayments;
