declare module "express-rate-limit" {
  import { RequestHandler } from "express";

  interface Options {
    windowMs?: number;
    max?: number;
    message?: string;
    statusCode?: number;
    [key: string]: any;
  }

  function rateLimit(options?: Options): RequestHandler;
  export = rateLimit;
}

declare module "http-proxy-middleware" {
  import { RequestHandler } from "express";

  interface Options {
    target?: string;
    changeOrigin?: boolean;
    pathRewrite?: Record<string, string>;
    [key: string]: any;
  }

  export function createProxyMiddleware(options: Options): RequestHandler;
}
