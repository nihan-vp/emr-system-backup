// ESM-compatible ESLint config (package.json uses "type": "module")
import expoConfig from 'eslint-config-expo/flat.js';

export default [
  ...(Array.isArray(expoConfig) ? expoConfig : [expoConfig]),
  {
    ignores: ['dist/*'],
  },
];

