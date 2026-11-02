const app = require('./app.json');

module.exports = {
  ...app,
  expo: {
    ...app.expo,
    ...(process.env.EXPO_ROUTER_APP_ROOT
      ? {
          extra: {
            ...app.expo.extra,
            router: { root: process.env.EXPO_ROUTER_APP_ROOT },
          },
        }
      : {}),
  },
};
