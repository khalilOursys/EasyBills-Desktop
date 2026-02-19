// src/components/Categories/ListCategories.js
import React, { useEffect, useCallback } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import {
  fetchCategories,
  categoryDeleted,
} from "../../../Redux/categoriesSlice";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";

function ListCategories({ obj }) {
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
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Produits",
      accessorKey: "products",
      Cell: ({ cell }) =>
        cell.row.original.products ? cell.row.original.products.length : 0,
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ cell, row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() => {
              navigate.push("/categories/update/" + cell.row.original.id);
            }}
            variant="warning"
            size="sm"
            className="text-warning btn-link edit"
          >
            <i className="fa fa-edit" />
          </Button>
          <Button
            id={"idLigne_" + cell.row.original.id}
            onClick={(e) => {
              confirmMessage(cell.row.original.id, e);
            }}
            variant="danger"
            size="sm"
            className="text-danger btn-link delete"
          >
            <i className="fa fa-trash" id={"idLigne_" + cell.row.original.id} />
          </Button>
        </div>
      ),
    },
  ]);

  function ajouter() {
    navigate.push("/categories/add");
  }

  const getCategories = useCallback(async () => {
    var response = await dispatch(fetchCategories());
    setEntities(response.payload);
  }, [dispatch]);

  const confirmMessage = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer cette catégorie?"
        onConfirm={() => deleteCategory(id, e)}
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

  function deleteCategory(id, e) {
    dispatch(categoryDeleted(id)).then((val) => {
      notify(1, "Catégorie supprimée avec succès");
      getCategories();
      hideAlert();
    });
  }

  useEffect(() => {
    getCategories();
  }, [getCategories]);

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
              Ajouter une catégorie
            </Button>
          </Col>
          <Col md="12">
            <h4 className="title">Liste des catégories</h4>
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

export default ListCategories;
