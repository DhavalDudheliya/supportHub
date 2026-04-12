import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import { QuickLink } from "@/components/dashboard/quick-link";

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Jump back into the areas your team uses most.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <QuickLink
          href="/tickets"
          title="Review ticket queue"
          description="Triaging open and pending requests."
        />
        <QuickLink
          href="/customers"
          title="Manage customers"
          description="Keep contact records current and searchable."
        />
        <QuickLink
          href="/settings/team"
          title="Team settings"
          description="Invite agents and monitor workspace access."
        />
      </CardContent>
    </Card>
  );
}
