import Link from "next/link";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/shared/state-panel";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <StatePanel
        icon={Flag}
        title="Out of bounds"
        description="That page doesn't exist or may have moved."
        action={
          <Button nativeButton={false} render={<Link href="/" />}>
            Back to home
          </Button>
        }
      />
    </div>
  );
}
