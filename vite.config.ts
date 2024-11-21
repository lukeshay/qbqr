import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "pdfjs-dist": ["pdfjs-dist"],
        },
      },
    },
  },
  base: "/qbqr/",
});
