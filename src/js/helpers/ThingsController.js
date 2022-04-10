"use strict";
import "@node-wot/browser-bundle";
import axios from "axios";
const newNotification = new Event("newNotification");
/**
 * ConsumedThing according to WoT Scripting API
 * @typedef {object} ConsumedThing
 */
/**
 * Class to create a an object that manages all consumed things.
 * @type {object}
 * @constructor
 * @public
 * @property {object.<ConsumedThing>} things - The property is the ConsumedThing id and the value is the ConsumedThing.
 * @property {?object.<ConsumedThing>} currentThing - The current consumed thing which is the thing that will be used by the methods.
 * @property {object.<string[]>} observedProperties - Contains all the observed properties where the key is the thing id and the value is all the observed properties.
 * @property {object.<string[]>} subscribedEvents -  Contains all the subscribed event where the key is the thing id and the value is all the subscribed event.
 */
class ThingsController {
  /**
   *Contains all the consumed things with their id as a key.
   * @type {object}
   * @property {ConsumedThing} - The property is the ConsumedThing id and the value is the ConsumedThing.
   * @default
   */
  #things = {};
  /**
   * The current consumed thing which is the thing that will be used by the methods.
   * @type {ConsumedThing|null}
   * @default
   */
  #currentThing = null;
  /**
   * Contains all the observed properties where the key is the thing id and the value is all the observed properties.
   * @type {object}
   * @property {string[]}
   * @default
   */
  #observedProperties = {};
  /**
   * Contains all the subscribed event where the key is the thing id and the value is all the subscribed event.
   * @type {object}
   * @property {string[]}
   * @default
   */
  #subscribedEvents = {};
  /**
   * An instance of the class Logger.
   * @type {Logger}
   */
  #logger;
  set logger(logger) {
    this.#logger = logger;
  }
  /**
   * Get the current thing id.
   * @type {string}
   */
  get currentThingID() {
    return this.#currentThing.id;
  }
  /**Get the current thing title.
   * @type {string}
   */
  get currentThingTitle() {
    return this.#currentThing.title;
  }
  /**
   * Returns false if the this.#currentThing is null and true otherwise.
   * @type {Function}
   * @returns {boolean}
   */

