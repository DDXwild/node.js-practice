import { z } from 'zod';

export const genres = [
  'drama',
  'comedy',
  'action',
  'sci-fi',
  'horror',
  'documentary',
] as const;

const currentYear = new Date().getFullYear();

export const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  releaseYear: z.number().int().min(1888).max(currentYear + 2),
  genre: z.enum(genres),
  director: z.string().min(1).max(100),
});

export const updateSchema = createSchema.partial();

export const filterSchema = z.object({
  genre: z.enum(genres).optional(),
  minYear: z.coerce.number().int().min(1888).optional(),
  maxYear: z.coerce.number().int().max(currentYear + 2).optional(),
  title: z.string().min(1).optional(),
});

const sortFieldRegex = /^-?(title|releaseYear|createdAt)$/;

export const listQuerySchema = filterSchema.extend({
  sort: z
    .string()
    .regex(sortFieldRegex, 'sort must be like releaseYear, -releaseYear, title, -title, createdAt, or -createdAt')
    .optional(),
  page: z.preprocess(
    (v) => (v === undefined || v === '' || v === null ? undefined : Number(v)),
    z.number().int().min(1).catch(1),
  ),
  limit: z.preprocess(
    (v) => (v === undefined || v === '' || v === null ? undefined : Number(v)),
    z.number().int().min(1).max(100).catch(10),
  ),
});

export type CreateInput = z.infer<typeof createSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;

export type Entity = CreateInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
