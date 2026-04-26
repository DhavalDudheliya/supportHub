"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { type AssignmentRule } from "@/lib/services/automation.service";
import { SortableRuleItem } from "./sortable-rule-item";
import { RuleFormModal } from "./rule-form-modal";
import { AssignmentRulesHeader } from "./assignment-rules-header";
import { AssignmentRulesEmpty } from "./assignment-rules-empty";
import {
  useRules,
  useAgents,
  useReorderRules,
  useToggleRule,
  useDeleteRule,
} from "@/hooks/use-automation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@supporthub/ui/components/alert-dialog";

export function AssignmentRulesPage() {
  const queryClient = useQueryClient();
  const { data: rulesData, isLoading } = useRules();
  const { data: agents = [] } = useAgents();

  const rules = rulesData || [];

  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AssignmentRule | null>(null);

  const reorderMutation = useReorderRules();
  const toggleMutation = useToggleRule();
  const deleteMutation = useDeleteRule();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let newOrder: AssignmentRule[] = [];

    // Optimistically update the cache for dnd-kit
    queryClient.setQueryData<AssignmentRule[]>(["automation-rules"], (old) => {
      if (!old) return old;
      const oldIndex = old.findIndex((r) => r.id === active.id);
      const newIndex = old.findIndex((r) => r.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return old;

      newOrder = arrayMove(old, oldIndex, newIndex);
      return newOrder;
    });

    if (newOrder.length > 0) {
      reorderMutation.mutate(
        newOrder.map((r, i) => ({ id: r.id, priority: i })),
      );
    }
  };

  const handleToggle = (rule: AssignmentRule) => {
    toggleMutation.mutate({ id: rule.id, isEnabled: !rule.isEnabled });
  };

  const handleDelete = (rule: AssignmentRule) => {
    setRuleToDelete(rule);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteMutation.mutate(ruleToDelete.id);
      setRuleToDelete(null);
    }
  };

  const handleNewRule = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleEditRule = (rule: AssignmentRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleSaveRule = () => {
    setShowModal(false);
    setEditingRule(null);
    queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <AssignmentRulesHeader onNewRule={handleNewRule} />

      {/* Rules list */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          Loading rules...
        </div>
      ) : rules.length === 0 ? (
        <AssignmentRulesEmpty />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rules.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {rules.map((rule) => (
                <SortableRuleItem
                  key={rule.id}
                  rule={rule}
                  onEdit={() => handleEditRule(rule)}
                  onDelete={() => handleDelete(rule)}
                  onToggle={() => handleToggle(rule)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Fallback info */}
      {rules.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          If no rule matches <ArrowRight className="h-3.5 w-3.5 opacity-70" />{" "}
          ticket goes to the
          <strong>unassigned queue</strong>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <RuleFormModal
          rule={editingRule}
          agents={agents}
          onClose={handleCloseModal}
          onSave={handleSaveRule}
        />
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete rule "{ruleToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
