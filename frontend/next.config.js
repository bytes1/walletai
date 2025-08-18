/** @type {import('next').NextConfig} */

const fs = require("fs");
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
