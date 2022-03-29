import $ from "jquery";
import JSONFormatter from "json-formatter-js";
export default class UriVariables {
  static htmlElement(uriVariables) {
    return this.#generateForm(uriVariables);
  }
  static #generateForm(uriVariables) {
    const form = $.parseHTML(
      `<form id="middleView-uriVariablesForm"><h1 class="p-b-3">UriVariables</h1></form>`
    );
    generateFields(uriVariables).forEach((field) => $(form).append(field));
    return form;
  }
  static values() {
    return $("#middleView-uriVariablesForm")
      .serializeArray()
      .reduce((acc, curr) => {
        return { ...acc, [curr.name]: curr.value };
      }, {});
  }
  static reportValidity() {
    return document.forms["middleView-uriVariablesForm"].reportValidity();
  }
}
const tooltip = (type, unit, min, max) => {
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
const generateFields = (uriVariables) => {
  let elements = [];
  Object.keys(uriVariables).forEach((uriVariable) => {
    const {
      unit,
      minimum,
      maximum,
      type: uriVariableType,
      enum: enumArray,
    } = uriVariables[uriVariable];
    elements.push(descriptionElement(uriVariable, uriVariables[uriVariable]));
    switch (uriVariableType) {
      case "integer":
        elements.push(
          $.parseHTML(integerInput(uriVariable, unit, minimum, maximum))
        );
        break;
      case "number":
        elements.push(
          $.parseHTML(numberInput(uriVariable, unit, minimum, maximum))
        );
        break;
      case "boolean":
        elements.push($.parseHTML(booleanInput(uriVariable, isRequired)));
        break;
      case "string":
        elements.push($.parseHTML(stringInput(uriVariable, enumArray)));
        break;
      default:
        break;
    }
  });
  return elements;
};

const booleanInput = (
  uriVariable
) => `<select class="form-select" required name="${uriVariable}"> 
  <option value="" selected>Select a Boolean Value </option>
  <option value="true">True</option>
  <option value="false">False</option>
  </select>`;
const integerInput = (uriVariable, unit, min, max) =>
  `<input type="number" placeholder="${tooltip(
    "Integer",
    unit,
    max,
    min
  )}" required name="${uriVariable}" id="middleView-uriVariables-${uriVariable}" step="1" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
    "Integer",
    unit,
    max,
    min
  )}"/>`;
const numberInput = (uriVariable, unit, min, max) =>
  `<input placeholder="${tooltip(
    "number",
    unit,
    max,
    min
  )}" type="number" required name="${uriVariable}"  id="middleView-uriVariables-${uriVariable}" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
    "number",
    unit,
    max,
    min
  )}"/>`;
const stringInput = (uriVariable, enumArray) => {
  if (typeof enumArray === "object" && enumArray.length > 0) {
    return `<select class="form-select" required name="${uriVariable}" > 
                <option value="" selected>Select from Enum</option>
                ${enumArray.reduce((acc, val) => {
                  return acc + `<option  value="${val}" >${val}</option>`;
                }, "")}
            </select>`;
  } else {
    return `<input type="text" placeholder="Enter a string without quotation marks"required name="${uriVariable}"  id="middleView-uriVariables-${uriVariable}" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip(
      "String"
    )}" /> `;
  }
};
const descriptionElement = (id, description) => {
  const element = $.parseHTML(
    `<div>
    <span data-bs-toggle="collapse" href="#middleView-uriVariables-description-${id}" role="button" aria-expanded="false" aria-controls="middleView-uriVariables-description-${id}">
    <i class="bi-info-circle-fill"></i> ${id} 
    </span>
    <div class="collapse" id="middleView-uriVariables-description-${id}">
        <div class="card card-body JsonFormatter"></div>
    </div>
   </div>`
  );
  const content = new JSONFormatter(description, 1).render();
  $(element).find(".card-body").append(content);
  return element;
};
