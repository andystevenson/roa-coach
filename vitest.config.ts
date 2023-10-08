import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    hookTimeout: 500000,
    testTimeout: 500000,
  },
})
