import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      // Matches tsconfig paths: @/* -> ./*
      // Uses trailing slash to avoid accidentally matching @wayloft/* workspace packages
      "@/": path.resolve(__dirname, "./") + "/",
    },
  },
});
