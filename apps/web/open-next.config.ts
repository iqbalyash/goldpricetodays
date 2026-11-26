import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // Avoid `npm run build`, which also runs the OpenNext bundle.
  buildCommand: "npm run build:next",
};

