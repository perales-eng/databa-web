import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // El service worker NUNCA debe cachearse: si el CDN o browser retienen
        // una versión vieja, los usuarios nunca reciben updates del SW y
        // quedan trabados con cache HTML obsoleto. Forzamos revalidación.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
