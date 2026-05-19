#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const routesIndexPath = path.join(srcRoot, 'routes', 'index.ts');
const generatedModulesPath = path.join(srcRoot, 'docs', 'generated-modules.ts');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const value = args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : 'true';
    parsed[key] = value;

    if (value !== 'true') {
      index += 1;
    }
  }

  return parsed;
};

const toWords = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const toKebabCase = (value) => toWords(value).map((part) => part.toLowerCase()).join('-');
const toPascalCase = (value) => toWords(value).map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase()).join('');
const toCamelCase = (value) => {
  const pascal = toPascalCase(value);
  return pascal ? pascal[0].toLowerCase() + pascal.slice(1) : '';
};
const toTitleCase = (value) => toWords(value).map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase()).join(' ');

const singularize = (value) => {
  if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.endsWith('ses')) return value.slice(0, -2);
  if (value.endsWith('s') && !value.endsWith('ss')) return value.slice(0, -1);
  return value;
};

const promptWithDefault = async (rl, question, fallback) => {
  const suffix = fallback ? ` (${fallback})` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || fallback;
};

const resolveOption = async (rl, question, explicitValue, fallback) => {
  if (explicitValue && explicitValue !== 'true') {
    return explicitValue;
  }

  return promptWithDefault(rl, question, fallback);
};

const createControllerTemplate = ({ moduleName, entityName, authMode }) => {
  const entityPascal = toPascalCase(entityName);
  const entityCamel = toCamelCase(entityName);
  const moduleCamel = toCamelCase(moduleName);
  const listFn = `list${toPascalCase(moduleName)}`;
  const createFn = `create${entityPascal}`;
  const getFn = `get${entityPascal}`;
  const updateFn = `update${entityPascal}`;
  const deleteFn = `delete${entityPascal}`;
  const authMessage = authMode === 'none' ? 'public' : `${authMode}-protected`;

  return `import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { ${createFn}, ${deleteFn}, ${getFn}, ${listFn}, ${updateFn} } from './${moduleName}.service';

const nonEmpty = z.string().trim().min(1);

const idParamsSchema = z.object({
  id: nonEmpty,
});

const ${entityCamel}PayloadSchema = z.object({
  name: nonEmpty,
  description: z.string().trim().optional(),
});

export const get${toPascalCase(moduleName)} = asyncHandler(async (_req: Request, res: Response) => {
  const items = await ${listFn}();

  return sendResponse(res, {
    success: true,
    message: '${toTitleCase(moduleName)} fetched successfully',
    data: items,
  });
});

export const post${entityPascal} = asyncHandler(async (req: Request, res: Response) => {
  const payload = ${entityCamel}PayloadSchema.parse(req.body);
  const item = await ${createFn}(payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: '${toTitleCase(entityName)} created successfully',
    data: item,
  });
});

export const get${entityPascal}ById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const item = await ${getFn}(id);

  return sendResponse(res, {
    success: true,
    message: '${toTitleCase(entityName)} fetched successfully',
    data: item,
  });
});

export const patch${entityPascal} = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = ${entityCamel}PayloadSchema.partial().parse(req.body);
  const item = await ${updateFn}(id, payload);

  return sendResponse(res, {
    success: true,
    message: '${toTitleCase(entityName)} updated successfully',
    data: item,
  });
});

export const remove${entityPascal} = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  await ${deleteFn}(id);

  return sendResponse(res, {
    success: true,
    message: '${toTitleCase(entityName)} deleted successfully',
  });
});

export const ${moduleCamel}ScaffoldMeta = {
  authMode: '${authMessage}',
} as const;
`;
};

const createServiceTemplate = ({ moduleName, entityName }) => {
  const entityPascal = toPascalCase(entityName);
  const pluralPascal = toPascalCase(moduleName);
  const storeName = `${toCamelCase(moduleName)}Store`;

  return `import { HttpError } from '../../core/http-error';

type ${entityPascal}Record = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const ${storeName} = new Map<string, ${entityPascal}Record>();

const buildId = () => \`${moduleName}-\${Date.now().toString(36)}\`;

export const list${pluralPascal} = async (): Promise<${entityPascal}Record[]> => {
  return Array.from(${storeName}.values());
};

export const create${entityPascal} = async (payload: {
  name: string;
  description?: string;
}): Promise<${entityPascal}Record> => {
  const now = new Date().toISOString();
  const record: ${entityPascal}Record = {
    id: buildId(),
    name: payload.name,
    description: payload.description,
    createdAt: now,
    updatedAt: now,
  };

  ${storeName}.set(record.id, record);
  return record;
};

export const get${entityPascal} = async (id: string): Promise<${entityPascal}Record> => {
  const item = ${storeName}.get(id);

  if (!item) {
    throw new HttpError(404, '${toTitleCase(entityName)} not found');
  }

  return item;
};

export const update${entityPascal} = async (
  id: string,
  payload: Partial<{
    name: string;
    description?: string;
  }>,
): Promise<${entityPascal}Record> => {
  const existing = await get${entityPascal}(id);
  const next: ${entityPascal}Record = {
    ...existing,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  ${storeName}.set(id, next);
  return next;
};

export const delete${entityPascal} = async (id: string): Promise<void> => {
  const existed = ${storeName}.delete(id);

  if (!existed) {
    throw new HttpError(404, '${toTitleCase(entityName)} not found');
  }
};
`;
};

