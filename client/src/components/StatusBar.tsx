import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusBarProps {
  model: string;
  season: number;
  episode: number;
  scene: number;
  apexStatus: "OFFLINE" | "READY" | "TRANSMITTING" | "GENERATING" | "RECEIVING";
  isStoryMode: boolean;
  isLoadingModel?: boolean;
  modelLoadProgress?: number;
  onHamburgerClick?: () => void;
}

export function StatusBar({
  model,
  season,
  episode,
  scene,
  apexStatus,
  isStoryMode,
  isLoadingModel,
  modelLoadProgress,
  onHamburgerClick,
}: StatusBarProps) {
  const getStatusColor = () => {
    switch (apexStatus) {
      case "OFFLINE":
        return "text-muted-foreground";
      case "READY":
        return "text-primary";
      case "TRANSMITTING":
      case "RECEIVING":
        return "text-accent";
      case "GENERATING":
        return "text-chart-2";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-4 terminal-scanlines">
      <Button
        size="icon"
        variant="ghost"
        onClick={onHamburgerClick}
        className="h-8 w-8"
        data-testid="button-hamburger-menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-6 text-sm font-mono flex-1">
        <div className="flex items-center gap-2" data-testid="text-model-status">
          <span className="text-muted-foreground">MODEL:</span>
          {isLoadingModel ? (
            <div className="flex items-center gap-2">
              <span className="text-foreground">{model}</span>
              <div className="w-24 h-2 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${modelLoadProgress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{Math.round(modelLoadProgress || 0)}%</span>
            </div>
          ) : (
            <span className="text-foreground terminal-glow">{model}</span>
          )}
        </div>

        <div className="flex items-center gap-2" data-testid="text-chapter-info">
          <span className="text-muted-foreground">CHAPTER:</span>
          <span className="text-foreground">S{season}E{episode}S{scene}</span>
        </div>

        {isStoryMode && (
          <div className="flex items-center gap-2" data-testid="text-apex-status">
            <span className="text-muted-foreground">APEX:</span>
            <span className={`${getStatusColor()} terminal-glow`}>{apexStatus}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground font-mono" data-testid="text-system-status">
        [NEXUS v2.4.7]
      </div>
    </div>
  );
}
