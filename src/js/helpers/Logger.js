/**
 * Class to create an object that used to save and retrieves logs.
 * @type {object}
 * @constructor
 * @public
 * @property {object} LogsViewer - Holds an instance of the RightView class.
 */
class Logger {
  /**
   *Contains all the consumed things with their id as a key.
   * @type {object}
   * @property {ConsumedThing} - Holds an instance of the RightView class.
   */
  #LogsViewer;
  set LogsViewer(LogsViewer) {
    this.#LogsViewer = LogsViewer;
  }
  /**
   * Initiate a logs object at the local storage.
   * @type {Function}
   * @param {string} id - The id of a Thing
   * @param {object} td - The Thing Description of a Thing.
   * @returns {void}
   */
  initiate(id, td) {
    if (!JSON.parse(localStorage.getItem(id)) === null) return undefined;
    localStorage.setItem(
      id,
      JSON.stringify({
        td,
        invokeAction: {},
        readProperty: {},
        readAllProperties: {},
        readMultipleProperties: {},
        observeProperty: {},
        unobserveProperty: {},
        subscribeEvent: {},
        unsubscribeEvent: {},
        writeProperty: {},
        writeAllProperties: {},
        writeMultipleProperties: {},
      })
    );
  }
  /**
   * Saves a log Request object at the local storage and sends it to the RightView.
   * @type {Function}
   * @param {string} affordance - The id of a Thing
   * @param {string} interactionAffordance - The id of a Thing
   * @param {boolean | null | undefined | number | string | object} data - The id of a Thing
   * @param {undefined | object} uriVariables - The uriVariables of a request.
   * @param {string} id - The id of a request.
   * @param {string} requestDate - The date of a request.
   * @returns {void}
   */
  saveRequest(
    affordance,
    interactionAffordance,
    data,
    uriVariables,
    id,
    requestDate
  ) {
    const logs = JSON.parse(localStorage.getItem(id));
    const request = {
      date: requestDate,
      interactionAffordance,
      data,
      uriVariables,
      type: affordance,
    };
    logs[affordance][requestDate] = { request };
    localStorage.setItem(id, JSON.stringify(logs));
    this.#LogsViewer.appendRequestToView(logs.td.title, request);
  }
  /**
   * Saves a log response object at the local storage and sends it to the RightView.
   * @type {Function}
   * @param {string} affordance - The id of a Thing
   * @param {string} interactionAffordance - The id of a Thing
   * @param {boolean | null | undefined | number | string | object} data - The id of a Thing
   * @param {undefined | object} uriVariables - The uriVariables of a request.
   * @param {string} id - The id of a request.
   * @param {string} requestDate - The date of a request.
   * @param {string} responseDate - The date of a response.
   * @param {string} status - The status of a request.
   * @returns {void}
   */
  saveResponse(
    affordance,
    interactionAffordance,
    data,
    uriVariables,
    id,
    requestDate,
    responseDate,
    status
  ) {
    const logs = JSON.parse(localStorage.getItem(id));
    const response = {
      type: affordance,
      interactionAffordance,
      date: responseDate,
      uriVariables,
      status,
      data,
    };
    logs[affordance][requestDate].response = { response };
    this.#LogsViewer.appendResponseToView(
      logs.td.title,
      response,
      logs[affordance][requestDate].request
    );
    logs[affordance][requestDate].response = { ...response };
    localStorage.setItem(id, JSON.stringify(logs));
  }
}

export default Logger;
