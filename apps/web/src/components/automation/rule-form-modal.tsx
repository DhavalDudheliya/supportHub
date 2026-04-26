import React, { useState } from "react";
import { X, Zap, Users, Info, ArrowRight } from "lucide-react";
import { cn } from "@supporthub/ui/lib/utils";
import { toast } from "sonner";
import {
  rulesService,
  type AssignmentRule,
  type RuleConditions,
  type RuleCondition,
} from "@/lib/services/automation.service";
import {
  TAG_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type Agent,
} from "./constants";

import { Button } from "@supporthub/ui/components/button";
import { Input } from "@supporthub/ui/components/input";
import { Label } from "@supporthub/ui/components/label";
import { Checkbox } from "@supporthub/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@supporthub/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@supporthub/ui/components/select";
import { SegmentedControl } from "@supporthub/ui/components/segmented-control";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@supporthub/ui/components/tooltip";

export function RuleFormModal({
  rule,
  agents,
  onClose,
  onSave,
}: {
  rule: AssignmentRule | null;
  agents: Agent[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(rule?.name || "");
  const [operator, setOperator] = useState<"AND" | "OR">(
    (rule?.conditions as RuleConditions)?.operator || "OR",
  );
  const [conditions, setConditions] = useState<RuleCondition[]>(
    (rule?.conditions as RuleConditions)?.conditions || [],
  );
  const [strategy, setStrategy] = useState<"SPECIFIC" | "ROUND_ROBIN">(
    rule?.strategy || "SPECIFIC",
  );
  const [assigneeId, setAssigneeId] = useState<string | null>(
    rule?.assigneeId || null,
  );
  const [setPriority, setSetPriority] = useState<string | null>(
    rule?.setPriority || null,
  );
  const [flagUrgent, setFlagUrgent] = useState(rule?.flagUrgent || false);
  const [saving, setSaving] = useState(false);
  const [condCategory, setCondCategory] = useState("");
  const [condTag, setCondTag] = useState("");

  const addCondition = () => {
    if (condCategory && condTag) {
      setConditions([
        ...conditions,
        { category: condCategory, tagName: condTag },
      ]);
      setCondCategory("");
      setCondTag("");
    }
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || conditions.length === 0) return;
    if (strategy === "SPECIFIC" && !assigneeId) return;

    setSaving(true);
    try {
      const data = {
        name,
        conditions: { operator, conditions },
        strategy,
        assigneeId: strategy === "SPECIFIC" ? assigneeId : null,
        setPriority,
        flagUrgent,
        isEnabled: true,
      };

      if (rule) {
        await rulesService.update(rule.id, data);
      } else {
        await rulesService.create(data);
      }

      onSave();
    } catch (err: any) {
      console.error("Failed to save rule:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to save rule",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Rule" : "Create Rule"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Rule name */}
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Billing tickets to billing team"'
              required
            />
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Label>Conditions</Label>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="cursor-help inline-flex outline-none"
                >
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px]">
                    Defines the criteria that incoming tickets must meet for
                    this rule to apply.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Operator toggle */}
            <div className="flex gap-3 items-center mb-4">
              <SegmentedControl<"AND" | "OR">
                options={[
                  { value: "AND", label: "AND" },
                  { value: "OR", label: "OR" },
                ]}
                value={operator}
                onChange={setOperator}
              />
              <span className="text-xs text-muted-foreground">
                {operator === "AND"
                  ? "All conditions must match"
                  : "Any condition can match"}
              </span>
            </div>

            {/* Existing conditions */}
            <div className="space-y-2 mb-4">
              {conditions.map((c, i) => {
                const handleRemoveClick = () => removeCondition(i);

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs border rounded-md px-3 py-2 bg-muted/30"
                  >
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full font-medium whitespace-nowrap",
                        CATEGORY_COLORS[c.category] || "bg-muted",
                      )}
                    >
                      {CATEGORY_LABELS[c.category] || c.category}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span className="font-medium truncate">{c.tagName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleRemoveClick}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Add condition */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={condCategory}
                  onValueChange={(v) => {
                    setCondCategory(v || "");
                    setCondTag("");
                  }}
                >
                  <SelectTrigger
                    aria-label="Select Category"
                    className={"w-full"}
                  >
                    <SelectValue placeholder="Category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(TAG_CATEGORIES).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select
                  disabled={!condCategory}
                  value={condTag}
                  onValueChange={(v) => setCondTag(v || "")}
                >
                  <SelectTrigger aria-label="Select Tag" className={"w-full"}>
                    <SelectValue placeholder="Tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(TAG_CATEGORIES[condCategory] || []).map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={addCondition}
                disabled={!condCategory || !condTag}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Assignment strategy */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Label>Assign To</Label>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="cursor-help inline-flex outline-none"
                >
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[250px]">
                    Determines how the matching ticket will be routed. 'Specific
                    Agent' routes to one person. 'Round Robin' distributes
                    evenly among the team.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex mb-3">
              <SegmentedControl<"SPECIFIC" | "ROUND_ROBIN">
                options={[
                  {
                    value: "SPECIFIC",
                    label: "Specific Agent",
                    icon: <Zap className="h-3 w-3" />,
                  },
                  {
                    value: "ROUND_ROBIN",
                    label: "Round Robin",
                    icon: <Users className="h-3 w-3" />,
                  },
                ]}
                value={strategy}
                onChange={setStrategy}
              />
            </div>

            {strategy === "SPECIFIC" && (
              <Select
                value={assigneeId || "NONE"}
                onValueChange={(v) =>
                  setAssigneeId(v === "NONE" || !v ? null : v)
                }
              >
                <SelectTrigger className={"w-full"}>
                  <SelectValue placeholder="Select agent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={"NONE"}>Select agent...</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.firstName} {a.lastName} — {a.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Optional overrides */}
          <div className="space-y-5 pt-4 border-t mt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Override Priority</Label>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="cursor-help inline-flex outline-none"
                  >
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[250px]">
                      Optionally force a specific priority level for tickets
                      that match these conditions, overriding default priority
                      logic.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={setPriority || "NONE"}
                onValueChange={(v) =>
                  setSetPriority(v === "NONE" || !v ? null : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No override" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No override</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border p-4 shadow-sm bg-muted/10 transition-colors hover:bg-muted/30">
              <Checkbox
                id="flag-urgent"
                checked={flagUrgent}
                onCheckedChange={(c) => setFlagUrgent(c === true)}
                className="mt-0.5"
              />
              <div className="space-y-1.5 leading-none">
                <Label
                  htmlFor="flag-urgent"
                  className="cursor-pointer font-medium text-sm"
                >
                  Flag for immediate attention
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automatically marks this ticket as requiring immediate agent
                  review. It will bypass standard SLA queues and be visually
                  highlighted in the inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                !name.trim() ||
                conditions.length === 0 ||
                (strategy === "SPECIFIC" && !assigneeId)
              }
            >
              {saving ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
