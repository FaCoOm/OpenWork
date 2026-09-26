const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  webpack: (config) => {
    config.resolve.alias['@openwork/core'] = path.resolve(__dirname, '../packages/core/dist/index.js');
    return config;
  },
};

module.exports = nextConfig;