const createRouteTemplate = ({ moduleName, entityName, authMode }) => {
  const routerName = `${toCamelCase(moduleName)}Router`;
  const controllerImport = `import * as ${toCamelCase(moduleName)}Controller from './${moduleName}.controller';`;
  const authImportMap = {
    none: '',
    admin: `import { requireAdminAuth } from '../../middlewares/auth.middleware';`,
    any: `import { requireAnyAuth } from '../../middlewares/auth.middleware';`,
    company: `import { requireCompanyAuth } from '../../middlewares/auth.middleware';`,
    notary: `import { requireNotaryAuth } from '../../middlewares/auth.middleware';`,
  };
  const authUseMap = {
    none: '',
    admin: 'router.use(requireAdminAuth);\n\n',
    any: 'router.use(requireAnyAuth);\n\n',
    company: 'router.use(requireCompanyAuth);\n\n',
    notary: 'router.use(requireNotaryAuth);\n\n',
  };
  const entityPascal = toPascalCase(entityName);

  return `import { Router } from 'express';

${authImportMap[authMode]}
${controllerImport}

const router = Router();

${authUseMap[authMode]}router.get('/', ${toCamelCase(moduleName)}Controller.get${toPascalCase(moduleName)});
router.post('/', ${toCamelCase(moduleName)}Controller.post${entityPascal});
router.get('/:id', ${toCamelCase(moduleName)}Controller.get${entityPascal}ById);
router.patch('/:id', ${toCamelCase(moduleName)}Controller.patch${entityPascal});
router.delete('/:id', ${toCamelCase(moduleName)}Controller.remove${entityPascal});

export const ${routerName} = router;
`;
};

const createDocsTemplate = ({ moduleName, routePath, tagName, entityName, authMode }) => {
  const entityLabel = toTitleCase(entityName);
  const collectionLabel = toTitleCase(moduleName);
  const exportName = `${toCamelCase(moduleName)}OpenApi`;
  const securityLine =
    authMode === 'none'
      ? ''
      : `        security: [{ bearerAuth: [] }],\n`;

  return `import type { OpenApiModuleDoc } from '../../docs/openapi.types';

const ${toCamelCase(entityName)}Schema = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '${moduleName}-abc123' },
    name: { type: 'string', example: '${entityLabel} Name' },
    description: { type: 'string', example: '${entityLabel} description' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'createdAt', 'updatedAt'],
} as const;

const ${toCamelCase(entityName)}PayloadSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', example: '${entityLabel} Name' },
    description: { type: 'string', example: '${entityLabel} description' },
  },
  required: ['name'],
} as const;

export const ${exportName}: OpenApiModuleDoc = {
  tag: {
    name: '${tagName}',
    description: '${collectionLabel} endpoints',
  },
  paths: {
    '/${routePath}': {
      get: {
        tags: ['${tagName}'],
        summary: 'List ${collectionLabel.toLowerCase()}',
${securityLine}        responses: {
          '200': {
            description: '${collectionLabel} fetched successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: ${toCamelCase(entityName)}Schema,
                        },
                      },
                      required: ['data'],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['${tagName}'],
        summary: 'Create ${entityLabel.toLowerCase()}',
${securityLine}        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ${toCamelCase(entityName)}PayloadSchema,
            },
          },
        },
        responses: {
          '201': {
            description: '${entityLabel} created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: ${toCamelCase(entityName)}Schema,
                      },
                      required: ['data'],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/${routePath}/{id}': {
      get: {
        tags: ['${tagName}'],
        summary: 'Get ${entityLabel.toLowerCase()} by id',
${securityLine}        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: '${entityLabel} fetched successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: ${toCamelCase(entityName)}Schema,
                      },
                      required: ['data'],
                    },
                  ],
                },
              },
            },
          },
          '404': {
            description: '${entityLabel} not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['${tagName}'],
        summary: 'Update ${entityLabel.toLowerCase()}',
${securityLine}        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                ...${toCamelCase(entityName)}PayloadSchema,
                required: [],
              },
            },
          },
        },
        responses: {
          '200': {
            description: '${entityLabel} updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: ${toCamelCase(entityName)}Schema,
                      },
                      required: ['data'],
                    },
                  ],
                },
              },
            },
          },
          '404': {
            description: '${entityLabel} not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['${tagName}'],
        summary: 'Delete ${entityLabel.toLowerCase()}',
${securityLine}        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: '${entityLabel} deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
          '404': {
            description: '${entityLabel} not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
  },
};
`;
};

