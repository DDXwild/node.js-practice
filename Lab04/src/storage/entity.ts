import type { CreateInput, Entity, ListQueryInput, UpdateInput } from '../schemas/entity.schema';
import { MovieModel } from '../models/entity.model';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(filters: Pick<ListQueryInput, 'genre' | 'minYear' | 'maxYear' | 'title'>): Record<string, unknown> {
  const q: Record<string, unknown> = {};
  if (filters.genre) {
    q.genre = filters.genre;
  }
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    q.releaseYear = {};
    if (filters.minYear !== undefined) {
      (q.releaseYear as { $gte?: number }).$gte = filters.minYear;
    }
    if (filters.maxYear !== undefined) {
      (q.releaseYear as { $lte?: number }).$lte = filters.maxYear;
    }
  }
  if (filters.title) {
    q.title = new RegExp(escapeRegex(filters.title), 'i');
  }
  return q;
}

function buildSort(sort?: string): Record<string, 1 | -1> {
  if (!sort) {
    return { createdAt: -1 };
  }
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return { [field]: desc ? -1 : 1 };
}

export async function findAll(
  query: ListQueryInput,
): Promise<{
  data: Entity[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { page, limit, sort, ...filters } = query;
  const filter = buildFilter(filters);
  const skip = (page - 1) * limit;
  const sortObj = buildSort(sort);

  const [total, docs] = await Promise.all([
    MovieModel.countDocuments(filter).exec(),
    MovieModel.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
  ]);

  const data = docs.map((d) => d.toJSON() as unknown as Entity);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getRecent(): Promise<Entity[]> {
  const cutoffYear = new Date().getFullYear() - 5;
  const docs = await MovieModel.find({ releaseYear: { $gte: cutoffYear } })
    .sort({ createdAt: -1 })
    .exec();
  return docs.map((d) => d.toJSON() as unknown as Entity);
}

export async function getById(id: string): Promise<Entity | null> {
  const doc = await MovieModel.findById(id).exec();
  return doc ? (doc.toJSON() as unknown as Entity) : null;
}

export async function create(data: CreateInput): Promise<Entity> {
  const doc = await MovieModel.create(data);
  return doc.toJSON() as unknown as Entity;
}

export async function update(id: string, data: UpdateInput): Promise<Entity | null> {
  const doc = await MovieModel.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).exec();
  return doc ? (doc.toJSON() as unknown as Entity) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await MovieModel.findByIdAndDelete(id).exec();
  return result !== null;
}
