import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
