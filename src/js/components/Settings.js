import sound from "../../../assets/sound.mp3";

import $ from "jquery";
class Settings {
  get htmlElement() {
    return this.#htmlElement();
  }
  generateSettingsForm() {
    let defaultSettings = JSON.parse(localStorage.getItem("settings"));
    if (defaultSettings === null) {
      defaultSettings = {
        notificationSound: true,
        logs: "onlyNotifications",
        theme: "FAU_new",
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
        <label class="form-select-label" for="settings-logs">logs</label>
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
  </div>`;
  }
  appendSettingsForm() {
    $("#settingsForm").remove();
    $("#settings-form-container").append(this.generateSettingsForm());
  }
  saveSettings() {
    let settings = {
      notificationSound: $("#notificationSound").is(":checked"),
      logs: $("#settings-logs").val(),
    };
    localStorage.setItem("settings", JSON.stringify({ ...settings }));
    this.appendSettingsForm();
    this.applySettings();
  }
  applySettings() {
    let settings = JSON.parse(localStorage.getItem("settings"));
    let selectedElements =
      ".card-request, .card-response-invokeAction, .card-response-readProperty, .card-response-writeProperty";
    if (settings.logs === "onlyNotifications") {
      $(selectedElements).hide();
    } else {
      $(selectedElements).show();
    }
  }
  isNotificationSoundOn() {
    return JSON.parse(localStorage.getItem("settings")).notificationSound;
  }
  playSound() {
    this.isNotificationSoundOn() &&
      document.getElementById("notificationAudio").play();
  }
  #htmlElement() {
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
