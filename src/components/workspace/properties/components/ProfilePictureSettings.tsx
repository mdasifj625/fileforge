import { BackgroundRemovalSettings } from "@/features/RemoveBackground/BackgroundRemovalSettings";
import { Layer } from "@/types/layer";

interface Props {
  layer?: Layer;
}

const PRESET_COLORS = [
  "#FF5722",
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#FFEB3B",
  "#E91E63",
  "#00BCD4",
  "#FF9800",
  "#ffffff",
  "#000000",
];

export function ProfilePictureSettings({ layer }: Props) {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center justify-between gap-2">
        <span>Profile Picture Maker</span>
      </h3>

      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            1. Remove Background (AI)
          </p>
          <BackgroundRemovalSettings layer={layer} />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            2. Choose Background Color
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  console.log("Color selected:", color);
                }}
                className="w-8 h-8 rounded-full border border-panel-border transition-transform hover:scale-110 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Select a color to set as the background behind your cut-out subject.
            (Coming soon)
          </p>
        </div>
      </div>
    </div>
  );
}
