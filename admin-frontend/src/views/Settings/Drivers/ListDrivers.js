// src/components/Drivers/ListDrivers.js
import React, { useEffect, useCallback, useState } from "react";
import { Button, Card, Container, Row, Col, Badge } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";
import {
  fetchDrivers,
  driverDeleted,
  toggleDriverActive,
} from "../../../Redux/driversSlice";

function ListDrivers() {
  const [alert, setAlert] = useState(null);
  const navigate = useHistory();
  const dispatch = useDispatch();
  const [drivers, setDrivers] = useState([]);

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
      header: "Nom complet",
      accessorKey: "firstName",
      Cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      header: "Téléphone",
      accessorKey: "phone",
      Cell: ({ cell }) => cell.getValue() || "-",
    },
    {
      header: "CIN",
      accessorKey: "cin",
      Cell: ({ cell }) => cell.getValue() || "-",
    },
    {
      header: "N° Permis",
      accessorKey: "licenseNumber",
      Cell: ({ cell }) => cell.getValue() || "-",
    },
    {
      header: "Statut",
      accessorKey: "active",
      Cell: ({ cell }) => (
        <Badge bg={cell.getValue() ? "success" : "secondary"}>
          {cell.getValue() ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      header: "Véhicule",
      accessorKey: "car",
      Cell: ({ cell }) => {
        const car = cell.getValue();
        return car
          ? `${car.brand} ${car.model} (${car.licensePlate})`
          : "Non assigné";
      },
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() =>
              handleToggleActive(row.original.id, row.original.active)
            }
            variant={row.original.active ? "warning" : "success"}
            size="sm"
            className="btn-link"
            title={row.original.active ? "Désactiver" : "Activer"}
          >
            <i
              className={`fa ${row.original.active ? "fa-toggle-off" : "fa-toggle-on"}`}
            />
          </Button>
          <Button
            onClick={() => navigate.push("/drivers/update/" + row.original.id)}
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

  const getDrivers = useCallback(async () => {
    const response = await dispatch(fetchDrivers());
    setDrivers(response.payload);
  }, [dispatch]);

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await dispatch(toggleDriverActive(id));
      notify(
        1,
        `Chauffeur ${currentStatus ? "désactivé" : "activé"} avec succès`,
      );
      getDrivers();
    } catch (error) {
      notify(2, "Erreur lors du changement de statut");
    }
  };

  const confirmDelete = (id) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer ce chauffeur?"
        onConfirm={() => deleteDriver(id)}
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

  const deleteDriver = async (id) => {
    try {
      await dispatch(driverDeleted(id));
      notify(1, "Chauffeur supprimé avec succès");
      getDrivers();
      hideAlert();
    } catch (error) {
      notify(2, "Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    getDrivers();
  }, [getDrivers]);

  function ajouter() {
    navigate.push("/drivers/add");
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
            Ajouter un chauffeur
          </Button>
        </Col>
        <Col md="12">
          <h4 className="title">Liste des chauffeurs</h4>
          <Card>
            <Card.Body>
              <MaterialReactTable
                columns={columns}
                data={drivers}
                enableColumnActions={true}
                enableColumnFilters={true}
                enablePagination={true}
                enableSorting={true}
                enableBottomToolbar={true}
                enableTopToolbar={true}
                muiTableBodyRowProps={{ hover: false }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ListDrivers;
