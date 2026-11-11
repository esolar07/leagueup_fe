import Link from "next/link";
import { ArrowRight, Eye, Flag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/config/campaigns";

/** Empty state for a discovery page with no games at all. */
export function NoGamesYet({ title, description }: { title: string; description: string }) {
  return (
    <StatePanel
      icon={Eye}
      title={title}
      description={description}
      action={
        <Button nativeButton={false} render={<Link href="/list-your-game" />}>
          List your game
        </Button>
      }
    />
  );
}

interface AudienceCardProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action: ReactNode;
}

function AudienceCard({ icon: Icon, eyebrow, title, description, action }: AudienceCardProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary uppercase">
        <Icon className="size-5" aria-hidden /> {eyebrow}
      </p>
      <h2 className="font-display mt-3 text-3xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{action}</div>
    </section>
  );
}

/** "Need a game? / Short on players?" pair from the campaign landing design. */
export function AudienceCards({ findHref }: { findHref: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AudienceCard
        icon={Users}
        eyebrow="Players"
        title="Need a game?"
        description="Browse open games near you and request a spot. The organizer approves requests. No account needed to look around."
        action={<Button nativeButton={false} render={<Link href={findHref} />}>Find a game</Button>}
      />
      <AudienceCard
        icon={Flag}
        eyebrow="Organizers"
        title="Short on players?"
        description="List your game in about two minutes. Set the spots, skill level and cost, then approve requests as they come in."
        action={<Button variant="outline" nativeButton={false} render={<Link href="/list-your-game" />}>List your game</Button>}
      />
    </div>
  );
}

/** Slim link to a campaign hub, for the general Find Games page. */
export function CampaignBanner({ campaign }: { campaign: Campaign }) {
  return (
    <Link
      href={campaign.path}
      className="cover-stripes group flex items-center justify-between gap-4 rounded-lg border border-brand-orange/40 p-4 transition-colors hover:border-brand-orange focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span>
        <span className="block text-xs font-bold tracking-wide text-brand-orange uppercase">{campaign.eyebrow}</span>
        <span className="font-display mt-1 block text-2xl">{campaign.name} games are live</span>
      </span>
      <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}
