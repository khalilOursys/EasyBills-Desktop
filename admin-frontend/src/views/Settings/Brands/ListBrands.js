// src/views/Settings/Brand/ListBrands.js (or src/views/Settings/Brands/ListBrands.js)
import React, { useEffect, useCallback, useState } from "react";
import {
  Button,
  Card,
  Container,
  Row,
  Col,
  Badge,
  Image,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";
import { fetchBrands, brandDeleted } from "../../../Redux/brandsSlice";

// Helper function to format date without moment
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function ListBrands() {
  const [alert, setAlert] = useState(null);
  const navigate = useHistory();
  const dispatch = useDispatch();
  const [brands, setBrands] = useState([]);

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

  const columns = [
    {
      header: "Logo",
      accessorKey: "logo",
      Cell: ({ cell }) =>
        cell.getValue() ? (
          <Image
            src={cell.getValue()}
            alt="brand logo"
            fluid
            style={{
              maxWidth: "50px",
              maxHeight: "50px",
              objectFit: "contain",
            }}
            className="rounded"
          />
        ) : (
          <div
            className="bg-light rounded d-flex align-items-center justify-content-center"
            style={{ width: "50px", height: "50px" }}
          >
            <i className="fas fa-image text-muted"></i>
          </div>
        ),
      size: 80,
    },
    {
      header: "Nom",
      accessorKey: "name",
      Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
    },
    {
      header: "Description",
      accessorKey: "description",
      Cell: ({ cell }) => {
        const desc = cell.getValue();
        return desc
          ? desc.length > 50
            ? desc.substring(0, 50) + "..."
            : desc
          : "-";
      },
    },
    {
      header: "Statut",
      accessorKey: "isActive",
      Cell: ({ cell }) => (
        <Badge bg={cell.getValue() ? "success" : "secondary"}>
          {cell.getValue() ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      header: "Date de création",
      accessorKey: "createdAt",
      Cell: ({ cell }) => formatDate(cell.getValue()),
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() => navigate.push("/brands/update/" + row.original.id)}
            variant="warning"
            size="sm"
            className="text-warning btn-link edit"
            title="Modifier"
          >
            <i className="fa fa-edit" />
          </Button>
          <Button
            onClick={() => confirmDelete(row.original.id)}
            variant="danger"
            size="sm"
            className="text-danger btn-link delete"
            title="Supprimer"
          >
            <i className="fa fa-trash" />
          </Button>
        </div>
      ),
    },
  ];

  const getBrands = useCallback(async () => {
    try {
      const response = await dispatch(fetchBrands());
      setBrands(response.payload || []);
    } catch (error) {
      notify(2, "Erreur lors du chargement des marques");
    }
  }, [dispatch]);

  const confirmDelete = (id) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer cette marque?"
        onConfirm={() => deleteBrand(id)}
        onCancel={() => hideAlert()}
        confirmBtnBsStyle="info"
        cancelBtnBsStyle="danger"
        confirmBtnText="Oui"
        cancelBtnText="Non"
        showCancel
      />,
    );
  };

  const hideAlert = () => {
    setAlert(null);
  };

  const deleteBrand = async (id) => {
    try {
      await dispatch(brandDeleted(id));
      notify(1, "Marque supprimée avec succès");
      getBrands();
      hideAlert();
    } catch (error) {
      notify(2, error.message || "Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    getBrands();
  }, [getBrands]);

  function ajouter() {
    navigate.push("/brands/add");
  }

  return (
    <Container fluid>
      {alert}
      <ToastContainer />
      <Row>
        <Col md="8">
          <Button
            className="btn-wd mr-1 float-left"
            type="button"
            variant="success"
            onClick={ajouter}
          >
            <span className="btn-label">
              <i className="fas fa-plus"></i>
            </span>
            Ajouter une marque
          </Button>
        </Col>
        <Col md="12">
          <h4 className="title">Liste des marques</h4>
          <Card>
            <Card.Body>
              <MaterialReactTable
                columns={columns}
                data={brands}
                enableColumnActions={true}
                enableColumnFilters={true}
                enablePagination={true}
                enableSorting={true}
                enableBottomToolbar={true}
                enableTopToolbar={true}
                muiTableBodyRowProps={{ hover: false }}
                initialState={{
                  sorting: [{ id: "createdAt", desc: true }],
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ListBrands;
