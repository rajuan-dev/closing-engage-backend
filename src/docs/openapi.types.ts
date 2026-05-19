export interface OpenApiModuleDoc {
  tag: {
    name: string;
    description: string;
  };
  paths: Record<string, unknown>;
}
