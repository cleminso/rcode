import { Button } from "@rcode/ui/ui/button";
import { cn } from "@rcode/ui/lib/utils";
import { useClipboard } from "@rcode/ui/hooks/use-clipboard";
import { CheckIcon, CopyIcon, TriangleAlertIcon } from "lucide-react";

type CopyCodeButtonProps = React.ComponentProps<typeof Button> & {
  content: string;
};

export function CopyCodeButton({ content, className, ...props }: CopyCodeButtonProps) {
  const { copied, copy, error } = useClipboard(1400);
  const hasError = error !== null;
  const label = hasError === true ? "Code could not be copied" : copied === true ? "Code copied" : "Copy code";

  const handleCopyCode = () => {
    void copy(content).catch((copyError: unknown) => {
      console.error("Failed to copy code.", copyError);
    });
  };

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="secondary"
      aria-label={label}
      title={label}
      className={cn("shadow-sm", className)}
      onClick={handleCopyCode}
      {...props}
    >
      {hasError === true ? (
        <TriangleAlertIcon className="size-3" />
      ) : copied === true ? (
        <CheckIcon className="size-3" />
      ) : (
        <CopyIcon className="size-3" />
      )}
    </Button>
  );
}
