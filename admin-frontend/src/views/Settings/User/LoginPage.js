import React, { useState, useEffect, useRef } from "react";
import { loginFetch } from "../../../Redux/usersSlice";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// react-bootstrap components
import { Button, Card, Form, Container, Col, Row } from "react-bootstrap";

function LoginPage() {
  /* localStorage.clear(); */
  /* const notify = (type,msg) => {
    if(type === 1)
      toast.success(<strong><i className="fas fa-check-circle"></i>{msg}</strong>);
    else 
      toast.error(<strong><i className="fas fa-exclamation-circle"></i>{msg}</strong>);
  } */
  const notifyErr = (msg) =>
    toast.error(
      <strong>
        <i className="fas fa-exclamation-circle"></i>
        {msg}
      </strong>
    );
  const dispatch = useDispatch();
  const [cardClasses, setCardClasses] = useState("card-hidden");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    setTimeout(function () {
      setCardClasses("");
    }, 1000);
  });
  function loginChange(event) {
    setLogin(event.target.value);
  }
  function passwordChange(event) {
    setPassword(event.target.value);
  }
  function enterKeyPressed(event) {
    if (event.charCode === 13) {
      submitForm();
      return true;
    } else {
      return false;
    }
  }
  const submitForm = (event) => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        var root = await dispatch(
          loginFetch({ email: login, password: password })
        );
        var entities = root.payload;
        resolve(entities);
      }, 0);
    });

    promise.then((value) => {
      console.log(value);

      if (value.message) {
        notifyErr(value.message);
      } else {
        localStorage.setItem("x-access-token", value.access_token);
        localStorage.setItem("user", value.user);
        window.location.replace("/users");
      }
      /* if(value.message !== true ){        
        notifyErr(value.message);
      } else {
        localStorage.setItem('x-access-token', value.token);
        window.location.replace("/Profile");
      } */
    });
  };
  return (
    <>
      <ToastContainer />
      <div className="login-page full-gray section-image" data-color="black">
        <Row>
          <Col className="hiddenMobile" lg="3" md="4" sm="4" xs="3">
            <div className="img-log">
              <div className="logo">
                <div className="bglogo">
                  <img
                    src={require("../../../assets/img/logo.png")}
                    alt="medicacom"
                  />
                </div>
              </div>
            </div>
          </Col>
          {/* <Col lg="9" md="8" sm="8" xs="9"> */}
          <Col lg="9">
            <div className="block-log">
              <Row>
                {/* <Col className="mx-auto" lg="5"> */}
                <Col className="mx-auto" lg="5" md="8" sm="10" xs="8">
                  <Form
                    action=""
                    className="form"
                    method=""
                    onSubmit={submitForm}
                  >
                    <Card className={"card-login " + cardClasses}>
                      <Card.Header>
                        <h3 className="header text-center">Connectez -vous</h3>
                        <br></br>
                        <p className="header text-center">
                          Connectez-vous pour accéder à votre espace
                        </p>
                      </Card.Header>
                      <Card.Body>
                        <Form.Group>
                          <label>Login</label>
                          {/* <button onClick={notify}>Notify!</button> */}
                          <Form.Control
                            onKeyPress={enterKeyPressed}
                            placeholder="Login"
                            type="text"
                            onChange={loginChange}
                          ></Form.Control>
                        </Form.Group>
                        <Form.Group>
                          <label>Mot de passe</label>
                          <Form.Control
                            placeholder="Password"
                            onKeyPress={enterKeyPressed}
                            onChange={passwordChange}
                            type="password"
                          ></Form.Control>
                        </Form.Group>
                      </Card.Body>
                      <Card.Footer className="ml-auto mr-auto">
                        <Button
                          className="btn-wd"
                          type="button"
                          variant="success"
                          onClick={submitForm}
                        >
                          Connexion
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Form>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default LoginPage;
