"use strict";
import $ from "jquery";

class Controller {
  #previousSelectedButton = {};
  #htmlElement = $.parseHTML(`
    <div id="controller"  style="display:none;">
        <div id="controllerButtonsContainer" class="btn-group" role="group">
          <button id="controllerMetadata" class="btn ">Metadata</button>
          <button id="controllerAction" class="btn ">Actions</button>
          <button id="controllerProperty" class="btn ">Properties</button>
          <button id="controllerEvent" class="btn ">Events</button>
          <button id="controllerRightView" class="btn bi-arrow-down-up"></button>
        </div>
    </div>
  `);
  get htmlElement() {
    this.#onClick();
    return this.#htmlElement;
  }
  #onClick() {
    $(this.#htmlElement).on("click", (e) => {
      let elementID = e.target.id;
      switch (elementID) {
        case "controllerMetadata":
          $("#affordanceMetadata").trigger("click");
          this.#showMiddleView();
          this.#highlightButton(elementID);
          break;
        case "controllerAction":
          $("#affordanceAction").trigger("click");
          this.#showMiddleView();
          this.#highlightButton(elementID);
          break;
        case "controllerEvent":
          $("#affordanceEvent").trigger("click");
          this.#showMiddleView();
          this.#highlightButton(elementID);
          break;
        case "controllerProperty":
          $("#affordanceProperty").trigger("click");
          this.#showMiddleView();
          this.#highlightButton(elementID);
          break;
        case "controllerRightView":
          this.#showRightView();
          $("#controllerRightView").removeClass("btn-orange");
          this.#highlightButton(elementID);
          break;
        default:
          break;
      }
    });
  }
  #showRightView() {
    $("#rightViewContainer").show();
    $("#middleViewContainer,#leftViewContainer").hide();
    $("#rightViewContainer > .body-row-2").scrollTop(
      $("#rightViewContainer > .body-row-2").height()
    );
  }
  #showMiddleView() {
    $("#leftViewContainer").show();
    $("#middleViewContainer,#rightViewContainer").hide();
  }
  #highlightButton(id) {
    if (id.includes("--")) {
      let className = [
        "readallproperties",
        "readmultipleproperties",
        "writeallproperties",
        "writemultipleproperties",
      ].includes(id.split("--")[1])
        ? "btn-topLevel-active"
        : "btn-active";
      $(`#${this.#previousSelectedButton.itemButton}`).removeClass(
        `btn-topLevel-active btn-active`
      );
      $(`#${id}`).addClass(className);
      this.#previousSelectedButton.itemButton = id;
    } else {
      $(`#${this.#previousSelectedButton.affordanceButton}`).removeClass(
        "btn-active"
      );
      $(`#${id}`).addClass("btn-active");
      this.#previousSelectedButton.affordanceButton = id;
    }
  }
  show() {
    $("#controller").show();
  }
  metadata() {
    $("#controllerMetadata").trigger("click");
  }
  log() {
    document.addEventListener("newNotification", () => {
      if (!$("#controllerRightView").hasClass("btn-active")) {
        $("#controllerRightView").addClass("btn-orange");
      }
    });
  }
  reset() {
    $("#controller").off("click");
    $("#controller").remove();
  }
}

export default new Controller();
