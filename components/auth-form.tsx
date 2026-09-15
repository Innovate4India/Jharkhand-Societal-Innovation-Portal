'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from '@/components/theme-toggle'
import { login, register, saveAuthToken, saveCurrentUser } from '@/lib/api'

type Role = 'Citizen' | 'Government' | 'University' | 'Industry'
const roles: Role[] = ['Citizen', 'Government', 'University', 'Industry']
const districts = ['Ranchi', 'Dhanbad', 'Bokaro', 'Deoghar', 'East Singhbhum', 'Hazaribagh']

function Field({ label, name, type = 'text', placeholder, required = true }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}{required && <span className="text-orange-600"> *</span>}</span><input name={name} required={required} type={type} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
}

function PasswordField({ label, name }: { label: string; name: string }) {
  const [show, setShow] = useState(false)
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label} <span className="text-orange-600">*</span></span><span className="relative block"><input name={name} required type={show ? 'text' : 'password'} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-11 text-sm outline-none focus:border-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 text-slate-400">{show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></span></label>
}

function Brand() {
  return <div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-800 text-white"><Sparkles className="size-5" /></span><span><strong className="block text-sm text-slate-950 dark:text-white">Jharkhand</strong><span className="block text-xs font-medium text-emerald-700">Innovation Portal</span></span></Link><ThemeToggle /></div>
}

function RoleSelect({ label = 'Select your role', role, setRole }: { label?: string; role: Role; setRole: (role: Role) => void }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span><select value={role} onChange={e => setRole(e.target.value as Role)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">{roles.map(item => <option key={item}>{item}</option>)}</select></label>
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 px-5 py-8 dark:bg-slate-950 sm:px-8"><div className="mx-auto max-w-md"><Brand /><div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"><h1 className="text-2xl font-bold text-slate-950 dark:text-white">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p><div className="mt-7">{children}</div></div><Link href="/" className="mt-6 block text-center text-sm font-semibold text-emerald-800 dark:text-emerald-400">Back to portal</Link><p className="mt-3 text-center text-xs text-slate-400">A trusted space for collective action in Jharkhand</p></div></main>
}

export function LoginForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('Citizen')
  const [error, setError] = useState('')
  const [roleNotice, setRoleNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setRoleNotice('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    if (!email || !password) {
      setError('Please enter email and password')
      setLoading(false)
      return
    }
    const response = await login(email, password)
    if (!response.success) {
      setError(response.message || 'Login failed')
      setLoading(false)
      return
    }
    if (response.data?.token) saveAuthToken(response.data.token)
    if (response.data?.user) saveCurrentUser(response.data.user)
    const userRole = response.data?.user?.role
    const backendRole = userRole === 'government' ? 'Government' : userRole === 'university' ? 'University' : userRole === 'industry' ? 'Industry' : 'Citizen'
    if (backendRole !== selectedRole) setRoleNotice(`Your account is registered as ${backendRole}. You have been redirected to the ${backendRole} dashboard.`)
    window.setTimeout(() => router.push('/'), 700)
  }

  return <AuthFrame title="Welcome back" subtitle="Sign in to continue your work for Jharkhand."><form onSubmit={submit} className="space-y-5"><Field name="email" label="Email" type="email" placeholder="you@example.com" /><PasswordField name="password" label="Password" /><RoleSelect label="Login as" role={selectedRole} setRole={setSelectedRole} /><div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2 text-slate-500"><input type="checkbox" className="accent-emerald-700" />Remember me</label><button type="button" onClick={() => setError('Password reset will be available in a future release.')} className="font-semibold text-emerald-800">Forgot password?</button></div>{error && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{error}</p>}{roleNotice && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{roleNotice}</p>}<button disabled={loading} className="h-11 w-full rounded-lg bg-emerald-800 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:opacity-70">{loading ? 'Logging in...' : 'Login'}</button><p className="text-center text-sm text-slate-500">Don't have an account? <Link href="/register" className="font-bold text-emerald-800">Create Account</Link></p></form></AuthFrame>
}

export function RegisterForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('Citizen')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const userData: Record<string, string> = { name: String(formData.get('name') || '').trim(), email: String(formData.get('email') || '').trim(), password, role: role.toLowerCase() }
    const fieldsByRole: Record<Role, string[]> = { Citizen: ['mobile', 'district', 'villageOrCity'], Government: ['department', 'designation', 'district'], University: ['institution', 'universityDepartment', 'accountType'], Industry: ['organizationName', 'organizationType', 'expertise'] }
    fieldsByRole[role].forEach(field => { userData[field] = String(formData.get(field) || '').trim() })
    const response = await register(userData)
    setLoading(false)
    if (!response.success) {
      setError(response.message || 'Unable to create account')
      return
    }
    setSuccess(true)
  }

  if (success) return <AuthFrame title="Account created successfully" subtitle="Account created successfully. Please login to continue."><div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800"><CheckCircle2 className="size-7" /></span><button onClick={() => router.push('/login')} className="mt-8 h-11 w-full rounded-lg bg-emerald-800 text-sm font-bold text-white">Go to Login</button></div></AuthFrame>
  return <AuthFrame title="Create your account" subtitle="Join the people building a better Jharkhand."><form onSubmit={submit} className="space-y-4"><RoleSelect role={role} setRole={setRole} /><div className="grid gap-4 sm:grid-cols-2"><Field name="name" label={role === 'Industry' ? 'Contact Person' : 'Full Name'} /><Field name="email" label="Official Email" type="email" />{role === 'Citizen' && <><Field name="mobile" label="Mobile Number" type="tel" /><Field name="district" label="District" /><Field name="villageOrCity" label="Village / City" /></>}{role === 'Government' && <><Field name="department" label="Department" /><Field name="designation" label="Designation" /><Field name="district" label="District" /></>}{role === 'University' && <><Field name="institution" label="University / Institution" /><Field name="universityDepartment" label="Department" /><Field name="accountType" label="Account type" /></>}{role === 'Industry' && <><Field name="organizationName" label="Organization Name" /><Field name="organizationType" label="Organization Type" /><Field name="expertise" label="Expertise" /></>}</div><div className="grid gap-4 sm:grid-cols-2"><PasswordField name="password" label="Password" /><PasswordField name="confirmPassword" label="Confirm Password" /></div>{error && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{error}</p>}<button disabled={loading} className="h-11 w-full rounded-lg bg-emerald-800 text-sm font-bold text-white disabled:opacity-70">{loading ? 'Creating Account...' : 'Create Account'}</button><p className="text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-bold text-emerald-800">Login</Link></p></form></AuthFrame>
}
