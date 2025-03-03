export default {
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // .js always uses the module type of the nearest package.json
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  // This allows tests use .js extensions in imports from tests.
  // We could import paths without extensions in tests, but from
  // library code it's important to use .js import paths because
  // TypeScript won't change them, and published ESM code needs
  // to use .js file extensions.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    "^.+\\.m?[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  resolver: `./src/test/test_resolver.cjs`,
};
