/* eslint-disable */
export default {
  displayName: 'backend-gazeta',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/backend-gazeta',
  transformIgnorePatterns: ['<rootDir>/generated/']
}; 