"use strict";
import $ from "jquery";
import JSONFormatter from "json-formatter-js";
let observeIcon = (propertyName) =>
  `<i id ="observeIcon--${propertyName}" class="bi-bullseye leftView--observeIcon"> </i>`;
let observeIconActive = (propertyName) =>
  `<i id ="observeIcon--${propertyName}" class="bi-bullseye leftView--observeIcon--active"> </i>`;

let editIcon = (propertyName) =>
  `<i id ="editIcon--${propertyName}" class="leftView--editIcon bi-pencil-fill"> </i>`;
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
          this.#highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceAction":
          this.#appendActions();
          this.#highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceEvent":
          this.#appendEvents();
          this.#highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceProperty":
          this.#appendProperties();
          this.#highlightButton(elementID);
          this.#mv.resetMiddleView();
          break;
        case "affordanceKey":
          this.#highlightButton(elementID);
          this.#mv.appendCredentialForm();
          break;
        case "action":
          this.#highlightButton(elementID);
          this.#mv.appendActionForm(elementID.split("--")[1]);
          break;
        case "property":
          this.#highlightButton(elementID);
          this.#mv.appendPropertyResponse(elementID.split("--").splice(1, 2));
          break;
        case "event":
          this.#highlightButton(elementID);
          this.#mv.appendEvent(elementID.split("--")[1]);
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
  #highlightButton(id) {
    if (id.includes("--")) {
      $(`#${this.#previousSelectedButton.itemButton}`).removeClass(
        "btn-active"
      );
      $(`#${id}`).addClass("btn-active");
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
    console.log(property);
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
    let properties = this.#tc.getPropertiesTD();
    let listGroupElement = $.parseHTML(`<div class="list-group"></div>`);
    Object.keys(properties).forEach((property) => {
      let hasUriVariables =
        typeof properties[property].uriVariables === "object" ? true : false;
      let observable = properties[property].observable;
      let readOnly = properties[property].readOnly;
      let buttonElement = $.parseHTML(
        `<button id="${
          !hasUriVariables && "property--" + property
        }" class="btn  list-group-item list-group-item-action  w-100 mb-1" type="button" data-bs-toggle="collapse" data-bs-target="#property--collapse--${property}" aria-expanded="false" aria-controls="property--collapse--${property}">
            ${property}
          </button>`
      );
      !readOnly && $(buttonElement).append(editIcon(property));
      observable &&
        $(buttonElement).append(
          this.#tc.isPropertyObserved(property)
            ? observeIconActive(property)
            : observeIcon(property)
        );
      $(listGroupElement).append(buttonElement);
      if (hasUriVariables) {
        let uriVariables = properties[property].uriVariables.id.enum;
        let collapseElement = $.parseHTML(
          `<div class="collapse multi-collapse" id="property--collapse--${property}"></div>`
        );
        let cardElement = $.parseHTML(`<div class="card card-body"></div>`);
        uriVariables.forEach((variable) => {
          $(cardElement).append(
            `<button class="btn  w-100 mb-1" type="button" id="property--${property}--${variable}">${variable}</button>`
          );
        });
        $(collapseElement).append(cardElement);
        $(listGroupElement).append(collapseElement);
      }
    });
    $("#affordance").append(listGroupElement);
  }
  appendMetadata() {
    this.#resetAffordance();
    $("#affordanceKey").hide();
    this.#tc.hasSecurity() && $("#affordanceKey").show();
    let metadata = this.#getMetadata();
    let listGroupElement = $.parseHTML(`<div class="list-group"></div>`);
    Object.keys(metadata).forEach((key, index) => {
      let buttonElement = $.parseHTML(
        `<button class="btn  list-group-item list-group-item-action   w-100 mb-1" type="button" data-bs-toggle="collapse" data-bs-target="#metadata-${index}" aria-expanded="false" aria-controls="metadata-${index}">
            ${key}
          </button>`
      );
      let collapseElement = $.parseHTML(
        `<div class="collapse multi-collapse" id="metadata-${index}"></div>`
      );
      let cardElement = $.parseHTML(`<div class="card card-body"></div>`);
      if (typeof metadata[key] === "object") {
        let formatter = new JSONFormatter(metadata[key]);
        $(cardElement).append(formatter.render());
      } else {
        $(cardElement).text(metadata[key]);
      }
      $(collapseElement).append(cardElement);
      $(listGroupElement).append(buttonElement, collapseElement);
    });
    $("#affordance").append(listGroupElement);
  }
}

export default new LeftView();
