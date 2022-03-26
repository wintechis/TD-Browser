import App from "./app";
import $ from "jquery";
const appMounted = new Event("appMounted");
const app = async () => {
  $("#app").append(await App());
};
// Load app

app().then(() => {
  document.dispatchEvent(appMounted);
});
