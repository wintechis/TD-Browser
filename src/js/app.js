"use strict";
import $ from "jquery";
import "bootstrap/dist/js/bootstrap.bundle";
import { ThingsController, Logger } from "./helpers";
import Navbar from "./components/Navbar";
import LeftView from "./components/LeftView";
import MiddleView from "./components/MiddleView";
import RightView from "./components/RightView";
import FAU_Logo_Div from "./components/FAU_Logo";
import Footer from "./components/Footer";
async function App() {
  const mainDiv = $.parseHTML(`<div id="main"></div>`);
  const bodyDiv = $.parseHTML(`<div id="bodyDiv"></div>`);
  let tc = new ThingsController();
  let logger = new Logger();
  Navbar.ThingsController = tc;
  Navbar.LeftView = LeftView;
  Navbar.MiddleView = MiddleView;
  LeftView.ThingsController = tc;
  LeftView.MiddleView = MiddleView;
  MiddleView.ThingsController = tc;
  MiddleView.LeftView = LeftView;
  MiddleView.RightView = RightView;
  logger.LogsViewer = RightView;
  RightView.logger;
  tc.logger = logger;
  $(bodyDiv).append(
    LeftView.htmlElement,
    MiddleView.htmlElement,
    RightView.htmlElement
  );
  $(mainDiv).append(Navbar.htmlElement, FAU_Logo_Div, bodyDiv, Footer);
  $(bodyDiv).hide();
  return mainDiv;
}

export default App;
