"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, KeyRound, Loader2, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrentUser } from "@/hooks/use-auth";
import { useClearApiKey, useResetData, useSetApiKey, useUpdateProfile } from "@/hooks/use-settings";
import { ApiError } from "@/lib/api";

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const setApiKey = useSetApiKey();
  const clearApiKey = useClearApiKey();
  const resetData = useResetData();

  const [name, setName] = useState(user?.name ?? "");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [confirmText, setConfirmText] = useState("");

  if (!user) return null;

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate(
      { name: name.trim() || user!.name },
      { onSuccess: () => toast.success("Profile updated"), onError: () => toast.error("Couldn't save profile") }
    );
  }

  async function handleNotifyToggle(checked: boolean) {
    if (checked && typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications were blocked in your browser settings.");
        return;
      }
    }
    updateProfile.mutate(
      { notifyEnabled: checked },
      { onError: () => toast.error("Couldn't update notification setting") }
    );
  }

  function handleSaveApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setApiKey.mutate(apiKeyInput.trim(), {
      onSuccess: () => {
        toast.success("API key saved");
        setApiKeyInput("");
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save API key"),
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile, API key, and notifications." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" /> Profile
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Input value={user.role === "admin" ? "Admin" : "Student"} disabled />
            </div>
            <Button type="submit" className="w-fit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
              Save profile
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> Anthropic API key
          </CardTitle>
          <CardDescription>
            Used to generate lesson summaries with Claude. Stored encrypted, never shown again after saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm">
            {user.hasApiKey ? (
              <>
                <ShieldCheck className="size-4 text-primary" />
                <span>An API key is saved on your account.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-500" />
                <span>No API key saved — summaries will fail until you add one.</span>
              </>
            )}
          </div>
          <form onSubmit={handleSaveApiKey} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={setApiKey.isPending || !apiKeyInput.trim()}>
                {setApiKey.isPending && <Loader2 className="size-4 animate-spin" />}
                Save key
              </Button>
              {user.hasApiKey && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={clearApiKey.isPending}
                  onClick={() =>
                    clearApiKey.mutate(undefined, { onSuccess: () => toast.success("API key removed") })
                  }
                >
                  Remove
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>Get a browser notification when an assignment is due soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-toggle">Assignment reminders</Label>
            <Switch id="notify-toggle" checked={user.notifyEnabled} onCheckedChange={handleNotifyToggle} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete all of your lessons, subjects, and assignments. Your account stays active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog onOpenChange={(open) => !open && setConfirmText("")}>
            <AlertDialogTrigger render={<Button variant="destructive" />}>Reset all my data</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>This can&apos;t be undone</AlertDialogTitle>
                <AlertDialogDescription>
                  All lessons, transcripts, summaries, subjects, and assignments on your account will be
                  permanently deleted. Type <span className="font-mono font-semibold">RESET</span> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="RESET" />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmText !== "RESET" || resetData.isPending}
                  onClick={() =>
                    resetData.mutate(undefined, {
                      onSuccess: () => toast.success("All data reset"),
                      onError: () => toast.error("Couldn't reset data"),
                    })
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {resetData.isPending && <Loader2 className="size-4 animate-spin" />}
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
