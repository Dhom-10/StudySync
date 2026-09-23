import { env } from "./lib/env";
import { createApp } from "./app";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`StudySync API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
