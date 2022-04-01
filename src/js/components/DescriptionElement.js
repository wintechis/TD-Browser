import $ from "jquery";
import JSONFormatter from "json-formatter-js";
const DescriptionElement = (id, title, description) => {
  const element = $.parseHTML(
    `
      <span data-bs-toggle="collapse" href="#${id}" role="button" aria-expanded="false" aria-controls="${id}">
      <i class="bi-info-circle-fill"></i> ${title} 
      </span>
      <div class="collapse" id="${id}">
          <div class="card card-body JsonFormatter"></div>
      </div>
    `
  );
  const content = new JSONFormatter(description, 1).render();
  $(element).find(".card-body").append(content);
  return element;
};

export default DescriptionElement;
