"use strict";
import "@node-wot/browser-bundle";
import axios from "axios";
const newEvent = new Event("newEvent");
class ThingsController {
  #things = {};
  #currentProperty = [];
  #currentThing = null;
  #observedProperties = {};
  #subscribedEvents = {};
  #logger;
  set logger(logger) {
    this.#logger = logger;
  }
  get currentProperty() {
    return this.#currentProperty;
  }
  get currentThingID() {
    return this.#currentThing.id;
  }
  get currentThingTitle() {
    return this.#currentThing.title;
  }
  hasCurrentThing() {
    if (this.#currentThing === null) {
      return false;
    }
    return true;
  }
  hasSecurity() {
    let security = this.#currentThing.security;
    if (typeof security === "object" && security.length > 0) {
      return security[0] === "nosec_sc" ? false : true;
    } else if (typeof security === "string") {
      return security === "nosec_sc" ? false : true;
    } else {
      return false;
    }
  }
  hasUriVariables(affordance, interactionAffordance) {
    const td = this.#getTD();
    return td[affordance][interactionAffordance].hasOwnProperty("uriVariables");
  }
  getUriVariables(affordance, interactionAffordance) {
    const td = this.#getTD();
    return td[affordance][interactionAffordance].uriVariables;
  }
  addCredential(username, password) {
    this.#currentThing.getServient().addCredentials({
      [this.#currentThing.id]: {
        username,
        password,
      },
    });
  }
  securityType() {
    let security = this.#currentThing.security;
    if (typeof security === "object" && security.length > 0) {
      return security[0];
    } else if (typeof security === "string") {
      return security;
    } else {
      return undefined;
    }
  }

  async consume(td) {
    if (!td.hasOwnProperty("id") || td.id.length === 0) {
      td.id = Date.now().toString();
    }
    if (!td.hasOwnProperty("title") || td.title.length === 0) {
      td.title = Date.now().toString();
    }
    let servient = new Wot.Core.Servient();
    servient.addClientFactory(new Wot.Http.HttpsClientFactory(null));
    servient.addClientFactory(new Wot.Http.HttpClientFactory(null));
    await servient.start().then((thingFactory) => {
      thingFactory.consume(td).then((thing) => {
        this.#things[thing.id] = thing;
        this.#currentThing = thing;
        this.#observedProperties[thing.id] = [];
        this.#subscribedEvents[thing.id] = [];
        this.#logger.initiate(thing.id, td);
        console.clear();
      });
    });
  }
  getActionForm(action) {
    if (!this.hasCurrentThing) return null;
    let td = this.#getTD();
    return td.actions[action];
  }
  getActions() {
    if (!this.hasCurrentThing) return null;
    let td = this.#getTD();
    return Object.keys(td.actions);
  }
  getEvents() {
    if (!this.hasCurrentThing) return null;
    let td = this.#getTD();
    return Object.keys(td.events);
  }
  getPropertiesTD() {
    if (!this.hasCurrentThing) return null;
    let td = this.#getTD();
    return td.properties;
  }
  getEventsTD() {
    if (!this.hasCurrentThing) return null;
    let td = this.#getTD();
    return td.events;
  }

  isPropertyObservable(property) {
    if (!this.hasCurrentThing) return null;
    return this.getPropertyTD(property).observable === true;
  }
  isPropertyObserved(property) {
    let thingID = this.#currentThing.id;
    if (property === undefined) property = this.currentProperty[0];
    try {
      return this.#observedProperties[thingID].includes(property)
        ? true
        : false;
    } catch (error) {
      return false;
    }
  }
  isEventSubscribed(event) {
    const thingID = this.#currentThing.id;
    try {
      return this.#subscribedEvents[thingID].includes(event);
    } catch (error) {
      return false;
    }
  }

  isPropertyReadable(property) {
    let isReadable;
    if (["writeallproperties", "writemultipleproperties"].includes(property)) {
      isReadable = false;
    } else if (
      ["readallproperties", "readmultipleproperties"].includes(property)
    ) {
      isReadable = true;
    } else {
      let propertyTD = this.getPropertyTD(property);
      isReadable =
        !propertyTD.hasOwnProperty("writeOnly") || !propertyTD.writeOnly;
    }
    return isReadable;
  }
  isPropertyWritable(property) {
    let isWritable;
    if (["writeallproperties", "writemultipleproperties"].includes(property)) {
      isWritable = true;
    } else if (
      ["readallproperties", "readmultipleproperties"].includes(property)
    ) {
      isWritable = false;
    } else {
      let propertyTD = this.getPropertyTD(property);
      isWritable =
        !propertyTD.hasOwnProperty("readOnly") || !propertyTD.readOnly;
    }
    return isWritable;
  }

  getPropertyTD(property) {
    if (!this.hasCurrentThing) return null;
    return this.getPropertiesTD()[property];
  }
  getToplevelForms() {
    if (!this.hasCurrentThing) return null;
    let td = this.#getTD();

    return td.hasOwnProperty("forms")
      ? td["forms"].reduce((acc, curr) => {
          return { [curr.op]: {}, ...acc };
        }, {})
      : [];
  }
  getEventTD(event) {
    if (!this.hasCurrentThing) return null;
    return this.getEventsTD()[event];
  }

  observeProperty() {
    const propertyName = this.#currentProperty[0];
    const thing = this.#currentThing;
    const requestDate = Date.now().toString();
    const thingId = this.currentThingID;
    this.#logger.saveRequest(
      "observeProperty",
      [propertyName],
      thingId,
      requestDate
    );
    thing.observeProperty(propertyName, (data) => {
      const responseDate = Date.now().toString();
      this.#logger.saveResponse(
        "observeProperty",
        [data],
        thingId,
        requestDate,
        responseDate,
        true
      );
    });
    !this.#observedProperties[thing.id].includes(propertyName) &&
      this.#observedProperties[thing.id].push(propertyName);
    // things[currentThing.id].observedProperties[observeObj.property] = true;
    // $(
    //   `#observeIconWithEvent,#${currentThing.id}-property-${observeObj.property} .material-icons:last-child`
    // ).addClass("observeIconGreen");
    // return true;
  }
  async unobserveProperty() {
    const propertyName = this.#currentProperty[0];
    const requestDate = Date.now().toString();
    const thingId = this.currentThingID;
    const thing = this.#currentThing;
    if (this.isPropertyObserved(propertyName)) {
      this.#logger.saveRequest(
        "unobserveProperty",
        [propertyName],
        thingId,
        requestDate
      );
      await thing.unobserveProperty(propertyName);
      const index = this.#observedProperties[thing.id].indexOf(propertyName);
      if (index > -1) this.#observedProperties[thing.id].splice(index, 1);
    }
  }
  async writeAllProperties(properties) {
    const requestDate = Date.now().toString();
    const thingId = this.currentThingID;
    const form = this.#getTopLevelForm("writeallproperties");
    this.#logger.saveRequest(
      "writeAllProperties",
      undefined,
      properties,
      undefined,
      thingId,
      requestDate
    );
    let config = {
      method: form.httpMethod.toLowerCase(),
      url: form.url,
      headers: {
        "Content-Type": form.contentType,
      },
      data: properties,
    };
    return await axios(config)
      .then((res) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "writeAllProperties",
          undefined,
          res.data,
          undefined,
          thingId,
          requestDate,
          responseDate,
          true
        );

        return { status: true, data: res.data };
      })
      .catch((e) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "writeAllProperties",
          [e.toString()],
          thingId,
          requestDate,
          responseDate,
          false
        );
        return { status: false, data: e.toString() };
      });
    // let url =
    //   propertyForm.href.split("{?id}")[0] +
    //   (uriVariable ? "?id=" + uriVariable : "");
    // let config = {
    //   method: "put",
    //   url,
    //   headers: {
    //     "Content-Type": propertyForm.contentType,
    //   },
    //   data: JSON.stringify(value),
    // };

    // return await axios(config)
    //   .then((response) => {
    //     const responseDate = Date.now().toString();
    //     this.#logger.saveResponse(
    //       "writeProperty",
    //       response.data,
    //       thingId,
    //       requestDate,
    //       responseDate,
    //       true
    //     );

    //     return { status: true, data: response.data };
    //   })
    //   .catch((error) => {
    //     const responseDate = Date.now().toString();
    //     this.#logger.saveResponse(
    //       "writeProperty",
    //       error,
    //       thingId,
    //       requestDate,
    //       responseDate,
    //       false
    //     );
    //     return { status: false, data: error.data };
    //   });
  }
  async writeMultipleProperties(properties) {
    const requestDate = Date.now().toString();
    const thingId = this.currentThingID;
    const form = this.#getTopLevelForm("writemultipleproperties");
    this.#logger.saveRequest(
      "writeMultipleProperties",
      undefined,
      properties,
      undefined,
      thingId,
      requestDate
    );
    let config = {
      method: form.httpMethod.toLowerCase(),
      url: form.url,
      headers: {
        "Content-Type": form.contentType,
      },
      data: properties,
    };
    return await axios(config)
      .then((res) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "writeMultipleProperties",
          undefined,
          "Promise Resolved",
          undefined,
          thingId,
          requestDate,
          responseDate,
          true
        );
        return { status: true, data: "Promise Resolved" };
      })
      .catch((e) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "writeMultipleProperties",
          undefined,
          message,
          undefined,
          thingId,
          requestDate,
          responseDate,
          false
        );
        return { status: false, data: e.toString() };
      });
  }
  async writeProperty(property, value, uriVariables) {
    const requestDate = Date.now().toString();
    const thingId = this.currentThingID;
    this.#logger.saveRequest(
      "writeProperty",
      property,
      value,
      uriVariables,
      thingId,
      requestDate
    );
    return this.#currentThing
      .writeProperty(property, value, { uriVariables })
      .then((response) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "writeProperty",
          property,
          response.data,
          uriVariables,
          thingId,
          requestDate,
          responseDate,
          true
        );
        return { status: true, data: response.data };
      })
      .catch((error) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "writeProperty",
          property,
          error.message,
          uriVariables,
          thingId,
          requestDate,
          responseDate,
          false
        );
        return { status: false, data: error.message };
      });
    // let url =
    //   propertyForm.href.split("{?id}")[0] +
    //   (uriVariable ? "?id=" + uriVariable : "");
    // let config = {
    //   method: "put",
    //   url,
    //   headers: {
    //     "Content-Type": propertyForm.contentType,
    //   },
    //   data: JSON.stringify(value),
    // };

    // return await axios(config)
    //   .then((response) => {
    //     const responseDate = Date.now().toString();
    //     this.#logger.saveResponse(
    //       "writeProperty",
    //       response.data,
    //       thingId,
    //       requestDate,
    //       responseDate,
    //       true
    //     );
    //     return { status: true, data: response.data };
    //   })
    //   .catch((error) => {
    //     const responseDate = Date.now().toString();
    //     this.#logger.saveResponse(
    //       "writeProperty",
    //       error,
    //       thingId,
    //       requestDate,
    //       responseDate,
    //       false
    //     );
    //     return { status: false, data: error.data };
    //   });
  }
  getPropertyDescription(property) {
    if (!this.hasCurrentThing) return null;
    return this.getPropertyTD(property).description;
  }
  getEventDescription(property) {
    if (!this.hasCurrentThing) return null;
    return this.getEventTD(property).description;
  }
  getReadableProperties() {
    return Object.keys(this.getPropertiesTD()).filter((property) =>
      this.isPropertyReadable(property)
    );
  }
  getWritableProperties() {
    return Object.keys(this.getPropertiesTD()).filter((property) =>
      this.isPropertyWritable(property)
    );
  }
  #getTopLevelForm(method) {
    let thing = this.#currentThing;
    let base = thing.base || "";
    let forms = thing.forms;
    for (let i in forms) {
      if (forms[i].op === method) {
        return {
          url: base + forms[i].href,
          httpMethod: forms[i]["htv:methodName"],
          contentType: forms[i].contentType,
        };
      }
    }
    throw new Error("notSupported");
  }
  async readAllProperties() {
    this.#currentProperty = ["readallproperties"];
    let requestDate = Date.now().toString();
    let responseDate;
    let thingId = this.currentThingID;
    let form = this.#getTopLevelForm("readallproperties");
    this.#logger.saveRequest(
      "readAllProperties",
      undefined,
      undefined,
      undefined,
      thingId,
      requestDate
    );
    let config = {
      method: form.httpMethod.toLowerCase(),
      url: form.url,
      headers: {
        "Content-Type": form.contentType,
      },
    };
    return await axios(config)
      .then((res) => {
        responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "readAllProperties",
          undefined,
          res.data,
          undefined,
          thingId,
          requestDate,
          responseDate,
          true
        );
        return res.data;
      })
      .catch((e) => {
        responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "readAllProperties",
          undefined,
          e.message,
          undefined,
          thingId,
          requestDate,
          responseDate,
          false
        );
        return e.toString();
      });
  }
  async readMultipleProperties(propertyNames) {
    this.#currentProperty = ["readmultipleproperties"];
    let requestDate = Date.now().toString();
    let responseDate;
    let thingId = this.currentThingID;
    this.#logger.saveRequest(
      "readMultipleProperties",
      undefined,
      propertyNames,
      undefined,
      thingId,
      requestDate
    );
    let form = this.#getTopLevelForm("readmultipleproperties");
    let config = {
      method: form.httpMethod.toLowerCase(),
      url: form.url,
      headers: {
        "Content-Type": form.contentType,
      },
      data: propertyNames,
    };
    return await axios(config)
      .then((res) => {
        responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "readMultipleProperties",
          undefined,
          res.data,
          undefined,
          thingId,
          requestDate,
          responseDate,
          true
        );
        return res.data;
      })
      .catch((e) => {
        responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "readMultipleProperties",
          undefined,
          e.toString(),
          undefined,
          thingId,
          requestDate,
          responseDate,
          false
        );
        return e.toString();
      });
  }
  async readProperty(property, uriVariables) {
    let payload = [property];
    let requestDate = Date.now().toString();
    let responseDate;
    let thingId = this.currentThingID;
    this.#logger.saveRequest(
      "readProperty",
      property,
      undefined,
      uriVariables,
      thingId,
      requestDate
    );
    return this.#currentThing
      .readProperty(property, { uriVariables })
      .then((res) => {
        responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "readProperty",
          property,
          res,
          uriVariables,
          thingId,
          requestDate,
          responseDate,
          true
        );
        return res;
      })
      .catch((error) => {
        responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "readProperty",
          property,
          error.message,
          uriVariables,
          thingId,
          requestDate,
          responseDate,
          false
        );
        return error.message;
      });
  }

  async invokeAction(action, payload, uriVariables) {
    if (!this.hasCurrentThing) return null;
    const thingId = this.currentThingID;
    const requestDate = Date.now().toString();
    this.#logger.saveRequest(
      "invokeAction",
      action,
      payload,
      uriVariables,
      thingId,
      requestDate
    );
    return await this.#currentThing
      .invokeAction(action, payload, { uriVariables })
      .then((res) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "invokeAction",
          action,
          res,
          uriVariables,
          thingId,
          requestDate,
          responseDate,
          true
        );
        return res;
      })
      .catch((error) => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "invokeAction",
          action,
          error.message,
          uriVariables,
          thingId,
          requestDate,
          responseDate,
          false
        );

        return error.message;
      });
  }
  subscribeEvent(event) {
    if (!this.hasCurrentThing) return null;
    const thingId = this.currentThingID;
    this.#subscribedEvents[thingId].push(event);
    const requestDate = Date.now().toString();
    try {
      this.#logger.saveRequest("subscribeEvent", [event], thingId, requestDate);
      this.#currentThing.subscribeEvent(
        event,
        (response) => {
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "subscribeEvent",
            [response],
            thingId,
            requestDate,
            responseDate,
            true
          );
          document.dispatchEvent(newEvent);
        },
        (err) => {
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "subscribeEvent",
            [err],
            thingId,
            requestDate,
            responseDate,
            false
          );

          throw new Error(" Event " + event + " error\nMessage: " + error);
        }
      );
    } catch (err) {
      const index = this.#subscribedEvents[thingId].indexOf(event);
      if (index > -1) this.#subscribedEvents[thingId].splice(index, 1);
    }
    // return await this.#currentThing
    //   .invokeAction(...payload)
    //   .then((res) => {
    //     // if (things[currentThing.id].key.hasKey) {
    //     //   login.showKey("green");
    //     // }
    //     return res;
    //     // if (res) {
    //     //   viewResponse(currentAction.action, res, {}, {});
    //     // } else {
    //     //   viewResponse(currentAction.action, "Executed successfully.", {}, {});
    //     // }
    //   })
    //   .catch((error) => {
    //     // if (err.toString().includes("Unauthorized")) {
    //     //   login.showKey("red");
    //     // }
    //     return error;
    //   }); //TypeError: e is undefined === no credentials
  }
  unsubscribeEvent(event) {
    if (!this.hasCurrentThing) return null;
    const thingId = this.currentThingID;
    this.#subscribedEvents[thingId].push(event);
    const requestDate = Date.now().toString();
    try {
      const index = this.#subscribedEvents[thingId].indexOf(event);
      if (index > -1) this.#subscribedEvents[thingId].splice(index, 1);
      this.#logger.saveRequest(
        "unsubscribeEvent",
        [event],
        thingId,
        requestDate
      );
      this.#currentThing.unsubscribeEvent(
        event,
        (response) => {
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "unsubscribeEvent",
            [response],
            thingId,
            requestDate,
            responseDate,
            true
          );
        },
        (error) => {
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "unsubscribeEvent",
            [response],
            thingId,
            requestDate,
            responseDate,
            false
          );
          throw new Error(
            " unsubscribeEvent %%%%%%%%%%%%% Event " +
              event +
              " error\nMessage: " +
              error
          );
        }
      );
    } catch (error) {}
    // return await this.#currentThing
    //   .invokeAction(...payload)
    //   .then((res) => {
    //     // if (things[currentThing.id].key.hasKey) {
    //     //   login.showKey("green");
    //     // }
    //     return res;
    //     // if (res) {
    //     //   viewResponse(currentAction.action, res, {}, {});
    //     // } else {
    //     //   viewResponse(currentAction.action, "Executed successfully.", {}, {});
    //     // }
    //   })
    //   .catch((error) => {
    //     // if (err.toString().includes("Unauthorized")) {
    //     //   login.showKey("red");
    //     // }
    //     return error;
    //   }); //TypeError: e is undefined === no credentials
  }
  getMetadata() {
    if (!this.hasCurrentThing) return null;
    let enumString = [
      "@context",
      "@type",
      "id",
      "title",
      "titles",
      "description",
      "descriptions",
      "support",
      "version",
      "created",
      "modified",
      "securityDefinitions",
      "security",
      "base",
      "links",
      "forms",
    ];
    let td = this.#getTD();
    let metadata = enumString.reduce((accumulator, currentValue) => {
      if (td[currentValue] !== undefined && enumString.includes(currentValue)) {
        accumulator.push([currentValue, td[currentValue]]);
      }
      return accumulator;
    }, []);
    return metadata;
  }
  #getTD() {
    if (!this.hasCurrentThing) return null;
    return this.#currentThing.getThingDescription();
  }
  setCurrentThingByID(id) {
    if (id in this.#things) {
      this.#currentThing = this.#things[id];
    }
  }
}

export default ThingsController;
