const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.js',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  turbopack: {},
};

module.exports = withSerwist(nextConfig);
