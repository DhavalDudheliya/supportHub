import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@supporthub/ui/components/button";

interface QuickLinkProps {
  href: string;
  title: string;
  description: string;
}

export function QuickLink({ href, title, description }: QuickLinkProps) {
  return (
    <Button
      variant="outline"
      className="h-auto justify-between rounded-2xl px-4 py-3"
      nativeButton={false}
      render={<Link href={href} />}
    >
      <div className="text-left">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
