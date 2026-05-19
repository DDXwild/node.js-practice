/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  roots: ['<rootDir>'],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
};
