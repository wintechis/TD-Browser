module.exports = {
  "@context": "https://www.w3.org/2019/wot/td/v1",
  id: "urn:dev:ops:32473-WoTLamp-1234",
  title: "bulb",
  securityDefinitions: { nosec_sc: { scheme: "nosec" } },
  security: "nosec_sc",
  properties: {
    status: {
      type: "string",
      readOnly: false,
      writeOnly: false,
      observable: false,
      forms: [
        {
          href: "http://localhost:3001/bulb/properties/status",
          contentType: "application/json",
          op: ["readproperty", "writeproperty"],
        },
      ],
    },
  },
  actions: {
    toggle: {
      forms: [
        {
          href: "http://localhost:3001/bulb/actions/toggle",
          contentType: "application/json",
          op: ["invokeaction"],
          "htv:methodName": "POST",
        },
      ],
      idempotent: false,
      safe: false,
    },
  },
  events: {
    overheating: {
      data: { type: "string" },
      forms: [
        {
          href: "http://localhost:3001/bulb/events/overheating",
          contentType: "application/json",
          subprotocol: "longpoll",
          op: ["subscribeevent", "unsubscribeevent"],
        },
      ],
    },
  },
  "@type": "Thing",
  forms: [
    {
      href: "http://localhost:3001/bulb/all/properties",
      contentType: "application/json",
      op: ["writeallproperties", "writemultipleproperties"],
    },
  ],
};
