import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { Card, SectionTitle } from "@/components/verbo/ui";

export const Route = createFileRoute("/admin/financial/money-lab")({
  head: () => ({
    meta: [
      { title: "The Money Lab — Admin" },
      { name: "description", content: "Financial workspace for the admin team. Placeholder — content pending." },
    ],
  }),
  component: MoneyLabPage,
});

function MoneyLabPage() {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>The Money Lab</SectionTitle>
        <p className="mt-1 text-sm text-muted-foreground">Financial workspace — coming soon.</p>
      </div>
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <div className="text-sm font-semibold text-foreground">Placeholder</div>
        <p className="max-w-sm text-xs text-muted-foreground">
          This page is reserved for the Financial workspace. Content will be added in a future phase.
        </p>
      </Card>
    </div>
  );
}