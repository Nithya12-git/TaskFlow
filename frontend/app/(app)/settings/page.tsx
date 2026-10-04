"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Lock, User } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { WorkspaceForm } from "@/components/settings/WorkspaceForm";
import { SecurityForm } from "@/components/settings/SecurityForm";

type Tab = "profile" | "workspace" | "security";

const TABS = [
  { value: "profile" as const, label: "Profile", icon: User },
  { value: "workspace" as const, label: "Workspace", icon: Building2 },
  { value: "security" as const, label: "Security", icon: Lock },
];

function SettingsView() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(initial === "workspace" || initial === "security" ? initial : "profile");

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, workspace and account security." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "profile" && <ProfileForm />}
      {tab === "workspace" && <WorkspaceForm />}
      {tab === "security" && <SecurityForm />}
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsView />
    </Suspense>
  );
}