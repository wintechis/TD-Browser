"use strict";
import $ from "jquery";
import JSONFormatter from "json-formatter-js";
import UriVariables from "./UriVariables";
import DescriptionElement from "./DescriptionElement";
let observeIcon = `<i id="middleView--observeIcon" class="bi-eye-fill"> </i>`;
let observeIconActive = `<i id="middleView--observeIcon" class="bi-eye-fill middleView--observeIcon--active"> </i>`;
let refreshIcon = `<span id="middleView--refreshIcon"class="bi-arrow-clockwise"/>`;
let editIcon = '<i id="middleView--editIcon" class="bi-pencil-fill"> </i>';
let descriptionString = (id, description) => {
  const element = $.parseHTML(
    `
      <div class="collapse" id="middleView-description-${id}">
          <div class="card card-body JsonFormatter"></div>
      </div>
    `
  );
  const content = new JSONFormatter(description, 1).render();
  $(element).find(".card-body").append(content);
  return element;
};
let infoIconElement = `<i class="bi-info-circle-fill"></i>`;
let collapseSpanElement = (id, content) =>
  `<span data-bs-toggle="collapse" href="#middleView-description-${id}" role="button" aria-expanded="false" aria-controls="middleView-description-${id}">
     ${infoIconElement + " " + content}
  </span>`;
