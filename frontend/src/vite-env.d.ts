/// <reference types="vite/client" />

declare module "*.{png,jpg,jpeg,svg,webp,gif}" {
  const src: string;
  export default src;
}
