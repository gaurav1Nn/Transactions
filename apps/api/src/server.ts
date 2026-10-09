import { createApp } from "./app.js";
import { env } from "./config/env.js";

const port = env.PORT;
const host = "0.0.0.0";

const app = createApp();

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port} [${env.NODE_ENV}]`);
});
