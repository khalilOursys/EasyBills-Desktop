import React, { useCallback, useEffect } from "react";
import Components from "./components";
import Sidebar from "./components/Sidebar/Sidebar";
import AdminNavbar from "./components/Navbars/AdminNavbar";
import Footer from "./components/Footer/Footer";
import { Route, Switch, Redirect, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import routes from "./routes";

function RootBase() {
  const id_role = localStorage.getItem("id_role");
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.collapse) {
        return getRoutes(prop.views);
      }
      //prop.id_role.includes(id_role)
      if (prop.id_role.includes("ADMIN")) {
        var component = React.createElement(
          Components[prop.componentStr],
          { obj: null },
          null
        );
        return <Route path={prop.path} key={key} render={() => component} />;
      }
      return null;
    });
  };

  return (
    <>
      <div className="wrapper">
        <Sidebar users={null} routes={routes} />
        <div className="main-panel">
          <AdminNavbar users={null} />
          <div className="content">
            <Switch>
              {getRoutes(routes)}
              {/* <Redirect from="/" to="/profile" /> */}
              {/* <Route path="/" element={<Navigate replace to="/profile" />} /> */}
            </Switch>
          </div>
          <Footer />
          <div
            className="close-layer"
            onClick={() =>
              document.documentElement.classList.toggle("nav-open")
            }
          />
        </div>
      </div>
    </>
  );
}

export default RootBase;
