import { Button, Card, Container, Row, Col, Badge } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";
import {
  deleteSaleInvoice,
  fetchSaleInvoices,
} from "../../../Redux/saleInvoiceSlice";

function ListRefundInvoice() {
  const notify = (type, msg) => {
    if (type === 1)
      toast.success(
        <strong>
          <i className="fas fa-check-circle"></i>
          {msg}
        </strong>,
      );
    else
      toast.error(
        <strong>
          <i className="fas fa-exclamation-circle"></i>
          {msg}
        </strong>,
      );
  };

  const [alert, setAlert] = useState(null);
  const navigate = useHistory();
  const dispatch = useDispatch();
  const [invoices, setInvoices] = useState([]);

  const columns = [
    {
      header: "Numéro",
      accessorKey: "invoiceNumber",
    },
    {
      header: "Date",
      accessorKey: "date",
      Cell: ({ cell }) => new Date(cell.getValue()).toLocaleDateString(),
    },
    {
      header: "Client",
      accessorKey: "client.name",
    },
    {
      header: "Type",
      accessorKey: "type",
      Cell: ({ cell }) => {
        const type = cell.getValue();
        const typeLabels = {
          QUOTATION: "Devis",
          DELIVERY_NOTE: "Bon de livraison",
          SALE_INVOICE: "Facture vente",
          SALE_REFUND: "Avoir client",
        };
        return <Badge bg="info">{typeLabels[type] || type}</Badge>;
      },
    },
    {
      header: "Statut",
      accessorKey: "status",
      Cell: ({ cell }) => {
        const status = cell.getValue();
        const variant =
          {
            DRAFT: "warning",
            VALIDATED: "primary",
            PAID: "success",
            CANCELLED: "danger",
          }[status] || "secondary";

        return (
          <Badge bg={variant}>
            {status === "DRAFT"
              ? "Brouillon"
              : status === "VALIDATED"
                ? "Validée"
                : status === "PAID"
                  ? "Payée"
                  : "Annulée"}
          </Badge>
        );
      },
    },
    {
      header: "Total HT (€)",
      accessorKey: "totalHT",
      Cell: ({ cell }) => parseFloat(cell.getValue()).toFixed(2),
    },
    {
      header: "Total TTC (€)",
      accessorKey: "totalTTC",
      Cell: ({ cell }) => parseFloat(cell.getValue()).toFixed(2),
    },
    {
      header: "Actions",
      accessorKey: "id",
      Cell: ({ cell }) => (
        <div className="actions-right">
          <Button
            onClick={() =>
              navigate.push("/refund-invoice/update/" + cell.getValue())
            }
            variant="warning"
            size="sm"
            className="text-warning btn-link edit mr-1"
          >
            <i className="fa fa-edit" />
          </Button>
          <Button
            onClick={(e) => confirmDelete(cell.getValue(), e)}
            variant="danger"
            size="sm"
            className="text-danger btn-link delete mr-1"
          >
            <i className="fa fa-trash" />
          </Button>
          <Button
            onClick={() =>
              navigate.push("/refund-invoice/detail/" + cell.getValue())
            }
            variant="info"
            size="sm"
            className="text-info btn-link"
          >
            <i className="fa fa-eye" />
          </Button>
        </div>
      ),
    },
  ];

  const fetchInvoices = async () => {
    try {
      const response = await dispatch(
        fetchSaleInvoices({ type: "SALE_REFUND" }),
      );
      if (response.payload) {
        setInvoices(response.payload);
      }
    } catch (error) {
      notify(2, "Erreur lors du chargement des factures de vente");
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteSaleInvoice(id))
      .unwrap()
      .then((response) => {
        if (response.status === 200) {
          notify(1, "Facture de vente supprimée avec succès");
          fetchInvoices();
        }
      })
      .catch((error) => {
        notify(2, "Erreur lors de la suppression");
      })
      .finally(() => {
        hideAlert();
      });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  const confirmDelete = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer cette facture de vente?"
        onConfirm={() => handleDelete(id)}
        onCancel={hideAlert}
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="secondary"
        confirmBtnText="Oui, supprimer"
        cancelBtnText="Annuler"
        showCancel
      />,
    );
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <Container fluid>
      <ToastContainer />
      {alert}
      <Row>
        <Col md="12" className="mb-3">
          <Button
            className="btn-wd mr-1"
            type="button"
            variant="success"
            onClick={() => navigate.push("/refund-invoice/add")}
          >
            <span className="btn-label">
              <i className="fas fa-plus"></i>
            </span>
            Nouvelle facture avoir
          </Button>
        </Col>
        <Col md="12">
          <h4 className="title">Factures avoir</h4>
          <Card>
            <Card.Body>
              <MaterialReactTable
                columns={columns}
                data={invoices}
                enableColumnActions
                enableColumnFilters
                enablePagination
                enableSorting
                enableBottomToolbar
                enableTopToolbar
                muiTableBodyRowProps={{ hover: false }}
                localization={{
                  noRecordsToDisplay: "Aucune facture de vente trouvée",
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ListRefundInvoice;
