// src/components/Drivers/AjouterDriver.js
import React, { useEffect, useState } from "react";
import Select from "react-select";
import validator from "validator";
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  driverAdded,
  driverGetById,
  driverUpdated,
} from "../../../Redux/driversSlice";
import { fetchCars } from "../../../Redux/carsSlice"; // Assuming you have a cars slice

function AjouterDriver() {
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [cin, setCin] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [active, setActive] = useState(true);
  const [carId, setCarId] = useState(null);

  // Car options
  const [cars, setCars] = useState([]);
  const [carOptions, setCarOptions] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);

  // Load cars for select dropdown
  useEffect(() => {
    dispatch(fetchCars()).then((response) => {
      const carsList = response.payload;
      setCars(carsList);
      const options = carsList.map((car) => ({
        value: car.id,
        label: `${car.brand} ${car.model} - ${car.licensePlate}`,
      }));
      setCarOptions(options);
    });

    // Load driver data if editing
    if (location.id) {
      dispatch(driverGetById(location.id)).then((response) => {
        const driver = response.payload;
        setFirstName(driver.firstName);
        setLastName(driver.lastName);
        setPhone(driver.phone || "");
        setCin(driver.cin || "");
        setLicenseNumber(driver.licenseNumber || "");
        setActive(driver.active);

        if (driver.car) {
          setSelectedCar({
            value: driver.car.id,
            label: `${driver.car.brand} ${driver.car.model} - ${driver.car.licensePlate}`,
          });
          setCarId(driver.car.id);
        }
      });
    }
  }, [dispatch, location.id]);

  function listeDrivers() {
    navigate.push("/drivers/list");
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

    // Validate CIN format (example: Tunisian CIN format - 8 digits)
    if (cin && !validator.isLength(cin, { min: 8, max: 8 })) {
      notify(2, "Le CIN doit contenir 8 chiffres");
      isValid = false;
    }

    // Validate phone if provided
    if (phone && !validator.isMobilePhone(phone, "any")) {
      notify(2, "Format de téléphone invalide");
      isValid = false;
    }

    if (isValid) {
      const driverData = {
        firstName,
        lastName,
        phone: phone || 0,
        cin: parseInt(cin) || 0,
        licenseNumber: licenseNumber || 0,
        active,
        carId: carId || undefined,
      };

      try {
        let result;
        if (location.id) {
          result = await dispatch(
            driverUpdated({ id: parseInt(location.id), ...driverData }),
          );
        } else {
          result = await dispatch(driverAdded(driverData));
        }

        if (result.payload) {
          notify(
            1,
            location.id ? "Modification avec succès" : "Insertion avec succès",
          );
          setTimeout(() => {
            listeDrivers();
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
                onClick={listeDrivers}
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
                      {!location.id
                        ? "Ajouter chauffeur"
                        : "Modifier chauffeur"}
                    </Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col className="pr-1" md="6">
                        <Form.Group>
                          <label>Prénom *</label>
                          <Form.Control
                            value={firstName}
                            placeholder="Prénom"
                            name="Prénom"
                            className="required"
                            type="text"
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                          <div className="error text-danger"></div>
                        </Form.Group>
                      </Col>
                      <Col className="pl-1" md="6">
                        <Form.Group>
                          <label>Nom *</label>
                          <Form.Control
                            value={lastName}
                            placeholder="Nom"
                            name="Nom"
                            className="required"
                            type="text"
                            onChange={(e) => setLastName(e.target.value)}
                          />
                          <div className="error text-danger"></div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col className="pr-1" md="4">
                        <Form.Group>
                          <label>Téléphone</label>
                          <Form.Control
                            value={phone}
                            placeholder="Téléphone"
                            type="tel"
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col className="pr-1" md="4">
                        <Form.Group>
                          <label>CIN</label>
                          <Form.Control
                            value={cin}
                            placeholder="Carte d'identité nationale"
                            type="text"
                            onChange={(e) => setCin(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col className="pl-1" md="4">
                        <Form.Group>
                          <label>Numéro de permis</label>
                          <Form.Control
                            value={licenseNumber}
                            placeholder="Numéro de permis de conduire"
                            type="text"
                            onChange={(e) => setLicenseNumber(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col className="pr-1" md="6">
                        <Form.Group>
                          <label>Véhicule assigné</label>
                          <Select
                            placeholder="Sélectionner un véhicule"
                            className="react-select primary"
                            classNamePrefix="react-select"
                            value={selectedCar}
                            isClearable
                            onChange={(value) => {
                              setSelectedCar(value);
                              setCarId(value ? value.value : null);
                            }}
                            options={carOptions}
                          />
                        </Form.Group>
                      </Col>
                      <Col className="pl-1" md="6">
                        <Form.Group>
                          <Form.Check
                            type="switch"
                            id="active-switch"
                            label="Chauffeur actif"
                            checked={active}
                            onChange={(e) => setActive(e.target.checked)}
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

export default AjouterDriver;
