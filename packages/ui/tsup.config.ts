import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src', '!./src/**/*.stories.*'],
  format: ['cjs', 'esm'],
  minify: true,
  dts: {
    compilerOptions: {
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      ignoreDeprecations: '6.0',
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
  },
  bundle: true,
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.js' : '.mjs',
  }),
})
