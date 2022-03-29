"use strict";
import $ from "jquery";
import JSONFormatter from "json-formatter-js";
import Settings from "./Settings";
class RightView {
  #tc;
  #logger;
  #htmlElement = $.parseHTML(
    `
    <div id="rightViewContainer" class="">
        <div id="" class="body-row-1">
        Logs
        </div>
        <div id="" class="body-row-2">
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
  set logger(logger) {
    this.#logger = logger;
  }
  appendLogsHistory() {
    this.#logger.getAllLogs;
  }
  #onClick() {
    $("#rightViewContainer").on("click", (e) => {
      switch (e.target.id) {
        case "logsFilter":
          break;
        default:
          break;
      }
    });
  }
  #onSubmit() {}
  appendRequestToView(title, request) {
    const formattedTime = this.#formatTime(request.date);
    let formattedData;
    if (request.data && request.uriVariables) {
      formattedData = new JSONFormatter({
        uriVariables: request.uriVariables,
        body: request.data,
      }).render();
    } else if (request.data || request.uriVariables) {
      formattedData =
        request.uriVariables === undefined
          ? new JSONFormatter({ body: request.data }).render()
          : new JSONFormatter({ uriVariables: request.uriVariables }).render();
    } else {
      formattedData = undefined;
    }
    const card = $.parseHTML(
      `<div class="card card-request text-center mb-3"> </div>`
    );
    const cardHeader = () => {
      let headerText = request.interactionAffordance;
      return $.parseHTML(
        `<div class="card-header ${
          formattedData ? "" : "card-header-pointer-none"
        }" ${
          formattedData === undefined ? "" : `data-bs-toggle="collapse"`
        } data-bs-target="#request-${
          request.date
        }"aria-expanded="false" aria-controls="request-${
          request.date
        }">${title} <span class="bi-caret-right-fill"/> <span class="badge bg-secondary">${
          request.type
        }</span> ${
          headerText ? `<span class="bi-caret-right-fill"/>` + headerText : ""
        }</div>`
      );
    };
    const cardBody = $.parseHTML(
      `<div class="card-body collapse multi-collapse" id="request-${request.date}"></div>`
    );
    $(cardBody).append(formattedData);
    const cardFooter = $.parseHTML(
      `<div class="card-footer ${
        formattedData ? "" : "card-header-pointer-none"
      }" ${
        formattedData === undefined ? "" : `data-bs-toggle="collapse"`
      } data-bs-target="#request-${
        request.date
      }" aria-expanded="false" aria-controls="request-${
        request.date
      }">${formattedTime}</div>`
    );
    $(card).append(cardHeader(), cardBody, cardFooter);
    $("#rightViewContainer > .body-row-2").prepend(card);
    Settings.applySettings();
  }
  appendResponseToView(title, response, request) {
    const formattedTime = this.#formatTime(response.date);
    const formattedData =
      response.data === undefined
        ? undefined
        : new JSONFormatter(response.data).render();
    const card = $.parseHTML(
      `<div class=" ${
        response.status ? "" : "card-response-failed"
      } card card-response ${"card-response-" + request.type} ${
        ["observeProperty", "subscribeEvent"].includes(response.type)
          ? "card-response-notification"
          : ""
      } text-center mb-3"></div>`
    );
    const cardHeader = () => {
      let headerText = request.interactionAffordance;
      return $.parseHTML(
        `<div class="card-header ${
          formattedData ? "" : "card-header-pointer-none"
        }" ${
          formattedData === undefined ? "" : `data-bs-toggle="collapse"`
        } data-bs-target="#response-${
          response.date
        }" aria-expanded="false" aria-controls="response-${response.date}">
        ${title} <span class="bi-caret-right-fill"/> <span class="badge bg-secondary">${
          request.type
        }</span>
          ${
            headerText ? `<span class="bi-caret-right-fill"/>` + headerText : ""
          }</div>`
      );
    };
    const cardBody = $.parseHTML(
      ` <div id="response-${response.date}"  class="card-body collapse multi-collapse"></div>`
    );
    $(cardBody).append(formattedData);
    const cardFooter = $.parseHTML(
      `<div class="card-footer ${
        formattedData ? "" : "card-header-pointer-none"
      }" ${
        formattedData === undefined ? "" : `data-bs-toggle="collapse"`
      } data-bs-target="#response-${
        response.date
      }" aria-expanded="false" aria-controls="response-${
        response.date
      }">${formattedTime}</div>`
    );
    $(card).append(cardHeader(), cardBody, cardFooter);
    $("#rightViewContainer > .body-row-2").prepend(card);
    this.#scrollToBottom(response.date);
    Settings.applySettings();
    ["subscribeEvent", "observeProperty"].includes(request.type) &&
      Settings.playSound();
  }
  // appendEventNotifications(thingTitle, eventName, data) {
  //   const time = new Date();
  //   const formatter = new JSONFormatter(data);
  //   const card = `<div class="card text-center mb-3">
  //   <div class="card-header">
  //     ${thingTitle}: ${"Event " + eventName}
  //   </div>
  //   <div class="card-body">
  //     ${$(formatter.render()).html()}
  //   </div>
  //   <div class="card-footer text-muted">
  //    ${time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds()}
  //   </div>
  // </div>`;
  //   $("#rightViewContainer > .body-row-2").append(card);
  // }
  appendPropertyNotifications(thingTitle, propertyName, data) {
    const time = new Date();
    const formatter = new JSONFormatter(data);
    const card = `<div class="card text-center mb-3">
    <div class="card-header">
      ${thingTitle}: ${"Property " + propertyName}
    </div>
    <div class="card-body">
      ${$(formatter.render()).html()}
    </div>
    <div class="card-footer text-muted">
     ${time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds()}
    </div>
  </div>`;
    $("#rightViewContainer > .body-row-2").append(card);
  }
  #formatTime(unix_timestamp) {
    const date = new Date(+unix_timestamp).toString().split(" ");
    return `
      ${date[2]} / ${date[1]} / ${date[3]} - ${date[4]}`;
  }
  #scrollToBottom(id) {
    $(".body-row-2").animate({ scrollTop: $("#" + id).scrollTop() }, 1000);
  }
}

export default new RightView();
