import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkspaceLayout />
      {/* We render children hidden so their useEffects run, or we don't render them at all and let WorkspaceLayout handle the UI */}
      <div className="hidden">{children}</div>
    </>
  );
}
