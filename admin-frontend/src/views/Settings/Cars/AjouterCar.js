// src/components/Cars/AjouterCar.js
import React, { useEffect, useState } from "react";
import validator from "validator";
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { carAdded, carGetById, carUpdated } from "../../../Redux/carsSlice";

function AjouterCar() {
  const notify = (type, msg) => {
    if (type === 1)
      toast.success(
        <strong>
          <i className="fas fa-check-circle"></i>
          {msg}
        </strong>,
      );
    else
      toast.error(
        <strong>
          <i className="fas fa-exclamation-circle"></i>
          {msg}
        </strong>,
      );
  };

  const dispatch = useDispatch();
  const navigate = useHistory();
  const location = useParams();

  // Form states
  const [registration, setRegistration] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  // Load car data if editing
  useEffect(() => {
    if (location.id) {
      dispatch(carGetById(location.id)).then((response) => {
        const car = response.payload;
        setRegistration(car.registration);
        setBrand(car.brand || "");
        setModel(car.model || "");
        setYear(car.year || "");
      });
    }
  }, [dispatch, location.id]);

  function listeCars() {
    navigate.push("/cars/list");
  }

  async function submitForm(event) {
    event.preventDefault();

    const required = document.getElementsByClassName("required");
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll(".error").forEach((el) => (el.innerHTML = ""));
    document
      .querySelectorAll(".required")
      .forEach((el) => (el.style.borderColor = "#ccc"));

    // Validate required fields
    for (let i = 0; i < required.length; i++) {
      if (validator.isEmpty(required[i].value)) {
        required[i].style.borderColor = "red";
        document.getElementsByClassName("error")[i].innerHTML =
          required[i].name + " est obligatoire";
        notify(2, required[i].name + " doit être non vide");
        isValid = false;
      }
    }

    // Validate registration format (example: Tunisian plates - 3 digits Tunis 3 digits)
    if (
      registration &&
      !validator.matches(
        registration,
        /^[0-9]{1,3}[-\s]?[A-Za-z]{1,3}[-\s]?[0-9]{1,4}$/,
      )
    ) {
      notify(2, "Format d'immatriculation invalide");
      isValid = false;
    }

    // Validate year if provided
    if (year) {
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        notify(2, `L'année doit être entre 1900 et ${currentYear + 1}`);
        isValid = false;
      }
    }

    if (isValid) {
      const carData = {
        registration,
        brand: brand || undefined,
        model: model || undefined,
        year: year ? parseInt(year) : undefined,
      };

      try {
        let result;
        if (location.id) {
          result = await dispatch(
            carUpdated({ id: parseInt(location.id), ...carData }),
          );
        } else {
          result = await dispatch(carAdded(carData));
        }

        if (result.payload) {
          notify(
            1,
            location.id ? "Modification avec succès" : "Insertion avec succès",
          );
          setTimeout(() => {
            listeCars();
          }, 1500);
        }
      } catch (error) {
        notify(2, error.message || "Erreur lors de l'enregistrement");
      }
    }
  }

  return (
    <Container fluid>
      <ToastContainer />
      <div className="section-image">
        <Container>
          <Row>
            <Col md="12">
              <Button
                className="btn-wd btn-outline mr-1 float-left"
                type="button"
                variant="info"
                onClick={listeCars}
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
              <Form onSubmit={submitForm}>
                <Card>
                  <Card.Header>
                    <Card.Title as="h4">
                      {!location.id ? "Ajouter véhicule" : "Modifier véhicule"}
                    </Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col className="pr-1" md="6">
                        <Form.Group>
                          <label>Immatriculation *</label>
                          <Form.Control
                            value={registration}
                            placeholder="Ex: 123 Tunis 456"
                            name="Immatriculation"
                            className="required"
                            type="text"
                            onChange={(e) =>
                              setRegistration(e.target.value.toUpperCase())
                            }
                          />
                          <div className="error text-danger"></div>
                          <Form.Text className="text-muted">
                            Format: 123 Tunis 456 ou 123TU456
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col className="pl-1" md="6">
                        <Form.Group>
                          <label>Marque</label>
                          <Form.Control
                            value={brand}
                            placeholder="Ex: Toyota, Renault, Peugeot"
                            type="text"
                            onChange={(e) => setBrand(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col className="pr-1" md="6">
                        <Form.Group>
                          <label>Modèle</label>
                          <Form.Control
                            value={model}
                            placeholder="Ex: Clio, 208, Corolla"
                            type="text"
                            onChange={(e) => setModel(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col className="pl-1" md="6">
                        <Form.Group>
                          <label>Année</label>
                          <Form.Control
                            value={year}
                            placeholder="Ex: 2020"
                            type="number"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            onChange={(e) => setYear(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      className="btn-fill pull-right"
                      type="submit"
                      variant="info"
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
  );
}

export default AjouterCar;
