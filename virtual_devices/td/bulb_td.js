module.exports = (port) => {
  return {
    "@context": "https://www.w3.org/2019/wot/td/v1",
    id: "urn:dev:ops:32473-WoTLamp-1234",
    title: "bulb",
    base: "http://localhost:" + port,
    securityDefinitions: { nosec_sc: { scheme: "nosec" } },
    security: "nosec_sc",
    properties: {
      status: {
        description: "current status of the bulb (on|off)",
        type: "object",
        properties: {
          value: {
            type: "string",
            enum: ["on", "off"],
          },
        },
        readOnly: true,
        writeOnly: false,
        observable: true,
        forms: [
          {
            href: "/bulb/properties/status",
            contentType: "application/json",
            op: ["readproperty", "writeproperty"],
          },
        ],
      },
      color: {
        description: "current RGB color of the bulb",
        type: "object",
        properties: {
          red: {
            type: "integer",
            minimum: 0,
            maximum: 255,
          },
          green: {
            type: "integer",
            minimum: 0,
            maximum: 255,
          },
          blue: {
            type: "integer",
            minimum: 0,
            maximum: 255,
          },
          required: ["red", "green", "blue"],
        },
        readOnly: false,
        writeOnly: false,
        observable: true,
        forms: [
          {
            href: "/bulb/properties/color",
            contentType: "application/json",
            op: ["readproperty", "writeproperty"],
          },
          {
            href: "/bulb/properties/color/observeproperty",
            contentType: "application/json",
            op: ["observeproperty", "unobserveproperty"],
            subprotocol: "longpoll",
          },
        ],
      },
      room: {
        description: "location of the bulb",
        type: "object",
        properties: {
          value: {
            type: "string",
          },
        },
        readOnly: false,
        writeOnly: false,
        observable: true,
        forms: [
          {
            href: "/bulb/properties/room",
            contentType: "application/json",
            op: ["readproperty", "writeproperty"],
          },
          {
            href: "/bulb/properties/room/observeproperty",
            contentType: "application/json",
            op: ["observeproperty", "unobserveproperty"],
            subprotocol: "longpoll",
          },
        ],
      },
    },
    actions: {
      toggle: {
        description: "toggle the bulb (on|off)",
        forms: [
          {
            href: "/bulb/actions/toggle",
            op: ["invokeaction"],
          },
        ],
      },
      reset: {
        description: "reset the bulb settings",
        forms: [
          {
            href: "/bulb/actions/reset",
            op: ["invokeaction"],
          },
        ],
      },
    },
    events: {
      power_on: {
        description: "fire the event when the power is back on",
        forms: [
          {
            href: "/bulb/events/power_on",
            contentType: "application/json",
            subprotocol: "longpoll",
            op: ["subscribeevent", "unsubscribeevent"],
          },
        ],
      },
    },
    forms: [
      {
        op: "readallproperties",
        href: "/bulb/readallproperties",
        contentType: "application/json",
        "htv:methodName": "GET",
      },
    ],
    "@type": "Thing",
  };
};
