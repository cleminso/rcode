import { defineConfig } from 'tsup'

export default defineConfig({
  tsconfig: './tsconfig.json',
  entry: ['./src', '!./src/**/*.stories.*'],
  format: ['cjs', 'esm'],
  minify: true,
  dts: true,
  bundle: true,
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.js' : '.mjs',
  }),
})
