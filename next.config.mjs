import withSerwist from '@serwist/next';

const serwist = withSerwist({
  swSrc: 'src/sw.js',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  turbopack: {},
};

export default serwist(nextConfig);

