import SweetAlert from "react-bootstrap-sweetalert";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import React, { useEffect, useCallback, useMemo } from "react";
import { fetchRole, roleDeleted } from "../../../Redux/roleReduce";
import { useDispatch } from "react-redux";
import { verification } from "../../../Redux/usersSlice";
import { toast, ToastContainer } from "react-toastify";
import MaterialReactTable from "material-react-table";
import { useHistory } from "react-router";

// core components
function ListRole() {
  const dispatch = useDispatch();
  const navigate = useHistory();
  const [alert, setAlert] = React.useState(null);
  const [entities, setEntities] = React.useState([]);
  const columns = useMemo(
    () => [
      //column definitions...
      {
        header: "Nom",
        accessorKey: "nom",
      },
      {
        accessorKey: "id",
        header: "actions",
        Cell: ({ cell, row }) => (
          <div className="actions-right block_action">
            <Button
              onClick={() => {
                navigate.push("/role/update/" + cell.row.original.id);
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
              <i
                className="fa fa-trash"
                id={"idLigne_" + cell.row.original.id}
              />
            </Button>
          </div>
        ),
      },
      //end
    ],
    []
  );
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
  const confirmMessage = (id, e) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title="Vous éte sure de supprime cette role?"
        onConfirm={() => deleteRole(id, e)}
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
  function ajouter() {
    navigate.push("/role/add");
  }
  function deleteRole(id, e) {
    dispatch(roleDeleted({ id })).then((val) => {
      notify(1, "Role supprimer avec succes");
      getRole();
      hideAlert();
    });
  }

  const getRole = useCallback(async () => {
    var root = await dispatch(fetchRole());
    setEntities(root.payload);
  }, [dispatch]);

  useEffect(() => {
    getRole();
  }, [getRole]); //now shut up eslint

  return (
    <>
      {alert}
      <Container fluid>
        <ToastContainer />
        <Row>
          <Col md="12">
            <Button
              id="saveBL"
              className="btn-wd btn-outline mr-1 float-left"
              type="button"
              variant="info"
              onClick={ajouter}
            >
              <span className="btn-label">
                <i className="fas fa-plus"></i>
              </span>
              Ajouter un role
            </Button>
          </Col>

          <Col md="12">
            <h4 className="title">Liste des roles</h4>
            <Card className="card-header">
              <Card.Body>
                <MaterialReactTable
                  columns={columns}
                  data={entities}
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
    </>
  );
}

export default ListRole;