const addRouteRegistration = ({ routePath, moduleName }) => {
  const routerName = `${toCamelCase(moduleName)}Router`;
  const importLine = `import { ${routerName} } from '../modules/${moduleName}/${moduleName}.route';`;
  const useLine = `router.use('/${routePath}', ${routerName});`;

  let source = fs.readFileSync(routesIndexPath, 'utf8');

  if (!source.includes(importLine)) {
    source = source.replace("const router = Router();", `${importLine}\n\nconst router = Router();`);
  }

  if (!source.includes(useLine)) {
    source = source.replace('export const apiRouter = router;', `${useLine}\n\nexport const apiRouter = router;`);
  }

  fs.writeFileSync(routesIndexPath, source);
};

const addDocsRegistration = ({ moduleName }) => {
  const exportName = `${toCamelCase(moduleName)}OpenApi`;
  const importLine = `import { ${exportName} } from '../modules/${moduleName}/${moduleName}.docs';`;
  const moduleLine = `  ${exportName},`;

  let source = fs.readFileSync(generatedModulesPath, 'utf8');

  if (!source.includes(importLine)) {
    source = source.replace('// AUTO-GENERATED IMPORTS', `// AUTO-GENERATED IMPORTS\n${importLine}`);
  }

  if (!source.includes(moduleLine)) {
    source = source.replace('  // AUTO-GENERATED MODULES', `  // AUTO-GENERATED MODULES\n${moduleLine}`);
  }

  fs.writeFileSync(generatedModulesPath, source);
};

const ensureValidAuthMode = (value) => ['none', 'admin', 'any', 'company', 'notary'].includes(value);

const main = async () => {
  const args = parseArgs();
  if (args.help === 'true') {
    stdout.write(
      [
        'Usage:',
        '  npm run create:api -- --name invoice-items --route invoice-items --tag "Invoice Items" --entity invoice-item --auth admin',
        '',
        'Auth modes: none, admin, any, company, notary',
        '',
      ].join('\n'),
    );
    return;
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const rawName = await resolveOption(rl, 'Module name', args.name, '');
    if (!rawName) {
      throw new Error('Module name is required.');
    }

    const moduleName = toKebabCase(rawName);
    const routePath = toKebabCase(await resolveOption(rl, 'Route path', args.route, moduleName));
    const tagName = await resolveOption(rl, 'Swagger tag', args.tag, toTitleCase(moduleName));
    const entityName = singularize(
      toKebabCase(await resolveOption(rl, 'Entity name', args.entity, singularize(moduleName))),
    );
    const authMode = (
      await resolveOption(rl, 'Auth mode [none|admin|any|company|notary]', args.auth, 'admin')
    ).toLowerCase();

    if (!ensureValidAuthMode(authMode)) {
      throw new Error('Auth mode must be one of: none, admin, any, company, notary.');
    }

    const moduleDir = path.join(srcRoot, 'modules', moduleName);
    if (fs.existsSync(moduleDir)) {
      throw new Error(`Module already exists: src/modules/${moduleName}`);
    }

    fs.mkdirSync(moduleDir, { recursive: true });

    fs.writeFileSync(path.join(moduleDir, `${moduleName}.controller.ts`), createControllerTemplate({ moduleName, entityName, authMode }));
    fs.writeFileSync(path.join(moduleDir, `${moduleName}.service.ts`), createServiceTemplate({ moduleName, entityName }));
    fs.writeFileSync(path.join(moduleDir, `${moduleName}.route.ts`), createRouteTemplate({ moduleName, entityName, authMode }));
    fs.writeFileSync(path.join(moduleDir, `${moduleName}.docs.ts`), createDocsTemplate({ moduleName, routePath, tagName, entityName, authMode }));
    fs.writeFileSync(
      path.join(moduleDir, 'README.md'),
      `# ${toTitleCase(moduleName)}\n\nScaffolded with \`npm run create:api\`.\nUpdate the service implementation and expand the Swagger examples as the feature grows.\n`,
    );

    addRouteRegistration({ routePath, moduleName });
    addDocsRegistration({ moduleName });

    stdout.write(
      [
        '',
        `Created API module: src/modules/${moduleName}`,
        `Registered route: ${routePath}`,
        `Registered Swagger docs for tag: ${tagName}`,
        'Next step: implement the real service logic inside the scaffolded service file.',
        '',
      ].join('\n'),
    );
  } finally {
    rl.close();
  }
};

main().catch((error) => {
  console.error(`create:api failed: ${error.message}`);
  process.exitCode = 1;
});
