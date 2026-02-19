// src/components/Products/AjouterProduct.js
import React, { useEffect } from "react";
import Select from "react-select";
import validator from "validator";
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams, useHistory } from "react-router-dom";
import { productAdded, productGetById } from "../../../Redux/productsSlice";
import { fetchCategories } from "../../../Redux/categoriesSlice";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

function AjouterProduct() {
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
  const [reference, setReference] = React.useState("");
  const [internalCode, setInternalCode] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [stock, setStock] = React.useState(0);
  const [minStock, setMinStock] = React.useState(0);
  const [purchasePrice, setPurchasePrice] = React.useState(0);
  const [marginPercent, setMarginPercent] = React.useState(0);
  const [salePrice, setSalePrice] = React.useState(0);
  const [discount, setDiscount] = React.useState(0);
  const [vat, setVat] = React.useState(19);
  const [categoryId, setCategoryId] = React.useState(0);
  const [id, setId] = React.useState(0);

  // Options for categories
  const [categories, setCategories] = React.useState([]);
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState(null);

  async function submitForm(event) {
    var required = document.getElementsByClassName("required");
    var isValid = true;

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
          isValid = false;
        }
      }
    }

    // Validate numbers
    if (purchasePrice <= 0 || salePrice <= 0 || marginPercent < 0) {
      notify(2, "Les prix et la marge doivent être positifs");
      isValid = false;
    }

    if (categoryId === 0) {
      notify(2, "Veuillez sélectionner une catégorie");
      isValid = false;
    }

    if (isValid) {
      const productData = {
        reference,
        internalCode,
        name: nom,
        stock: parseInt(stock),
        minStock: parseInt(minStock),
        purchasePrice: parseFloat(purchasePrice),
        marginPercent: parseFloat(marginPercent),
        salePrice: parseFloat(salePrice),
        discount: parseFloat(discount),
        vat: parseFloat(vat),
        categoryId: parseInt(categoryId),
      };

      dispatch(productAdded(productData)).then((data) => {
        if (data.payload) {
          if (isNaN(location.id) === true) notify(1, "Insertion avec succès");
          else notify(1, "Modification avec succès");
          setTimeout(async () => {
            listeProducts();
          }, 1500);
        } else {
          notify(2, "Problème de connexion");
        }
      });
    }
  }

  useEffect(() => {
    // Load categories
    dispatch(fetchCategories()).then((response) => {
      const cats = response.payload;
      setCategories(cats);
      const options = cats.map((cat) => ({
        value: cat.id,
        label: cat.name,
      }));
      setCategoryOptions(options);
    });

    // Load product if editing
    const promise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (isNaN(location.id) === false) {
          var product = await dispatch(productGetById(location.id));
          var entities = product.payload;
          setReference(entities.reference);
          setInternalCode(entities.internalCode);
          setNom(entities.name);
          setStock(entities.stock);
          setMinStock(entities.minStock);
          setPurchasePrice(entities.purchasePrice);
          setMarginPercent(entities.marginPercent);
          setSalePrice(entities.salePrice);
          setDiscount(entities.discount);
          setVat(entities.vat);
          setCategoryId(entities.categoryId);
          setId(location.id);

          // Set selected category
          const selectedCat = categories.find(
            (cat) => cat.id === entities.categoryId
          );
          if (selectedCat) {
            setSelectedCategory({
              value: selectedCat.id,
              label: selectedCat.name,
            });
          }
          resolve(entities);
        } else {
          resolve(0);
        }
      }, 0);
    });
  }, [location.id, dispatch]);

  function listeProducts() {
    navigate.push("/products/list");
  }

  // Calculate sale price based on purchase price and margin
  const calculateSalePrice = () => {
    if (purchasePrice && marginPercent) {
      const calculatedPrice = purchasePrice * (1 + marginPercent / 100);
      setSalePrice(calculatedPrice.toFixed(2));
    }
  };

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
                  onClick={listeProducts}
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
                          ? "Ajouter produit"
                          : "Modifier produit"}
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Référence* </label>
                            <Form.Control
                              defaultValue={reference}
                              placeholder="Référence"
                              name="Référence"
                              className="required"
                              type="text"
                              onChange={(value) => {
                                setReference(value.target.value);
                              }}
                            ></Form.Control>
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                        <Col className="pl-1" md="6">
                          <Form.Group>
                            <label>Code Interne* </label>
                            <Form.Control
                              defaultValue={internalCode}
                              placeholder="Code Interne"
                              name="Code Interne"
                              className="required"
                              type="text"
                              onChange={(value) => {
                                setInternalCode(value.target.value);
                              }}
                            ></Form.Control>
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col className="pr-1" md="12">
                          <Form.Group>
                            <label>Nom* </label>
                            <Form.Control
                              defaultValue={nom}
                              placeholder="Nom du produit"
                              name="Nom"
                              className="required"
                              type="text"
                              onChange={(value) => {
                                setNom(value.target.value);
                              }}
                            ></Form.Control>
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col className="pr-1" md="4">
                          <Form.Group>
                            <label>Stock </label>
                            <Form.Control
                              defaultValue={stock}
                              placeholder="Stock"
                              type="number"
                              min="0"
                              onChange={(value) => {
                                setStock(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                        <Col className="pr-1" md="4">
                          <Form.Group>
                            <label>Stock Minimum </label>
                            <Form.Control
                              defaultValue={minStock}
                              placeholder="Stock Minimum"
                              type="number"
                              min="0"
                              onChange={(value) => {
                                setMinStock(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                        <Col className="pl-1" md="4">
                          <Form.Group>
                            <label>Catégorie* </label>
                            <Select
                              placeholder="Sélectionner une catégorie"
                              className="react-select primary"
                              classNamePrefix="react-select"
                              value={selectedCategory}
                              onChange={(value) => {
                                setSelectedCategory(value);
                                setCategoryId(value.value);
                              }}
                              options={categoryOptions}
                            />
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col className="pr-1" md="4">
                          <Form.Group>
                            <label>Prix d'Achat (DH)* </label>
                            <Form.Control
                              defaultValue={purchasePrice}
                              placeholder="0.00"
                              name="Prix Achat"
                              className="required"
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(value) => {
                                setPurchasePrice(value.target.value);
                                calculateSalePrice();
                              }}
                            ></Form.Control>
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                        <Col className="pr-1" md="4">
                          <Form.Group>
                            <label>Marge (%)* </label>
                            <Form.Control
                              defaultValue={marginPercent}
                              placeholder="0"
                              name="Marge"
                              className="required"
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(value) => {
                                setMarginPercent(value.target.value);
                                calculateSalePrice();
                              }}
                            ></Form.Control>
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                        <Col className="pl-1" md="4">
                          <Form.Group>
                            <label>Prix de Vente (DH)* </label>
                            <Form.Control
                              defaultValue={salePrice}
                              placeholder="0.00"
                              name="Prix Vente"
                              className="required"
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(value) => {
                                setSalePrice(value.target.value);
                              }}
                            ></Form.Control>
                            <div className="error"></div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Remise (%) </label>
                            <Form.Control
                              defaultValue={discount}
                              placeholder="0"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              onChange={(value) => {
                                setDiscount(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                        <Col className="pl-1" md="6">
                          <Form.Group>
                            <label>TVA (%) </label>
                            <Form.Control
                              defaultValue={vat}
                              placeholder="19"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              onChange={(value) => {
                                setVat(value.target.value);
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

export default AjouterProduct;
