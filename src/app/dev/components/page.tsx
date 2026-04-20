"use client";

import React, { useState } from "react";

// Atoms
import {
  BackButton,
  SectionLabel,
  EyebrowLabel,
  LevelPill,
  StreakBadge,
  StatCard,
  EmptyState,
  GlowBlob,
  FAB,
} from "@/components/atoms";

// Molecules
import { CharacterAvatar } from "@/components/molecules/character-avatar";
import { KidRow } from "@/components/molecules/kid-row";
import {
  TaskCard,
  ApprovalRow,
  InviteCodeCard,
  FilterChipGroup,
  FormField,
  FadeUp,
  Confetti,
} from "@/components/molecules";

// Organisms
import { CelebrationOverlay, BadgeGrid } from "@/components/organisms";
import { StageProgress } from "@/components/organisms/stage-progress";
import { Section } from "@/components/organisms/section";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

/* ------------------------------------------------------------------ */

function ComponentCard({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-3 text-xs font-mono text-gray-500">{name}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function SectionHeader({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <h2
      className="mb-4 mt-10 rounded-lg px-4 py-2 text-lg font-bold text-white first:mt-0"
      style={{ background: color }}
    >
      {title}
    </h2>
  );
}

function ConfettiWrapper({ onDone }: { onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <Confetti duration={2000} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ComponentPlaygroundPage() {
  const [mode, setMode] = useState<"kid" | "parent">("kid");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [filterValue, setFilterValue] = useState("all");

  return (
    <div
      data-role={mode} data-theme="warm"
      className="min-h-screen bg-gray-50 p-6"
    >
      {/* Mode Toggle */}
      <div className="mb-6 flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <span className="text-sm font-semibold text-gray-700">Mode:</span>
        <button
          onClick={() => setMode("kid")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "kid"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Kid
        </button>
        <button
          onClick={() => setMode("parent")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "parent"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Parent
        </button>
      </div>

      {/* ============================================================ */}
      {/* ATOMS                                                         */}
      {/* ============================================================ */}
      <SectionHeader title="Atoms" color="#3B82F6" />

      <div className="grid gap-4">
        <ComponentCard name="BackButton">
          <BackButton />
          <BackButton variant="glass" />
        </ComponentCard>

        <ComponentCard name="SectionLabel">
          <SectionLabel as="h2">As H2</SectionLabel>
          <SectionLabel as="h3">As H3</SectionLabel>
          <SectionLabel as="span">As Span</SectionLabel>
        </ComponentCard>

        <ComponentCard name="EyebrowLabel">
          <EyebrowLabel>Default label</EyebrowLabel>
        </ComponentCard>

        <ComponentCard name="LevelPill">
          <LevelPill level={1} variant="default" size="sm" />
          <LevelPill level={5} variant="default" size="md" />
          <LevelPill level={10} variant="default" size="lg" />
          <LevelPill level={15} variant="accent" size="sm" />
          <LevelPill level={20} variant="accent" size="md" />
          <LevelPill level={25} variant="accent" size="lg" />
          <LevelPill level={28} variant="outline" size="sm" />
          <LevelPill level={29} variant="outline" size="md" />
          <LevelPill level={30} variant="outline" size="lg" />
        </ComponentCard>

        <ComponentCard name="StreakBadge">
          <StreakBadge days={0} size="sm" />
          <StreakBadge days={3} size="sm" />
          <StreakBadge days={15} size="sm" />
          <StreakBadge days={0} size="md" />
          <StreakBadge days={3} size="md" />
          <StreakBadge days={15} size="md" />
          <StreakBadge days={0} size="lg" />
          <StreakBadge days={3} size="lg" />
          <StreakBadge days={15} size="lg" />
        </ComponentCard>

        <ComponentCard name="StatCard">
          <StatCard variant="default" label="Points" value="1,250" />
          <StatCard variant="accent" label="Level" value="12" />
          <StatCard variant="muted" label="Streak" value="7 days" />
        </ComponentCard>

        <ComponentCard name="EmptyState">
          <EmptyState variant="default" title="No tasks yet" description="Create your first task to get started." />
        </ComponentCard>
        <ComponentCard name="EmptyState (compact)">
          <EmptyState variant="compact" title="Nothing here" description="Check back later." />
        </ComponentCard>
        <ComponentCard name="EmptyState (card)">
          <EmptyState variant="card" title="Empty" description="No items to display." />
        </ComponentCard>

        <ComponentCard name="GlowBlob">
          <div className="relative h-24 w-full overflow-hidden rounded-lg bg-gray-900">
            <GlowBlob size="sm" />
            <GlowBlob size="md" />
            <GlowBlob size="lg" />
          </div>
        </ComponentCard>

        <ComponentCard name="FAB">
          <FAB variant="primary" onClick={() => {}} />
          <FAB variant="secondary" onClick={() => {}} />
        </ComponentCard>

        <Separator className="my-4" />

        {/* shadcn basics */}
        <ComponentCard name="Button (shadcn)">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </ComponentCard>

        <ComponentCard name="Input (shadcn)">
          <Input placeholder="Type something..." className="max-w-xs" />
          <Input placeholder="Disabled" disabled className="max-w-xs" />
        </ComponentCard>

        <ComponentCard name="Badge (shadcn)">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </ComponentCard>

        <ComponentCard name="Progress (shadcn)">
          <div className="w-full space-y-2">
            <Progress value={0} />
            <Progress value={33} />
            <Progress value={66} />
            <Progress value={100} />
          </div>
        </ComponentCard>

        <ComponentCard name="Avatar (shadcn)">
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>TK</AvatarFallback>
          </Avatar>
        </ComponentCard>

        <ComponentCard name="Separator (shadcn)">
          <div className="w-full">
            <p className="text-sm">Above</p>
            <Separator className="my-2" />
            <p className="text-sm">Below</p>
          </div>
        </ComponentCard>

        <ComponentCard name="Skeleton (shadcn)">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-20 w-full" />
        </ComponentCard>

        <ComponentCard name="Tabs (shadcn)">
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content for tab 1</TabsContent>
            <TabsContent value="tab2">Content for tab 2</TabsContent>
            <TabsContent value="tab3">Content for tab 3</TabsContent>
          </Tabs>
        </ComponentCard>

        <ComponentCard name="ToggleGroup (shadcn)">
          <ToggleGroup type="single" defaultValue="a">
            <ToggleGroupItem value="a">Option A</ToggleGroupItem>
            <ToggleGroupItem value="b">Option B</ToggleGroupItem>
            <ToggleGroupItem value="c">Option C</ToggleGroupItem>
          </ToggleGroup>
        </ComponentCard>
      </div>

      {/* ============================================================ */}
      {/* MOLECULES                                                     */}
      {/* ============================================================ */}
      <SectionHeader title="Molecules" color="#10B981" />

      <div className="grid gap-4">
        <ComponentCard name="CharacterAvatar">
          <CharacterAvatar characterId="fox" size="sm" />
          <CharacterAvatar characterId="rabbit" size="md" />
          <CharacterAvatar characterId="bear" size="lg" />
          <CharacterAvatar characterId="fox" size="xl" showLevel level={12} />
        </ComponentCard>

        <ComponentCard name="KidRow">
          <div className="w-full space-y-2">
            <KidRow
              name="Luna"
              characterId="fox"
              level={5}
              progress={60}
              completedCount={3}
              totalCount={5}
              href="/dev/components"
              interactive
            />
            <KidRow
              name="Max"
              characterId="rabbit"
              level={12}
              progress={80}
              completedCount={4}
              totalCount={5}
              href="/dev/components"
              interactive
            />
          </div>
        </ComponentCard>

        <ComponentCard name="TaskCard">
          <div className="w-full space-y-3">
            <TaskCard title="Brush teeth" points={10} status="pending" />
            <TaskCard title="Make bed" points={5} status="completed" />
            <TaskCard title="Do homework" points={20} status="overdue" />
            <TaskCard title="Clean room" points={15} status="pardoned" />
          </div>
        </ComponentCard>

        <ComponentCard name="ApprovalRow">
          <div className="w-full space-y-3">
            <ApprovalRow
              childName="Luna"
              taskTitle="Extra Math Practice"
              points={25}
              status="pending"
              onApprove={() => {}}
              onReject={() => {}}
            />
            <ApprovalRow
              childName="Max"
              taskTitle="Help with dishes"
              points={10}
              status="approved"
            />
            <ApprovalRow
              childName="Luna"
              taskTitle="Walk the dog"
              points={15}
              status="rejected"
            />
          </div>
        </ComponentCard>

        <ComponentCard name="InviteCodeCard">
          <InviteCodeCard code="ABC12345" />
        </ComponentCard>

        <ComponentCard name="FilterChipGroup">
          <FilterChipGroup
            options={[
              { value: "all", label: "All", count: 12 },
              { value: "pending", label: "Pending", count: 5 },
              { value: "completed", label: "Completed", count: 7 },
            ]}
            value={filterValue}
            onValueChange={setFilterValue}
          />
        </ComponentCard>

        <ComponentCard name="FormField">
          <div className="w-full space-y-3">
            <FormField label="Task name" hint="Keep it short and fun">
              <Input placeholder="e.g. Brush teeth" />
            </FormField>
            <FormField label="Points" error="Points must be a number" required>
              <Input placeholder="10" defaultValue="abc" />
            </FormField>
          </div>
        </ComponentCard>

        <ComponentCard name="FadeUp">
          <FadeUp>
            <div className="rounded-lg bg-purple-100 p-4 text-sm text-purple-700">
              This content animates in with FadeUp
            </div>
          </FadeUp>
        </ComponentCard>

        <ComponentCard name="Confetti">
          <Button onClick={() => setShowConfetti(true)}>Trigger Confetti</Button>
          {showConfetti && <ConfettiWrapper onDone={() => setShowConfetti(false)} />}
        </ComponentCard>
      </div>

      {/* ============================================================ */}
      {/* ORGANISMS                                                     */}
      {/* ============================================================ */}
      <SectionHeader title="Organisms" color="#8B5CF6" />

      <div className="grid gap-4">
        <ComponentCard name="CelebrationOverlay">
          <Button onClick={() => setShowCelebration(true)}>
            Trigger Celebration
          </Button>
          <CelebrationOverlay
            open={showCelebration}
            onClose={() => setShowCelebration(false)}
            points={50}
            taskTitle="Clean your room"
            levelUp={{ from: 4, to: 5 }}
            characterId="fox"
          />
        </ComponentCard>

        <ComponentCard name="BadgeGrid">
          <BadgeGrid
            badges={[
              { id: "1", emoji: "🌟", name: "First Task", earned: true, earnedAt: "2024-01-01" },
              { id: "2", emoji: "🔥", name: "Hot Streak", earned: true, earnedAt: "2024-01-05" },
              { id: "3", emoji: "🏆", name: "Champion", earned: false },
              { id: "4", emoji: "💎", name: "Diamond", earned: false },
              { id: "5", emoji: "🎯", name: "Bullseye", earned: true, earnedAt: "2024-01-10" },
              { id: "6", emoji: "🚀", name: "Rocket", earned: false },
            ]}
          />
        </ComponentCard>

        <ComponentCard name="StageProgress">
          <div className="w-full space-y-6">
            <StageProgress
              currentStage={1}
              stages={[
                { name: "Egg", minLevel: 1 },
                { name: "Baby", minLevel: 6 },
                { name: "Youth", minLevel: 12 },
                { name: "Adult", minLevel: 20 },
                { name: "Master", minLevel: 26 },
              ]}
            />
            <StageProgress
              currentStage={3}
              stages={[
                { name: "Egg", minLevel: 1 },
                { name: "Baby", minLevel: 6 },
                { name: "Youth", minLevel: 12 },
                { name: "Adult", minLevel: 20 },
                { name: "Master", minLevel: 26 },
              ]}
            />
            <StageProgress
              currentStage={5}
              stages={[
                { name: "Egg", minLevel: 1 },
                { name: "Baby", minLevel: 6 },
                { name: "Youth", minLevel: 12 },
                { name: "Adult", minLevel: 20 },
                { name: "Master", minLevel: 26 },
              ]}
            />
          </div>
        </ComponentCard>

        <ComponentCard name="Section">
          <div className="w-full">
            <Section title="Today's Tasks" count={3} hint="Keep going!">
              <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
                Sample section content goes here
              </div>
            </Section>
          </div>
        </ComponentCard>
      </div>

      {/* Bottom spacer */}
      <div className="h-20" />
    </div>
  );
}
