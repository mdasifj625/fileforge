import mongoose, { Document, Model, Schema } from "mongoose";

// This syncs the non-destructive layer configurations and preferences,
// but explicitly does *not* sync the raw binary files (which stay local).
export interface IWorkspace extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  theme: "light" | "dark" | "system";
  layersConfig: string; // Stored as a serialized JSON string of metadata
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: "My Workspace",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    layersConfig: {
      type: String,
      default: "[]",
    },
  },
  {
    timestamps: true,
  },
);

export const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace ||
  mongoose.model<IWorkspace>("Workspace", workspaceSchema);
