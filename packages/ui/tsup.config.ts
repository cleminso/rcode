import { defineConfig } from 'tsup'

export default defineConfig({
  tsconfig: './tsconfig.json',
  entry: ['./src/components/atoms', './src/components/ui', './src/hooks', './src/lib', '!./src/**/*.stories.*'],
  format: ['esm'],
  minify: false,
  dts: true,
  bundle: true,
  clean: true,
  outExtension: () => ({ js: '.mjs' }),
  external: ['@base-ui/react', 'lucide-react', 'sonner', 'next-themes'],
})
