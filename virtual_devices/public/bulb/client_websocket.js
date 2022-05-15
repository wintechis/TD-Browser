const socket = io("/client/bulb");
const spanElement = document.getElementById("bulb-span");
const root = document.documentElement;
const switchElement = document.getElementById("switch");
let bulb = { status: false };
socket.on("status", (status, color, power) => {
  bulb.status = status === "on";
  bulb.status ? power && controller.bulb.on() : controller.bulb.off();
  root.style.setProperty(
    "--color",
    `rgb(${color.red},${color.green},${color.blue})`
  );
});

socket.on("initialPower", (power, status) => {
  if (power) {
    controller.switch.on();
    status === "on" && controller.bulb.on();
  } else {
    controller.switch.off();
    controller.bulb.off();
  }

  switchElement.addEventListener("click", () => {
    controller.switch.toggle();
    if (switchElement.classList.contains("on")) {
      bulb.status && controller.bulb.on();
    } else {
      controller.bulb.off();
    }
    socket.emit("updatePower");
  });

  socket.on("updatePower", (power) => {
    if (power) {
      controller.switch.on();
      if (bulb.status) {
        controller.bulb.on();
      }
    } else {
      controller.switch.off();
      controller.bulb.off();
    }
  });
});
const controller = {
  bulb: {
    on: () => {
      spanElement.classList.add("on");
      spanElement.classList.remove("off");
    },
    off: () => {
      spanElement.classList.add("off");
      spanElement.classList.remove("on");
    },
    toggle: function () {
      spanElement.classList.contains("on") ? this.off() : this.on();
    },
  },
  switch: {
    on: () => {
      switchElement.classList.add("on");
    },
    off: () => {
      switchElement.classList.remove("on");
    },
    toggle: function () {
      switchElement.classList.contains("on") ? this.off() : this.on();
    },
  },
};
