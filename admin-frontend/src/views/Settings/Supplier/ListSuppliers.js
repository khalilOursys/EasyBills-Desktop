// src/components/Suppliers/ListSuppliers.js
import React, { useEffect, useCallback } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { fetchSuppliers, supplierDeleted } from "../../../Redux/suppliersSlice";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";

function ListSuppliers({ obj }) {
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
      header: "Code",
      accessorKey: "code",
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
      header: "RIB",
      accessorKey: "bankRib",
    },
    {
      header: "Factures",
      accessorKey: "purchaseInvoices",
      Cell: ({ cell }) =>
        cell.row.original.purchaseInvoices
          ? cell.row.original.purchaseInvoices.length
          : 0,
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ cell, row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() => {
              navigate.push("/suppliers/update/" + cell.row.original.id);
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
    navigate.push("/suppliers/add");
  }

  const getSuppliers = useCallback(async () => {
    var response = await dispatch(fetchSuppliers());
    setEntities(response.payload);
  }, [dispatch]);

  const confirmMessage = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer ce fournisseur?"
        onConfirm={() => deleteSupplier(id, e)}
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

  function deleteSupplier(id, e) {
    dispatch(supplierDeleted(id)).then((val) => {
      notify(1, "Fournisseur supprimé avec succès");
      getSuppliers();
      hideAlert();
    });
  }

  useEffect(() => {
    getSuppliers();
  }, [getSuppliers]);

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
              Ajouter un fournisseur
            </Button>
          </Col>
          <Col md="12">
            <h4 className="title">Liste des fournisseurs</h4>
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

export default ListSuppliers;