  hasCurrentThing() {
    if (this.#currentThing === null) {
      return false;
    }
    return true;
  }
  /**
   * Returns false if the this.#currentThing has nosec_sc
   * @type {Function}
   * @returns {boolean}
   */
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
  /**
   * Returns true if the this.#currentThing has uriVariables.
   * @type {Function}
   * @param {"properties"|"actions"|"events"} affordance
   * @param {string} interactionAffordance
   * @returns {boolean}
   */
  hasUriVariables(affordance, interactionAffordance) {
    const td = this.#getTD();
    return td[affordance][interactionAffordance].hasOwnProperty("uriVariables");
  }
  /**
   * Get the uriVariables object from the TD for the specified affordance and interactionAffordance for the currentThing.
   * @type {Function}
   * @param {"properties"|"actions"|"events"} affordance
   * @param {string} interactionAffordance
   * @returns {object}
   */
  getUriVariables(affordance, interactionAffordance) {
    const td = this.#getTD();
    return td[affordance][interactionAffordance].uriVariables;
  }
  /**
   * Add security credential to the currentThing.
   * @type {Function}
   * @param {string} username
   * @param {string} password
   * @returns {void}
   */
  addCredential(username, password) {
    this.#currentThing.getServient().addCredentials({
      [this.#currentThing.id]: {
        username,
        password,
      },
    });
  }
  /**
   * Get the security type for the currentThing.
   * @type {Function}
   * @returns {string | undefined}
   */
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
  /**
   * Consume a thing description.
   * @type {Function}
   * @param {object} td - Thing description object.
   * @returns void
   */
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
  /**
   * Get the action interaction affordance object from the currentThing.
   * @type {Function}
   * @param {object} td - Thing description object.
   * @returns {object}
   */
  getActionForm(action) {
    let td = this.#getTD();
    return td.actions[action];
  }
  /**
   * Get all actions interaction affordance from the currentThing.
   * @type {Function}
   * @returns {string[]}
   */
  getActions() {
    let td = this.#getTD();
    return Object.keys(td.actions);
  }
  /**
   * Get all events interaction affordance from the currentThing.
   * @type {Function}
   * @returns {object}
   */
  getEvents() {
    let td = this.#getTD();
    return Object.keys(td.events);
  }
  /**
   * Get the object for all properties from the currentThing.
   * @type {Function}
   * @returns {object}
   */
  getPropertiesTD() {
    let td = this.#getTD();
    return td.properties;
  }
  /**
   * Get the object for all events from the currentThing.
   * @type {Function}
   * @returns {object}
   */
  getEventsTD() {
    let td = this.#getTD();
    return td.events;
  }
  /**
   * @type {Function}
   * @param {string} property - The property interaction affordance.
   * @returns {boolean}
   */
  isPropertyObservable(property) {
    return this.getPropertyTD(property).observable === true;
  }
  /**
   * @type {Function}
   * @param {string} property - The property interaction affordance.
   * @returns {boolean}
   */
  isPropertyObserved(property) {
    let thingID = this.#currentThing.id;
    try {
      return this.#observedProperties[thingID].includes(property)
        ? true
        : false;
    } catch (error) {
      return false;
    }
  }
  /**
   * @type {Function}
   * @param {string} event - The event interaction affordance.
   * @returns {boolean}
   */
  isEventSubscribed(event) {
    const thingID = this.#currentThing.id;
    try {
      return this.#subscribedEvents[thingID].includes(event);
    } catch (error) {
      return false;
    }
  }
  /**
   * @type {Function}
   * @param {string} property - The property interaction affordance.
   * @returns {boolean}
   */
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
  /**
   * @type {Function}
   * @param {string} property - The property interaction affordance.
   * @returns {boolean}
   */
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
  /**
   * get the property interaction affordance object from the currentThing.
   * @type {Function}
   * @param {string} property - The property interaction affordance.
   * @returns {object}
   */
  getPropertyTD(property) {
    return this.getPropertiesTD()[property];
  }
  /**
   * get the top level form object for the currentThing.
   * @type {Function}
   * @param {"readallproperties"|"readmultipleproperties"|"writeallproperties"|"writemultipleproperties"} property - The top level form type
   * @returns {object}
   */
  getTopLevelFormTD(property) {
    const forms = this.#getTD()["forms"];
    if (forms.length) {
      return { ...forms };
    } else {
      for (const iterator of forms) {
        if (iterator.op === property) {
          return { ...property };
        }
      }
    }
  }
  /**
   * get op(s) for the top level form for the currentThing.
   * @type {Function}
   * @returns {object}
   */
  getToplevelForms() {
    let td = this.#getTD();
    return td.hasOwnProperty("forms")
      ? td["forms"].reduce((acc, curr) => {
          return { [curr.op]: {}, ...acc };
        }, {})
      : {};
  }
  /**
   * get the event ob for the currentThing.
   * @type {Function}
   * @param {string} event - The event interaction affordance.
   * @returns {object}
   */
  getEventTD(event) {
    return this.getEventsTD()[event];
  }
  /**
   * @type {Function}
   * @param {string} property - The property interaction affordance.
   * @returns {object.<status:boolean,data:string>}
   */
  observeProperty(property) {
    const thing = this.#currentThing;
    const requestDate = Date.now().toString();
    const thingId = this.currentThingID;
    this.#logger.saveRequest(
      "observeProperty",
      property,
      undefined,
      undefined,
      thingId,
      requestDate
    );
    !this.#observedProperties[thing.id].includes(property) &&
      this.#observedProperties[thing.id].push(property);
    return thing
      .observeProperty(
        property,
        (response) => {
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "observeProperty",
            property,
            response,
            undefined,
            thingId,
            requestDate,
            responseDate,
            true
          );
          document.dispatchEvent(newNotification);
        },
        (error) => {
          const index = this.#observedProperties[thing.id].indexOf(property);
          if (index > -1) {
            this.#observedProperties[thing.id].splice(index, 1);
            const responseDate = Date.now().toString();
            this.#logger.saveResponse(
              "observeProperty",
              property,
              error.message,
              undefined,
              thingId,
              requestDate,
              responseDate,
              false
            );
            return { status: false, data: error.message };
          }
        }
      )
      .catch((error) => {
        const index = this.#observedProperties[thing.id].indexOf(property);
        if (index > -1) {
          this.#observedProperties[thing.id].splice(index, 1);
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "observeProperty",
            property,
            error.message,
            undefined,
            thingId,
            requestDate,
            responseDate,
            false
          );
          return { status: false, data: error.message };
        }
      });
  }
  /**
   * @type {Function}
   * @param {string} property - The property interaction affordance.
   */
  async unobserveProperty(property) {
    const requestDate = Date.now().toString();
    const thingId = this.currentThingID;
    const thing = this.#currentThing;
    if (this.isPropertyObserved(property)) {
      this.#logger.saveRequest(
        "unobserveProperty",
        property,
        undefined,
        undefined,
        thingId,
        requestDate
      );
      await thing.unobserveProperty(property);
      const index = this.#observedProperties[thing.id].indexOf(property);
      if (index > -1) this.#observedProperties[thing.id].splice(index, 1);
    }
  }
  /**
   * @type {Function}
   * @param {string[]} properties - All properties.
   * @returns {object.<status:boolean,data:string>}
   */
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
  }
  /**
   * @type {Function}
   * @param {string[]} properties
   * @returns {object.<status:boolean,data:string>}
   */
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
  /**
   * @type {Function}
   * @param {string} property
   * @param {*} value
   * @param {object} uriVariables
   * @returns {object.<status:boolean,data:string>}
   */
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
      .then(() => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "writeProperty",
          property,
          undefined,
          uriVariables,
          thingId,
          requestDate,
          responseDate,
          true
        );
        return { status: true, data: "The Property Was Successfully Updated." };
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
  }
  /**
   * Get the description for a property.
   * @type {Function}
   * @param {string} property
   * @returns {string|undefined}
   */
  getPropertyDescription(property) {
    return this.getPropertyTD(property).description;
  }
  /**
   * Get the description for an event.
   * @type {Function}
   * @param {string} event
   * @returns {string|undefined}
   */
  getEventDescription(event) {
    return this.getEventTD(event).description;
  }
  /**
   * Get all the readable properties.
   * @type {Function}
   * @returns {string[]}
   */
  getReadableProperties() {
    return Object.keys(this.getPropertiesTD()).filter((property) =>
      this.isPropertyReadable(property)
    );
  }
  /**
   * Get all the writable properties.
   * @type {Function}
   * @returns {string[]}
   */
  getWritableProperties() {
    return Object.keys(this.getPropertiesTD()).filter((property) =>
      this.isPropertyWritable(property)
    );
  }
  /**
   * Get the url,httpMethod and contentType for a top level Form.
   * @type {Function}
   * @param {"readallproperties"|"readmultipleproperties"|"writeallproperties"|"writemultipleproperties"} method - The top level form type
   * @returns {object.<url:string,httpMethod:url,contentType:string>}
   * @private
   */
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
  /**
   * @type {Function}
   * @returns {*}
   */
  async readAllProperties() {
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
  /**
   * @type {Function}
   * @returns {object}
   */
  async readMultipleProperties(properties) {
    let requestDate = Date.now().toString();
    let responseDate;
    let thingId = this.currentThingID;
    this.#logger.saveRequest(
      "readMultipleProperties",
      undefined,
      properties,
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
      data: properties,
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
  /**
   * @type {Function}
   * @param {string} property
   * @param {object} uriVariables
   * @returns {*}
   */
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
  /**
   * @type {Function}
   * @param {string} action
   * @param {*} payload
   * @param {object} uriVariables
   * @returns {*}
   */
  async invokeAction(action, payload, uriVariables) {
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
  /**
   * @type {Function}
   * @param {string} event
   */
  subscribeEvent(event) {
    const thingId = this.currentThingID;
    this.#subscribedEvents[thingId].push(event);
    const requestDate = Date.now().toString();
    this.#logger.saveRequest(
      "subscribeEvent",
      event,
      undefined,
      undefined,
      thingId,
      requestDate
    );
    return this.#currentThing
      .subscribeEvent(
        event,
        (response) => {
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "subscribeEvent",
            event,
            response,
            undefined,
            thingId,
            requestDate,
            responseDate,
            true
          );
          document.dispatchEvent(newNotification);
        },
        (error) => {
          const index = this.#subscribedEvents[thingId].indexOf(event);
          if (index > -1) {
            this.#subscribedEvents[thingId].splice(index, 1);
            const responseDate = Date.now().toString();
            this.#logger.saveResponse(
              "subscribeEvent",
              event,
              error.message,
              undefined,
              thingId,
              requestDate,
              responseDate,
              false
            );
          }
        }
      )
      .catch((error) => {
        const index = this.#subscribedEvents[thingId].indexOf(event);
        if (index > -1) {
          this.#subscribedEvents[thingId].splice(index, 1);
          const responseDate = Date.now().toString();
          this.#logger.saveResponse(
            "subscribeEvent",
            event,
            error.message,
            undefined,
            thingId,
            requestDate,
            responseDate,
            false
          );
          return { status: false, data: error.message };
        }
      });
  }
  /**
   * @type {Function}
   * @param {string} event
   */
  unsubscribeEvent(event) {
    const thingId = this.currentThingID;
    const requestDate = Date.now().toString();
    const index = this.#subscribedEvents[thingId].indexOf(event);
    if (index > -1) this.#subscribedEvents[thingId].splice(index, 1);
    this.#logger.saveRequest(
      "unsubscribeEvent",
      event,
      undefined,
      undefined,
      thingId,
      requestDate
    );
    this.#currentThing.unsubscribeEvent(
      event,
      () => {
        const responseDate = Date.now().toString();
        this.#logger.saveResponse(
          "unsubscribeEvent",
          event,
          undefined,
          undefined,
          thingId,
          requestDate,
          responseDate,
          true
        );
      },
      (error) => {
        console.log(error);
      }
    );
  }
  /** return the metadata for the currentThing.
   * @type {Function}
   * @returns {string[][]}
   */
  getMetadata() {
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
  /**
   * Return the Thing Description for the currentThing.
   * @type {Function}
   * @returns {object}
   */
  #getTD() {
    return this.#currentThing.getThingDescription();
  }
  /**Change the current Thing.
   * @type {Function}
   * @param {string} id
   */
  setCurrentThingByID(id) {
    if (id in this.#things) {
      this.#currentThing = this.#things[id];
    }
  }
}

export default ThingsController;
