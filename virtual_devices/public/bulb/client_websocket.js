let socket = io("/client/bulb");
let spanElement = document.getElementsByTagName("span")[0];
socket.on("status", (status) => {
  console.log(status === "on");
  status === "on"
    ? spanElement.classList.add("on")
    : spanElement.classList.remove("on");
});
