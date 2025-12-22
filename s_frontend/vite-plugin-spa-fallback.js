export default function spaFallback() {
  return {
    name: "spa-fallback",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Only handle GET requests
        if (req.method !== "GET") {
          return next();
        }

        const url = req.url || "";

        // Skip if it's an API call, asset, or HMR
        if (
          url.includes("?") ||
          url.includes(".") ||
          url.startsWith("/@") ||
          url.startsWith("/node_modules")
        ) {
          return next();
        }

        // For root and any client-side routes, serve dashboard
        if (
          url === "/" ||
          url.startsWith("/nfts") ||
          url.startsWith("/users") ||
          url.startsWith("/settings")
        ) {
          req.url = "/src/dashboard/index.html";
        }

        next();
      });
    },
  };
}
