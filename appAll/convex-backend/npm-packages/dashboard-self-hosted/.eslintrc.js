const path = require("path");

module.exports = {
  root: true,
  extends: [path.resolve(__dirname, "../dashboard-common/.eslintrc.cjs")],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: [],
  settings: {
    tailwindcss: {
      config: "../dashboard-common/tailwind.config.ts",
    },
  },
  overrides: [
    {
      files: ["src/pages/**/*.tsx"],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
};
