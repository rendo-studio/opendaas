import { createMDX } from "fumadocs-mdx/next";
import path from "node:path";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(".")
  }
};

const withMDX = createMDX({
  configPath: "./source.config.ts"
});

export default withMDX(config);
