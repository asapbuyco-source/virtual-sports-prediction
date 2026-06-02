import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "firebase-auth": ["firebase/auth"],
          "firebase-firestore": ["firebase/firestore"],
          "firebase-functions": ["firebase/functions"],
          "firebase-analytics": ["firebase/analytics"],
          "firebase-app": ["firebase/app"],
          "ui-vendor": ["lucide-react", "clsx", "tailwind-merge"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "query-vendor": ["@tanstack/react-query"],
          "framer-motion": ["framer-motion"],
        },
      },
    },
  },
});