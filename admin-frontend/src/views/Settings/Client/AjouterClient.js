// src/components/Clients/AjouterClient.js
import React, { useEffect } from "react";
import validator from "validator";
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { clientAdded, clientGetById } from "../../../Redux/clientsSlice";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

function AjouterClient() {
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
  const navigate = useHistory();
  const location = useParams();

  // Input states
  const [nom, setNom] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [taxNumber, setTaxNumber] = React.useState("");
  const [id, setId] = React.useState(0);

  // Required states
  const [nomRequired] = React.useState(true);

  async function submitForm(event) {
    var required = document.getElementsByClassName("required");

    for (var i = 0; i < required.length; i++) {
      if (required[i] !== undefined) {
        document.getElementsByClassName("error")[i].innerHTML = "";
        required[i].style.borderColor = "#ccc";

        // Condition required
        if (validator.isEmpty(required[i].value)) {
          required[i].style.borderColor = "red";
          document.getElementsByClassName("error")[i].innerHTML =
            required[i].name + " est obligatoire";
          notify(2, required[i].name + " doit être non vide");
        }
      }
    }

    if (!validator.isEmpty(nom)) {
      const clientData = {
        name: nom,
        phone,
        address,
        taxNumber,
      };

      dispatch(clientAdded(clientData)).then((data) => {
        if (data.payload) {
          if (isNaN(location.id) === true) notify(1, "Insertion avec succès");
          else notify(1, "Modification avec succès");
          setTimeout(async () => {
            listeClients();
          }, 1500);
        } else {
          notify(2, "Problème de connexion");
        }
      });
    }
  }

  useEffect(() => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (isNaN(location.id) === false) {
          var client = await dispatch(clientGetById(location.id));
          var entities = client.payload;
          setNom(entities.name);
          setPhone(entities.phone || "");
          setAddress(entities.address || "");
          setTaxNumber(entities.taxNumber || "");
          setId(location.id);
          resolve(entities);
        } else {
          resolve(0);
        }
      }, 0);
    });
  }, [location.id, dispatch]);

  function listeClients() {
    navigate.push("/clients/list");
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
                  onClick={listeClients}
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
                      <Card.Title as="h4">
                        {typeof location.id == "undefined"
                          ? "Ajouter client"
                          : "Modifier client"}
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Nom* </label>
                            <Form.Control
                              defaultValue={nom}
                              placeholder="Nom du client"
                              name="Nom"
                              className="required"
                              type="text"
                              onChange={(value) => {
                                setNom(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                          <div className="error"></div>
                          {nomRequired ? null : (
                            <label className="error">
                              Nom est obligatoire.
                            </label>
                          )}
                        </Col>
                        <Col className="pl-1" md="6">
                          <Form.Group>
                            <label>Téléphone </label>
                            <Form.Control
                              defaultValue={phone}
                              placeholder="Téléphone"
                              type="text"
                              onChange={(value) => {
                                setPhone(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Adresse </label>
                            <Form.Control
                              defaultValue={address}
                              placeholder="Adresse"
                              as="textarea"
                              rows={3}
                              onChange={(value) => {
                                setAddress(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                        <Col className="pl-1" md="6">
                          <Form.Group>
                            <label>N° Fiscal </label>
                            <Form.Control
                              defaultValue={taxNumber}
                              placeholder="Numéro fiscal"
                              type="text"
                              onChange={(value) => {
                                setTaxNumber(value.target.value);
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

export default AjouterClient;
