// src/components/Products/ListProducts.js
import React, { useEffect, useCallback } from "react";
import { Button, Card, Container, Row, Col, Badge } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { fetchProducts, productDeleted } from "../../../Redux/productsSlice";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";

function ListProducts({ obj }) {
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
      header: "Référence",
      accessorKey: "reference",
    },
    {
      header: "Code Interne",
      accessorKey: "internalCode",
    },
    {
      header: "Nom",
      accessorKey: "name",
    },
    {
      header: "Catégorie",
      accessorKey: "category.name",
    },
    {
      header: "Stock",
      accessorKey: "stock",
      Cell: ({ cell }) => (
        <Badge
          bg={
            cell.getValue() < cell.row.original.minStock ? "danger" : "success"
          }
        >
          {cell.getValue()}
        </Badge>
      ),
    },
    {
      header: "Prix Achat",
      accessorKey: "purchasePrice",
      Cell: ({ cell }) => `${cell.getValue().toFixed(2)} DH`,
    },
    {
      header: "Prix Vente",
      accessorKey: "salePrice",
      Cell: ({ cell }) => `${cell.getValue().toFixed(2)} DH`,
    },
    {
      accessorKey: "id",
      header: "Actions",
      Cell: ({ cell, row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() => {
              navigate.push("/products/update/" + cell.row.original.id);
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
    navigate.push("/products/add");
  }

  const getProducts = useCallback(async () => {
    var response = await dispatch(fetchProducts());
    setEntities(response.payload);
  }, [dispatch]);

  const confirmMessage = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Êtes-vous sûr de vouloir supprimer ce produit?"
        onConfirm={() => deleteProduct(id, e)}
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

  function deleteProduct(id, e) {
    dispatch(productDeleted(id)).then((val) => {
      notify(1, "Produit supprimé avec succès");
      getProducts();
      hideAlert();
    });
  }

  useEffect(() => {
    getProducts();
  }, [getProducts]);

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
              Ajouter un produit
            </Button>
          </Col>
          <Col md="12">
            <h4 className="title">Liste des produits</h4>
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

export default ListProducts;
