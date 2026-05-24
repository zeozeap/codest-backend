import mongoose from "mongoose";

export interface IProject {
  title: string;
  description: string;
  longDescription?: string;
  technologies: string[];
  imageUrl: string;
  imagePublicId: string;
  liveUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new mongoose.Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    longDescription: {
      type: String,
    },
    technologies: [
      {
        type: String,
        required: true,
      },
    ],
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    liveUrl: {
      type: String,
    },
    githubUrl: {
      type: String,
    },
    linkedinUrl: {
      type: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model<IProject>("Project", projectSchema);
