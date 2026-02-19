import React, { useEffect } from "react";
import validator from "validator";
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  getCompanySettings,
  updateCompanySettings,
} from "../Redux/settingsReduce";

function CompanySettings() {
  const dispatch = useDispatch();

  /* ================= STATES ================= */
  const [companyName, setCompanyName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [taxNumber, setTaxNumber] = React.useState("");
  const [rib, setRib] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [logo, setLogo] = React.useState(null);

  /* ================= TOAST ================= */
  const notify = (type, msg) => {
    if (type === 1)
      toast.success(<strong>{msg}</strong>);
    else toast.error(<strong>{msg}</strong>);
  };

  /* ================= SUBMIT ================= */
  async function submitForm() {
    if (validator.isEmpty(companyName)) {
      notify(2, "Nom société obligatoire");
      return;
    }

    const formData = new FormData();
    formData.append("companyName", companyName);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("taxNumber", taxNumber);
    formData.append("rib", rib);
    formData.append("email", email);
    if (logo) formData.append("logo", logo);

    dispatch(updateCompanySettings(formData)).then((res) => {
      if (res.payload) notify(1, "Mise à jour avec succès");
      else notify(2, "Erreur serveur");
    });
  }

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    dispatch(getCompanySettings()).then((res) => {
      if (res.payload) {
        const s = res.payload;
        setCompanyName(s.companyName || "");
        setPhone(s.phone || "");
        setAddress(s.address || "");
        setTaxNumber(s.taxNumber || "");
        setRib(s.rib || "");
        setEmail(s.email || "");
      }
    });
  }, [dispatch]);

  return (
    <Container fluid>
      <ToastContainer />
      <Row>
        <Col md="12">
          <Form>
            <Card>
              <Card.Header>
                <Card.Title as="h4">Paramètres Société</Card.Title>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md="6">
                    <Form.Group>
                      <label>Nom société *</label>
                      <Form.Control
                        className="required"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md="6">
                    <Form.Group>
                      <label>Email</label>
                      <Form.Control
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <Form.Group>
                      <label>Téléphone</label>
                      <Form.Control
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md="6">
                    <Form.Group>
                      <label>N° Fiscal</label>
                      <Form.Control
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <Form.Group>
                      <label>Adresse</label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md="6">
                    <Form.Group>
                      <label>RIB</label>
                      <Form.Control
                        value={rib}
                        onChange={(e) => setRib(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <Form.Group>
                      <label>Logo</label>
                      <Form.Control
                        type="file"
                        onChange={(e) => setLogo(e.target.files[0])}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  className="btn-fill pull-right"
                  variant="info"
                  type="button"
                  onClick={submitForm}
                >
                  Enregistrer
                </Button>
              </Card.Body>
            </Card>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default CompanySettings;
