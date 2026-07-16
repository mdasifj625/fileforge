import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

const ProfilePictureSettings = dynamic(
  () => import("./ProfilePictureSettings").then((mod) => mod.ProfilePictureSettings),
  { ssr: false }
);

export const profilePictureTool: ToolDefinition = {
  id: "profile-picture",
  name: "Profile Picture Maker",
  category: "image",
  description: "Remove background and add a solid color.",
  params: [],
  PropertiesComponent: ProfilePictureSettings,
};
