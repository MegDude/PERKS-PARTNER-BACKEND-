export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= 29.5 && lat <= 30.8 && lng >= -98.5 && lng <= -97.2;
}

export function validateCoordinateLocation(location: { latitude?: unknown; longitude?: unknown; valid?: unknown }) {
  return isValidCoordinate(location?.latitude, location?.longitude);
}

export function sanitizeCoordinates(lat: unknown, lng: unknown, fallback: [number, number] = [30.267, -97.743]): [number, number] {
  return isValidCoordinate(lat, lng) ? [lat as number, lng as number] : fallback;
}

export function assertValidLocation(entityId: string, lat: unknown, lng: unknown): void {
  if (!isValidCoordinate(lat, lng)) {
    throw new Error(`Entity ${entityId} has invalid coordinates: [${lat}, ${lng}]`);
  }
}

export function filterValidEntities<T extends { location?: { latitude?: unknown; longitude?: unknown } }>(entities: T[]) {
  return entities.filter((entity) => Boolean(entity.location && isValidCoordinate(entity.location.latitude, entity.location.longitude)));
}

export function validateCoordinateBatch(coordinates: Array<[unknown, unknown]>): ValidationResult {
  const errors: string[] = [];
  coordinates.forEach((coords, index) => {
    if (!isValidCoordinate(coords[0], coords[1])) errors.push(`Index ${index}: Invalid coordinates [${coords[0]}, ${coords[1]}]`);
  });
  return { isValid: errors.length === 0, errors };
}

export function isValidMapCenter(center: unknown): center is [number, number] {
  return Array.isArray(center) && center.length === 2 && isValidCoordinate(center[0], center[1]);
}

export function getValidMapCenter(center: unknown, fallback: [number, number] = [30.267, -97.743]): [number, number] {
  return isValidMapCenter(center) ? center : fallback;
}
