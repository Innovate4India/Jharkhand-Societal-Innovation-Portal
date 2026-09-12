"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
  FileText,
  Flag,
  LayoutDashboard,
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
  getChallenges,
  getCurrentUser,
  clearAuthToken,
  getAuthToken,
  getCurrentUserFromStorage,
  saveCurrentUser,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import ChallengesPage from "@/components/challenges-page";
import GovernmentDashboard from "@/components/government-dashboard";
import UniversityDashboard from "@/components/university-dashboard";
import SahayakChat from "@/components/sahayak-chat";
import DashboardShell from "@/components/dashboard-shell";

type View =
  | "home"
  | "citizen"
  | "government"
  | "university"
  | "submit"
  | "challenges";
type Role = "Citizen" | "Government" | "University";

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
}: {
  view: View;
  setView: (v: View) => void;
  role: Role;
  open: boolean;
  setOpen: (v: boolean) => void;
  onGovernmentAction: (action: string) => void;
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
          onClick={() => setView(role === "Government" ? "government" : role === "University" ? "university" : "citizen")}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
            (view === "citizen" || view === "government" || view === "university")
              ? "bg-[#E31E24] text-white"
              : "text-white/80 hover:bg-[#0B2D6B] hover:text-white",
          )}
        >
          <LayoutDashboard className="size-4" />
          {role === "Government" ? "Government dashboard" : role === "University" ? "University dashboard" : "My dashboard"}
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
      </nav>
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
  onLogout,
}: {
  title: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  userName?: string;
  onLogout: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <header className="flex h-20 min-w-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-8">
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
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800">
              <span className="size-1.5 rounded-full bg-orange-500" />A platform
              for collective action
            </div>
            <h1 className="max-w-2xl text-balance text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
              Local problems.
              <br />
              <span className="text-emerald-800">Shared solutions.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              A trusted space where citizens, government, universities and
              industries come together to create a more resilient Jharkhand.
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
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700"
              >
                Explore challenges
              </button>
            </div>
          </div>
          <div className="rounded-3xl bg-emerald-900 p-8 text-white">
            <p className="text-sm font-medium text-emerald-200">
              A growing movement
            </p>
            <p className="mt-3 text-5xl font-bold">24</p>
            <p className="mt-1 text-emerald-100">districts connected</p>
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-emerald-700 pt-5 text-sm">
              <div>
                <strong className="block text-2xl">186</strong>
                <span className="text-emerald-200">solutions received</span>
              </div>
              <div>
                <strong className="block text-2xl">61</strong>
                <span className="text-emerald-200">problems resolved</span>
              </div>
            </div>
          </div>
        </section>
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
  const [touched, setTouched] = useState(false);
  const required =
    !title.trim() || !description.trim() || !category || !district;
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const villageOrCity = String(formData.get('villageOrCity') || '').trim();
    if (required || !villageOrCity || submitting) return;
    if (contactNumber && !/^[6-9]\d{9}$/.test(contactNumber)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    const priority = urgency.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
    if (!['low', 'medium', 'high', 'critical'].includes(priority)) return;
    setSubmitting(true);
    const response = await createChallenge({
      title: title.trim(),
      description: description.trim(),
      category,
      district,
      villageOrCity,
      priority,
      ...(contactNumber ? { citizenContactNumber: contactNumber } : {}),
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
                  required
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                  placeholder="Village, ward, landmark or block"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-3 text-xs font-bold text-slate-600 sm:py-0"
                >
                  Use my location
                </button>
              </span>
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
              Photo, video or document{" "}
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
                  className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none ring-emerald-700 focus:ring-2"
                  placeholder="People, communities or groups"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Urgency
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal outline-none"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Expected impact
              <textarea
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

function Dashboard({ setView }: { setView: (v: View) => void }) {
  const currentUser = getCurrentUserFromStorage();
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [submittedChallenges, setSubmittedChallenges] = useState<Array<{ _id: string; title: string; status: string; priority: string; citizenContactNumber?: string; assignedUniversity?: { name?: string; institution?: string }; fundingAmount?: number; fundingStatus?: string }>>([]);
  useEffect(() => {
    async function loadSubmittedChallenges() {
      if (!currentUser?._id) {
        setSubmittedCount(0);
        return;
      }
      const response = await getChallenges();
      if (!response.success) {
        setSubmittedCount(0);
        return;
      }
      const challenges = response.data || [];
      setSubmittedChallenges(challenges.filter((challenge) => {
        const submittedById = (challenge.submittedBy as { _id?: string } | undefined)?._id;
        return submittedById === currentUser._id;
      }));
      const count = challenges.filter((challenge) => {
        const submittedById = (challenge.submittedBy as { _id?: string } | undefined)?._id;
        return submittedById === currentUser._id;
      }).length;
      setSubmittedCount(count);
    }
    void loadSubmittedChallenges();
  }, [currentUser?._id]);
  return (
    <DashboardShell
      eyebrow="Citizen dashboard"
      title="Your community dashboard"
      greeting={`Good morning, ${currentUser?.name || "there"}`}
      subtitle="Here is what is happening with your contributions."
      stats={[
        { label: "Problems submitted", value: submittedCount === null ? "—" : String(submittedCount), note: "Based on submitted challenges", icon: FileText },
        { label: "Solutions supported", value: String(submittedChallenges.filter((challenge) => challenge.assignedUniversity).length), note: "Challenges with university support", icon: Users },
        { label: "Impact points", value: "0", note: "No impact data available yet", icon: CheckCircle2 },
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
                <p className="min-w-0 flex-1 break-words font-bold text-slate-800">{challenge.title}</p>
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold capitalize text-amber-800">{challenge.status === 'resolved' ? 'Problem Solved' : challenge.status.replaceAll('_', ' ')}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Priority: {challenge.priority} · University: {challenge.assignedUniversity?.institution || challenge.assignedUniversity?.name || 'Not assigned'}</p>
              {challenge.citizenContactNumber && <p className="mt-1 text-xs text-slate-500">Contact number: {challenge.citizenContactNumber}</p>}
              {challenge.fundingStatus === 'approved' && <p className="mt-1 text-xs font-semibold text-emerald-700">Funding approved: ₹{challenge.fundingAmount?.toLocaleString('en-IN')}</p>}
            </div>
          )) : <p className="text-sm text-slate-500">Your submitted problems will appear here.</p>}
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-700">
          Have a local concern?
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-950">
          Your voice can start a solution.
        </h3>
        <button
          onClick={() => setView("submit")}
          className="mt-5 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"
        >
          Submit a problem
        </button>
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
      setView(role === "Government" ? "government" : "university");
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
      if (!["citizen", "government", "university"].includes(userRole)) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const nextRole = userRole === "government" ? "Government" : userRole === "university" ? "University" : "Citizen";
      setRole(nextRole);
      setAuthenticated(true);
      setView(nextRole === "Government" ? "government" : nextRole === "University" ? "university" : "citizen");
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
        <Topbar title={title} open={open} setOpen={setOpen} onLogout={handleLogout} />
        {view === "submit" ? (
          <Submit setView={guardedSetView} />
        ) : view === "challenges" ? (
          <ChallengesPage setView={guardedSetView} />
        ) : view === "government" ? (
          <GovernmentDashboard requestedAction={governmentAction} />
        ) : view === "university" ? (
          <UniversityDashboard />
        ) : (
          <Dashboard setView={guardedSetView} />
        )}
        {role === "Citizen" && <SahayakChat onNavigate={guardedSetView} />}
      </div>
    </div>
  );
}
