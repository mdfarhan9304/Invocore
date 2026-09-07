import { loadConfig } from "@invocore/config";

import { createApp } from "./app.js";

const port = loadConfig().servicePorts.coreApi;
const app = createApp();

app.listen(port, () => {
  console.warn(`core-api listening on port ${port}`);
});
