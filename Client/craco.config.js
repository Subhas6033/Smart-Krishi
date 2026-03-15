const { lingoCompiler } = require("@lingo.dev/compiler");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      return lingoCompiler.webpack({
        sourceLocale: "en",
        targetLocales: [
          "hi",
          "ta",
          "te",
          "kn",
          "ml",
          "bn",
          "gu",
          "pa",
          "mr",
          "ur",
        ],
      })(webpackConfig);
    },
  },
};
