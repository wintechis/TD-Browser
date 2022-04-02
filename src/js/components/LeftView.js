"use strict";
import $ from "jquery";
import JSONFormatter from "json-formatter-js";
let observeIcon = (propertyName) =>
  `<i id ="observeIcon--${propertyName}" class="bi-eye-fill leftView--observeIcon"> </i>`;
let observeIconActive = (propertyName) =>
  `<i id ="observeIcon--${propertyName}" class="bi-eye-fill leftView--observeIcon--active"> </i>`;
let editIcon = (propertyName) =>
  `<i id ="editIcon--${propertyName}" class="leftView--editIcon bi-pencil-fill"> </i>`;
let readableIcon = `<i class="bi-book-fill readableIcon"> </i>`;
const updateMiddleView = new Event("updateMiddleView");
class LeftView {
  #tc;
  #mv;
  #previousSelectedButton = {};
  #htmlElement = $.parseHTML(`
    <div id="leftViewContainer" class="">
        <div id="affordanceButtons" class="body-row-1 btn-group" role="group">
          <button id="affordanceMetadata" class="btn ">Metadata</button>
          <button id="affordanceAction" class="btn ">Actions</button>
          <button id="affordanceProperty" class="btn ">Properties</button>
          <button id="affordanceEvent" class="btn ">Events</button>
          <button id="affordanceKey" type="button" style="display: none;" class="btn bi-key"></button>
        </div>
        <div id="affordance" class="body-row-2">
        </div>
    </div>
  `);
  get htmlElement() {
    this.#onClick();
    return this.#htmlElement;
  }
  set ThingsController(tc) {
    this.#tc = tc;
  }
  set MiddleView(mv) {
    this.#mv = mv;
  }
  #onClick() {
    $(this.#htmlElement).on("click", (e) => {
      let elementID = e.target.id;
      switch (elementID.includes("--") ? elementID.split("--")[0] : elementID) {
        case "affordanceMetadata":
          this.appendMetadata();
          this.highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceAction":
          this.#appendActions();
          this.highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceEvent":
          this.#appendEvents();
          this.highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceProperty":
          this.#appendProperties();
          this.highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceKey":
          this.highlightButton(elementID);
          this.#mv.appendCredentialForm();
          break;
        case "action":
          this.highlightButton(elementID);
          this.#mv.appendActionForm(elementID.split("--")[1]);
          document.dispatchEvent(updateMiddleView);
          break;
        case "property":
          this.highlightButton(elementID);
          this.#mv.appendProperty(elementID.split("--")[1]);
          document.dispatchEvent(updateMiddleView);
          break;
        case "event":
          this.highlightButton(elementID);
          this.#mv.appendEvent(elementID.split("--")[1]);
          document.dispatchEvent(updateMiddleView);
          break;
        case "observeIcon":
          $(e.target).parent().trigger("click");
          break;
        case "editIcon":
          $(e.target).parent().trigger("click");
          break;
        default:
          break;
      }
    });
  }
  highlightButton(id) {
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
  #getMetadata() {
    return this.#tc.getMetadata();
  }
  #resetAffordance() {
    $("#affordance").html("");
  }
  #appendActions() {
    this.#resetAffordance();
    let actions = this.#tc.getActions();
    let listGroupElement = $.parseHTML(`<div class="list-group"></div>`);
    actions.forEach((action) => {
      let buttonElement = $.parseHTML(
        `  <button type="button" id="action--${action}" class="btn list-group-item list-group-item-action  mb-1">${action}</button>`
      );
      $(listGroupElement).append(buttonElement);
    });
    $("#affordance").append(listGroupElement);
  }
  toggleObserveIcon(property) {
    $(`#observeIcon--${property}`).hasClass("leftView--observeIcon--active")
      ? $(`#observeIcon--${property}`).removeClass(
          "leftView--observeIcon--active"
        )
      : $(`#observeIcon--${property}`).addClass(
          "leftView--observeIcon--active"
        );
  }

  #appendEvents() {
    this.#resetAffordance();
    let events = this.#tc.getEvents();
    let listGroupElement = $.parseHTML(`<div class="list-group"></div>`);
    events.forEach((action) => {
      let buttonElement = $.parseHTML(
        `  <button type="button" id="event--${action}" class="btn  list-group-item list-group-item-action  mb-1">${action}</button>`
      );
      $(listGroupElement).append(buttonElement);
    });
    $("#affordance").append(listGroupElement);
  }
  #appendProperties() {
    this.#resetAffordance();
    let properties = {
      ...this.#tc.getToplevelForms(),
      ...this.#tc.getPropertiesTD(),
    };
    let listGroupElement = $.parseHTML(`<div class="list-group"></div>`);
    Object.keys(properties).forEach((property) => {
      let observable = properties[property].observable;
      let isPropertyReadable = this.#tc.isPropertyReadable(property);
      let isPropertyWritable = this.#tc.isPropertyWritable(property);
      let isTopLevelForm = [
        "readallproperties",
        "readmultipleproperties",
        "writeallproperties",
        "writemultipleproperties",
      ].includes(property);
      let buttonElement = $.parseHTML(
        `<button id="${
          "property--" + property
        }" class="btn  list-group-item list-group-item-action  w-100 mb-1 ${
          isTopLevelForm ? "btn-topLevel" : ""
        }" type="button" data-bs-toggle="collapse" data-bs-target="#property--collapse--${property}" aria-expanded="false" aria-controls="property--collapse--${property}">
            ${property}
          </button>`
      );
      isPropertyWritable && $(buttonElement).append(editIcon(property));
      isPropertyReadable && $(buttonElement).append(readableIcon);

      observable &&
        $(buttonElement).append(
          this.#tc.isPropertyObserved(property)
            ? observeIconActive(property)
            : observeIcon(property)
        );
      $(listGroupElement).append(buttonElement);
    });
    $("#affordance").append(listGroupElement);
  }
  appendMetadata() {
    this.#resetAffordance();
    $("#affordanceKey").hide();
    this.#tc.hasSecurity() && $("#affordanceKey").show();
    let metadata = this.#getMetadata();
    let listGroupElement = $.parseHTML(`<div class="list-group"></div>`);
    metadata.forEach((element, index) => {
      let buttonElement = $.parseHTML(
        `<button class="btn  list-group-item list-group-item-action   w-100 mb-1" type="button" data-bs-toggle="collapse" data-bs-target="#metadata-${index}" aria-expanded="false" aria-controls="metadata-${index}">
            ${element[0]}
          </button>`
      );
      let collapseElement = $.parseHTML(
        `<div class="collapse multi-collapse" id="metadata-${index}"></div>`
      );
      let cardElement = $.parseHTML(`<div class="card card-body"></div>`);
      if (typeof element[1] === "object") {
        let formatter = new JSONFormatter(element[1]);
        $(cardElement).append(formatter.render());
      } else {
        $(cardElement).text(element[1]);
      }
      $(collapseElement).append(cardElement);
      $(listGroupElement).append(buttonElement, collapseElement);
    });
    $("#affordance").append(listGroupElement);
  }
}

export default new LeftView();
