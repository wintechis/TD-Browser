let socket = io("/client/bulb");
let spanElement = document.getElementsByTagName("span")[0];
socket.on("status", (status) => {
  status === "on"
    ? spanElement.classList.add("on")
    : spanElement.classList.remove("on");
});
