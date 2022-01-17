"use strict";
import $ from "jquery";
import JSONFormatter from "json-formatter-js";
let observeIcon = `<i id="middleView--observeIcon" class="bi-eye-fill"> </i>`;
let observeIconActive = `<i id="middleView--observeIcon" class="bi-eye-fill middleView--observeIcon--active"> </i>`;
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
  #currentRequestTime;
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
          this.#currentRequestTime = undefined;
          $(".middleView-affordanceTitleContainer").nextAll().remove();
          this.#appendUpdatePropertyForm([this.#currentProperty[0]], true);
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
        case "middleView-readMultiplePropertiesForm":
          this.#handleReadMultiplePropertiesForm();
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
    } else if (inputs.length === 0) {
      inputs = [{}];
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
    let RequestTime = Date.now();
    this.#currentRequestTime = RequestTime;
    let response = await this.#tc.invokeAction(payload);
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
          true,
          uriVariable.unit
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
    let select = $.parseHTML(
      `<select name="${title}" id="${
        "middleView-formField-" + title
      }-select" class="form-select" aria-label="elect" ${
        required ? "required" : ""
      }></select> `
    );
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
      enumArray.forEach((val) =>
        $(select).append(`<option  value="${val}" >${val}</option>`)
      );
      $(formElement).append(
        `<div class=""> 
        ${title !== undefined ? collapseSpanElement(title, title) : ""}        
        ${title !== undefined ? descriptionString(title, description) : ""}`,
        select,
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
          }" max="${max ? max : ""}" ${
            required ? "required" : ""
          } placeholder="${placeholder ? placeholder : ""}"></div>`
        )
      );
    } else if (type === "number") {
      $(formElement).append(
        $.parseHTML(
          `<div class="">${
            title !== undefined ? collapseSpanElement(title, title) : ""
          }   
            ${
              title !== undefined && description !== undefined
                ? descriptionString(title, description)
                : ""
            }
            <input type="number" step="any" class="form-control " id="middleView-formField-${title}" min="${
            min ? min : ""
          }" max="${max ? max : ""}" ${
            required ? "required" : ""
          } placeholder="${placeholder ? placeholder : ""}"></div>`
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
  #appendUpdatePropertyForm(properties, isRequired) {
    let inputElements = "";
    let propertiesTD = this.#tc.getPropertiesTD();
    let tooltip = (type, unit, min, max) => {
      if (unit && typeof max === "number" && typeof min === "number") {
        return `Enter a value of type ${type} between ${min} ${unit} and ${max} ${unit}`;
      } else if (
        (unit && typeof max === "number") ||
        (unit && typeof max === "number") ||
        (unit && typeof min === "number")
      ) {
        return typeof max === "number"
          ? `Enter a value of type ${type} and the max value is ${max} ${unit}`
          : `Enter a value of type ${type} and the min value is ${min} ${unit}`;
      } else if (unit) {
        return `Enter a value of type ${type} and the unit is ${unit}`;
      } else if (typeof max === "number" && typeof min === "number") {
        return ` ${min} to ${max}`;
      } else if (typeof max === "number" || typeof min === "number") {
        typeof max === "number"
          ? `Enter a value of type ${type} and the max value is ${max}`
          : `Enter a value of type ${type} and the min value is ${min}`;
      } else {
        return `Enter a value of type ${type}`;
      }
    };
    let integerInput = (property, indx, isRequired, unit, min, max) =>
      `<label>${
        property.includes("nestedProperty") ? property.split("--")[2] : property
      } <input type="number" ${
        isRequired ? "required" : ""
      } name="${property}--integer" id="middleView-propertyForm-input-${indx}" step="1" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
        "Integer",
        unit,
        max,
        min
      )}"/></label>`;
    let numberInput = (property, indx, isRequired, unit, min, max) =>
      `<label>${
        property.includes("nestedProperty") ? property.split("--")[2] : property
      } <input type="number" ${
        isRequired ? "required" : ""
      } name="${property}--number"  id="middleView-propertyForm-input-${indx}" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
        "Number",
        unit,
        max,
        min
      )}"/></label>`;
    let stringInput = (property, indx, isRequired, enumArray) => {
      if (typeof enumArray === "object" && enumArray.length > 0) {
        return ` <label>${
          property.includes("nestedProperty")
            ? property.split("--")[2]
            : property
        }<select class="form-select" ${
          isRequired ? "required" : ""
        } name="${property}--string" > 
      <option value="" selected>Select a String </option>
      ${enumArray.reduce(
        (acc, val) => acc + `<option  value="${val}" >${val}</option>`,
        ""
      )}
      </select></label>`;
      } else {
        return `<label>${
          property.includes("nestedProperty")
            ? property.split("--")[2]
            : property
        } <input type="text" ${
          isRequired ? "required" : ""
        } name="${property}--string"  id="middleView-propertyForm-input-${indx}" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
          "String"
        )}" /> </label>`;
      }
    };
    let arrayInput = (property, indx, isRequired) =>
      `<label>${
        property.includes("nestedProperty") ? property.split("--")[2] : property
      } <div class="textareaType-invalid" data-toggle="tooltip" data-placement="top" style="display:none;"></div> <textarea
      class="textarea-type-array" ${
        isRequired ? "required" : ""
      } name="${property}--array"  id="middleView-propertyForm-input-${indx}"data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
        "Array"
      )}"></textarea> </label>`;
    let booleanInput = (property, indx, isRequired) => ` <label>${
      property.includes("nestedProperty") ? property.split("--")[2] : property
    }<select class="form-select" ${
      isRequired ? "required" : ""
    } name="${property}--boolean" > 
    <option value="" selected>Select a Boolean Value </option>
    <option value="true">True</option>
    <option value="false">False</option>
    </select></label>`;
    let propertiesOfTypeObject = [];
    properties.forEach((property, indx) => {
      let {
        unit,
        min,
        max,
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
      let nestedInputElements = `<div class="nestedInputsContainer"  id="middleView-propertyForm-nestedInputsContainer-${property}"> <div class="header ">${property}</div>`;
      Object.keys(propertiesTD[property]["properties"]).forEach(
        (nestedProperty, indx) => {
          let {
            unit,
            min,
            max,
            type: propertyType,
          } = propertiesTD[property]["properties"][nestedProperty];
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
    $("#middleView-content").append(formElement);
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
            .children("div")
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
    arrayValidator();
  }
  async #submitProperty() {
    console.log((inputs = $("#middleView-propertyForm").serializeArray()));
    let inputs = $("#middleView-propertyForm")
      .serializeArray()
      .reduce((acc, input) => {
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
        if (input.value.length === 0) return { ...acc };
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
        }
        if (input.name.includes("nestedProperty")) {
          if (value.length !== 0) {
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
    switch (this.#currentProperty[0]) {
      case "writeallproperties":
        response = await this.#tc.writeAllProperties(inputs);
        break;
      case "writemultipleproperties":
        response = await this.#tc.writeMultipleProperties(inputs);
        break;
      default:
        response = await this.#tc.writeProperty(
          inputs[this.#currentProperty[0]]
        );
        break;
    }
    if (this.#currentRequestTime !== RequestTime) return undefined;

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
    ].includes(property[0]);
    let propertyDescription = isTopLevelForm
      ? undefined
      : this.#tc.getPropertyDescription(property[0]);
    let title =
      property.length === 2
        ? property.toString().replace(",", " : ")
        : property[0];
    let affordanceTitleContainer = $.parseHTML(
      `<div class="middleView-affordanceTitleContainer"></div>`
    );
    let collapseSpan = $.parseHTML(`<div></div>`);
    $(collapseSpan).append(collapseSpanElement(property[0], title));
    !isTopLevelForm &&
      this.#tc.isPropertyObservable(property[0]) &&
      $(collapseSpan).append(
        this.#tc.isPropertyObserved() ? observeIconActive : observeIcon
      );
    if (property[0] === "readallproperties") {
      $(collapseSpan).append(refreshIcon);
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
    } else if (property[0] === "readmultipleproperties") {
      $(affordanceTitleContainer).append(collapseSpan);
      let readableProperties = this.#tc.getReadableProperties();
      let formElement = `<form id="middleView-readMultiplePropertiesForm" class="form-check"><div class="middleView-inputsContainer">${readableProperties.reduce(
        (acc, curr) => {
          return (
            acc +
            `<label class="form-check-label" >${curr} <input class="form-check-input" name="${curr}" type="checkbox" value=""></label>`
          );
        },
        ""
      )}</div><button class="btn btn-submit " type="submit">Read</button></form>`;
      $("#middleView-content").append(affordanceTitleContainer, formElement);
    } else if (property[0] === "writeallproperties") {
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      let writableProperties = this.#tc.getWritableProperties();
      this.#appendUpdatePropertyForm(writableProperties, true);
    } else if (property[0] === "writemultipleproperties") {
      $(affordanceTitleContainer).append(collapseSpan);
      $("#middleView-content").append(affordanceTitleContainer);
      let writableProperties = this.#tc.getWritableProperties();
      this.#appendUpdatePropertyForm(writableProperties, false);
    } else if (
      this.#tc.isPropertyWritable(property[0]) &&
      this.#tc.isPropertyReadable(property[0])
    ) {
      $(collapseSpan).append(refreshIcon);
      $(collapseSpan).append(editIcon);
      $(affordanceTitleContainer).append(
        collapseSpan,
        descriptionString(property[0], propertyDescription)
      );
      $("#middleView-content").append(affordanceTitleContainer);
      let RequestTime = Date.now();
      this.#currentRequestTime = RequestTime;
      let response = await this.#tc.readProperty(...property);
      if (this.#currentRequestTime === RequestTime) {
        let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
        $(formatter).append(new JSONFormatter(response, 1).render());
        $("#middleView-content").append(formatter);
      }
    } else if (this.#tc.isPropertyWritable(property[0])) {
      $(collapseSpan).append(editIcon);
      $(affordanceTitleContainer).append(
        collapseSpan,
        descriptionString(property[0], propertyDescription)
      );
      $("#middleView-content").append(affordanceTitleContainer);
      this.#appendUpdatePropertyForm([property[0]], true);
    } else if (this.#tc.isPropertyReadable(property[0])) {
      $(collapseSpan).append(refreshIcon);
      $(affordanceTitleContainer).append(
        collapseSpan,
        descriptionString(property[0], propertyDescription)
      );
      $("#middleView-content").append(affordanceTitleContainer);
      let RequestTime = Date.now();
      let response = await this.#tc.readProperty(...property);
      this.#currentRequestTime = RequestTime;
      if (this.#currentRequestTime === RequestTime) {
        let formatter = $.parseHTML(`<div class="JsonFormatter"></div>`);
        $(formatter).append(new JSONFormatter(response, 1).render());
        $("#middleView-content").append(formatter);
      }
    }
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
    this.#currentRequestTime = undefined;
    $("#middleView-content").html("");
  }
}

export default new MiddleView();
