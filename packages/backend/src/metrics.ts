import { useHotCleanup } from '@backstage/backend-common';
import { RequestHandler } from 'express';
import promBundle from 'express-prom-bundle';
import prom from 'prom-client';
import * as url from 'url';

const rootRegEx = new RegExp('^/([^/]*)/.*');
const apiRegEx = new RegExp('^/api/([^/]*)/.*');

export function normalizePath(req: any): string {
  const path = url.parse(req.originalUrl || req.url).pathname || '/';

  // Capture /api/ and the plugin name
  if (apiRegEx.test(path)) {
    return path.replace(apiRegEx, '/api/$1');
  }

  // Only the first path segment at root level
  return path.replace(rootRegEx, '/$1');
}

/**
 * Adds a /metrics endpoint, register default runtime metrics and instrument the router.
 */
export function metricsHandler(): RequestHandler {
  // We can only initialize the metrics once and have to clean them up between hot reloads
  useHotCleanup(module, () => prom.register.clear());

  return promBundle({
    includeMethod: true,
    includePath: true,
    // Using includePath alone is problematic, as it will include path labels with high
    // cardinality (e.g. path params). Instead we would have to template them. However, this
    // is difficult, as every backend plugin might use different routes. Instead we only take
    // the first directory of the path, to have at least an idea how each plugin performs:
    normalizePath,
    promClient: { collectDefaultMetrics: {} },
  });
}
