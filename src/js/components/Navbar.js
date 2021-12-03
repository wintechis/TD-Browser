"use strict";
import $ from "jquery";
import helpers, { isURL } from "../helpers";
import axios from "axios";
import Settings from "./Settings";
const spinnerElement = `<span class="spinner-border  spinner-border-sm" id="consumingSpinner" > </span>`;
class Navbar {
  #LV;
  #tc;
  #MV;
  #htmlElement = $.parseHTML(
    `<div id="navbar" class="">
            <form id="consumingForm" class="p-2 d-inline-block">
              <input class=" p-2 " type="url" name="thingURL" id="thingURL" placeholder="URL" ia-label="Search">
              <input class=" p-2 "type="file" name="thingFile" id="fileInput">
              <button class="btn" id="fileInputTrigger" type="button">Upload</button> 
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
          this.#onSubmit();
          break;
        case "thingAvatar":
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
          if (
            file[0].type !== "application/json" &&
            file[0].type !== "application/ld+json" &&
            file[0].name.split(".")[1] !== "jsonld"
          ) {
            throw "Select only a file of type JSON!";
          } else if (file[0].size === 0) {
            throw "The selected file is empty!";
          } else {
            $("#thingURL").val(file[0].name);
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
    // let previousThingID = this.#tc.hasCurrentThing()
    //   ? this.#tc.currentThingID
    //   : undefined;
    if (files.length > 0) {
      let td = await helpers.fileToJSON(files[0]);
      await this.#tc.consume(td);
      key = !key;
      $("#thingURL").attr("type", "url");
    } else if (isURL(url)) {
      await axios
        .get(url)
        .then(async (response) => {
          let td = response.data;
          await this.#tc.consume(td);
          key = !key;
        })
        .catch((e) => {
          console.log(e);
        });
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
