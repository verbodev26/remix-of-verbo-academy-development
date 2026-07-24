import { useMemo, useState } from "react";
import { ASSIGNMENTS, USERS } from "@/lib/mock-data";
import { cohortsForStudent } from "@/lib/workshops-store";
import {
  addConductReport,
  CONDUCT_CATEGORIES,
  type ConductCategory,
  type ConductTargetType,
} from "@/lib/conduct-reports-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { GhostButton, PrimaryButton } from "@/components/verbo/ui";
import { ShieldAlert } from "lucide-react";

interface Props {
  studentId: string;
  open: boolean;
  onClose: () => void;
}

export function ReportConductModal({ studentId, open, onClose }: Props) {
  const [targetType, setTargetType] = useState<ConductTargetType>("teacher");
  const [targetId, setTargetId] = useState<string>("");
  const [category, setCategory] = useState<ConductCategory | "">("");
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Teachers the student actually has a relationship with:
  // - assigned 1:1 teacher(s) via ASSIGNMENTS
  // - workshop cohort teachers (cohort.teacher_id)
  // Clubs excluded on purpose — no per-student attendee list exists today.
  const teacherOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const a of ASSIGNMENTS) if (a.student_id === studentId) ids.add(a.teacher_id);
    for (const { cohort } of cohortsForStudent(studentId)) {
      if (cohort.teacher_id) ids.add(cohort.teacher_id);
    }
    return USERS.filter((u) => u.role === "teacher" && ids.has(u.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studentId]);

  const studentOptions = useMemo(
    () => USERS.filter((u) => u.role === "student" && u.id !== studentId)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [studentId],
  );

  const reset = () => {
    setTargetType("teacher");
    setTargetId("");
    setCategory("");
    setText("");
    setSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    !!targetId && !!category && text.trim().length > 0;

  const handleSubmit = () => {
    setError(null);
    if (!canSubmit) {
      setError("Please complete all fields before submitting.");
      return;
    }
    addConductReport({
      reporterId: studentId,
      targetType,
      targetId,
      category: category as ConductCategory,
      text,
    });
    setSubmitted(true);
  };

  const options = targetType === "teacher" ? teacherOptions : studentOptions;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: "#01304a" }} className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" style={{ color: "#f38934" }} />
            Report misconduct
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Thank you. Your report has been sent to the Verbo team for review.
            </p>
            <p className="text-xs text-muted-foreground">
              Remember: the reported person will never see your name, but the Verbo team knows
              who submitted this report so we can follow up if needed.
            </p>
            <DialogFooter>
              <PrimaryButton onClick={handleClose}>Close</PrimaryButton>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-lg border p-3 text-xs leading-relaxed"
              style={{
                backgroundColor: "rgba(243, 137, 52, 0.08)",
                borderColor: "rgba(243, 137, 52, 0.35)",
                color: "#01304a",
              }}
            >
              This report is <strong>anonymous to the person you are reporting</strong> — they
              will never see your name. The Verbo team does see your identity for follow-up
              and to keep the platform safe.
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Report type</label>
              <div className="flex gap-2">
                {(["teacher", "student"] as ConductTargetType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTargetType(t); setTargetId(""); }}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      targetType === t
                        ? "border-foreground bg-secondary text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {t === "teacher" ? "Report a teacher" : "Report a student"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                {targetType === "teacher" ? "Teacher" : "Student"}
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">
                  {targetType === "teacher"
                    ? teacherOptions.length === 0
                      ? "No teachers linked to your account"
                      : "Select a teacher"
                    : "Select a student"}
                </option>
                {options.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ConductCategory)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select a category</option>
                {CONDUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Details</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Describe what happened, when, and any relevant context."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <DialogFooter className="gap-2">
              <GhostButton onClick={handleClose}>Cancel</GhostButton>
              <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
                Send report
              </PrimaryButton>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
