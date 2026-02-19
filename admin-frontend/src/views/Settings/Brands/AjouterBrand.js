// src/components/Brands/AjouterBrand.js
import React, { useEffect, useState } from "react";
import validator from "validator";
import {
  Button,
  Card,
  Form,
  Container,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  brandAdded,
  brandGetById,
  brandUpdated,
  uploadBrandImage,
} from "../../../Redux/brandsSlice";

function AjouterBrand() {
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Load brand data if editing
  useEffect(() => {
    if (location.id) {
      dispatch(brandGetById(location.id)).then((response) => {
        const brand = response.payload;
        setName(brand.name || "");
        setDescription(brand.description || "");
        setLogo(brand.logo || "");
        if (brand.logo) {
          setLogoPreview(brand.logo);
        }
      });
    }
  }, [dispatch, location.id]);

  function listeBrands() {
    navigate.push("/brands/list");
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        notify(2, "Veuillez sélectionner une image valide");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        notify(2, "L'image ne doit pas dépasser 2MB");
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return logo;

    setUploading(true);
    try {
      const imageUrl = await dispatch(uploadBrandImage(logoFile)).unwrap();
      setUploading(false);
      return imageUrl;
    } catch (error) {
      setUploading(false);
      notify(2, "Erreur lors du téléchargement de l'image");
      throw error;
    }
  };

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

    // Validate name length
    if (name && name.length < 2) {
      notify(2, "Le nom de la marque doit contenir au moins 2 caractères");
      isValid = false;
    }

    if (isValid) {
      try {
        let logoUrl = logo;

        // Upload new logo if selected
        if (logoFile) {
          logoUrl = await uploadLogo();
        }

        const brandData = {
          name,
          description: description || undefined,
          ...(logoUrl && { img: logoUrl }),
        };

        let result;
        if (location.id) {
          result = await dispatch(
            brandUpdated({ id: parseInt(location.id), ...brandData }),
          );
        } else {
          result = await dispatch(brandAdded(brandData));
        }

        if (result.payload) {
          notify(
            1,
            location.id ? "Modification avec succès" : "Insertion avec succès",
          );
          setTimeout(() => {
            listeBrands();
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
                onClick={listeBrands}
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
                        ? "Ajouter une marque"
                        : "Modifier la marque"}
                    </Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md="8">
                        <Row>
                          <Col className="pr-1" md="12">
                            <Form.Group>
                              <label>Nom de la marque *</label>
                              <Form.Control
                                value={name}
                                placeholder="Ex: Nike, Adidas, Apple"
                                name="Nom"
                                className="required"
                                type="text"
                                onChange={(e) => setName(e.target.value)}
                              />
                              <div className="error text-danger"></div>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col className="pr-1" md="12">
                            <Form.Group>
                              <label>Description</label>
                              <Form.Control
                                as="textarea"
                                rows={4}
                                value={description}
                                placeholder="Description de la marque..."
                                onChange={(e) => setDescription(e.target.value)}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Col>

                      <Col md="4">
                        <Form.Group>
                          <label>Logo de la marque</label>
                          <div className="text-center mb-3">
                            {logoPreview ? (
                              <Image
                                src={logoPreview}
                                alt="Logo preview"
                                fluid
                                style={{
                                  maxHeight: "150px",
                                  marginBottom: "10px",
                                }}
                                className="border rounded p-2"
                              />
                            ) : (
                              <div
                                className="border rounded d-flex align-items-center justify-content-center bg-light"
                                style={{
                                  height: "150px",
                                  marginBottom: "10px",
                                }}
                              >
                                <span className="text-muted">
                                  Aperçu du logo
                                </span>
                              </div>
                            )}
                          </div>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            disabled={uploading}
                          />
                          <Form.Text className="text-muted">
                            Formats acceptés: JPG, PNG, GIF. Max: 2MB
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      className="btn-fill pull-right"
                      type="submit"
                      variant="info"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>{" "}
                          Téléchargement...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
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

export default AjouterBrand;
