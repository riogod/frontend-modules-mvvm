export default {
  name: 'module-api-example',
  exposes: {},
  shared: {},
  base: process.env.NODE_ENV === 'production' ? '/modules/api_example/' : '/',
  remotes: {},
};

