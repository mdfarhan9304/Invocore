import { loadConfig } from "@invocore/config";

import { createWorkerStatus } from "./worker.js";

const status = createWorkerStatus();
const port = loadConfig().servicePorts.workersService;

console.warn(`${status.service} ${status.status} on control port ${port}`);
