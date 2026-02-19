// src/components/Suppliers/AjouterSupplier.js
import React, { useEffect } from "react";
import validator from "validator";
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { supplierAdded, supplierGetById } from "../../../Redux/suppliersSlice";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

function AjouterSupplier() {
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
  const [code, setCode] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [taxNumber, setTaxNumber] = React.useState("");
  const [bankRib, setBankRib] = React.useState("");
  const [id, setId] = React.useState(0);

  // Required states
  const [codeRequired] = React.useState(true);
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

    if (!validator.isEmpty(code) && !validator.isEmpty(nom)) {
      const supplierData = {
        code,
        name: nom,
        phone,
        address,
        taxNumber,
        bankRib,
      };

      dispatch(supplierAdded(supplierData)).then((data) => {
        if (data.payload) {
          if (isNaN(location.id) === true) notify(1, "Insertion avec succès");
          else notify(1, "Modification avec succès");
          setTimeout(async () => {
            listeSuppliers();
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
          var supplier = await dispatch(supplierGetById(location.id));
          var entities = supplier.payload;
          setCode(entities.code);
          setNom(entities.name);
          setPhone(entities.phone || "");
          setAddress(entities.address || "");
          setTaxNumber(entities.taxNumber || "");
          setBankRib(entities.bankRib || "");
          setId(location.id);
          resolve(entities);
        } else {
          resolve(0);
        }
      }, 0);
    });
  }, [location.id, dispatch]);

  function listeSuppliers() {
    navigate.push("/suppliers/list");
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
                  onClick={listeSuppliers}
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
                          ? "Ajouter fournisseur"
                          : "Modifier fournisseur"}
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Code* </label>
                            <Form.Control
                              defaultValue={code}
                              placeholder="Code fournisseur"
                              name="Code"
                              className="required"
                              type="text"
                              onChange={(value) => {
                                setCode(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                          <div className="error"></div>
                          {codeRequired ? null : (
                            <label className="error">
                              Code est obligatoire.
                            </label>
                          )}
                        </Col>
                        <Col className="pl-1" md="6">
                          <Form.Group>
                            <label>Nom* </label>
                            <Form.Control
                              defaultValue={nom}
                              placeholder="Nom du fournisseur"
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
                      </Row>

                      <Row>
                        <Col className="pr-1" md="6">
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
                            <label>RIB Bancaire </label>
                            <Form.Control
                              defaultValue={bankRib}
                              placeholder="RIB bancaire"
                              type="text"
                              onChange={(value) => {
                                setBankRib(value.target.value);
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

export default AjouterSupplier;
