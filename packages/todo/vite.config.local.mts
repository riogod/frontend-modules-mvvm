export default {
  name: 'module-todo',
  exposes: {},
  shared: {},
  base: process.env.NODE_ENV === 'production' ? '/modules/todo/' : '/',
  remotes: {},
};


