// @ts-check
/* eslint-env node */

/**
 * An object with Jest options.
 * @type {import('@jest/types').Config.InitialOptions}
 */
const options = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  resolver: "ts-jest-resolver",
  setupFiles: ["jest-canvas-mock"],
};

module.exports = options;
