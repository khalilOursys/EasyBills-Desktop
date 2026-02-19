import React, { useEffect, useCallback } from "react";

// react-bootstrap components
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import { roleAdded, roleGetById } from "../../../Redux/roleReduce";

import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

function AjouterRole() {
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
  const dispatch = useDispatch();
  const location = useParams();
  const navigate = useHistory();
  const [nom, setNom] = React.useState("");
  const [order, setOrder] = React.useState("");
  const [id, setId] = React.useState(0);
  function submitForm(event) {
    if (nom !== "") {
      dispatch(roleAdded({ nom, order, id }));
      if (isNaN(location.id) === true) {
        notify(1, "Insertion avec succes");
      } else {
        notify(1, "Modifier avec succes");
      }
      setTimeout(async () => {
        listeRole();
      }, 1500);
    } else {
      notify(2, "Role est obligatoire");
    }
  }

  useEffect(() => {
    async function getRole() {
      if (isNaN(location.id) === false) {
        var role = await dispatch(roleGetById(location.id));
        var entities = role.payload;
        setNom(entities.nom);
        setOrder(entities.order);
        setId(location.id);
      }
    }
    getRole();
  }, [location.id, dispatch]);

  function listeRole() {
    navigate.push("/role/list");
  }
  return (
    <>
      <Container fluid>
        <ToastContainer />
        <div className="section-image">
          <Container>
            <Row>
              <Col md="12">
                <Button
                  id="saveBL"
                  className="btn-wd btn-outline mr-1 float-left"
                  type="button"
                  variant="info"
                  onClick={listeRole}
                >
                  <span className="btn-label">
                    <i className="fas fa-list"></i>
                  </span>
                  Retour à la liste
                </Button>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <Form action="" className="form" method="">
                  <Card>
                    <Card.Header>
                      <Card.Header>
                        <Card.Title as="h4">
                          {typeof location.id == "undefined"
                            ? "Ajouter role"
                            : "Modifier role"}
                        </Card.Title>
                      </Card.Header>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Nom * </label>
                            <Form.Control
                              defaultValue={nom}
                              placeholder="Nom"
                              type="text"
                              onChange={(value) => {
                                setNom(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                        <Col className="pl-1" md="6">
                          <Form.Group>
                            <label>Order * </label>
                            <Form.Control
                              defaultValue={order}
                              placeholder="Order"
                              type="text"
                              onChange={(value) => {
                                setOrder(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button
                        className="btn-fill pull-right"
                        type="button"
                        variant="info"
                        onClick={submitForm}
                      >
                        Enregistrer
                      </Button>
                      <div className="clearfix"></div>
                    </Card.Body>
                  </Card>
                </Form>
              </Col>
            </Row>
          </Container>
        </div>
      </Container>
    </>
  );
}

export default AjouterRole;
