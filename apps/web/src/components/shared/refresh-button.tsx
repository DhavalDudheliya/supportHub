import { RefreshCcw } from "lucide-react";
import { Button } from "@supporthub/ui/components/button";

interface RefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function RefreshButton({ onClick, disabled }: RefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
    >
      <RefreshCcw className="mr-2 h-4 w-4" />
      Refresh
    </Button>
  );
}
