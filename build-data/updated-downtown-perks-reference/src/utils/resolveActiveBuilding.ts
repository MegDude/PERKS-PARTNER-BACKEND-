/**
 * Canonical Active Building Resolver
 * 
 * Single source of truth for resolving the active building from route params,
 * query params, or a building registry. Prevents duplicate lookup logic
 * across pages and ensures consistent building context handling.
 * 
 * Usage:
 *   const result = resolveActiveBuilding({
 *     routeParams: { buildingId },
 *     queryParams: new URLSearchParams(window.location.search),
 *     pathname: window.location.pathname,
 *     buildingRegistry: buildings,
 *   });
 *   
 *   if (result.status === 'found') {
 *     // result.building is the Building object
 *     // result.buildingId is the canonical ID
 *   }
 */

/**
 * Resolves the active building from available context sources.
 * 
 * Priority order:
 *   1. routeParams.buildingId (from /buildings/:buildingId/...)
 *   2. queryParams.get('building')
 *   3. pathname extraction (fallback for /buildings/:id patterns)
 * 
 * @param {Object} params
 * @param {Object} params.routeParams - React Router useParams() result
 * @param {URLSearchParams} [params.queryParams] - Parsed query string
 * @param {string} [params.pathname] - Current pathname
 * @param {Array} [params.buildingRegistry] - List of Building entities
 * @returns {{ buildingId: string|null, building: Object|null, source: string, status: 'found'|'not_found'|'missing' }}
 */
export function resolveActiveBuilding({ routeParams, queryParams, pathname, buildingRegistry = [] }) {
  let buildingId = null;
  let source = 'none';

  // 1. Route param (primary)
  if (routeParams?.buildingId) {
    buildingId = routeParams.buildingId;
    source = 'route';
  }
  // 2. Query param (fallback)
  else if (queryParams?.get('building')) {
    buildingId = queryParams.get('building');
    source = 'query';
  }
  // 3. Pathname extraction (last resort)
  else if (pathname) {
    const match = pathname.match(/\/buildings\/([^/]+)/);
    if (match && match[1] !== 'new') {
      buildingId = match[1];
      source = 'pathname';
    }
  }

  // No building ID found at all
  if (!buildingId) {
    return { buildingId: null, building: null, source: 'none', status: 'missing' };
  }

  // Registry not yet loaded — return ID but mark as pending
  if (buildingRegistry.length === 0) {
    return { buildingId, building: null, source, status: 'not_found' };
  }

  // Look up building by ID (never by name)
  const building = buildingRegistry.find(b => b.id === buildingId);

  if (!building) {
    return { buildingId, building: null, source, status: 'not_found' };
  }

  return { buildingId, building, source, status: 'found' };
}