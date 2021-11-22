"use strict";
import $ from "jquery";
import JSONFormatter from "json-formatter-js";
let observeIcon = `<i id="middleView--observeIcon" class="bi-bullseye"> </i>`;
let observeIconActive = `<i id="middleView--observeIcon" class="bi-bullseye middleView--observeIcon--active"> </i>`;
let refreshIcon = `<span id="middleView--refreshIcon"class="bi-arrow-clockwise"/>`;
let editIcon = '<i id="middleView--editIcon" class="bi-pencil-fill"> </i>';
let descriptionString = (id, description) =>
  `<div class="collapse" id="middleView-description-${id}"><div class="card card-body">${description}</div></div>`;
let infoIconElement = `<i class="bi-info-circle-fill"></i>`;
let collapseSpanElement = (id, content) =>
  `<span data-bs-toggle="collapse" href="#middleView-description-${id}" role="button" aria-expanded="false" aria-controls="middleView-description-${id}">
     ${content + " " + infoIconElement}
  </span>`;
let credentialFormElement = (securityType) =>
  `
    <form id="middleView--credentialForm" class="form-inline">
    <label for="middleView--credentialForm" class="sr-only">Security: ${securityType}</label>
     <div class="form-group">
      <label for="middleView--credentialForm--username" class="sr-only">Username</label>
      <input type="text" class="form-control" id="middleView--credentialForm--username" placeholder="Username">
     </div>
     <div class="form-group">
      <label for="middleView--credentialForm--password" class="sr-only">Password</label>
      <input type="password" class="form-control" id="middleView--credentialForm--password" placeholder="Password">
     </div>
     <button type="submit" class="btn">Submit</button>
    </form>
  `;
