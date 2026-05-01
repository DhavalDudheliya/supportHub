import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Users } from "lucide-react";
import { Loading } from "@supporthub/ui/components/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@supporthub/ui/components/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import type { TeamAgent } from "@/lib/services/invitation.service";

interface TeamAgentsCardProps {
  agents: TeamAgent[];
  loading: boolean;
}

export function TeamAgentsCard({ agents, loading }: TeamAgentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Joined Agents</CardTitle>
        <CardDescription>
          Agents who accepted their invitation and now have workspace access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loading />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No agents have joined yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Accepted invitations will show up here once agents finish creating
              their account.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">
                    {agent.firstName} {agent.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {agent.email}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Joined
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(agent.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
