import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  authProvider: "supabase" | "local" | "google";
  authProviderId: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    authProvider: {
      type: String,
      required: true,
      enum: ["supabase", "local", "google"],
      default: "supabase",
    },
    authProviderId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// If model already exists, use it. Otherwise, create it.
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
