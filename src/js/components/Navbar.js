"use strict";
import $ from "jquery";
import helpers, { isURL } from "../helpers";
import axios from "axios";
import Settings from "./Settings";
const spinnerElement = `<span class="spinner-border  spinner-border-sm" id="consumingSpinner" > </span>`;
let alertElement = (text, type, id) => {
  return `
  <div id="${id}" class="alert alert-${type} position-fixed top-0 start-0 p-3 w-100" style="z-index: 11" role="alert">${text}</div>`;
};
const fileConsumed = new Event("fileConsumed");
class Navbar {
  #LV;
  #tc;
  #MV;
  #htmlElement = $.parseHTML(
    `<div id="navbar" class="">
            <form id="consumingForm" class="">
              <input class=" " type="url" name="thingURL" id="thingURL" placeholder="URL" ia-label="Search">
              <input class=""type="file" name="thingFile" accept=".json,.jsonld" id="fileInput">
              <button class="btn" id="fileInputTrigger" style="display:none" type="button">Upload</button> 
              <button class="btn" type="submit" id="consumeButton" >Consume</button>
            </form>
            <div id="thingsAvatarContainer" class="d-inline "></div>
            ${Settings.htmlElement}
    </div>`
  );
  get htmlElement() {
    this.#onClick();
    this.#onUploadingFile();
    return this.#htmlElement;
  }
  set ThingsController(tc) {
    this.#tc = tc;
  }
  set MiddleView(MV) {
    this.#MV = MV;
  }
  set LeftView(LV) {
    this.#LV = LV;
  }
  #onClick() {
    $(this.#htmlElement).on("click", (e) => {
      let key = e.target.className.includes("thingAvatar")
        ? "thingAvatar"
        : e.target.id;

      switch (key) {
        case "fileInputTrigger":
          this.#triggerFileBrowser();
          break;
        case "consumeButton":
          e.preventDefault();
          $("#thingURL").val().length
            ? this.#onSubmit()
            : $("#fileInput").trigger("click");
          break;
        case "thingAvatar":
          !e.target.id.includes("switcher--") &&
            this.#changeCurrentThing(e.target.id);
          break;
        case "settings-form-save":
          Settings.saveSettings();
          break;
        case "settings-form-close":
          Settings.appendSettingsForm();
          break;
        default:
          break;
      }
    });
  }
  #onUploadingFile() {
    $(this.#htmlElement)
      .find("#fileInput")
      .on("change", () => {
        let file = $("#fileInput").prop("files");
        try {
          if (file[0].size === 0) {
            throw "The selected file is empty!";
          } else {
            this.#onSubmit();
          }
        } catch (error) {
          $("#consumingForm").trigger("reset");
          alert(error);
        }
      });
  }
  #triggerFileBrowser() {
    $("#thingURL").attr("type", "text");
    $("#fileInput").trigger("click");
  }
  async #onSubmit() {
    let files = $("#fileInput").prop("files");
    let url = $("#thingURL").val();
    let key = false;
    $("#consumeButton").html(spinnerElement);
    if (files.length > 0) {
      let td = await helpers.fileToJSON(files[0]);
      await this.#tc.consume(td);
      key = !key;
      $("#thingURL").attr("type", "url");
    } else {
      try {
        url = !url.toLocaleLowerCase().includes("http")
          ? new URL("http://" + url)
          : new URL(url);
        await axios.get(url).then(async (response) => {
          let td = response.data;
          await this.#tc.consume(td);
          key = !key;
        });
      } catch (error) {
        let alertId = "alert-" + Date.now();
        $("body").append(alertElement(error, "danger", alertId)).show("slow");
        setTimeout(() => {
          $("#" + alertId).remove();
        }, 2000);
      }
    }
    $("#consumeButton").html("Consume");
    if (key) {
      let avatarElement = this.#thingAvatarGenerator(
        this.#tc.currentThingTitle,
        this.#tc.currentThingID
      );
      this.#appendThingAvatar(avatarElement);
      $("#logoDiv").hide();
      $("#bodyDiv").show();
      this.#LV.appendMetadata();
      this.#LV.highlightButton("affordanceMetadata");
      this.#MV.clearMiddleViewContent();
      this.#MV.addMiddleViewTitle(this.#tc.currentThingTitle);
      document.dispatchEvent(fileConsumed);
      let alertId = "alert-" + Date.now();
      $("body")
        .append(
          alertElement(
            `Successfully Consumed ${this.#tc.currentThingTitle}`,
            "success",
            alertId
          )
        )
        .show("slow");
      setTimeout(() => {
        $("#" + alertId).remove();
      }, 2000);
    }

    $("#consumingForm").trigger("reset");
  }
  #thingAvatarGenerator(title, id) {
    title = title.split(" ");
    let avatarText = "";
    if (title.length > 1) {
      avatarText = (title[0][0] + title[1][0]).toUpperCase();
    } else if (title.length === 1) {
      avatarText = (title[0][0] + title[0][1]).toUpperCase();
    }
    return $.parseHTML(
      `<div id="thingAvatar--${id}"  class="thingAvatar currentThingAvatar"> ${avatarText} </div>`
    );
  }
  #appendThingAvatar(avatarElement) {
    $(`.thingAvatar`).removeClass("currentThingAvatar");
    $("#thingsAvatarContainer").prepend(avatarElement);
  }
  #changeCurrentThing(id) {
    $(`.thingAvatar`).removeClass("currentThingAvatar");
    document.getElementById(id).classList.add("currentThingAvatar");
    $(`#${id}`).addClass("currentThingAvatar");
    let currentID = id.split("--")[1];
    this.#tc.setCurrentThingByID(currentID);
    this.#LV.appendMetadata();
    this.#LV.highlightButton("affordanceMetadata");
    this.#MV.addMiddleViewTitle(this.#tc.currentThingTitle);
    this.#MV.clearMiddleViewContent();
  }
  showSettings() {}
  hideSettings() {}
}

export default new Navbar();
