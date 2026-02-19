import { Button, Card, Container, Row, Col } from "react-bootstrap";
import React, { useEffect, useCallback } from "react";
import {
  fetchUsers,
  userChangeEtat,
  userDeleted,
} from "../../../Redux/usersSlice";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import MaterialReactTable from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";

// core components
function ListUser({ obj }) {
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
    //column definitions...
    {
      header: "First name",
      accessorKey: "firstName",
    },
    {
      header: "lastName",
      accessorKey: "lastName",
    },
    {
      header: "Role",
      accessorKey: "role",
    },
    {
      header: "E-mail",
      accessorKey: "email",
    },
    {
      accessorKey: "id",
      header: "actions",
      Cell: ({ cell, row }) => (
        <div className="actions-right block_action">
          <Button
            onClick={() => {
              navigate.push("/user/update/" + cell.row.original.id);
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
    //end
  ]);
  function ajouter() {
    navigate.push("/user/add");
  }

  const getUser = useCallback(async () => {
    var response = await dispatch(fetchUsers());
    setEntities(response.payload);
  }, [dispatch]);
  const confirmMessage = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Vous éte sure de supprime cette user?"
        onConfirm={() => deleteUser(id, e)}
        onCancel={() => hideAlert()}
        confirmBtnBsStyle="info"
        cancelBtnBsStyle="danger"
        confirmBtnText="Oui"
        cancelBtnText="Non"
        showCancel
      >
        {/* Vous éte sure de supprime cette User? */}
      </SweetAlert>
    );
  };
  const hideAlert = () => {
    setAlert(null);
  };
  function deleteUser(id, e) {
    dispatch(userDeleted({ id })).then((val) => {
      notify(1, "User supprimer avec succes");
      getUser();
      hideAlert();
    });
  }

  useEffect(() => {
    getUser();
  }, [getUser]);

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
              Ajouter un utilisateur
            </Button>
          </Col>
          <Col md="12">
            <h4 className="title">Liste des utilisateurs</h4>
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

export default ListUser;
