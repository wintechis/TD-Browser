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
        action: {},
        event: {},
        property: {},
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
    logs.property[requestDate] = { request };
    localStorage.setItem(id, JSON.stringify(logs));
    this.#LogsViewer.appendRequestToView(logs.td.title, request);
  }
  saveResponse(affordance, data, id, requestDate, responseDate, status) {
    const logs = JSON.parse(localStorage.getItem(id));
    const response = { type: affordance, date: responseDate, status, data };
    logs.property[requestDate].response = { response };
    this.#LogsViewer.appendResponseToView(
      logs.td.title,
      response,
      logs.property[requestDate].request
    );
    logs.property[requestDate].response = { ...response };
    localStorage.setItem(id, JSON.stringify(logs));
  }
}

export default Logger;
