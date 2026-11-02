import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // ... Specify options here.
    fileParallelism: false,
  },
});
