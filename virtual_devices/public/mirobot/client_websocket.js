const socket = io("/client/mirobot");
socket.on("status", (payload) => {
  console.log(payload);
  payload.holding_box &&
    document
      .getElementById(payload.current_box)
      .classList.add("pick_without_duration");
});
socket.on("pick_box", (box) => {
  document.getElementsByClassName("pick_without_duration").length &&
    document
      .getElementsByClassName("pick_without_duration")[0]
      .classList.remove("pick_without_duration");
  document.getElementById(box).classList.add("pick");
});
socket.on("drop_box", () => {
  document.getElementsByClassName("pick_without_duration").length &&
    document
      .getElementsByClassName("pick_without_duration")[0]
      .classList.remove("pick_without_duration");
  document.getElementsByClassName("pick")[0].classList.remove("pick");
});
