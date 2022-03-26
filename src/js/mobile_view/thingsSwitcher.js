"use strict";
import $ from "jquery";
let isContainerEmpty = true;
let start = () => {
  document.addEventListener("fileConsumed", () => {
    if (isContainerEmpty) {
      $("#thingsAvatarContainer").append(
        `<button id="thingsButton" class="btn bi-list" data-bs-toggle="modal" data-bs-target="#thingsSwitcherModal"></button>
        <div class="modal fade"  data-bs-keyboard="false" id="thingsSwitcherModal" tabindex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="thingsSwitcherModalLabel">All Consumed Things</h5>
              </div>
              <div id="thingsSwitcherModal-body" class="modal-body">
              </div>
              </div>
            </div>
          </div>
        </div>`
      );
    }
    $("#thingsAvatarContainer > .thingAvatar").hide();
    let currentThingElement = $(".currentThingAvatar");
    currentThingElement.show();
    currentThingElement.on("click.switcher", () => {
      $("#controllerMetadata").trigger("click");
    });
    let clonedElement = $(".currentThingAvatar").clone();
    clonedElement.attr("id", "switcher--" + clonedElement.attr("id"));
    clonedElement.removeClass("currentThingAvatar");
    clonedElement.attr("data-bs-dismiss", "modal");
    clonedElement.on("click.switcher", () => {
      currentThingElement.trigger("click");
      $(" #thingsAvatarContainer >.thingAvatar").hide();
      currentThingElement.show();
      $("#controllerMetadata").trigger("click");
    });
    $("#thingsSwitcherModal-body").append(clonedElement);
    isContainerEmpty = false;
  });
};
const restart = () => {
  $("#thingsButton,#thingsSwitcherModal").show();
  $("#thingsAvatarContainer > .thingAvatar").not(".currentThingAvatar").hide();
};
const reset = () => {
  $("#thingsAvatarContainer > .thingAvatar").show();
  $("#thingsButton").hide();
};

export default {
  start,
  reset,
  restart,
};
