import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CopyFormat = "markdown" | "json" | "toon";

export const COPY_FORMATS: { id: CopyFormat; label: string; description: string }[] = [
  { id: "markdown", label: "Markdown", description: "Human-readable" },
  { id: "json", label: "JSON", description: "Structured data" },
  { id: "toon", label: "TOON", description: "Token-efficient" },
];

export function CopyMenu({
  onCopy,
  defaultFormat = "markdown",
  className,
}: {
  onCopy: (format: CopyFormat) => void;
  defaultFormat?: CopyFormat;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant="outline"
        className="rounded-r-none border-r-0 pr-3"
        onClick={() => onCopy(defaultFormat)}
      >
        Copy
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="rounded-l-none border-l-0 px-2"
              aria-label="More copy formats"
            />
          }
        >
          <ChevronDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 min-w-64">
          {COPY_FORMATS.map((f) => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => onCopy(f.id)}
              className="justify-between gap-4"
            >
              <span className="font-medium">{f.label}</span>
              <span className="text-xs text-muted-foreground">{f.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
