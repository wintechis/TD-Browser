import $ from "jquery";
import Controller from "./controller";
import thingsSwitcher from "./thingsSwitcher";
let numberOfThings = 0;
export default () => {
  let smallView = $(window).width() <= 828 ? true : false;
  let hideFooter = false;
  document.addEventListener("appMounted", () => {
    if (smallView) changeToSmallView();
  });
  document.addEventListener("fileConsumed", () => {
    if (!hideFooter && smallView) {
      $("#footer").hide();
      Controller.show();
    }
    Controller.metadata();
    numberOfThings++;
    hideFooter = true;
  });
  window.addEventListener("resize", () => {
    let currentView = $(window).width() <= 828 ? true : false;
    if (currentView !== smallView) {
      $("#app").remove();
      $("body").append(
        ` <div  class="alert alert-danger">
                  Refresh the App!
          </div>`
      );
    }
    /*     if (currentView === smallView) {
    } else if (currentView) { //small view
      thingsSwitcher.restart();
      smallView = currentView;
      changeToSmallView();
    } else { //big view
      smallView = currentView;
      reset();
    } */
  });
};
const reset = () => {
  $(
    "#leftViewContainer,#middleViewContainer,#rightViewContainer, #leftViewContainer >  #affordanceButtons, #footer"
  ).show();
  thingsSwitcher.reset();
  Controller.reset();
};
const changeToSmallView = () => {
  $(
    "#middleViewContainer,#rightViewContainer, #leftViewContainer >  #affordanceButtons,.body-row-1"
  ).hide();
  $(".thingAvatar").length && $("#footer").hide();
  $(Controller.htmlElement).insertBefore("#footer");
  document.addEventListener("updateMiddleView", () => {
    $("#leftViewContainer").hide();
    $("#middleViewContainer").show();
  });
  Controller.log();
  numberOfThings && Controller.metadata();
  thingsSwitcher.start();
};
