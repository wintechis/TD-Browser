class Logger {
  #LogsViewer;
  set LogsViewer(LogsViewer) {
    this.#LogsViewer = LogsViewer;
  }
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
  saveRequest(affordance, data, id, requestDate) {
    const logs = JSON.parse(localStorage.getItem(id));
    const request = {
      date: requestDate,
      data,
      type: affordance,
    };
    logs[affordance][requestDate] = { request };
    localStorage.setItem(id, JSON.stringify(logs));
    this.#LogsViewer.appendRequestToView(logs.td.title, request);
  }
  saveResponse(affordance, data, id, requestDate, responseDate, status) {
    const logs = JSON.parse(localStorage.getItem(id));
    const response = { type: affordance, date: responseDate, status, data };
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
