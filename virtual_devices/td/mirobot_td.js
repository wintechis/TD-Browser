module.exports = {
  "@context": "https://www.w3.org/2019/wot/td/v1",
  id: "urn:dev:ops:32473-WoTMirobot-1234",
  title: "mirobot",
  securityDefinitions: { nosec_sc: { scheme: "nosec" } },
  security: "nosec_sc",
  base: "http://localhost:3001",
  properties: {
    holding_box: {
      type: "boolean",
      description: "to know if the mirobot is holding a box",
      readOnly: true,
      observable: true,
      forms: [
        {
          href: "mirobot/properties/holding_box",
          contentType: "application/json",
          op: ["readproperty"],
        },
        {
          href: "mirobot/properties/holding_box/observeproperty",
          contentType: "application/json",
          op: ["observeproperty", "unobserveproperty"],
          subprotocol: "longpoll",
        },
      ],
    },
    current_box: {
      type: "string",
      description: "to know the current box that the mirobot is holding",
      readOnly: true,
      forms: [
        {
          href: "mirobot/properties/current_box",
          contentType: "application/json",
          op: ["readproperty"],
        },
      ],
    },
    boxes: {
      description: "to know the all the available boxes",
      output: {
        type: "array",
      },
      readOnly: true,
      forms: [
        {
          href: "mirobot/properties/boxes",
          contentType: "application/json",
          op: ["readproperty"],
        },
      ],
    },
  },
  actions: {
    pick_box: {
      description: "to ask the mirobot to pick one of the boxes.",
      input: {
        type: "object",
        properties: {
          color: {
            type: "string",
            description: "pick a color.",
            enum: ["red", "green", "blue", "yellow"],
          },
        },
        required: ["color"],
      },
      idempotent: false,
      safe: false,
      forms: [
        {
          href: "mirobot/actions/pick_box",
          contentType: "text/plain",
          op: ["invokeaction"],
          "htv:methodName": "POST",
        },
      ],
    },
    drop_box: {
      description: "to ask the mirobot to drop the current box",
      forms: [
        {
          href: "mirobot/actions/drop_box",
          contentType: "application/json",
          op: ["invokeaction"],
          "htv:methodName": "POST",
        },
      ],
    },
  },
  events: {
    red_box: {
      description:
        "will notify the client if the red box was picked or dropped",
      data: { type: "string" },
      forms: [
        {
          href: "mirobot/events/red_box",
          contentType: "application/json",
          subprotocol: "longpoll",
          op: ["subscribeevent", "unsubscribeevent"],
        },
      ],
    },
    blue_box: {
      description:
        "will notify the client if the blue box was picked or dropped",
      data: { type: "string" },
      forms: [
        {
          href: "mirobot/events/blue_box",
          contentType: "application/json",
          subprotocol: "longpoll",
          op: ["subscribeevent", "unsubscribeevent"],
        },
      ],
    },
    green_box: {
      description:
        "will notify the client if the green box was picked or dropped",
      data: { type: "string" },
      forms: [
        {
          href: "mirobot/events/green_box",
          contentType: "application/json",
          subprotocol: "longpoll",
          op: ["subscribeevent", "unsubscribeevent"],
        },
      ],
    },
    yellow_box: {
      description:
        "will notify the client if the yellow box was picked or dropped",
      data: { type: "string" },
      forms: [
        {
          href: "mirobot/events/yellow_box",
          contentType: "application/json",
          subprotocol: "longpoll",
          op: ["subscribeevent", "unsubscribeevent"],
        },
      ],
    },
  },
  "@type": "Thing",
};
