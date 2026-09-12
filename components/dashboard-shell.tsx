'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'

export type DashboardStat = {
  label: string
  value: string
  note: string
  icon: LucideIcon
}

type DashboardShellProps = {
  eyebrow: string
  title: string
  greeting: string
  subtitle: string
  stats: DashboardStat[]
  children: React.ReactNode
  actions?: React.ReactNode
  showCitizenTagline?: boolean
}

function JharkhandOutline() {
  return (
    <svg viewBox="0 0 220 220" className="h-36 w-36 shrink-0 text-blue-100/75 sm:h-44 sm:w-44" role="img" aria-label="Outline map of Jharkhand">
      <path
        d="M 12.0 89.2 L 17.0 79.6 L 14.5 74.8 L 16.3 72.8 L 29.7 73.3 L 32.3 71.9 L 37.8 71.6 L 41.4 67.7 L 46.1 75.0 L 47.2 73.2 L 48.6 74.7 L 49.2 72.8 L 53.6 72.4 L 54.4 73.6 L 54.0 76.1 L 61.3 82.2 L 62.8 82.0 L 65.7 78.2 L 68.7 79.1 L 70.0 76.7 L 74.8 73.8 L 75.9 74.3 L 76.4 76.4 L 78.1 76.4 L 79.5 80.0 L 82.7 80.0 L 86.9 78.3 L 87.3 80.5 L 90.8 76.7 L 95.5 74.2 L 100.2 73.3 L 105.6 73.7 L 108.3 71.2 L 111.6 71.2 L 111.2 67.3 L 112.7 66.9 L 113.9 63.5 L 115.5 62.1 L 119.9 62.3 L 122.6 65.2 L 128.1 63.0 L 127.8 64.6 L 130.6 65.5 L 132.3 70.7 L 138.9 71.5 L 139.5 73.7 L 138.3 76.5 L 145.7 80.4 L 147.6 74.6 L 151.5 71.1 L 156.6 71.6 L 158.8 69.9 L 164.6 72.3 L 165.8 68.9 L 171.2 69.9 L 172.3 66.5 L 172.3 61.7 L 174.5 58.6 L 174.8 52.2 L 177.3 49.6 L 180.6 49.5 L 182.3 44.3 L 187.5 44.1 L 189.6 40.0 L 191.8 38.3 L 195.1 40.8 L 202.4 42.0 L 202.7 48.1 L 205.6 50.4 L 207.0 54.8 L 206.0 61.3 L 204.2 61.4 L 206.9 64.0 L 207.8 66.7 L 206.7 67.9 L 208.0 68.5 L 205.8 70.3 L 201.6 69.7 L 203.2 70.7 L 203.7 73.7 L 200.9 80.8 L 196.1 84.0 L 196.2 85.6 L 197.4 85.8 L 197.8 87.2 L 194.9 87.5 L 193.5 90.4 L 190.3 89.5 L 190.4 92.8 L 189.0 94.3 L 183.9 95.1 L 182.6 92.8 L 179.5 93.4 L 181.6 97.7 L 180.1 99.2 L 179.7 101.6 L 175.6 100.4 L 176.7 102.8 L 175.0 103.6 L 164.1 98.9 L 161.4 102.2 L 161.7 104.8 L 160.7 107.0 L 144.0 111.6 L 141.3 113.7 L 140.8 116.3 L 138.1 118.6 L 136.2 119.1 L 131.8 117.0 L 131.9 113.3 L 128.1 112.1 L 126.5 113.0 L 126.6 116.0 L 118.9 117.5 L 119.6 119.7 L 121.9 120.2 L 119.1 126.9 L 121.6 131.1 L 123.9 130.4 L 126.5 131.0 L 134.0 137.9 L 137.6 137.3 L 148.1 138.6 L 144.0 140.9 L 143.5 147.4 L 151.6 151.8 L 152.6 155.1 L 158.2 157.1 L 159.0 159.1 L 157.2 159.4 L 157.2 160.9 L 160.3 163.2 L 160.9 166.1 L 163.0 168.1 L 159.6 168.9 L 159.1 170.8 L 157.7 170.5 L 155.9 171.7 L 147.7 166.7 L 142.1 166.9 L 138.8 163.5 L 130.8 159.6 L 128.1 157.2 L 123.7 159.6 L 126.1 166.7 L 124.9 169.8 L 125.9 173.0 L 125.3 176.6 L 122.8 180.1 L 119.3 181.7 L 117.0 180.1 L 117.5 175.5 L 112.6 177.8 L 101.0 174.1 L 97.4 175.6 L 92.9 179.8 L 87.6 176.2 L 82.8 176.5 L 87.9 166.9 L 86.2 159.5 L 79.5 163.0 L 74.9 161.8 L 72.0 162.7 L 62.7 163.0 L 61.8 165.1 L 58.6 166.9 L 53.8 167.2 L 48.1 165.4 L 43.4 159.6 L 39.2 157.9 L 40.1 155.8 L 42.9 153.6 L 45.3 153.4 L 48.7 151.0 L 50.3 147.5 L 54.9 144.1 L 55.7 142.6 L 54.7 139.4 L 47.0 137.1 L 46.7 138.4 L 45.6 138.3 L 44.3 134.5 L 41.7 131.9 L 41.7 122.7 L 40.7 121.4 L 38.8 122.7 L 38.1 121.7 L 38.4 117.7 L 41.1 114.3 L 39.9 110.7 L 37.2 111.4 L 36.9 113.9 L 30.2 112.5 L 28.5 109.1 L 29.1 106.4 L 28.1 103.7 L 20.7 97.0 L 19.8 91.9 L 16.9 90.1 L 12.0 89.2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DashboardHero({ eyebrow, title, greeting, subtitle, actions, showCitizenTagline = false }: Omit<DashboardShellProps, 'stats' | 'children'>) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#06245C] px-6 py-8 pb-40 text-white shadow-lg sm:px-10 sm:py-10 sm:pb-44 md:pb-10">
      <div className="relative z-10 max-w-2xl md:max-w-[60%]">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-200">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-5 text-lg font-semibold text-white">{greeting}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">{subtitle}</p>
        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        <div className="mt-7 h-1 w-16 rounded-full bg-[#E31E24]" />
      </div>
      <div aria-hidden="true" className="absolute -right-12 -top-16 size-72 rounded-full border border-white/10 bg-[#0B2D6B]/70 sm:size-96">
        <div className="absolute inset-10 rounded-full border border-white/10" />
      </div>
      <div className="absolute bottom-5 right-4 z-10 flex items-center gap-2 sm:bottom-8 sm:right-8 sm:gap-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2">
        <JharkhandOutline />
        {showCitizenTagline && <div className="w-24 text-sm font-semibold leading-5 text-white sm:w-32 sm:text-base">Ideas for<br />a Better<br />Jharkhand<div className="mt-3 h-1 w-12 rounded-full bg-[#E31E24]" /></div>}
      </div>
    </section>
  )
}

export function DashboardStats({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.slice(0, 3).map(({ label, value, note, icon: Icon }) => (
        <article key={label} className="rounded-2xl border border-[#DDE3EA] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#4B5563]">{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#10213F]">{value}</p>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-[#E31E24]/10 text-[#E31E24]">
              <Icon className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#123F8C]">{note}</p>
        </article>
      ))}
    </div>
  )
}

export function DashboardSection({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#DDE3EA] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#E31E24]">{eyebrow}</p>
          <h3 className="mt-1 text-lg font-bold text-[#10213F]">{title}</h3>
        </div>
        {action || <ArrowUpRight className="size-4 text-[#4B5563]" />}
      </div>
      {children}
    </section>
  )
}

export default function DashboardShell({ eyebrow, title, greeting, subtitle, stats, children, actions, showCitizenTagline }: DashboardShellProps) {
  return (
    <main className="min-h-full bg-[#F5F7FA] p-5 sm:p-8">
      <div className="mx-auto max-w-[1450px]">
        <DashboardHero eyebrow={eyebrow} title={title} greeting={greeting} subtitle={subtitle} actions={actions} showCitizenTagline={showCitizenTagline} />
        <div className="mt-6">
          <DashboardStats stats={stats} />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}
