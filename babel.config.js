// babel.config.js (Expo SDK 53)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // ← 官方建議，取代 expo-router/babel
    plugins: [
      // 留空即可，若未來需要其他外掛再加
    ],
  };
};
