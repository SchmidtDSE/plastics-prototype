import {WorkerResponse, executeWorkerRequest} from "/js/worker.js";


onmessage = (event) => {
    const request = event.data;
    try {
        const response = executeWorkerRequest(request);
        postMessage(response);
    } catch (e) {
        console.log(e, request);
        const requestIndex = request.getRequestIndex();
        const response = new WorkerResponse(e, requestIndex, new Map());
        postMessage(response);
    }
};
