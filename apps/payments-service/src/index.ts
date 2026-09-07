import { loadConfig } from "@invocore/config";

import { createApp } from "./app.js";

const port = loadConfig().servicePorts.paymentsService;
const app = createApp();

app.listen(port, () => {
  console.warn(`payments-service listening on port ${port}`);
});
