/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRunner: 'jest-jasmine2', // allow fail before https://github.com/facebook/jest/issues/11698 is fixed
}
