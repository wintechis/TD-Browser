import sound from "../../../assets/sound.mp3";

import $ from "jquery";
class Settings {
  get htmlElement() {
    return this.#htmlElement();
  }
  get getArraySeparator() {
    return JSON.parse(localStorage.getItem("settings")).arraySeparator;
  }
  generateSettingsForm() {
    let defaultSettings = JSON.parse(localStorage.getItem("settings"));
    if (defaultSettings === null) {
      defaultSettings = {
        notificationSound: true,
        logs: "onlyNotifications",
        theme: "default",
        arraySeparator: ",",
      };
      localStorage.setItem("settings", JSON.stringify(defaultSettings));
    }
    return `
      <form id="settingsForm">
      <div>
        <label class="form-check-label" for="notificationSound">Notification Sound</label> 
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" role="switch" id="notificationSound" ${
            defaultSettings.notificationSound ? "checked" : ""
          }>
          </div>
          </div>
        <label class="form-select-label" for="settings-Logs">logs</label>
        <select id="settings-logs" class="form-select" aria-label="">
          <option 
            ${defaultSettings.logs === "onlyNotifications" ? "selected" : ""} 
            value="onlyNotifications">Only Notifications
          </option>
          <option 
          ${
            defaultSettings.logs === "all" ? "selected" : ""
          }  value="all">All</option>
        </select>
        <label class="form-select-label" for="settings-theme">Theme</label>
        <select id="settings-theme" class="form-select" aria-label="">
          <option 
            ${defaultSettings.theme === "default" ? "selected" : ""} 
            value="default">Light
          </option>
          <option 
          ${
            defaultSettings.theme === "dark" ? "selected" : ""
          }  value="dark">Dark</option>
        </select>
  </div>`;
    /*   <label class="form-text-label" for="settings-arraySeparator">Array Separator</label>
  <input type="text" id="settings-arraySeparator" value="${
    defaultSettings.arraySeparator
  }" class=""/> */
  }
  appendSettingsForm() {
    $("#settingsForm").remove();
    $("#settings-form-container").append(this.generateSettingsForm());
  }
  saveSettings() {
    const settings = {
      notificationSound: $("#notificationSound").is(":checked"),
      logs: $("#settings-logs").val(),
      theme: $("#settings-theme").val(),
      arraySeparator: $("#settings-arraySeparator").val(),
    };
    localStorage.setItem("settings", JSON.stringify({ ...settings }));
    this.appendSettingsForm();
    this.applySettings();
  }
  applySettings() {
    let defaultSettings = {
      notificationSound: true,
      logs: "onlyNotifications",
      theme: "default",
    };
    let settings =
      JSON.parse(localStorage.getItem("settings")) || defaultSettings;
    let selectedElements =
      ".card-request, .card-response-invokeAction, .card-response-readProperty, .card-response-writeProperty, .card-response-readAllProperties, .card-response-readMultipleProperties, .card-response-writeAllProperties, .card-response-writeMultipleProperties";
    if (settings.logs === "onlyNotifications") {
      $(selectedElements).hide();
    } else {
      $(selectedElements).show();
    }
    document
      .getElementsByTagName("body")[0]
      .setAttribute("data-theme", settings.theme);
    // $("body")[0].attr("data-theme", "dark");
  }
  isNotificationSoundOn() {
    return JSON.parse(localStorage.getItem("settings")).notificationSound;
  }
  playSound() {
    this.isNotificationSoundOn() &&
      document.getElementById("notificationAudio").play();
  }
  #htmlElement() {
    this.applySettings();
    return `
    <div id="settingsIcon" class="bi-gear" data-bs-toggle="modal" data-bs-target="#settingsModal" ></div>
    <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" id="settingsModal" tabindex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="settingsModalLabel">Settings</h5>
        </div>
        <div class="modal-body">
        <audio id="notificationAudio" >
        <source src="${sound}"></source>
      </audio>
        <div id="settings-form-container" class="row  align-items-center">
        ${this.generateSettingsForm()}
        </div>
        <div class="modal-footer">
          <button type="button" id="settings-form-close" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" id="settings-form-save" class="btn btn-primary" data-bs-dismiss="modal">Save</button>
        </div>
      </div>
    </div>
  </div>`;
  }
}

export default new Settings();
