import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SupportHub",
  description: "Overview of your SupportHub workspace",
};

/**
 * Dashboard page — placeholder for Phase 5.
 * Shows a welcome message for now.
 */
export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a summary of your workspace today.
        </p>
      </div>

      {/* Placeholder cards — will be built in Phase 5 */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Unsolved tickets", value: "—" },
          { label: "Overdue", value: "—" },
          { label: "Due today", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-background p-6 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
