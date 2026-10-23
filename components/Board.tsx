"use client";

import { useEffect, useMemo, useState } from "react";
import { COLUMNS, Job, Status } from "@/lib/types";

const KEY = "jobtrail.v1";
const iso = (offsetDays = 0) => new Date(Date.now() - offsetDays * 864e5).toISOString().slice(0, 10);
const daysSince = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));
const uid = () => Math.random().toString(36).slice(2, 10);

const SAMPLE: Job[] = [
  { id: uid(), company: "Razorpay", role: "Frontend Engineer", status: "wishlist", date: iso(1), notes: "Ask a friend for a referral first." },
  { id: uid(), company: "Zoho", role: "UI Developer", status: "applied", date: iso(9), notes: "Applied through the careers page." },
  { id: uid(), company: "Swiggy", role: "SDE-1 (Web)", status: "applied", date: iso(3) },
  { id: uid(), company: "Freshworks", role: "Associate Software Engineer", status: "interview", date: iso(2), notes: "Round 2 on Friday: React and system basics." },
  { id: uid(), company: "Postman", role: "Frontend Intern", status: "rejected", date: iso(20) },
];

function age(job: Job) {
  const d = daysSince(job.date);
  const when = d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
  return job.status === "wishlist" ? `Added ${when}` : job.status === "applied" ? `Applied ${when}` : `Updated ${when}`;
}

export default function Board() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ready, setReady] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setJobs(raw ? (JSON.parse(raw) as Job[]) : SAMPLE);
    } catch {
      setJobs(SAMPLE);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(jobs));
    } catch {
      /* storage unavailable: the board still works for this session */
    }
  }, [jobs, ready]);

  const move = (id: string, status: Status) =>
    setJobs((js) => js.map((j) => (j.id === id && j.status !== status ? { ...j, status, date: iso() } : j)));
  const remove = (id: string) => setJobs((js) => js.filter((j) => j.id !== id));

  const stats = useMemo(() => {
    const count = (s: Status) => jobs.filter((j) => j.status === s).length;
    const sent = count("applied") + count("interview") + count("offer") + count("rejected");
    const replies = count("interview") + count("offer");
    return {
      active: count("applied") + count("interview"),
      rate: sent ? Math.round((replies / sent) * 100) : 0,
      due: jobs.filter((j) => j.status === "applied" && daysSince(j.date) >= 7).length,
    };
  }, [jobs]);

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Jobtrail</h1>
          <p className="mt-1 max-w-md text-[var(--muted)]">
            Drag each application through your pipeline. Anything waiting more than a week gets flagged for a follow-up.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(true)}
            className="rounded-xl bg-sky-600 px-4 py-2.5 font-semibold text-white hover:bg-sky-500"
          >
            Add application
          </button>
          <button
            onClick={() => window.confirm("Remove every application from this board?") && setJobs([])}
            className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Clear all
          </button>
        </div>
      </header>

      <section aria-label="Summary" className="mb-6 grid grid-cols-3 gap-3 sm:max-w-xl">
        {[
          { v: stats.active, l: "In progress" },
          { v: `${stats.rate}%`, l: "Got a reply" },
          { v: stats.due, l: "Need a follow-up" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <div className="text-2xl font-bold tabular-nums">{s.v}</div>
            <div className="text-sm text-[var(--muted)]">{s.l}</div>
          </div>
        ))}
      </section>

      <div className="flex snap-x gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const list = jobs.filter((j) => j.status === col.id);
          return (
            <section
              key={col.id}
              aria-label={col.label}
              onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
              onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
              onDrop={() => { if (dragId) move(dragId, col.id); setDragId(null); setOver(null); }}
              className="min-w-[270px] flex-1 snap-start rounded-2xl p-3 transition-colors"
              style={{ background: "var(--panel)", outline: over === col.id ? `2px dashed ${col.color}` : "2px dashed transparent" }}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="h-3 w-3 rounded-full" style={{ background: col.color }} />
                <h2 className="font-semibold">{col.label}</h2>
                <span className="ml-auto rounded-full bg-[var(--card)] px-2 text-sm tabular-nums text-[var(--muted)]">{list.length}</span>
              </div>
              <div className="flex min-h-[80px] flex-col gap-3">
                {list.length === 0 && <p className="px-1 py-4 text-sm text-[var(--muted)]">{col.hint}. Drop a card here.</p>}
                {list.map((j) => {
                  const due = j.status === "applied" && daysSince(j.date) >= 7;
                  return (
                    <article
                      key={j.id}
                      draggable
                      onDragStart={() => setDragId(j.id)}
                      onDragEnd={() => { setDragId(null); setOver(null); }}
                      className="cursor-grab rounded-xl border border-[var(--line)] bg-[var(--card)] p-3 shadow-sm active:cursor-grabbing"
                      style={{ borderLeft: `4px solid ${col.color}`, opacity: dragId === j.id ? 0.45 : 1 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold leading-tight">{j.company}</h3>
                          <p className="text-sm text-[var(--muted)]">{j.role}</p>
                        </div>
                        <button onClick={() => remove(j.id)} aria-label={`Delete ${j.company}`} className="rounded px-1 text-[var(--muted)] hover:text-red-500">×</button>
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">{age(j)}</p>
                      {due && <p className="mt-2 inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600">Follow up today</p>}
                      {j.notes && <p className="mt-2 text-sm">{j.notes}</p>}
                      {j.link && <a href={j.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-sky-600 underline">Job post</a>}
                      <label className="mt-3 block text-xs text-[var(--muted)]">
                        Move to
                        <select
                          value={j.status}
                          onChange={(e) => move(j.id, e.target.value as Status)}
                          className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm text-[var(--ink)]"
                        >
                          {COLUMNS.map((c) => (<option key={c.id} value={c.id} className="text-black">{c.label}</option>))}
                        </select>
                      </label>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {adding && <AddForm onClose={() => setAdding(false)} onAdd={(j) => { setJobs((js) => [j, ...js]); setAdding(false); }} />}
    </>
  );
}

function AddForm({ onAdd, onClose }: { onAdd: (j: Job) => void; onClose: () => void }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("applied");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) { setError("Enter both a company and a role."); return; }
    onAdd({ id: uid(), company: company.trim(), role: role.trim(), status, date: iso(), link: link.trim() || undefined, notes: notes.trim() || undefined });
  };
  const field = "mt-1 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2";

  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Add application">
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-[var(--card)] p-5">
        <h2 className="text-xl font-bold">Add application</h2>
        <label className="block text-sm">Company<input autoFocus value={company} onChange={(e) => setCompany(e.target.value)} className={field} /></label>
        <label className="block text-sm">Role<input value={role} onChange={(e) => setRole(e.target.value)} className={field} /></label>
        <label className="block text-sm">Stage
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={field}>
            {COLUMNS.map((c) => (<option key={c.id} value={c.id} className="text-black">{c.label}</option>))}
          </select>
        </label>
        <label className="block text-sm">Job post link (optional)<input type="url" value={link} onChange={(e) => setLink(e.target.value)} className={field} /></label>
        <label className="block text-sm">Notes (optional)<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={field} /></label>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--line)] px-4 py-2">Cancel</button>
          <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white">Save</button>
        </div>
      </form>
    </div>
  );
}
