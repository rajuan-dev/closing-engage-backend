declare module 'compression' {
  import type { RequestHandler } from 'express';

  interface CompressionOptions {
    threshold?: number | string;
    level?: number;
    chunkSize?: number;
    filter?: (req: unknown, res: unknown) => boolean;
    memLevel?: number;
    strategy?: number;
    brotli?: Record<string, unknown>;
  }

  function compression(options?: CompressionOptions): RequestHandler;

  export default compression;
}

declare module 'swagger-jsdoc' {
  interface SwaggerJSDocOptions {
    definition?: Record<string, unknown>;
    apis?: string[];
    [key: string]: unknown;
  }

  function swaggerJsdoc(options?: SwaggerJSDocOptions): Record<string, unknown>;

  export default swaggerJsdoc;
}
