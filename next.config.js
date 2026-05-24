/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["retell-sdk", "nodemailer"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Tells ngrok to bypass its browser-warning interstitial for all requests,
          // so JavaScript chunks load correctly through the tunnel.
          { key: "ngrok-skip-browser-warning", value: "true" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
