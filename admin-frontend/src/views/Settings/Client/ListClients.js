// src/components/Clients/ListClients.js
import React, { useEffect, useCallback } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { fetchClients, clientDeleted } from "../../../Redux/clientsSlice";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";

function ListClients({ obj }) {
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

  const [columns] = React.useState([
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Nom",
      accessorKey: "name",
    },
    {
      header: "Téléphone",
      accessorKey: "phone",
    },
    {
      header: "Adresse",
      accessorKey: "address",
    },
    {
      header: "N° Fiscal",
      accessorKey: "taxNumber",
    },
    {
      header: "Factures",
      accessorKey: "saleInvoices",
      Cell: ({ cell }) =>
        cell.row.original.saleInvoices
          ? cell.row.original.saleInvoices.length
          : 0,
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ cell, row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() => {
              navigate.push("/clients/update/" + cell.row.original.id);
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
          >
            <i className="fa fa-trash" />
          </Button>
        </div>
      ),
    },
  ]);

  function ajouter() {
    navigate.push("/clients/add");
  }

  const getClients = useCallback(async () => {
    var response = await dispatch(fetchClients());
    setEntities(response.payload);
  }, [dispatch]);

  const confirmMessage = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer ce client?"
        onConfirm={() => deleteClient(id, e)}
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

  function deleteClient(id, e) {
    dispatch(clientDeleted(id)).then((val) => {
      notify(1, "Client supprimé avec succès");
      getClients();
      hideAlert();
    });
  }

  useEffect(() => {
    getClients();
  }, [getClients]);

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
      />
    );
  }

  return (
    <>
      <Container fluid>
        {alert}
        <ToastContainer />
        <Row>
          <Col md="8">
            <Button
              id="saveBL"
              className="btn-wd  mr-1 float-left"
              type="button"
              variant="success"
              onClick={ajouter}
            >
              <span className="btn-label">
                <i className="fas fa-plus"></i>
              </span>
              Ajouter un client
            </Button>
          </Col>
          <Col md="12">
            <h4 className="title">Liste des clients</h4>
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

export default ListClients;
