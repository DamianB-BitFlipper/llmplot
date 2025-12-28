// Type declarations for Bun's import attributes
// These allow importing assets with { type: "file" } or { type: "text" }

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.woff2" {
  const content: string;
  export default content;
}