class MiddleView {
  #tc;
  #LV;
  #RV;
  #currentAction;
  #currentEvent;
  #currentProperty;
  #htmlElement = $.parseHTML(
    `
    <div id="middleViewContainer" class="">
        <div id="middleView-title" class="body-row-1">
        </div>
        <div id="middleView-content" class="body-row-2">
        </div>
    </div>
  `
  );
  get htmlElement() {
    this.#onSubmit();
    this.#onClick();
    return this.#htmlElement;
  }
  set ThingsController(tc) {
    this.#tc = tc;
  }
  set LeftView(LV) {
    this.#LV = LV;
  }
  set RightView(RV) {
    this.#RV = RV;
  }

  #onClick() {
    $(this.#htmlElement).on("click", (e) => {
      if ($(e.target).hasClass("actionFormSelectButton")) {
        $(e.target)
          .parent()
          .children(".actionFormSelectButton")
          .removeClass("actionFormSelectButton-active");
        $(e.target).addClass("actionFormSelectButton-active");

        return false;
      }
      let elementID = e.target.id;
      switch (elementID) {
        case "middleView--observeIcon":
          this.#tc.isPropertyObserved()
            ? this.#unobserveProperty()
            : this.#observeProperty();
          break;
        case "middleView--editIcon":
          $(".middleView-affordanceTitleContainer").nextAll().remove();
          this.#editProperty();
          break;
        case "middleView--refreshIcon":
          this.appendPropertyResponse(this.#currentProperty);
          break;
        case "middleView--backIcon":
          this.appendActionForm(this.#currentAction.actionName);
          break;
        case "middleView--subscribeEvent":
          this.#subscribeEvent();
          break;
        case "middleView--unsubscribeEvent":
          this.#unsubscribeEvent();
          break;
        default:
          break;
      }
    });
  }
  #onSubmit() {
    $(this.#htmlElement).on("submit", (e) => {
      e.preventDefault();
      let formID = e.target.id;
      switch (formID) {
        case "middleView-actionForm":
          this.#submitAction(e);
          this.#deleteForm();
          break;
        case "middleView-propertyForm":
          this.#submitProperty(e);
          this.#deleteForm();
          break;
        case "middleView--credentialForm":
          this.#submitCredential(e);
          this.#deleteForm();
          break;
        default:
          break;
      }
    });
  }
  #subscribeEvent() {
    let thingTitle = this.#tc.currentThingTitle;
    this.#tc.subscribeEvent(this.#currentEvent);
    $("#middleView--subscribeEvent").hide();
    $("#middleView--unsubscribeEvent").show();
  }
  #unsubscribeEvent() {
    this.#tc.unsubscribeEvent(this.#currentEvent);
    $("#middleView--unsubscribeEvent").hide();
    $("#middleView--subscribeEvent").show();
  }

  async #submitAction(e) {
    let payload = [this.#currentAction.actionName];
    let inputs = $("#middleView-actionForm").serializeArray();
    if (inputs.length > 1) {
      inputs = inputs
        .filter((input) => input.value.length !== 0)
        .map((input) => {
          if (
            this.#currentAction.types[input.name] === "integer" ||
            this.#currentAction.types[input.name] === "number"
          ) {
            return { name: input.name, value: Number(input.value) };
          } else if (this.#currentAction.types[input.name] === "boolean") {
            return { name: input.name, value: input.value === "true" };
          }
          return input;
        });
    } else {
      if (
        this.#currentAction.types[inputs[0].name] === "integer" ||
        this.#currentAction.types[inputs[0].name] === "number"
      ) {
        inputs = [{ name: undefined, value: Number(inputs[0].value) }];
      } else if (this.#currentAction.types.undefined === "boolean") {
        inputs = [{ name: undefined, value: inputs[0].value === "true" }];
      } else {
        inputs = [{ name: undefined, value: inputs[0].value }];
      }
    }
    let inputsObject = inputs.reduce((accumulator, current) => {
      accumulator[current.name] = current.value;
      return { ...accumulator };
    }, {});
    if (this.#currentAction.hasUriVariables) {
      payload.push(undefined, { uriVariables: { ...inputsObject } });
    } else if (
      Object.keys(inputsObject).length === 1 &&
      inputsObject.hasOwnProperty("undefined")
    ) {
      payload[1] = inputsObject.undefined;
    } else {
      payload.push(inputsObject);
    }

    let response = await this.#tc.invokeAction(payload);
    let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
    $(formatter).append(new JSONFormatter(response, 1).render());
    $("#middleView--backIcon").toggle();
    $("#middleView-content").append(formatter);
  }
  resetMiddleView() {
    $("#middleView-content").html("");
  }
  #submitCredential() {
    let password = $("#middleView--credentialForm--password").val();
    let username = $("#middleView--credentialForm--username").val();
    this.#tc.addCredential(username, password);
  }
  #generateActionForm(action, actionObj) {
    let formElement = $.parseHTML(`<form id="middleView-actionForm"></form>`);
    let inputsContainer = $.parseHTML(
      `<div class="middleView-inputsContainer"></div>`
    );
    if (typeof actionObj.uriVariables === "object") {
      let uriVariables = {
        ...actionObj.uriVariables,
      };
      Object.keys(uriVariables).forEach((val, indx) => {
        let uriVariable = uriVariables[val];
        let formFields = this.#generateFormFields(
          inputsContainer,
          uriVariable.type,
          val,
          uriVariable.description,
          uriVariable.enum,
          uriVariable.minimum,
          uriVariable.maximum,
          true
        );
        $(inputsContainer).append(formFields);
      });
    } else if (
      actionObj.hasOwnProperty("input") &&
      actionObj.input.hasOwnProperty("properties")
    ) {
      let propertiesObject = {
        ...actionObj.input.properties,
      };
      Object.keys(propertiesObject).forEach((val, indx) => {
        let propertyObject = propertiesObject[val];
        let formFields = this.#generateFormFields(
          inputsContainer,
          propertyObject.type,
          val,
          propertyObject.description,
          propertyObject.enum,
          propertyObject.minimum,
          propertyObject.maximum,
          actionObj.input.required.includes(val) ? true : false
        );
        $(inputsContainer).append(formFields);
      });
    } else if (
      (actionObj.hasOwnProperty("input") &&
        !actionObj.input.hasOwnProperty("properties")) ||
      !actionObj.hasOwnProperty("input")
    ) {
      let formField = this.#generateFormFields(
        inputsContainer,
        actionObj.hasOwnProperty("input")
          ? actionObj.input.type
          : actionObj.type,
        undefined,
        undefined,
        actionObj.hasOwnProperty("input")
          ? actionObj.input.enum
          : actionObj.enum,
        actionObj.hasOwnProperty("input")
          ? actionObj.input.minimum
          : actionObj.minimum,
        actionObj.hasOwnProperty("input")
          ? actionObj.input.maximum
          : actionObj.maximum,
        true
      );
      $(inputsContainer).append(formField);
    }
    $(formElement).append(
      inputsContainer,
      '<button type="submit" id="middleView-formSubmitButton" class="btn">Invoke</button'
    );
    return formElement;
  }
  #generateFormFields(
    formElement,
    type,
    title,
    description,
    enumArray,
    min,
    max,
    required
  ) {
    let div = $.parseHTML(
      `<div class="btn-group" role="group" aria-label="Basic radio toggle button group"></div>`
    );
    let select = $.parseHTML(
      `<select name="${title}" id="${
        "middleView-formField-" + title
      }-select" class="form-select" aria-label="elect" ${
        required ? "required" : ""
      }></select> `
    );
    if (typeof enumArray !== "undefined") {
      // if (enumArray.length < 5) {
      //   enumArray.forEach((val, idx) =>
      //     $(div).append(
      //       `<input type="radio" class="btn-check " name="${title}"  value="${val}"  id="${
      //         title + idx
      //       }" autocomplete="off" checked><label class="btn actionFormSelectButton" for="${
      //         title + idx
      //       }">${val}</label>`
      //     )
      //   );
      // } else {
      enumArray.forEach((val) =>
        $(select).append(`<option  value="${val}" >${val}</option>`)
      );
      // }

      $(formElement).append(
        `<div class=""> 
        ${title !== undefined ? collapseSpanElement(title, title) : ""}        
        ${title !== undefined ? descriptionString(title, description) : ""}`,
        select, // enumArray.length < 5 ? div : select,
        "</div>"
      );
    } else if (type === "string") {
      $(formElement).append(
        `<div>
          ${
            title !== undefined ? collapseSpanElement(title, title) : ""
          }        
          ${title !== undefined ? descriptionString(title, description) : ""}
          <input name="${title}" type="text" class="form-control" id="middleView-formField-${title}" ${
          required ? "required" : ""
        }></div>`
      );
    } else if (type === "integer") {
      $(formElement).append(
        $.parseHTML(
          `<div class="">${
            title !== undefined ? collapseSpanElement(title, title) : ""
          }   
            ${title !== undefined ? descriptionString(title, description) : ""}
            <input type="number" class="form-control" step="1"  id="middleView-formField-${title}" min="${
            min ? min : ""
          }" max="${max ? max : ""}" ${required ? "required" : ""}></div>`
        )
      );
    } else if (type === "number") {
      $(formElement).append(
        $.parseHTML(
          `<div class="">${
            title !== undefined ? collapseSpanElement(title, title) : ""
          }   
            ${title !== undefined ? descriptionString(title, description) : ""}
            <input type="number" step="any" class="form-control " id="middleView-formField-${title}" min="${
            min ? min : ""
          }" max="${max ? max : ""}" ${required ? "required" : ""}></div>`
        )
      );
    } else if (type === "boolean") {
      $(formElement).append(
        $.parseHTML(
          `<div class=""> <div class="form-check form-switch"> 
              ${title !== undefined ? collapseSpanElement(title, title) : ""}   
              ${
                title !== undefined ? descriptionString(title, description) : ""
              }
              <input name="${title}"  id="middleView-formField-${title}" class="form-check-input " value="true"  type="checkbox" checked>
            </div>`
        )
      );
    }
  }
  #deleteForm() {
    $("#middleView-content > form").remove("");
  }
  appendCredentialForm() {
    this.resetMiddleView();
    let securityType = this.#tc.securityType();
    $("#middleView-content").html(credentialFormElement(securityType));
  }

  appendActionForm(actionName) {
    this.resetMiddleView();
    let actionObj = this.#tc.getActionForm(actionName);
    let uriVariables = actionObj.uriVariables;
    let properties =
      actionObj.input !== undefined ? actionObj.input.properties : undefined;
    let types;
    if (uriVariables) {
      types = Object.keys(uriVariables).reduce((accumulator, key) => {
        return { ...accumulator, [key]: uriVariables[key].type };
      }, {});
    } else if (properties) {
      types = Object.keys(properties).reduce((accumulator, key) => {
        return { ...accumulator, [key]: properties[key].type };
      }, {});
    } else if (
      (actionObj.hasOwnProperty("input") &&
        actionObj.input.hasOwnProperty("type")) ||
      (!actionObj.hasOwnProperty("input") && actionObj.hasOwnProperty("type"))
    ) {
      types = {
        undefined: actionObj.hasOwnProperty("input")
          ? actionObj.input.type
          : actionObj.type,
      };
    } else {
      types = undefined;
    }
    this.#currentAction = {
      types,
      actionName,
      hasUriVariables: typeof uriVariables === "object" ? true : false,
    };
    let affordanceTitleContainer = $.parseHTML(
      `<div class="middleView-affordanceTitleContainer"></div>`
    );
    $(affordanceTitleContainer).append(
      $.parseHTML(
        collapseSpanElement(actionName, actionName) +
          descriptionString(actionName, actionObj.description)
      )
    );
    $("#middleView--backIcon").remove();
    let backIcon = `<span id="middleView--backIcon" class="bi-arrow-left-circle-fill" ></span>`;
    let actionForm = this.#generateActionForm(actionName, actionObj);
    $("#middleView-content").append(
      backIcon,
      affordanceTitleContainer,
      actionForm
    );
  }
  #observeProperty() {
    let thingTitle = this.#tc.currentThingTitle;
    this.#tc.observeProperty();
    $(`#middleView--observeIcon `).addClass("middleView--observeIcon--active");
    this.#LV.toggleObserveIcon(this.#tc.currentProperty[0]);
  }
  #unobserveProperty() {
    this.#tc.unobserveProperty();
    $(`#middleView--observeIcon`).removeClass(
      "middleView--observeIcon--active"
    );
    this.#LV.toggleObserveIcon(this.#tc.currentProperty[0]);
  }
  #editProperty() {
    let property = this.#tc.currentProperty[0];
    let properties = this.#tc.getPropertiesTD();
    let propertyType = properties[property].type;
    // integer // number // boolean //string
    let inputElement;
    if (propertyType === "integer") {
      inputElement = `<input type="number" name="integer" id="middleView-propertyForm-input" step="1" required/>`;
    } else if (propertyType === "number") {
      inputElement = `<input type="number"  name="number"  id="middleView-propertyForm-input" required/>`;
    } else if (propertyType === "boolean") {
      inputElement = `
      <div>
        <input  class="" type="radio" name="boolean" id="inlineRadio1" value="true">
        <label class="btn" for="inlineRadio1">True</label>
        <input class="" type="radio" name="boolean" id="inlineRadio2" value="false">
        <label class="btn" for="inlineRadio2">False</label>
      </div>
        `;

      // `
      // <div class=" btn-group " role="group" aria-label="Basic radio toggle button group">
      //   <div class="form-check">
      //     <input type="radio" class="btn-check " name="boolean"  value="true"       id="middleView-propertyForm-input-true" autocomplete="off"><label class="btn   actionFormSelectButton"  checked for="middleView-propertyForm-input-true">True</label>
      //   </div>
      //   <div class="form-check">
      //     <input type="radio"   class="btn-check " name="boolean"  value="false"    id="middleView-propertyForm-input-false"  autocomplete="off" ><label class="btn  actionFormSelectButton"    for="middleView-propertyForm-input-true">False</label>
      //   </div>
      // </div>`;
    } else if (propertyType === "string") {
      inputElement = `<input type="text"  name="string"  id="middleView-propertyForm-input" required/>`;
    } else {
      throw new Error("Property Type not supported");
    }
    let formElement = $.parseHTML("<form id='middleView-propertyForm'></form>");
    let submitButtonElement = `<button class="btn" type="submit">Update</button>`;
    $(formElement).append(inputElement, submitButtonElement);
    $("#middleView-content > .json-formatter-row").remove();
    $("#middleView-content").append(formElement);
  }
  async #submitProperty() {
    let input = $("#middleView-propertyForm").serializeArray()[0];
    let value;
    switch (input.name) {
      case "number":
        value = +input.value;
        break;
      case "integer":
        value = +input.value;
        break;
      case "boolean":
        value = input.value === "true";
        break;
      default:
        value = input.value;
        break;
    }
    let response = await this.#tc.writeProperty(value);
    let alertElement;
    let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
    if (response.status) {
      alertElement =
        $.parseHTML(`<div class="alert alert-success alert-dismissible fade show" role="alert"><strong>Property Updated</strong>
       </div>`);
      $(formatter).append(
        new JSONFormatter({ response: response.data }, 1).render()
      );
    } else {
      alertElement = $.parseHTML(
        `<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Failed to Update</strong> <div>${response.data}</div></div>`
      );
      $(formatter).append(
        new JSONFormatter({ response: response.data }, 1).render()
      );
    }
    $(alertElement).append(formatter);
    $("#middleView-content").append(formatter);
  }
  async appendPropertyResponse(property) {
    this.#currentProperty = property;
    this.resetMiddleView();
    let response = await this.#tc.readProperty(...property);
    let propertyDescription = this.#tc.getPropertyDescription(property[0]);
    let title =
      property.length === 2
        ? property.toString().replace(",", " : ")
        : property[0];
    let affordanceTitleContainer = $.parseHTML(
      `<div class="middleView-affordanceTitleContainer"></div>`
    );
    let collapseSpan = $.parseHTML(`<div></div>`);
    $(collapseSpan).append(
      collapseSpanElement(property[0], title),
      refreshIcon
    );
    this.#tc.isPropertyObservable(property[0]) &&
      $(collapseSpan).append(
        this.#tc.isPropertyObserved() ? observeIconActive : observeIcon
      );
    this.#tc.isPropertyReadOnly(property[0]) &&
      $(collapseSpan).append(editIcon);
    $(affordanceTitleContainer).append(
      collapseSpan,
      descriptionString(property[0], propertyDescription)
    );
    $("#middleView-content").append(affordanceTitleContainer);
    let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
    $(formatter).append(new JSONFormatter(response, 1).render());
    $("#middleView-content").append(formatter);
    // let actionForm = this.#generateActionForm(actionName, actionObj);
    // $("#middleView-content").append(formTitleElement, actionForm);

    //     thing
    //     .readProperty(property)
    //     .then((res) => {
    //       if (things[currentThing.id].key.hasKey) {
    //         login.showKey("green");
    //       }
    //       viewResponse(
    //         property,
    //         res,
    //         { updatable, thing, property },
    //         { observable, thing, property }
    //       );
    //     })
    //     .catch((err) => {
    //       if (err.toString().includes("Unauthorized")) {
    //         login.showKey("red");
    //       }
    //       console.log("error: " + err);
    //     });
    // });
  }
  appendEvent(event) {
    this.resetMiddleView();
    this.#currentEvent = event;
    let eventDescription = this.#tc.getEventDescription(event);
    let buttonsElement = `<button id="middleView--unsubscribeEvent" class="btn">Unsubscribe</button> <button id="middleView--subscribeEvent" class="btn">Subscribe</button>`;
    $("#middleView-content").append(
      collapseSpanElement(event, event),
      descriptionString(event, eventDescription),
      buttonsElement
    );
    !this.#tc.isEventSubscribed(event)
      ? $("#middleView--unsubscribeEvent").hide()
      : $("#middleView--subscribeEvent").hide();
  }
  addMiddleViewTitle(text) {
    $("#middleView-title").text(text);
  }
  clearMiddleViewContent() {
    $("#middleView-content").html("");
  }
}

export default new MiddleView();
