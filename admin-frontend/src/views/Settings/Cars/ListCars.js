// src/components/Cars/ListCars.js
import React, { useEffect, useCallback, useState } from "react";
import { Button, Card, Container, Row, Col, Badge } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";
import { fetchCars, carDeleted } from "../../../Redux/carsSlice";

function ListCars() {
  const [alert, setAlert] = useState(null);
  const navigate = useHistory();
  const dispatch = useDispatch();
  const [cars, setCars] = useState([]);

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
      header: "Immatriculation",
      accessorKey: "registration",
      Cell: ({ cell }) => <Badge bg="info">{cell.getValue()}</Badge>,
    },
    {
      header: "Marque",
      accessorKey: "brand",
      Cell: ({ cell }) => cell.getValue() || "-",
    },
    {
      header: "Modèle",
      accessorKey: "model",
      Cell: ({ cell }) => cell.getValue() || "-",
    },
    {
      header: "Année",
      accessorKey: "year",
      Cell: ({ cell }) => cell.getValue() || "-",
    },
    {
      header: "Chauffeur assigné",
      accessorKey: "driver",
      Cell: ({ cell }) => {
        const driver = cell.getValue();
        return driver ? (
          <Badge bg="success">
            {driver.firstName} {driver.lastName}
          </Badge>
        ) : (
          <Badge bg="secondary">Non assigné</Badge>
        );
      },
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() => navigate.push("/cars/update/" + row.original.id)}
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

  const getCars = useCallback(async () => {
    const response = await dispatch(fetchCars());
    setCars(response.payload);
  }, [dispatch]);

  const confirmDelete = (id) => {
    // Check if car has assigned driver
    const car = cars.find((c) => c.id === id);
    if (car?.driver) {
      notify(
        2,
        "Impossible de supprimer un véhicule avec un chauffeur assigné",
      );
      return;
    }

    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer ce véhicule?"
        onConfirm={() => deleteCar(id)}
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

  const deleteCar = async (id) => {
    try {
      await dispatch(carDeleted(id));
      notify(1, "Véhicule supprimé avec succès");
      getCars();
      hideAlert();
    } catch (error) {
      notify(2, error.message || "Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    getCars();
  }, [getCars]);

  function ajouter() {
    navigate.push("/cars/add");
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
            Ajouter un véhicule
          </Button>
        </Col>
        <Col md="12">
          <h4 className="title">Liste des véhicules</h4>
          <Card>
            <Card.Body>
              <MaterialReactTable
                columns={columns}
                data={cars}
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

export default ListCars;