let exclamationIcon = () => `<i class="bi-exclamation-diamond-fill"></i>`;
const arrayValidator = () => {
  $("textarea").on("keyup", (event) => {
    try {
      let value = $(event.target).val();
      if (
        value.length === 0 ||
        (typeof JSON.parse(value) === "object" &&
          typeof value.length === "number")
      ) {
        $(event.target).parent().children("div").hide();
      } else {
        throw new Error("Invalid Type");
      }
    } catch (error) {
      $(event.target)
        .parent()
        .children(".textareaType-invalid")
        .show()
        .attr(
          "title",
          error.toString() === "Invalid Type"
            ? "Invalid Type"
            : "Invalid Syntax"
        );
    }
  });
};
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
  #currentRequestTime;
  #htmlElement = $.parseHTML(
    `
    <div id="middleViewContainer" >
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
          this.#tc.isPropertyObserved(this.#currentProperty)
            ? this.#unobserveProperty()
            : this.#observeProperty();
          break;
        case "middleView--editIcon":
          this.#currentRequestTime = undefined;
          $(".middleView-affordanceTitleContainer").nextAll().remove();
          this.#appendUpdatePropertyForm(
            [this.#currentProperty],
            "writeproperty"
          );
          break;
        case "middleView--refreshIcon":
          this.appendProperty(this.#currentProperty);
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
      let uriVariables;
      if (
        $("#middleView-uriVariablesForm").length &&
        !UriVariables.reportValidity()
      )
        return false;
      else if ($("#middleView-uriVariablesForm").length) {
        uriVariables = UriVariables.values();
      }
      let formID = e.target.id;
      switch (formID) {
        case "middleView-actionForm":
          this.#submitAction(e, uriVariables);
          this.#deleteForm();
          break;
        case "middleView-propertyForm":
          this.#submitProperty(e, uriVariables);
          this.#deleteForm();
          break;
        case "middleView-uriVariablesPropertyForm":
          this.#handelUriVariablesPropertyForm(e, uriVariables);
          this.#deleteForm();
          break;
        case "middleView--credentialForm":
          this.#submitCredential(e, uriVariables);
          this.#deleteForm();
          break;
        case "middleView-readMultiplePropertiesForm":
          this.#handleReadMultiplePropertiesForm();
          this.#deleteForm();
          break;
        default:
          break;
      }
    });
  }
  async #subscribeEvent() {
    const thingTitle = this.#tc.currentThingTitle;
    $("#middleView-content > .alert-danger").remove();
    $("#middleView--subscribeEvent").hide();
    $("#middleView--unsubscribeEvent").show();
    const requestTime = Date.now();
    this.#currentRequestTime = requestTime;
    const response = await this.#tc.subscribeEvent(this.#currentEvent);
    try {
      if (
        response.status === false &&
        this.#currentRequestTime === requestTime
      ) {
        $("#middleView--subscribeEvent").show();
        $("#middleView--unsubscribeEvent").hide();
        const alertElement = $.parseHTML(
          `<div class="alert alert-danger  fade show" role="alert"><strong>Failed to Subscribe</strong> <div>${response.data}</div></div>`
        );
        $("#middleView-content").append(alertElement);
      }
    } catch (error) {}
  }
  #unsubscribeEvent() {
    this.#tc.unsubscribeEvent(this.#currentEvent);
    $("#middleView-content > .alert-danger").remove();
    $("#middleView--unsubscribeEvent").hide();
    $("#middleView--subscribeEvent").show();
  }

  async #submitAction(e, uriVariables) {
    const action = this.#currentAction.actionName;
    let payload;
    let inputs = $("#middleView-actionForm").serializeArray();
    if (inputs.length > 1) {
      payload = inputs
        .filter((input) => input.value.length !== 0)
        .reduce((accumulator, input) => {
          let inputType = this.#currentAction.types[input.name];
          let value = input.value;
          if (inputType === "integer" || inputType === "number") {
            value = Number(value);
          } else if (inputType === "boolean") {
            value = value === "true";
          } else if (inputType === "array") {
            value = JSON.parse(value);
          }
          return { ...accumulator, [input.name]: value };
        }, {});
    } else if (inputs.length === 0) {
      payload = undefined;
    } else {
      let inputType = this.#currentAction.types[inputs[0].name];
      if (inputType === "integer" || inputType === "number") {
        payload = Number(inputs[0].value);
      } else if (inputType === "array") {
        payload = JSON.parse(inputs[0].value);
      } else if (this.#currentAction.types.undefined === "boolean") {
        payload = inputs[0].value === "true";
      } else {
        payload = inputs[0].value;
      }
    }
    let RequestTime = Date.now();
    this.#currentRequestTime = RequestTime;
    let response = await this.#tc.invokeAction(action, payload, uriVariables);
    if (this.#currentRequestTime === RequestTime) {
      let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
      $(formatter).append(new JSONFormatter(response, 1).render());
      $("#middleView--backIcon").toggle();
      $("#middleView-content").append(formatter);
    }
  }
  resetMiddleView() {
    this.#currentRequestTime = undefined;
    $("#middleView-content *").off();
    $("#middleView-content").html("");
  }
  #submitCredential() {
    let password = $("#middleView--credentialForm--password").val();
    let username = $("#middleView--credentialForm--username").val();
    this.#tc.addCredential(username, password);
  }
  #generateActionForm(actionObj) {
    let formElement = $.parseHTML(`<form id="middleView-actionForm"></form>`);
    let inputsContainer = $.parseHTML(
      `<div class="middleView-inputsContainer"></div>`
    );
    if (
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
          propertyObject,
          propertyObject.enum,
          propertyObject.minimum,
          propertyObject.maximum,
          actionObj.input.required && actionObj.input.required.includes(val)
            ? true
            : false,
          propertyObject.unit
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
        true,
        actionObj.hasOwnProperty("input")
          ? actionObj.input.unit
          : actionObj.unit
      );
      $(inputsContainer).append(formField);
    }
    $(formElement).append(
      inputsContainer,
      '<button type="submit" id="middleView-formSubmitButton" class="btn btn-submit">Invoke</button'
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
    required,
    unit
  ) {
    const select = $.parseHTML(
      `<select name="${title}" id="${
        "middleView-formField-" + title
      }-select" class="form-select" aria-label="elect" ${
        required ? "required" : ""
      }></select> `
    );
    const fieldContainer = $.parseHTML("<div></div>");
    title !== undefined &&
      $(fieldContainer).append(DescriptionElement(title, title, description));
    let placeholder;
    if (unit && typeof max === "number" && typeof min === "number") {
      placeholder = ` ${min} ${unit} to ${max} ${unit}`;
    } else if (
      (unit && typeof max === "number") ||
      (unit && typeof min === "number")
    ) {
      placeholder =
        typeof max === "number" ? `Max: ${max} ${unit}` : `Min: ${min} ${unit}`;
    } else if (unit) {
      placeholder = "Uint: " + unit;
    } else if (typeof max === "number" && typeof min === "number") {
      placeholder = ` ${min} to ${max}`;
    } else if (typeof max === "number" || typeof min === "number") {
      typeof max === "number" ? `Max: ${max}` : `Min: ${min}`;
    } else {
      placeholder = undefined;
    }
    if (typeof enumArray !== "undefined") {
      $(select).append(`<option value="" selected>Select a String </option>`);
      enumArray.forEach((val) =>
        $(select).append(`<option  value="${val}" >${val}</option>`)
      );
      $(fieldContainer).append(select);
    } else if (type === "string") {
      $(fieldContainer).append(
        `<input name="${title}" type="text" class="form-control" id="middleView-formField-${title}" 
        ${required ? "required" : ""}>`
      );
    } else if (type === "integer") {
      $(fieldContainer).append(
        $.parseHTML(
          `<input type="number" class="form-control" step="1"  id="middleView-formField-${title}" min=" 
          ${min ? min : ""}" max="${max ? max : ""}"
          ${required ? "required" : ""}
           placeholder="${placeholder ? placeholder : ""}">`
        )
      );
    } else if (type === "number") {
      $(fieldContainer).append(
        $.parseHTML(
          `<input type="number" step="any" class="form-control " id="middleView-formField-${title}" min="${
            min ? min : ""
          }" max="${max ? max : ""}" ${
            required ? "required" : ""
          } placeholder="${placeholder ? placeholder : ""}">`
        )
      );
    } else if (type === "boolean") {
      $(fieldContainer).append(
        $.parseHTML(
          `<input name="${title}"  id="middleView-formField-${title}" class="form-check-input " value="true"  type="checkbox" checked>`
        )
      );
    } else if (type === "array") {
      $(fieldContainer).addClass("array-textarea-container");
      $(fieldContainer).append(
        $.parseHTML(
          `<div class="textareaType-invalid" data-toggle="tooltip" data-placement="top" style="display:none;">${exclamationIcon()}</div><textarea id="middleView-formField-${title}"  name="${title}" class="textarea-type-array" placeholder="Enter an array. Example:\n[ 1 , true , &quot;text&quot; ]" ${
            required ? "required" : ""
          } data-bs-toggle="tooltip" data-bs-placement="top" title="Enter a value of type array!"></textarea>`
        )
      );
    }
    $(formElement).append(fieldContainer);
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
    let properties =
      actionObj.input !== undefined ? actionObj.input.properties : undefined;
    let types;
    const uriVariablesForm = actionObj.hasOwnProperty("uriVariables")
      ? UriVariables.htmlElement(actionObj.uriVariables)
      : [];
    if (properties) {
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
    };
    let affordanceTitleContainer = $.parseHTML(
      `<div class="middleView-affordanceTitleContainer"></div>`
    );
    $(affordanceTitleContainer).append(
      DescriptionElement("title--" + actionName, actionName, actionObj)
    );
    $("#middleView--backIcon").remove();
    let backIcon = `<span id="middleView--backIcon" class="bi-arrow-left-circle-fill" ></span>`;
    let actionForm = this.#generateActionForm(actionObj);
    $("#middleView-content").append(
      backIcon,
      affordanceTitleContainer,
      uriVariablesForm,
      actionForm
    );
    arrayValidator();
  }
  async #observeProperty() {
    const property = this.#currentProperty;
    $(`#middleView--observeIcon `).addClass("middleView--observeIcon--active");
    this.#LV.toggleObserveIcon();
    const requestTime = Date.now();
    this.#currentRequestTime = requestTime;
    const response = await this.#tc.observeProperty(property);
    if (response.status === false && this.#currentRequestTime === requestTime) {
      $(`#middleView--observeIcon`).removeClass(
        "middleView--observeIcon--active"
      );
      this.#LV.toggleObserveIcon(property);
      const alertElement = $.parseHTML(
        `<div class="alert alert-danger  fade show" role="alert"><strong>Failed to Observe</strong><div>${response.data}</div></div>`
      );
      $("#middleView-content").append(alertElement);
    }
  }
  #unobserveProperty() {
    this.#tc.unobserveProperty(this.#currentProperty);
    $(`#middleView--observeIcon`).removeClass(
      "middleView--observeIcon--active"
    );
    this.#LV.toggleObserveIcon(property);
  }
  #appendUpdatePropertyForm(properties, formType) {
    let isRequired =
      formType === "writeallproperties" || formType === "writeproperty"
        ? true
        : false;
    let inputElements = "";
    let propertiesTD = this.#tc.getPropertiesTD();
    let tooltip = (type, unit, min, max) => {
      let article = type === "number" ? "a" : "an";
      if (unit && typeof max === "number" && typeof min === "number") {
        return `Enter ${article} ${type} between ${min} & ${max} (${unit})`;
      } else if (
        (unit && typeof max === "number") ||
        (unit && typeof min === "number")
      ) {
        return typeof max === "number"
          ? `${article} ${type} & max: ${max} (${unit})`
          : `${article} ${type} & max: ${min} (${unit})`;
      } else if (unit) {
        return `Enter ${article} ${type} (${unit})`;
      } else if (typeof max === "number" && typeof min === "number") {
        return ` ${min} to ${max}`;
      } else if (typeof max === "number" || typeof min === "number") {
        typeof max === "number"
          ? `Enter ${article} ${type} & max: ${max}`
          : `Enter ${article} ${type} & max: ${min}`;
      } else {
        return `Enter a value of type ${type}`;
      }
    };
    let integerInput = (property, indx, isRequired, unit, min, max) =>
      `<label><span>${
        property.includes("nestedProperty") ? property.split("--")[2] : property
      }</span><input type="number" class="form-control" placeholder="${tooltip(
        "Integer",
        unit,
        max,
        min
      )}" ${
        isRequired ? "required" : ""
      } name="${property}--integer" id="middleView-propertyForm-input-${indx}" min="${min}" max="${max}" step="1" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
        "Integer",
        unit,
        max,
        min
      )}"/></label>`;
    let numberInput = (property, indx, isRequired, unit, min, max) =>
      `<label><span>${
        property.includes("nestedProperty") ? property.split("--")[2] : property
      }</span> <input class="form-control" placeholder="${tooltip(
        "number",
        unit,
        max,
        min
      )}" type="number" ${
        isRequired ? "required" : ""
      } name="${property}--number"  min="${min}" max="${max}" id="middleView-propertyForm-input-${indx}" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
        "number",
        unit,
        max,
        min
      )}"/></label>`;
    let stringInput = (property, indx, isRequired, enumArray) => {
      if (typeof enumArray === "object" && enumArray.length > 0) {
        return ` <label><span>${
          property.includes("nestedProperty")
            ? property.split("--")[2]
            : property
        }</span><select class="form-select" ${
          isRequired ? "required" : ""
        } name="${property}--string" > 
      <option value="" selected>Select a String </option>
      ${enumArray.reduce(
        (acc, val) => acc + `<option  value="${val}" >${val}</option>`,
        ""
      )}
      </select></label>`;
      } else {
        return `<label><span>${
          property.includes("nestedProperty")
            ? property.split("--")[2]
            : property
        }</span> <input class="form-control" type="text" placeholder="Enter a string without quotation marks" ${
          isRequired ? "required" : ""
        } name="${property}--string"  id="middleView-propertyForm-input-${indx}" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
          "String"
        )}" /> </label>`;
      }
    };
    let arrayInput = (property, indx, isRequired) =>
      `<label><span>${
        property.includes("nestedProperty") ? property.split("--")[2] : property
      }</span> <div class="textareaType-invalid" data-toggle="tooltip" data-placement="top" style="display:none;">${exclamationIcon()}</div> <textarea
      class="textarea-type-array" placeholder="Enter an array. Example:\n[ 1 , true , &quot;text&quot; ]"  ${
        isRequired ? "required" : ""
      } name="${property}--array"  id="middleView-propertyForm-input-${indx}"data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
        "Array"
      )}"></textarea> </label>`;
    let booleanInput = (property, indx, isRequired) => ` <label><span>${
      property.includes("nestedProperty") ? property.split("--")[2] : property
    }</span><select class="form-select" ${
      isRequired ? "required" : ""
    } name="${property}--boolean" > 
    <option value="" selected>Select a Boolean Value </option>
    <option value="true">True</option>
    <option value="false">False</option>
    </select></label>`;
    const propertiesOfTypeObject = [];
    properties.forEach((property, indx) => {
      const {
        unit,
        minimum: min,
        maximum: max,
        type: propertyType,
        enum: enumArray,
      } = propertiesTD[property];
      switch (propertyType) {
        case "integer":
          inputElements += integerInput(
            property,
            indx,
            isRequired,
            unit,
            min,
            max
          );
          break;
        case "number":
          inputElements += numberInput(
            property,
            indx,
            isRequired,
            unit,
            min,
            max
          );
          break;
        case "boolean":
          inputElements += booleanInput(property, indx, isRequired);
          break;
        case "string":
          inputElements += stringInput(property, indx, isRequired, enumArray);
          break;
        case "array":
          inputElements += arrayInput(property, indx, isRequired);
          break;
        case "object":
          propertiesOfTypeObject.push(property);
          break;
        default:
          break;
      }
    });
    propertiesOfTypeObject.forEach((property) => {
      let nestedInputElements = `<div class="nestedInputsContainer"  id="middleView-propertyForm-nestedInputsContainer-${property}"> <div class="header header-active">${property}</div>`;
      Object.keys(propertiesTD[property]["properties"]).forEach(
        (nestedProperty, indx) => {
          const {
            unit,
            minimum: min,
            maximum: max,
            type: propertyType,
          } = propertiesTD[property]["properties"][nestedProperty];
          if (formType === "writeproperty") {
            const required = propertiesTD[property]["properties"]["required"];

            isRequired =
              typeof required === "object" &&
              required.length &&
              required.includes(nestedProperty)
                ? true
                : false;
          }
          switch (propertyType) {
            case "integer":
              nestedInputElements += integerInput(
                "nestedProperty--" + property + "--" + nestedProperty,
                "nestedProperty--" + indx,
                isRequired,
                unit,
                min,
                max
              );
              break;
            case "number":
              nestedInputElements += numberInput(
                "nestedProperty--" + property + "--" + nestedProperty,
                "nested-property-" + indx,
                isRequired,
                unit,
                min,
                max
              );
              break;
            case "boolean":
              nestedInputElements += booleanInput(
                "nestedProperty--" + property + "--" + nestedProperty,
                "nested-property-" + indx,
                isRequired
              );
              break;
            case "string":
              nestedInputElements += stringInput(
                "nestedProperty--" + property + "--" + nestedProperty,
                "nested-property-" + indx,
                isRequired
              );
              break;
            case "array":
              nestedInputElements += arrayInput(
                "nestedProperty--" + property + "--" + nestedProperty,
                "nested-property-" + indx,
                isRequired
              );

            default:
              break;
          }
        }
      );
      nestedInputElements += ` </div>`;
      inputElements += nestedInputElements;
    });
    let formElement = $.parseHTML(`<form id="middleView-propertyForm"></form>`);
    let inputsContainer = $.parseHTML(
      `<div class="middleView-inputsContainer"></div>`
    );
    let submitButtonElement = `<button class="btn btn-submit" type="submit">Update</button>`;
    $(inputsContainer).append(inputElements);
    $(formElement).append(inputsContainer, submitButtonElement);

    $("#middleView-content > .json-formatter-row").remove();
    formType === "writeproperty" &&
      this.#tc.hasUriVariables("properties", this.#currentProperty) &&
      this.#appendUriVariablesPropertyForm(this.#currentProperty, true);
    $("#middleView-content").append(formElement);
    arrayValidator();
    if (formType === "writemultipleproperties") {
      let labelElements = $(
        `.middleView-inputsContainer > label,.middleView-inputsContainer > div > label`
      );
      labelElements.prepend(
        `<input class="form-check-input" name="" type="checkbox" value="false">`
      );
      let fieldElements = labelElements
        .children()
        .filter("input:not(':checkbox'),textarea,select");
      $(fieldElements).prop("disabled", true).trigger("change");
      $(fieldElements)
        .not("input:text")
        .prop("required", true)
        .trigger("change");
      $(fieldElements).hide();
      let objectContainers = $(`.middleView-inputsContainer > div`);
      objectContainers.children("label").hide();
      $(".form-check-input").on("change", (e) => {
        let fieldElement = $(e.target)
          .nextUntil()
          .filter(function () {
            return ["input", "select", "textarea"].includes(
              this.tagName.toLowerCase()
            )
              ? true
              : false;
          });
        if (e.target.value === "true") {
          $(fieldElement).prop("disabled", true).trigger("change");
          $(fieldElement).fadeOut("400");
          $(e.target).attr("value", "false");
        } else {
          $(fieldElement).prop("disabled", false).trigger("change");
          $(fieldElement).fadeIn("400");
          $(e.target).attr("value", "true");
        }
      });
      $(`.middleView-inputsContainer > div > .header `)
        .removeClass("header-active")
        .on("click", (e) => {
          let labelElements = $(e.target).nextUntil();
          let fieldElements = labelElements.children(
            "input:not(':checkbox'),textarea,select"
          );
          if (e.target.value === "false") {
            $(e.target).removeClass("header-active");
            $(e.target).parent().removeClass("nestedInputsContainer-active");
            $(labelElements).fadeOut("300");
            $(fieldElements).prop("disabled", false).trigger("change");
            $(e.target).val("true");
          } else {
            $(e.target).addClass("header-active");
            $(e.target).parent().addClass("nestedInputsContainer-active");
            $(labelElements).fadeIn("300");
            $(fieldElements).prop("disabled", true).trigger("change");
            $(e.target).val("false");
          }
        });
    }
  }
  async #submitProperty(e, uriVariables) {
    let inputs = $("#middleView-propertyForm").serializeArray();
    inputs = inputs.reduce((acc, input) => {
      let type;
      let key;
      let upperKey;
      if (input.name.includes("nestedProperty")) {
        type = input.name.split("--")[3];
        key = input.name.split("--")[2];
        upperKey = input.name.split("--")[1];
      } else {
        type = input.name.split("--")[1];
        key = input.name.split("--")[0];
      }
      let value;
      if (type !== "string" && input.value.length === 0) return { ...acc };
      switch (type) {
        case "number":
          value = +input.value;
          break;
        case "integer":
          value = Math.floor(+input.value);
          break;
        case "number":
          value = +input.value;
          break;
        case "boolean":
          value = input.value === "true";
          break;
        case "array":
          value = JSON.parse(input.value);
          break;
        case "string":
          value = input.value;
          break;
      }
      if (input.name.includes("nestedProperty")) {
        if (value.length !== 0 || type === "string") {
          if (acc.hasOwnProperty(upperKey)) acc[upperKey][key] = value;
          else {
            acc[upperKey] = {};
            acc[upperKey][key] = value;
          }
        }
        return { ...acc };
      } else {
        return { ...acc, [key]: value };
      }
    }, {});
    let response;
    let RequestTime = Date.now();
    this.#currentRequestTime = RequestTime;
    switch (this.#currentProperty) {
      case "writeallproperties":
        response = await this.#tc.writeAllProperties(inputs);
        break;
      case "writemultipleproperties":
        response = await this.#tc.writeMultipleProperties(inputs);
        break;
      default:
        response = await this.#tc.writeProperty(
          this.#currentProperty,
          inputs[this.#currentProperty],
          uriVariables
        );
        break;
    }
    if (this.#currentRequestTime !== RequestTime) return undefined;
    let alertElement;
    let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
    if (response.status) {
      alertElement =
        $.parseHTML(`<div class="alert alert-success  fade show" role="alert"><strong>${response.data}</strong>
       </div>`);
      // $(formatter).append(
      //   new JSONFormatter({ response: response.data }, 1).render()
      // );
    } else {
      alertElement = $.parseHTML(
        `<div class="alert alert-danger  fade show" role="alert"><strong>Failed to Update</strong> <div>${response.data}</div></div>`
      );
      // $(formatter).append(
      //   new JSONFormatter({ response: response.data }, 1).render()
      // );
    }
    // $(alertElement).append(formatter);
    $("#middleView-content").append(alertElement);
  }
  async #handleReadMultiplePropertiesForm() {
    let properties = $("#middleView-readMultiplePropertiesForm")
      .serializeArray()
      .map((input) => {
        return input.name;
      });
    let RequestTime = Date.now();
    this.#currentRequestTime = RequestTime;
    let response = await this.#tc.readMultipleProperties(properties);
    if (this.#currentRequestTime === RequestTime) {
      let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
      $(formatter).append(new JSONFormatter(response, 1).render());
      $("#middleView-content").append(formatter);
    }
  }
  async appendProperty(property) {
    this.#currentProperty = property;
    this.resetMiddleView();
    let isTopLevelForm = [
      "readallproperties",
      "readmultipleproperties",
      "writeallproperties",
      "writemultipleproperties",
    ].includes(property);
    let propertyDescription = isTopLevelForm
      ? this.#tc.getTopLevelFormTD(property)
      : this.#tc.getPropertyTD(property);
    let title = property;
    let affordanceTitleContainer = $.parseHTML(
      `<div class="middleView-affordanceTitleContainer"></div>`
    );
    let collapseSpan = $.parseHTML(`<div></div>`);
    $(collapseSpan).append(collapseSpanElement(property, title));
    !isTopLevelForm &&
      this.#tc.isPropertyObservable(property) &&
      $(collapseSpan).append(
        this.#tc.isPropertyObserved(property) ? observeIconActive : observeIcon
      );
    if (property === "readallproperties") {
      $(collapseSpan).append(
        refreshIcon,
        descriptionString(property, propertyDescription)
      );
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      let RequestTime = Date.now();
      this.#currentRequestTime = RequestTime;
      let response = await this.#tc.readAllProperties();
      if (this.#currentRequestTime === RequestTime) {
        let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
        $(formatter).append(new JSONFormatter(response, 1).render());
        $("#middleView-content").append(formatter);
      }
    } else if (property === "readmultipleproperties") {
      $(collapseSpan).append(descriptionString(property, propertyDescription));
      $(affordanceTitleContainer).append(collapseSpan);
      let readableProperties = this.#tc.getReadableProperties();
      let formElement = `<form id="middleView-readMultiplePropertiesForm" class="form-check"><div class="middleView-inputsContainer"> <label class="form-check-label selectAll-label"><input class="form-check-input selectAll-input" type="checkbox" > <span>Select All</span></label> ${readableProperties.reduce(
        (acc, curr) => {
          return (
            acc +
            `<label class="form-check-label" >${curr} <input class="form-check-input" name="${curr}" type="checkbox" value=""></label>`
          );
        },
        ""
      )}</div><button class="btn btn-submit " type="submit">Read</button></form>`;
      $("#middleView-content").append(affordanceTitleContainer, formElement);
      let selectAllElement = $("#middleView-readMultiplePropertiesForm ").find(
        ".selectAll-input"
      );
      let selectAllSpan = $(selectAllElement).next();
      $(selectAllElement).attr("value", "false");
      $(selectAllSpan).on("click", function (e) {
        if ($(selectAllElement).attr("value") === "true") {
          $(".form-check-input").prop("checked", false).trigger("change");
          $(selectAllElement).attr("value", "false");
          $(selectAllSpan).text("Select All").removeClass("active");
        } else {
          $(".form-check-input").prop("checked", true).trigger("change");
          $(selectAllElement).attr("value", "true");
          $(selectAllSpan).text("Deselect All").addClass("active");
        }
      });
    } else if (property === "writeallproperties") {
      $(collapseSpan).append(descriptionString(property, propertyDescription));
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      let writableProperties = this.#tc.getWritableProperties();
      this.#appendUpdatePropertyForm(writableProperties, "writeallproperties");
    } else if (property === "writemultipleproperties") {
      $(collapseSpan).append(descriptionString(property, propertyDescription));
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      let writableProperties = this.#tc.getWritableProperties();
      this.#appendUpdatePropertyForm(
        writableProperties,
        "writemultipleproperties"
      );
    } else if (
      this.#tc.isPropertyWritable(property) &&
      this.#tc.isPropertyReadable(property)
    ) {
      $(collapseSpan).append(refreshIcon);
      $(collapseSpan).append(editIcon);
      $(collapseSpan).append(descriptionString(property, propertyDescription));
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      if (this.#tc.hasUriVariables("properties", property)) {
        this.#appendUriVariablesPropertyForm(property);
      } else {
        let RequestTime = Date.now();
        this.#currentRequestTime = RequestTime;
        let response = await this.#tc.readProperty(property);
        if (this.#currentRequestTime === RequestTime) {
          let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
          $(formatter).append(new JSONFormatter(response, 1).render());
          $("#middleView-content").append(formatter);
        }
      }
    } else if (this.#tc.isPropertyWritable(property)) {
      $(collapseSpan).append(editIcon);
      $(collapseSpan).append(descriptionString(property, propertyDescription));
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      this.#appendUpdatePropertyForm([property], "writeproperty");
    } else if (this.#tc.isPropertyReadable(property)) {
      $(collapseSpan).append(refreshIcon);
      $(collapseSpan).append(descriptionString(property, propertyDescription));
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      if (this.#tc.hasUriVariables("properties", property)) {
        this.#appendUriVariablesPropertyForm(property);
      } else {
        let RequestTime = Date.now();
        let response = await this.#tc.readProperty(property);
        this.#currentRequestTime = RequestTime;
        if (this.#currentRequestTime === RequestTime) {
          let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
          $(formatter).append(new JSONFormatter(response, 1).render());
          $("#middleView-content").append(formatter);
        }
      }
    }
  }
  #appendUriVariablesPropertyForm(
    property = this.#currentProperty,
    isForUpdate = false
  ) {
    const uriVariables = this.#tc.getUriVariables("properties", property);
    const uriVariablesForm = UriVariables.htmlElement(uriVariables);
    if (isForUpdate) {
      $("#middleView-content").append(uriVariablesForm);
    } else {
      const submitButtonElement = `<button class="btn btn-submit" type="submit">Read</button>`;
      const formElement = $.parseHTML(
        `<form id="middleView-uriVariablesPropertyForm"></form>`
      );
      $(formElement).append(submitButtonElement);
      $("#middleView-content").append(uriVariablesForm, formElement);
    }
  }
  async #handelUriVariablesPropertyForm(e, uriVariables) {
    const property = this.#currentProperty;
    let RequestTime = Date.now();
    this.#currentRequestTime = RequestTime;
    let response = await this.#tc.readProperty(property, uriVariables);
    if (this.#currentRequestTime === RequestTime) {
      let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
      $(formatter).append(new JSONFormatter(response, 1).render());
      $("#middleView-content").append(formatter);
    }
  }
  appendEvent(event) {
    this.resetMiddleView();
    this.#currentEvent = event;
    let eventDescription = this.#tc.getEventTD(event);
    let buttonsElement = `<button id="middleView--unsubscribeEvent" class="btn">Unsubscribe</button> <button id="middleView--subscribeEvent" class="btn">Subscribe</button>`;
    $("#middleView-content").append(
      DescriptionElement(event, event, eventDescription),
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
    this.#currentRequestTime = undefined;
    $("#middleView-content").html("");
  }
}

export default new MiddleView();
