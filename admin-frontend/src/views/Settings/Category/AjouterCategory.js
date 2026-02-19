// src/components/Categories/AjouterCategory.js
import React, { useEffect } from "react";
import Select from "react-select";
import validator from "validator";
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { categoryAdded, categoryGetById } from "../../../Redux/categoriesSlice";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

function AjouterCategory() {
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
  const [description, setDescription] = React.useState("");
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
      dispatch(categoryAdded({ name: nom, description })).then((data) => {
        if (data.payload) {
          if (isNaN(location.id) === true) notify(1, "Insertion avec succès");
          else notify(1, "Modification avec succès");
          setTimeout(async () => {
            listeCategories();
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
          var category = await dispatch(categoryGetById(location.id));
          var entities = category.payload;
          setNom(entities.name);
          setDescription(entities.description || "");
          setId(location.id);
          resolve(entities);
        } else {
          resolve(0);
        }
      }, 0);
    });
  }, [location.id, dispatch]);

  function listeCategories() {
    navigate.push("/categories/list");
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
                  onClick={listeCategories}
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
                          ? "Ajouter catégorie"
                          : "Modifier catégorie"}
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Nom* </label>
                            <Form.Control
                              defaultValue={nom}
                              placeholder="Nom"
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
                            <label>Description </label>
                            <Form.Control
                              defaultValue={description}
                              placeholder="Description"
                              name="Description"
                              type="text"
                              as="textarea"
                              rows={3}
                              onChange={(value) => {
                                setDescription(value.target.value);
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

export default AjouterCategory;
