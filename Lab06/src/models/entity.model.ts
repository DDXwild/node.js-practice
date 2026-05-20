import mongoose, { Schema } from 'mongoose';
import { genres } from '../schemas/entity.schema';

const currentYear = new Date().getFullYear();

/** Fields stored in MongoDB (Mongoose adds _id and timestamps). */
export interface Movie {
  title: string;
  description?: string;
  releaseYear: number;
  genre: (typeof genres)[number];
  director: string;
}

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
      validate: {
        validator(v: string): boolean {
          return /[a-zA-Z\u0400-\u04FF]/.test(v);
        },
        message: 'Title must contain at least one letter',
      },
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    releaseYear: {
      type: Number,
      required: true,
      min: 1888,
      max: currentYear + 2,
      validate: {
        validator(v: number): boolean {
          return Number.isInteger(v) && v <= new Date().getFullYear() + 2;
        },
        message: 'Release year must be an integer within the allowed range',
      },
    },
    genre: {
      type: String,
      required: true,
      enum: {
        values: [...genres],
        message: 'Invalid genre',
      },
    },
    director: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        const plain = ret as Record<string, unknown>;
        if (plain._id) {
          plain.id = (plain._id as mongoose.Types.ObjectId).toString();
          delete plain._id;
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        const plain = ret as Record<string, unknown>;
        if (plain._id) {
          plain.id = (plain._id as mongoose.Types.ObjectId).toString();
          delete plain._id;
        }
        return ret;
      },
    },
  },
);

movieSchema.virtual('displayTitle').get(function (this: mongoose.Document & Movie) {
  return `${this.title} (${this.releaseYear})`;
});

export const MovieModel = mongoose.model('Movie', movieSchema, 'movies');
