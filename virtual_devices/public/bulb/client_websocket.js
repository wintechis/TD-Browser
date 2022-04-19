let socket = io("/client/bulb");
let spanElement = document.getElementsByTagName("span")[0];
let root = document.documentElement;
socket.on("status", (status, color) => {
  status === "on"
    ? spanElement.classList.add("on")
    : spanElement.classList.remove("on");
  root.style.setProperty(
    "--color",
    `rgb(${color.red},${color.green},${color.blue})`
  );
});
