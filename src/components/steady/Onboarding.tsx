import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { loadPlan, type Profile } from "@/lib/data";
import { CURRICULUM, type SubjectKey } from "@/lib/curriculum";
import { Card, Stepper } from "./kit";

export function Onboarding({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [start, setStart] = useState(profile.start_date);
  const [hours, setHours] = useState(profile.daily_target_minutes / 60);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectKey[]>(
    (profile.selected_subjects as SubjectKey[]) || [],
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleSubject = (subject: SubjectKey) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  const finish = async () => {
    if (selectedSubjects.length === 0) {
      setErr("Please select at least one subject.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await loadPlan({
        name: name.trim(),
        startDate: start,
        dailyMinutes: Math.round(hours * 60),
        selectedSubjects,
      });

      // Prefetch all queries to avoid loading states
      await Promise.all([
        qc.prefetchQuery({ queryKey: ["profile"] }),
        qc.prefetchQuery({ queryKey: ["tasks"] }),
        qc.prefetchQuery({ queryKey: ["subjects"] }),
      ]);

      await qc.invalidateQueries();
    } catch {
      setErr("The plan didn't load this time. Let's try once more.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="page-in w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2">
          <Leaf className="size-5 text-primary" />
          <span className="font-display text-lg">Steady</span>
          <span className="num ml-auto text-xs text-muted-foreground">{step + 1} / 4</span>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <h1 className="text-[28px] leading-tight">What should I call you?</h1>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="h-12 rounded-xl bg-surface-2"
            />
            <Button
              className="h-11 w-full rounded-xl"
              disabled={!name.trim()}
              onClick={() => setStep(1)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-[28px] leading-tight">Your rhythm</h1>
            <label className="block space-y-2">
              <span className="label-caps">Plan start date</span>
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-12 rounded-xl bg-surface-2"
              />
            </label>
            <div className="space-y-2">
              <span className="label-caps">Daily hours</span>
              <Stepper
                label="daily hours"
                value={hours}
                step={0.5}
                min={1}
                onChange={setHours}
                format={(v) => `${v} h`}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button className="h-11 flex-1 rounded-xl" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h1 className="text-[28px] leading-tight">What will you study?</h1>
            <p className="text-sm text-muted-foreground">
              Choose the subjects that matter to you. You can update this later.
            </p>
            <div className="space-y-3">
              {CURRICULUM.map((subject) => (
                <label
                  key={subject.key}
                  className="flex items-start gap-3 rounded-lg p-3 hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={selectedSubjects.includes(subject.key)}
                    onCheckedChange={() => toggleSubject(subject.key)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{subject.name}</div>
                    <div className="text-xs text-muted-foreground">{subject.tagline}</div>
                  </div>
                </label>
              ))}
            </div>
            {err && <p className="text-sm text-clay">{err}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="h-11 flex-1 rounded-xl"
                disabled={selectedSubjects.length === 0}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h1 className="text-[28px] leading-tight">Ready when you are, {name.trim()}.</h1>
            <div className="space-y-2 rounded-lg bg-surface-2 p-3">
              <p className="text-xs font-medium text-muted-foreground">Your plan:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.map((key) => {
                  const subject = CURRICULUM.find((s) => s.key === key);
                  return (
                    <div
                      key={key}
                      className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 text-xs"
                    >
                      <Check className="size-3" />
                      {subject?.name}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Starting {new Date(start).toLocaleDateString()} • {hours} hour
                {hours !== 1 ? "s" : ""}/day
              </p>
            </div>
            {err && <p className="text-sm text-clay">{err}</p>}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="h-11 rounded-xl"
                disabled={busy}
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button className="h-11 flex-1 rounded-xl" disabled={busy} onClick={finish}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Setting up your curriculum…
                  </>
                ) : (
                  "Begin your journey"
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
