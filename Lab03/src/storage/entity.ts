import type { CreateInput, Entity, FilterInput, UpdateInput } from '../schemas/entity.schema';

const store = new Map<string, Entity>();

export function getAll(filters?: FilterInput): Entity[] {
  let items = Array.from(store.values());

  if (filters?.genre) {
    items = items.filter((movie) => movie.genre === filters.genre);
  }
  if (filters?.minYear !== undefined) {
    items = items.filter((movie) => movie.releaseYear >= filters.minYear!);
  }
  if (filters?.maxYear !== undefined) {
    items = items.filter((movie) => movie.releaseYear <= filters.maxYear!);
  }
  if (filters?.title) {
    const query = filters.title.toLowerCase();
    items = items.filter((movie) => movie.title.toLowerCase().includes(query));
  }

  return items;
}

export function getRecent(): Entity[] {
  const cutoffYear = new Date().getFullYear() - 5;
  return Array.from(store.values()).filter((movie) => movie.releaseYear >= cutoffYear);
}

export function getById(id: string): Entity | undefined {
  return store.get(id);
}

export function create(data: CreateInput): Entity {
  const now = new Date();
  const entity: Entity = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  store.set(entity.id, entity);
  return entity;
}

export function update(id: string, data: UpdateInput): Entity | undefined {
  const existing = store.get(id);
  if (!existing) {
    return undefined;
  }

  const updated: Entity = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };
  store.set(id, updated);
  return updated;
}

export function remove(id: string): boolean {
  return store.delete(id);
}

export function reset(): void {
  store.clear();
}
