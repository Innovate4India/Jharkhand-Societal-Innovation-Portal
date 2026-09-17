"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Coins,
  FilePlus2,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import {
  createChallenge,
  detectUrgency,
  getChallenges,
  getCurrentUser,
  clearAuthToken,
  getAuthToken,
  getCurrentUserFromStorage,
  getMyRewards,
  redeemMyReward,
  saveCurrentUser,
  reverseGeocode,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import ChallengesPage from "@/components/challenges-page";
import GovernmentDashboard from "@/components/government-dashboard";
import UniversityDashboard from "@/components/university-dashboard";
import IndustryDashboard from "@/components/industry-dashboard";
import SahayakChat, { OfflineHomepageSahayak } from "@/components/sahayak-chat";
import DashboardShell from "@/components/dashboard-shell";

type View =
  | "home"
  | "citizen"
  | "government"
  | "university"
  | "industry"
  | "submit"
  | "challenges";
type Role = "Citizen" | "Government" | "University" | "Industry";

const districts = [
  "Bokaro",
  "Chatra",
  "Deoghar",
  "Dhanbad",
  "Dumka",
  "East Singhbhum",
  "Garhwa",
  "Giridih",
  "Godda",
  "Gumla",
  "Hazaribagh",
  "Jamtara",
  "Khunti",
  "Koderma",
  "Latehar",
  "Lohardaga",
  "Pakur",
  "Palamu",
  "Ramgarh",
  "Ranchi",
  "Sahibganj",
  "Seraikela-Kharsawan",
  "Simdega",
  "West Singhbhum",
];
const categories = [
  "Education",
  "Healthcare",
  "Agriculture",
  "Water & Sanitation",
  "Sanitation",
  "Environment",
  "Energy",
  "Urban Development",
  "Accessibility",
  "Public Administration",
  "Rural Livelihoods",
];

function Sidebar({
  view,
  setView,
  role,
  open,
  setOpen,
  onGovernmentAction,
  onLogout,
}: {
  view: View;
  setView: (v: View) => void;
  role: Role;
  open: boolean;
  setOpen: (v: boolean) => void;
  onGovernmentAction: (action: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 max-w-[calc(100vw-1rem)] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-[#123F8C] bg-[#06245C] px-5 py-6 text-white transition-[width,transform,padding,border] duration-250 ease-in-out lg:static lg:translate-x-0",
        open
          ? "translate-x-0"
          : "-translate-x-full border-r-0 px-0 lg:w-0 lg:translate-x-0",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[#E31E24] text-white">
            <Sparkles className="size-5" />
          </span>
          <span>
            <strong className="block text-sm text-white">Jharkhand</strong>
            <span className="block text-xs font-medium text-blue-200">
              Innovation Portal
            </span>
          </span>
        </button>
        <button
          className="grid size-9 place-items-center rounded-lg text-white/80 transition hover:bg-[#0B2D6B] hover:text-white"
          onClick={() => setOpen(false)}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="size-5" />
        </button>
      </div>
      <div className="mt-9 rounded-xl bg-[#0B2D6B] p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-blue-200">
          Signed in as
        </p>
        <p className="text-sm font-semibold text-white">{role}</p>
      </div>
      <nav className="mt-8 flex flex-col gap-2">
        <button
          onClick={() => setView(role === "Government" ? "government" : role === "University" ? "university" : role === "Industry" ? "industry" : "citizen")}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
            (view === "citizen" || view === "government" || view === "university")
              ? "bg-[#E31E24] text-white"
              : "text-white/80 hover:bg-[#0B2D6B] hover:text-white",
          )}
        >
          <LayoutDashboard className="size-4" />
          {role === "Government" ? "Government dashboard" : role === "University" ? "University dashboard" : role === "Industry" ? "Industry dashboard" : "My dashboard"}
        </button>
        {role === "Citizen" && (
          <>
            <button
              onClick={() => setView("challenges")}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                view === "challenges"
                  ? "bg-[#E31E24] text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Flag className="size-4" />
              Browse challenges
            </button>
            <button
              onClick={() => setView("submit")}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                view === "submit"
                  ? "bg-[#E31E24] text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <FilePlus2 className="size-4" />
              Submit a problem
            </button>
          </>
        )}
        {role === "Government" && (
          <>
            {["Review challenges", "Assign university", "Funding", "Projects", "Analytics"].map((label) => (
              <button key={label} onClick={() => onGovernmentAction(label)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/80 hover:bg-[#0B2D6B] hover:text-white">
                <Flag className="size-4" />
                {label}
              </button>
            ))}
          </>
        )}
        {role === "University" && (
          <>
            {["Assigned challenges", "Projects", "Faculty mentors", "Student teams", "Progress tracking", "Completed solutions"].map((label) => (
              <button key={label} onClick={() => setView("university")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/80 hover:bg-[#0B2D6B] hover:text-white">
                <Flag className="size-4" />
                {label}
              </button>
            ))}
          </>
        )}
        {role === "Industry" && <button onClick={() => setView("industry")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/80 hover:bg-[#0B2D6B] hover:text-white"><BriefcaseBusiness className="size-4" />Sponsorship opportunities</button>}
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="mobile-sidebar-logout mt-4 min-h-11 items-center gap-3 rounded-xl border border-red-300/30 px-3 py-3 text-left text-sm font-semibold text-red-100 transition hover:bg-red-500/20 hover:text-white"
      >
        <LogOut className="size-4" />
        Logout
      </button>
      <div className="mt-auto rounded-2xl border border-white/10 bg-[#0B2D6B] p-4">
        <ShieldCheck className="size-5 text-red-200" />
        <p className="mt-3 text-sm font-semibold text-white">
          Build a better Jharkhand
        </p>
        <p className="mt-1 text-xs leading-5 text-blue-100">
          Share an idea, collaborate, and make a measurable difference.
        </p>
      </div>
    </aside>
  );
}
function Topbar({
  title,
  open,
  setOpen,
  userName,
  isCitizen,
  rewardRefreshToken,
  onLogout,
}: {
  title: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  userName?: string;
  isCitizen: boolean;
  rewardRefreshToken: number;
  onLogout: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [impactTokens, setImpactTokens] = useState<number | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(false);

  useEffect(() => {
    if (!isCitizen) return;
    let active = true;
    setLoadingRewards(true);
    void getMyRewards().then((response) => {
      if (!active) return;
      if (response.success) {
        setImpactTokens(response.data?.summary.impactTokens ?? 0);
      } else {
        setImpactTokens((previous) => previous ?? 0);
      }
      setLoadingRewards(false);
    });
    return () => {
      active = false;
    };
  }, [isCitizen, rewardRefreshToken]);

  return (
    <header className="mobile-portal-header flex h-20 min-w-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {!open && (
          <button
            className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeftOpen className="size-5" />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-400">
            Jharkhand Societal Innovation Portal
          </p>
          <h1 className="truncate text-lg font-bold text-slate-950">{title}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <Search className="hidden size-4 text-slate-400 sm:block" />
        <Bell className="size-4 text-slate-500" />
        {isCitizen && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 sm:px-2.5 ${loadingRewards ? "animate-pulse" : ""}`}
            aria-label={`${impactTokens ?? 0} Impact Tokens`}
            title={`${impactTokens ?? 0} Impact Tokens`}
          >
            <Coins className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Impact Tokens:</span>
            <span>{impactTokens ?? 0}</span>
          </span>
        )}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="hidden border-l border-slate-200 pl-4 text-sm font-semibold text-slate-700 sm:block"
          >
            {userName || "User"}{" "}
            <ChevronDown className="ml-1 inline size-4 text-slate-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
              <button
                onClick={onLogout}
                className="w-full px-4 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Home({ setView }: { setView: (v: View) => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-4 sm:px-10">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-3"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-800 text-white">
            <Sparkles className="size-5" />
          </span>
          <span className="text-left">
            <strong className="block text-sm text-slate-950">Jharkhand</strong>
            <span className="text-xs font-medium text-emerald-700">
              Innovation Portal
            </span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("challenges")}
            className="hidden px-3 py-2 text-sm font-semibold text-slate-600 sm:block"
          >
            Explore problems
          </button>
          <Link
            href="/login"
            className="hidden px-3 py-2 text-sm font-semibold text-slate-600 sm:block"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Open portal
          </Link>
        </div>
      </header>
      <main>
        <section className="home-hero relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-[#06245C] px-5 py-16 text-white sm:px-10 lg:py-24">
          {/* <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: "url('/images/jharkhand-statue.jpg')" }}
          /> */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 bg-cover bg-[center_30%] opacity-20 md:bg-[center_25%]"
  style={{ backgroundImage: "url('/images/jharkhand-statue.jpg')" }}
/>

          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#06245C]/10" />
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200/30 bg-[#0B2D6B]/80 px-3 py-1.5 text-xs font-bold text-orange-100">
              {/* <span className="size-1.5 rounded-full bg-orange-500" />A platform
              for collective action */}
              <span className="size-1.5 rounded-full bg-orange-500" />
<span className="typewriter-text">A platform for collective action</span>
            </div>
            <h1 className="max-w-2xl text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Local problems.
              <br />
              <span className="text-emerald-200">Shared solutions.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              A trusted space where citizens, government and universities come
              together to create a more resilient Jharkhand.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={() => setView("submit")}
                className="rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
              >
                Share a problem <span className="ml-2">→</span>
              </button>
              <button
                onClick={() => setView("challenges")}
                className="rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white"
              >
                Explore challenges
              </button>
            </div>
          </div>
        </section>
        <OfflineHomepageSahayak />
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-10">
          <div className="grid gap-5 border-t border-slate-200 pt-12 sm:grid-cols-4">
            {[
              "Citizens share local problems",
              "AI categorizes and prioritizes",
              "Partners collaborate on solutions",
              "Communities see change",
            ].map((text, i) => (
              <div key={text}>
                <span className="text-sm font-bold text-orange-700">
                  0{i + 1}
                </span>
                <p className="mt-3 font-bold text-slate-950">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Submit({ setView }: { setView: (v: View) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [submittedChallenge, setSubmittedChallenge] = useState<{ id: string; status: string; files: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [urgencySource, setUrgencySource] = useState<'ai_detected' | 'manually_adjusted' | 'fallback'>('fallback');
  const [urgencyReason, setUrgencyReason] = useState("");
  const [detectingUrgency, setDetectingUrgency] = useState(false);
  const [urgencyManuallyAdjusted, setUrgencyManuallyAdjusted] = useState(false);
  const [affected, setAffected] = useState("");
  const [expectedImpact, setExpectedImpact] = useState("");
  const [locationText, setLocationText] = useState("");
  const [touched, setTouched] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [capturingLocation, setCapturingLocation] = useState(false);
  const required =
    !title.trim() || !description.trim() || !category || !district;
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const villageOrCity = String(formData.get('villageOrCity') || '').trim();
    if (required || submitting) return;
    if (!selectedFiles.length) {
      setError('Please upload at least one photo, video, or document as supporting evidence.');
      return;
    }
    if (contactNumber && !/^[6-9]\d{9}$/.test(contactNumber)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    const finalUrgency = urgency.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const priority = finalUrgency.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
    if (!['low', 'medium', 'high', 'critical'].includes(priority)) return;
    setSubmitting(true);
    const response = await createChallenge({
      title: title.trim(),
      description: description.trim(),
      category,
      district,
      villageOrCity,
      priority,
      urgency: finalUrgency,
      urgencySource,
      urgencyReason,
      affected: affected.trim(),
      expectedImpact: expectedImpact.trim(),
      ...(contactNumber ? { citizenContactNumber: contactNumber } : {}),
      ...(locationCoordinates ? { location: locationCoordinates } : {}),
    }, selectedFiles);
    setSubmitting(false);
    if (!response.success) {
      setError(response.message || 'Unable to submit challenge. Please try again.');
      return;
    }
    if (response.data) {
      setSubmittedChallenge({ id: response.data._id, status: response.data.status, files: selectedFiles.map((file) => file.name) });
    }
    setSubmitted(true);
  }
  async function detectProblemUrgency() {
    if (urgencyManuallyAdjusted || !title.trim() || !description.trim() || detectingUrgency) return;
    setDetectingUrgency(true);
    const response = await detectUrgency({
      title: title.trim(),
      description: description.trim(),
      category,
      affected: affected.trim(),
      expectedImpact: expectedImpact.trim(),
      location: locationText.trim(),
    });
    setDetectingUrgency(false);
    if (!response.success || !response.data) {
      setUrgency('Medium');
      setUrgencySource('fallback');
      setUrgencyReason('Automatic detection was unavailable. Medium urgency was used.');
      return;
    }
    setUrgency(response.data.urgency[0] + response.data.urgency.slice(1).toLowerCase());
    setUrgencySource('ai_detected');
    setUrgencyReason(response.data.reason);
  }
  if (submitted)
    return (
      <div className="min-h-full bg-slate-50 p-5 sm:p-8">
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="size-7" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-emerald-700">
            Challenge submitted
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            Thank you for speaking up.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Your challenge has been recorded and will be reviewed by our team
            before being assigned to the right institutions.
          </p>
          <div className="mt-8 grid gap-3 rounded-xl bg-slate-50 p-5 text-left sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Challenge ID
              </p>
              <p className="mt-1 font-bold text-slate-950">{submittedChallenge?.id || 'Created successfully'}</p>
            </div>
            {submittedChallenge?.files.length ? (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Uploaded files</p>
                <p className="mt-2 text-sm text-emerald-900">{submittedChallenge.files.join(', ')}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current status
              </p>
              <p className="mt-1 font-bold text-amber-700">
                {submittedChallenge?.status === 'under_review' ? 'Under Government Review' : 'Submitted'}
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-500">
            Next, our reviewers will validate the details, identify potential
            collaborators, and notify you when the challenge progresses.
          </p>
          <button
            onClick={() => setView("citizen")}
            className="mt-8 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  return (
    <div className="min-h-full bg-slate-50 p-5 sm:p-8">
      <button
        onClick={() => setView("citizen")}
        className="text-sm font-bold text-emerald-800"
      >
        ← Back to dashboard
      </button>
      <div className="mx-auto mt-7 max-w-3xl">
        <h2 className="text-3xl font-bold text-slate-950">
          Submit a Community Challenge
        </h2>
        <p className="mt-2 text-slate-500">
          Your lived experience can help create a better solution.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Problem title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                placeholder="Give your problem a clear title"
              />
              {touched && !title.trim() && (
                <span className="text-xs font-normal text-red-600">
                  Please add a title.
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Detailed problem description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={detectProblemUrgency}
                className="min-h-32 rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                placeholder="Describe what is happening, where, and why it matters."
              />
              {touched && !description.trim() && (
                <span className="text-xs font-normal text-red-600">
                  Please describe the challenge.
                </span>
              )}
            </label>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Impact area / category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                District
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal outline-none"
                >
                  <option value="">Select district</option>
                  {districts.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Location{" "}
              <span className="flex flex-col gap-2 sm:flex-row">
                <input
                  name="villageOrCity"
                  value={locationText}
                  onChange={(event) => setLocationText(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                  placeholder="Village, ward, landmark or block"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-3 text-xs font-bold text-slate-600 sm:py-0"
                  disabled={capturingLocation}
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setLocationMessage('Location could not be captured. You can continue without location.');
                      return;
                    }
                    setCapturingLocation(true);
                    setLocationMessage('');
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        setLocationCoordinates({
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude,
                        });
                        const response = await reverseGeocode(position.coords.latitude, position.coords.longitude);
                        if (response.success && response.data) {
                          const address = [
                            response.data.village,
                            response.data.ward,
                            response.data.town || response.data.city,
                            response.data.district,
                            response.data.state,
                            response.data.country,
                          ].filter(Boolean).join(', ') || response.data.displayName;
                          if (address) setLocationText(address);
                          setLocationMessage(address ? 'Location captured successfully.' : 'Unable to detect your location. Please enter your location manually.');
                        } else {
                          setLocationMessage('Unable to detect your location. Please enter your location manually.');
                        }
                        setCapturingLocation(false);
                      },
                      () => {
                        setLocationCoordinates(null);
                        setLocationMessage('Location could not be captured. You can continue without location.');
                        setCapturingLocation(false);
                      },
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
                    );
                  }}
                >
                  {capturingLocation ? 'Capturing...' : 'Use my location'}
                </button>
              </span>
              {locationMessage && (
                <span className={`text-xs font-normal ${locationCoordinates ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {locationMessage}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Contact number
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                placeholder="Enter your mobile number"
              />
              <span className="text-xs font-normal text-slate-500">
                Government officials may contact you to verify or clarify your submission.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Photo, video or document (required){" "}
              <span className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
                <UploadCloud className="size-6 text-slate-400" />
                <span className="text-sm font-semibold text-slate-600">
                  Upload supporting files
                </span>
                <span className="text-xs font-normal text-slate-400">
                  JPG, JPEG, PNG, PDF or MP4 · up to 25 MB each
                </span>
                <input
                  type="file"
                  name="files"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.mp4,image/jpeg,image/png,application/pdf,video/mp4"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    const allowed = /\.(jpe?g|png|pdf|mp4)$/i;
                    const invalid = files.find((file) => !allowed.test(file.name) || file.size > 25 * 1024 * 1024);
                    if (invalid) {
                      setError(`${invalid.name} is unsupported or larger than 25 MB.`);
                      setSelectedFiles([]);
                      event.currentTarget.value = '';
                      return;
                    }
                    if (files.length > 5) {
                      setError('You can upload up to 5 files.');
                      setSelectedFiles([]);
                      event.currentTarget.value = '';
                      return;
                    }
                    setError('');
                    setSelectedFiles(files);
                  }}
                  className="block w-full text-sm font-normal text-slate-600"
                />
                {selectedFiles.length > 0 && (
                  <ul className="mt-2 w-full space-y-1 text-left text-xs text-slate-600">
                    {selectedFiles.map((file, index) => (
                      <li key={`${file.name}-${file.lastModified}`} className="flex items-start justify-between gap-2 rounded bg-white px-2 py-1">
                        <span className="min-w-0 break-words">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button type="button" onClick={() => setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="font-bold text-red-600">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </span>
            </label>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Who is affected?
                <input
                  value={affected}
                  onChange={(event) => setAffected(event.target.value)}
                  className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                  placeholder="People, communities or groups"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Urgency
                <select
                  value={urgency}
                  onChange={(e) => {
                    setUrgency(e.target.value);
                    setUrgencySource('manually_adjusted');
                    setUrgencyManuallyAdjusted(true);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal outline-none"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
                {detectingUrgency ? (
                  <span className="text-xs font-normal text-slate-500">AI is analyzing problem severity...</span>
                ) : urgencySource === 'ai_detected' ? (
                  <span className="text-xs font-normal text-emerald-700">AI detected: {urgency.toUpperCase()}</span>
                ) : urgencySource === 'manually_adjusted' ? (
                  <span className="text-xs font-normal text-slate-500">Manually adjusted</span>
                ) : null}
                {urgencyReason && <span className="text-xs font-normal text-slate-500">Reason: {urgencyReason}</span>}
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Expected impact
              <textarea
                value={expectedImpact}
                onChange={(event) => setExpectedImpact(event.target.value)}
                onBlur={detectProblemUrgency}
                className="min-h-24 rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                placeholder="What would improve if this challenge were solved?"
              />
            </label>
            <div className="border-t border-slate-100 pt-6">
              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <p className="text-xs leading-5 text-slate-500">
                Submitted challenges are reviewed by the portal team before
                being assigned to universities, government departments or
                industry partners.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
              >
                {submitting ? 'Submitting...' : 'Submit Challenge'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ setView, onRewardsChanged }: { setView: (v: View) => void; onRewardsChanged: () => void }) {
  const currentUser = getCurrentUserFromStorage();
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [submittedChallenges, setSubmittedChallenges] = useState<Array<{ _id: string; title: string; status: string }>>([]);
  const [rewards, setRewards] = useState<Awaited<ReturnType<typeof getMyRewards>>['data']>(undefined);
  const [rewardMessage, setRewardMessage] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  function getCitizenStatus(status: string) {
    const normalized = String(status || '').trim().toLowerCase();
    return ['completed', 'resolved'].includes(normalized) ? 'COMPLETE' : 'PENDING';
  }

  useEffect(() => {
    async function loadSubmittedChallenges() {
      if (!currentUser?._id) {
        setSubmittedCount(0);
        return;
      }
      const [response, rewardsResponse] = await Promise.all([getChallenges(), getMyRewards()]);
      if (rewardsResponse.success) setRewards(rewardsResponse.data);
      if (!response.success) {
        setSubmittedCount(0);
        return;
      }
      const allChallenges = response.data || [];
      const myChallenges = allChallenges.filter((challenge) => {
        const submittedById = (challenge.submittedBy as { _id?: string } | undefined)?._id;
        return submittedById === currentUser._id;
      });
      setSubmittedChallenges(myChallenges.map((challenge) => ({
        _id: challenge._id,
        title: challenge.title,
        status: getCitizenStatus(challenge.status),
      })));
      setSubmittedCount(myChallenges.length);
    }
    void loadSubmittedChallenges();
  }, [currentUser?._id]);

  async function redeemReward() {
    if (redeeming) return;
    setRedeeming(true);
    setRewardMessage('');
    const response = await redeemMyReward();
    if (!response.success) {
      setRewardMessage(response.message || 'Unable to redeem the demo reward.');
    } else {
      const refreshed = await getMyRewards();
      if (refreshed.success) {
        setRewards(refreshed.data);
        onRewardsChanged();
      }
      setRewardMessage('Virtual Cash Reward added to your portal balance. No real bank or UPI transfer was made.');
    }
    setRedeeming(false);
  }

  return (
    <DashboardShell
      eyebrow="Citizen dashboard"
      title="Your community dashboard"
      greeting={`Good morning, ${currentUser?.name || "there"}`}
      subtitle="Track your submitted problems with a simple status update."
      stats={[
        { label: "Problems submitted", value: submittedCount === null ? "—" : String(submittedCount), note: "Submitted by you", icon: FileText },
        { label: "Current status", value: submittedChallenges.some((challenge) => challenge.status === 'COMPLETE') ? 'COMPLETE' : 'PENDING', note: 'Latest visible update', icon: CheckCircle2 },
      ]}
      showCitizenTagline
      actions={<button onClick={() => setView("submit")} className="rounded-lg bg-[#E31E24] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#C8171D]">Submit a problem</button>}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-bold text-slate-950">Your submitted problems</h3>
        <div className="mt-4 space-y-3">
          {submittedChallenges.length ? submittedChallenges.map((challenge) => (
            <div key={challenge._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 flex-1 break-words font-bold text-slate-800">Problem: {challenge.title}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${challenge.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                  {challenge.status}
                </span>
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">Your submitted problems will appear here.</p>}
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">Impact Rewards</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div><p className="text-xs font-semibold text-emerald-700">Impact Tokens</p><p className="mt-1 text-3xl font-bold text-emerald-950">{rewards?.summary.impactTokens ?? '—'}</p></div>
          <div><p className="text-xs font-semibold text-emerald-700">Verified Problems</p><p className="mt-1 text-3xl font-bold text-emerald-950">{rewards?.summary.totalVerifiedProblems ?? '—'}</p></div>
          <div><p className="text-xs font-semibold text-emerald-700">Redeemable</p><p className="mt-1 text-3xl font-bold text-emerald-950">₹{rewards?.summary.rewardAmount ?? 0}</p></div>
          <div><p className="text-xs font-semibold text-emerald-700">Virtual Cash Balance</p><p className="mt-1 text-3xl font-bold text-emerald-950">₹{rewards?.summary.virtualCashBalance ?? 0}</p></div>
        </div>
        {rewards && <div className="mt-4"><p className="text-sm text-emerald-900">Progress: {rewards.summary.nextRewardTokens} / 50 tokens</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${(rewards.summary.nextRewardTokens / 50) * 100}%` }} /></div></div>}
        <div className="mt-4 rounded-xl border border-emerald-200 bg-white/60 p-4 text-sm text-emerald-900">
          <p className="font-bold">How it works</p>
          <p className="mt-1">Every valid problem verified by the Government earns you 1 Impact Token. Collect 50 Impact Tokens to redeem ₹500 virtual cash.</p>
          <p className="mt-2 font-semibold">50 Tokens = ₹500 · 100 Tokens = ₹1,000 · 150 Tokens = ₹1,500</p>
        </div>
        <p className="mt-4 text-sm font-bold text-emerald-800">Virtual Cash Reward</p>
        <p className="mt-1 text-xs font-semibold text-emerald-800">Rewards are currently virtual/demo cash inside the portal. No real bank or UPI transfer is made.</p>
        {rewards?.summary.rewardAmount ? <button type="button" onClick={redeemReward} disabled={redeeming} className="mt-4 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{redeeming ? 'Redeeming...' : `Redeem ₹${rewards.summary.rewardAmount}`}</button> : null}
        {rewardMessage && <p className="mt-3 text-sm text-emerald-900">{rewardMessage}</p>}
        {rewards?.history.length ? <div className="mt-5 border-t border-emerald-100 pt-4"><p className="text-sm font-bold text-emerald-900">Reward History</p><div className="mt-2 space-y-2">{rewards.history.map((item) => <p key={`${item.redeemedAt}-${item.rewardAmount}`} className="text-sm text-emerald-800">₹{item.rewardAmount} · {item.tokensRedeemed} Impact Tokens · Virtual Cash Reward · Redeemed on {new Date(item.redeemedAt).toLocaleDateString('en-GB')}</p>)}</div></div> : null}
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-700">
          Have a local concern?
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-950">
          Your voice can start a solution.
        </h3>
        <button onClick={() => setView("submit")} className="mt-5 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">Submit a problem</button>
      </div>
    </DashboardShell>
  );
}

export default function PortalShell() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [role, setRole] = useState<Role>("Citizen");
  const [authenticated, setAuthenticated] = useState(false);
  const [open, setOpen] = useState(true);
  const [governmentAction, setGovernmentAction] = useState('');
  const [rewardRefreshToken, setRewardRefreshToken] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setOpen(false);
    }
  }, []);
  const guardedSetView = (nextView: View) => {
    if (nextView !== "home" && !authenticated) {
      router.replace("/login");
      return;
    }
    if ((nextView === "submit" || nextView === "challenges") && role !== "Citizen") {
      setView(role === "Government" ? "government" : role === "University" ? "university" : role === "Industry" ? "industry" : "citizen");
      return;
    }
    setView(nextView);
  };
  useEffect(() => {
    async function restoreSession() {
      if (!getAuthToken()) return;
      const storedUser = getCurrentUserFromStorage();
      const response = storedUser ? { success: true, data: { user: storedUser } } : await getCurrentUser();
      if (!response.success || !response.data?.user) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const userRole = response.data.user.role;
      if (!["citizen", "government", "university", "industry"].includes(userRole)) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const nextRole = userRole === "government" ? "Government" : userRole === "university" ? "University" : userRole === "industry" ? "Industry" : "Citizen";
      setRole(nextRole);
      setAuthenticated(true);
      setView(nextRole === "Government" ? "government" : nextRole === "University" ? "university" : nextRole === "Industry" ? "industry" : "citizen");
    }
    void restoreSession();
  }, [router]);
  function handleLogout() {
    clearAuthToken();
    setAuthenticated(false);
    setView("home");
    router.replace("/login");
  }
  if (view === "home") return <Home setView={guardedSetView} />;
  const title =
    view === "submit"
      ? "Submit a challenge"
      : view === "challenges"
        ? "Browse challenges"
        : view === "government"
          ? "Government Dashboard"
          : view === "university"
            ? "University Dashboard"
            : view === "industry"
              ? "Industry Dashboard"
                : "My dashboard";
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        view={view}
        setView={guardedSetView}
        role={role}
        open={open}
        setOpen={setOpen}
        onGovernmentAction={(action) => {
          const actionMap: Record<string, string> = {
            "Review challenges": "Review Challenges",
            "Assign university": "Assign University",
            Funding: "Funding",
            Projects: "View Projects",
            Analytics: "View Analytics",
          }
          const nextAction = actionMap[action] || action
          setGovernmentAction('')
          window.setTimeout(() => setGovernmentAction(nextAction), 0)
          setView("government")
        }}
        onLogout={handleLogout}
      />
      {open && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          open={open}
          setOpen={setOpen}
          isCitizen={role === "Citizen"}
          rewardRefreshToken={rewardRefreshToken}
          onLogout={handleLogout}
        />
        {view === "submit" ? (
          <Submit setView={guardedSetView} />
        ) : view === "challenges" ? (
          <ChallengesPage setView={guardedSetView} />
        ) : view === "government" ? (
          <GovernmentDashboard requestedAction={governmentAction} />
        ) : view === "university" ? (
          <UniversityDashboard />
        ) : view === "industry" ? (
          <IndustryDashboard />
        ) : (
          <Dashboard setView={guardedSetView} onRewardsChanged={() => setRewardRefreshToken((value) => value + 1)} />
        )}
        {role === "Citizen" && <SahayakChat onNavigate={guardedSetView} />}
      </div>
    </div>
  );
}
