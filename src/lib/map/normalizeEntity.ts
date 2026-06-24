import { generateLogo } from "@/lib/branding/generateLogo";

export function normalizeEntity(entity: any) {
  return {
    ...entity,
    logo: generateLogo(entity)
  };
}

export function normalizeEntities(entities: any[]) {
  return entities.map(normalizeEntity);
}
