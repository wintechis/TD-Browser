import App from "./app";
import $ from "jquery";

const app = async () => {
  $("#app").append(await App());
};
// Load app
app();
