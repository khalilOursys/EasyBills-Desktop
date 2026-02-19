import React from "react";
import { Navbar, Container, Nav, Dropdown, Button, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
/* import { anneeAdded, fetchAnnee } from "../../Redux/anneeReduce"; */
import Select from "react-select";

function Header({ users }) {
  var navigate = useHistory();
  const dispatch = useDispatch();
  /* const [annee, setAnnee] = React.useState();
  const [optionsAnnee, setOptionsAnnee] = React.useState([
    {
      value: "",
      label: "Annee",
      isDisabled: true,
    },
  ]); */
  let nom = "test";
  /* let role = users.user.id_role;
  let id = users.user.id; */
  function LogOut(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.replace("/login");
  }
  const mobileSidebarToggle = (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle("nav-open");
    var node = document.createElement("div");
    node.id = "bodyClick";
    node.onclick = function () {
      this.parentElement.removeChild(this);
      document.documentElement.classList.toggle("nav-open");
    };
    document.body.appendChild(node);
  };

  const getBrandText = () => {
    /* for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    } */
    return "";
  };
  /* const getAnnes = React.useCallback(async () => {
    var year = await dispatch(fetchAnnee());
    var arrayOption = [];
    var selected = null;
    var yearNow = new Date().getFullYear();
    year.payload.forEach((element) => {
      arrayOption.push({
        value: element.annee,
        label: element.annee,
        selected: element.selected,
        id: element.id,
      }); 
      if (yearNow === element.annee)
        selected = {
          value: element.annee,
          label: element.annee,
          selected: element.selected,
          id: element.id,
        };
    });
    var annee = localStorage.getItem("annee");
    if (annee === null) {
      setAnnee({ value: selected.value, label: selected.value });
      localStorage.setItem("annee", selected.value);
    } else {
      setAnnee({ value: annee, label: annee });
      localStorage.setItem("annee", annee);
    }

    setOptionsAnnee(arrayOption);
  }, [dispatch]);
  React.useEffect(() => {
    getAnnes();
  }, [getAnnes]); */

  function updateAnnee(value) {
    localStorage.setItem("annee", value.value);
    window.location.reload();
  }

  return (
    <Navbar bg="light" expand="lg">
      <Container fluid>
        <div className="navbar-wrapper">
          <div className="navbar-minimize">
            <Button
              className="btn-fill btn-round btn-icon d-none d-lg-block bg-dark border-dark"
              variant="dark"
              onClick={() => document.body.classList.toggle("sidebar-mini")}
            >
              <i className="fas fa-ellipsis-v visible-on-sidebar-regular"></i>
              <i className="fas fa-bars visible-on-sidebar-mini"></i>
            </Button>
            <Button
              className="btn-fill btn-round btn-icon d-block d-lg-none bg-dark border-dark"
              variant="dark"
              onClick={() =>
                document.documentElement.classList.toggle("nav-open")
              }
            >
              <i className="fas fa-list"></i>
              <i className="fas fa-bars visible-on-sidebar-mini"></i>
            </Button>
          </div>
          <Navbar.Brand
            href="#pablo"
            onClick={(e) => e.preventDefault()}
          ></Navbar.Brand>
        </div>
        <Col md="4">
          {/* <Select
            className="react-select primary"
            classNamePrefix="react-select"
            name="singleSelect"
            value={annee}
            onChange={(value) => {
              setAnnee(value);
              updateAnnee(value);
            }}
            options={optionsAnnee}
            placeholder="Annee"
          /> */}
        </Col>
        <Col md="6">
          <Navbar.Collapse id="basic-navbar-nav" className="dropdown-profile">
            <Nav className="ml-auto" navbar>
              {/* <Nav.Item>
              <Nav.Link
                className="m-0"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <span className="no-icon">Account</span>
              </Nav.Link>
            </Nav.Item> */}
              <Dropdown as={Nav.Item}>
                <Dropdown.Toggle
                  aria-expanded={false}
                  aria-haspopup={true}
                  as={Nav.Link}
                  data-toggle="dropdown"
                  id="navbarDropdownMenuLink"
                  variant="default"
                  className="m-0"
                >
                  <span className="no-icon">{nom}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu aria-labelledby="navbarDropdownMenuLink">
                  <Dropdown.Item
                    href="#"
                    onClick={(e) => navigate.push("/Settings")}
                  >
                    <i className="fas fa-users-cog"></i>
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Item
                    href="#"
                    onClick={(e) => navigate.push("/profile")}
                  >
                    <i className="fas fa-user"></i>
                    profile
                  </Dropdown.Item>
                  <Dropdown.Item href="#" onClick={LogOut}>
                    <i className="nc-icon nc-button-power"></i>
                    Déconnecter
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Col>
      </Container>
    </Navbar>
  );
}

export default Header;
