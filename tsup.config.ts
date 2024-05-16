import { defineConfig } from "tsup"

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    splitting: false,
    sourcemap: true,
    clean: true,
    target: "es2020",
    platform: "browser",
    dts: true,
    outDir: "dist/esm"
})
