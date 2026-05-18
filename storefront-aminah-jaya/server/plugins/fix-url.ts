import { defineNitroPlugin } from "nitropack/runtime";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    const host = event.node.req.headers.host || "localhost";
    const protocol = event.node.req.headers["x-forwarded-proto"] || "http";
    if (event.node.req.url && event.node.req.url.startsWith("/")) {
      event.node.req.url = `${protocol}://${host}${event.node.req.url}`;
    }
  });
});
