import React, { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { apiRequest, uploadFile } from "./api";
import {
  caseHighlights,
  faqs,
  pageTabs,
  practiceAreas,
  quotes,
  recognizedBy,
  resultMetrics,
  roleThemes,
  stats,
  testimonials
} from "./data";

const roleOrder = ["client", "lawyer", "assistant", "admin"];
const SESSION_KEY = "lexbridge-session-v1";
const SESSION_USER_KEY = "sasf-react-session-v1";
const CASE_CATEGORIES = [
  "Criminal Law",
  "Civil Law",
  "Family Law",
  "Corporate / Business Law",
  "Property / Real Estate Law",
  "Labor & Employment Law",
  "Intellectual Property (IP) Law",
  "Tax Law",
  "Immigration Law",
  "Cyber Law / IT Law",
  "Environmental Law",
  "Constitutional / Administrative Law"
];

export default function App() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("home");
  const [users, setUsers] = useState([]);
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let active = true;
    apiRequest("/api/load")
      .then((res) => {
        if (active) setUsers(Array.isArray(res?.users) ? res.users : []);
      })
      .catch(() => {
        if (active) setUsers([]);
      });
    return () => { active = false; };
  }, []);

  const dbLawyers = useMemo(
    () => (Array.isArray(users) ? users : []).filter((u) => String(u.role || "").toLowerCase() === "lawyer"),
    [users]
  );
  const dbAssistants = useMemo(
    () => (Array.isArray(users) ? users : []).filter((u) => String(u.role || "").toLowerCase() === "assistant"),
    [users]
  );
  const assignableLawyers = useMemo(
    () => (Array.isArray(users) ? users : [])
      .filter((u) => String(u.role || "").toLowerCase() === "lawyer")
      .map((u) => ({ label: u.name || "Lawyer", value: u.id }))
      .filter((l) => l.value),
    [users]
  );

  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
      if (sessionUser.userId) localStorage.setItem(SESSION_KEY, sessionUser.userId);
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  }, [sessionUser]);

  const handleLoginSuccess = (payload) => {
    setSessionUser(payload);
    navigate(`/${payload.role}`, { replace: true });
  };

  const handleLogout = () => {
    setSessionUser(null);
    navigate("/", { replace: true });
  };

  // Renders a role-protected dashboard; redirects if not logged in or wrong role
  const protectedDashboard = (requiredRole) => {
    if (!sessionUser) return <Navigate to="/login" replace />;
    if (String(sessionUser.role).toLowerCase() !== requiredRole)
      return <Navigate to={`/${sessionUser.role}`} replace />;
    return <RoleWorkspace sessionUser={sessionUser} users={users} onLogout={handleLogout} />;
  };

  return (
    <Routes>
      {/* Public landing — redirects to dashboard if already logged in */}
      <Route
        path="/"
        element={
          sessionUser
            ? <Navigate to={`/${sessionUser.role}`} replace />
            : <WorkspaceLanding
                onOpenAuth={() => navigate("/login")}
                activePage={activePage}
                onChangePage={setActivePage}
                lawyersList={dbLawyers}
                assistantsList={dbAssistants}
              />
        }
      />

      {/* Login page — redirects to dashboard if already logged in */}
      <Route
        path="/login"
        element={
          sessionUser
            ? <Navigate to={`/${sessionUser.role}`} replace />
            : <AuthExperience
                onBack={() => navigate("/")}
                availableLawyers={assignableLawyers}
                onLoginSuccess={handleLoginSuccess}
              />
        }
      />

      {/* Role-specific dashboards */}
      <Route path="/client"    element={protectedDashboard("client")} />
      <Route path="/lawyer"    element={protectedDashboard("lawyer")} />
      <Route path="/assistant" element={protectedDashboard("assistant")} />
      <Route path="/admin"     element={protectedDashboard("admin")} />

      {/* Catch-all → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function WorkspaceLanding({ onOpenAuth, activePage, onChangePage, lawyersList, assistantsList }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setQuoteIndex((prev) => (prev + 1) % quotes.length), 4400);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length), 6200);
    return () => window.clearInterval(timer);
  }, []);

  const dynamicStats = useMemo(() => {
    const cloned = [...stats];
    cloned[0] = { ...cloned[0], value: Math.max(cloned[0].value, lawyersList.length * 100 + assistantsList.length * 80) };
    return cloned;
  }, [lawyersList.length, assistantsList.length]);

  return (
    <div className="min-h-screen bg-[#f3f2ef] text-slate-900">
      <div className="noise-overlay" />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-300/70 bg-[#f7f6f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
              <img src="/uploads/logo.png" alt="SASF Law Firm Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">SASF Law Firm</p>
              <p className="font-serif text-[1.75rem] leading-none">Legal Workspace</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-xl border border-slate-300 bg-white p-1.5 md:flex">
            {pageTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onChangePage(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activePage === tab.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={onOpenAuth} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            Sign In / Sign Up
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <MobileTabBar activePage={activePage} onChangePage={onChangePage} />

        <AnimatePresence mode="wait">
          <motion.div key={activePage} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.28 }}>
            {activePage === "home" ? (
              <HomePage
                quote={quotes[quoteIndex]}
                dynamicStats={dynamicStats}
                lawyersList={lawyersList}
                assistantsList={assistantsList}
              />
            ) : null}
            {activePage === "team" ? <TeamPage lawyersList={lawyersList} assistantsList={assistantsList} /> : null}
            {activePage === "practice" ? <PracticePage /> : null}
            {activePage === "results" ? <ResultsPage testimonialIndex={testimonialIndex} setTestimonialIndex={setTestimonialIndex} /> : null}
            {activePage === "contact" ? <ContactPage /> : null}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function HomePage({ quote, dynamicStats, lawyersList, assistantsList }) {
  return (
    <div className="space-y-10">
      <section className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-300 bg-gradient-to-br from-white via-[#f8f7f3] to-[#eceae3] p-8 shadow-[0_18px_45px_rgba(15,23,42,0.09)] sm:p-10">
          <p className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            Premium Legal Operations
          </p>
          <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.02] text-slate-900 sm:text-7xl">
            Faster legal execution. Cleaner decisions. Better client trust.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            A modern legal workspace unifying litigation, client communication, schedules, documentation, and role-based control.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700">{lawyersList.length}+ Lawyers Available</span>
            <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700">{assistantsList.length}+ Assistants Active</span>
            <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700">Admin-Controlled Database</span>
          </div>
        </div>

        <motion.aside initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-slate-300 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Daily Legal Principle</p>
          <p className="mt-6 font-serif text-[2.2rem] leading-tight text-slate-900">"{quote.text}"</p>
          <p className="mt-7 text-sm font-semibold text-slate-600">{quote.author}</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">{quote.insight}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Evidence-first review</span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Timeline discipline</span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Hearing preparedness</span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Client transparency</span>
          </div>
        </motion.aside>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white py-5">
        <div className="px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recognized By</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recognizedBy.map((org) => (
              <div key={org.id} className="flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-[#f1f1ef] px-3 text-center text-sm font-semibold text-slate-600">
                {org.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicStats.map((stat) => (
          <CounterCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard title="Multi-Page Workspace" text="Home, Team, Practice, Results, and Contact pages are available in one premium landing flow." />
        <GlassCard title="Database-Driven Team" text="Lawyers and assistants are loaded from backend state so admin can add, edit, and remove members centrally." />
      </section>
    </div>
  );
}

function TeamPage({ lawyersList, assistantsList }) {
  const [teamFilter, setTeamFilter] = useState("lawyers");
  const current = teamFilter === "lawyers" ? lawyersList : assistantsList;

  return (
    <div>
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">People</p>
          <h2 className="mt-2 font-serif text-5xl text-slate-900">Legal Talent Network</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">All profiles shown here come from the backend user dataset for admin-level control.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1.5">
          <button onClick={() => setTeamFilter("lawyers")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${teamFilter === "lawyers" ? "bg-slate-900 text-white" : "text-slate-600"}`}>
            Lawyers ({lawyersList.length})
          </button>
          <button onClick={() => setTeamFilter("assistants")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${teamFilter === "assistants" ? "bg-slate-900 text-white" : "text-slate-600"}`}>
            Assistants ({assistantsList.length})
          </button>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {current.map((person, index) => (
          <motion.article
            key={person.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
          >
            <img src={person.image_url} alt={person.name} className="h-64 w-full object-cover" />
            <div className="p-4">
              <p className="text-lg font-semibold text-slate-900">{person.name}</p>
              <p className="text-sm text-slate-600">{person.level}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{person.department || (teamFilter === "lawyers" ? "Legal Division" : "Operations Desk")}</p>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  );
}

function PracticePage() {
  const [openFaq, setOpenFaq] = useState(faqs[0]?.id || "");

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Practice Areas</p>
        <h2 className="mt-2 font-serif text-5xl text-slate-900">Specialized legal coverage</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Full-spectrum legal services for individuals, enterprises, and institutions. Explore broad coverage across litigation, advisory, compliance, and strategic legal defense.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {practiceAreas.map((area) => (
            <div key={area.id} className="rounded-2xl border border-slate-300 bg-white p-5">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg border border-slate-300 bg-white">
                <AreaIcon name={area.icon} />
              </div>
              <p className="text-lg font-semibold text-slate-900">{area.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">FAQ</p>
        <h3 className="mt-2 font-serif text-4xl text-slate-900">Common questions</h3>
        <p className="mt-2 text-sm text-slate-500">{faqs.length} detailed answers for onboarding, case process, billing, and confidentiality.</p>
        <div className="mt-5 max-h-[920px] space-y-3 overflow-auto pr-1">
          {faqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div key={faq.id} className="rounded-xl border border-slate-300 bg-[#fbfbfa]">
                <button onClick={() => setOpenFaq(isOpen ? "" : faq.id)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left">
                  <span className="text-sm font-semibold text-slate-900">{faq.question}</span>
                  <span className="text-xl text-slate-500">{isOpen ? "-" : "+"}</span>
                </button>
                <AnimatePresence>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm leading-6 text-slate-600">{faq.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ResultsPage({ testimonialIndex, setTestimonialIndex }) {
  const activeTestimonial = testimonials[testimonialIndex];
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-3xl border border-slate-300 bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Client Success</p>
          <AnimatePresence mode="wait">
            <motion.div key={activeTestimonial.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <p className="mt-5 font-serif text-5xl leading-tight text-slate-900">"{activeTestimonial.quote}"</p>
              <p className="mt-6 text-base font-semibold text-slate-900">{activeTestimonial.clientName}</p>
              <p className="text-sm text-slate-600">{activeTestimonial.caseType}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex items-center gap-2">
            {testimonials.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setTestimonialIndex(idx)}
                className={`h-2.5 rounded-full transition ${testimonialIndex === idx ? "w-8 bg-slate-900" : "w-2.5 bg-slate-300"}`}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {testimonials.map((item) => (
              <div key={`${item.id}-mini`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{item.caseType}</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{item.clientName}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Operational Edge</p>
          <h3 className="mt-2 font-serif text-4xl leading-tight">Built for measurable legal outcomes</h3>
          <ul className="mt-6 space-y-3 text-sm text-slate-200">
            <li>Structured case timelines with ownership clarity</li>
            <li>Role-based access for client, lawyer, assistant, admin</li>
            <li>Faster document and hearing readiness cycles</li>
            <li>Database-backed staff management for admin control</li>
            <li>Dedicated legal lead and assistant contact model</li>
            <li>Evidence trail review before every critical submission</li>
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-slate-300 bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Performance Metrics</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {resultMetrics.map((metric) => (
              <div key={metric.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                <p className="mt-2 font-serif text-4xl text-slate-900">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-300 bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Case Highlights</p>
          <div className="mt-5 space-y-3">
            {caseHighlights.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-base font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-700">Outcome: {item.outcome}</p>
                <p className="mt-1 text-sm text-slate-600">Impact: {item.impact}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lead Intake</p>
        <h2 className="mt-2 font-serif text-5xl text-slate-900">Request Free Case Evaluation</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
          Share your legal context. Our legal desk will return a structured first review, risk signals, and recommended next steps.
        </p>
      </section>

      <form className="rounded-2xl border border-slate-300 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" type="text" placeholder="Your name" />
          <Input label="Email" type="email" placeholder="you@email.com" />
        </div>
        <div className="mt-4">
          <Input label="Phone" type="text" placeholder="+880..." />
        </div>
        <div className="mt-4">
          <Input label="Case Type" type="text" placeholder="Corporate / Civil / Family..." />
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Case Summary</label>
          <textarea rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900" placeholder="Briefly describe your issue" />
        </div>
        <button type="submit" className="mt-6 w-full rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-red-700">
          Submit Evaluation Request
        </button>
      </form>
    </div>
  );
}

function CounterCard({ stat }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1100;
    const frame = 1000 / 30;
    const steps = Math.round(duration / frame);
    let currentStep = 0;

    const timer = window.setInterval(() => {
      currentStep += 1;
      const next = Math.min(stat.value, Math.round((currentStep / steps) * stat.value));
      setCount(next);
      if (currentStep >= steps) {
        window.clearInterval(timer);
        setCount(stat.value);
      }
    }, frame);

    return () => window.clearInterval(timer);
  }, [inView, stat.value]);

  return (
    <div ref={ref} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
      <p className="mt-3 font-serif text-5xl leading-none text-slate-900">
        {count}
        {stat.suffix}
      </p>
    </div>
  );
}

function GlassCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white/80 p-6 shadow-[0_8px_22px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <p className="text-xl font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function MobileTabBar({ activePage, onChangePage }) {
  return (
    <div className="mb-5 block overflow-x-auto md:hidden">
      <div className="inline-flex min-w-full gap-2 rounded-xl border border-slate-300 bg-white p-1.5">
        {pageTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChangePage(tab.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${activePage === tab.id ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RoleWorkspace({ sessionUser, users, onLogout }) {
  const role = String(sessionUser?.role || "client").toLowerCase();
  const name = sessionUser?.name || "User";
  const theme =
    role === "assistant"
      ? { shell: "from-amber-50 via-orange-50 to-amber-100", accent: "bg-amber-700", badge: "text-amber-800 bg-amber-100" }
      : role === "lawyer"
        ? { shell: "from-emerald-50 via-green-50 to-emerald-100", accent: "bg-emerald-700", badge: "text-emerald-800 bg-emerald-100" }
        : role === "admin"
          ? { shell: "from-indigo-50 via-blue-50 to-indigo-100", accent: "bg-indigo-700", badge: "text-indigo-800 bg-indigo-100" }
          : { shell: "from-rose-50 via-red-50 to-rose-100", accent: "bg-rose-700", badge: "text-rose-800 bg-rose-100" };

  const [db, setDb] = useState({
    users: Array.isArray(users) ? users : [],
    cases: [],
    appointments: [],
    schedules: [],
    documents: [],
    notifications: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [apptForm, setApptForm] = useState({ type: CASE_CATEGORIES[0], date: "", time: "", lawyerId: "" });
  const [scheduleForm, setScheduleForm] = useState({ lawyerId: "", title: "", date: "", time: "", type: "Meeting" });
  const [docForm, setDocForm] = useState({ caseId: "", title: "", category: "Evidence", file: null });
  const docFileRef = useRef(null);
  const [assistantPage, setAssistantPage] = useState("requests");
  const [assistantSearch, setAssistantSearch] = useState("");
  const [selectedAssistantCaseId, setSelectedAssistantCaseId] = useState("");
  const [assistantCalendarMonth, setAssistantCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [clientTab, setClientTab] = useState("overview");
  const [expandedCase, setExpandedCase] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest("/api/load")
      .then((data) => {
        if (!active) return;
        setDb({
          users: Array.isArray(data?.users) ? data.users : [],
          cases: Array.isArray(data?.cases) ? data.cases : [],
          appointments: Array.isArray(data?.appointments) ? data.appointments : [],
          schedules: Array.isArray(data?.schedules) ? data.schedules : [],
          documents: Array.isArray(data?.documents) ? data.documents : [],
          notifications: Array.isArray(data?.notifications) ? data.notifications : [],
          transactions: Array.isArray(data?.transactions) ? data.transactions : []
        });
      })
      .catch(() => {
        if (active) setNotice("Failed to load latest data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const currentUser =
    db.users.find((u) => String(u.id || "") === String(sessionUser?.userId || "")) ||
    ({ id: sessionUser?.userId || "", name, role, status: "active" });

  const lawyersOnly = db.users.filter((u) => String(u.role || "").toLowerCase() === "lawyer");

  useEffect(() => {
    if (scheduleForm.lawyerId) return;
    if (currentUser?.lawyerId) {
      setScheduleForm((prev) => ({ ...prev, lawyerId: currentUser.lawyerId }));
      return;
    }
    if (lawyersOnly[0]?.id) {
      setScheduleForm((prev) => ({ ...prev, lawyerId: lawyersOnly[0].id }));
    }
  }, [currentUser?.lawyerId, lawyersOnly, scheduleForm.lawyerId]);

  const saveAll = async (nextState, message = "") => {
    setDb(nextState);
    await apiRequest("/api/save", { method: "POST", body: nextState });
    if (message) setNotice(message);
  };

  const getCaseId = (item) => String(item?.caseId || item?.id || "");
  const getDocId = (item) => String(item?.docId || item?.id || "");
  const getApptId = (item) => String(item?.id || item?.appointmentId || "");
  const getScheduleId = (item) => String(item?.eventId || item?.id || "");

  const updateCaseStatus = async (caseId, status) => {
    if (!["lawyer", "assistant"].includes(role)) return;
    const nextCases = db.cases.map((item) =>
      String(item.caseId || item.id) === String(caseId)
        ? {
            ...item,
            status,
            lastUpdated: new Date().toISOString()
          }
        : item
    );
    await saveAll({ ...db, cases: nextCases }, "Case status updated.");
  };

  const normalizeCategory = (value) => String(value || "").toLowerCase().replace(/[^a-z]/g, "");

  const findAssignedAssistant = (caseType) => {
    const assistantsOnly = db.users.filter((u) => String(u.role || "").toLowerCase() === "assistant");
    const target = normalizeCategory(caseType);
    const exact = assistantsOnly.find((a) => normalizeCategory(a.department).includes(target));
    if (exact) return exact;
    return assistantsOnly[0] || null;
  };

  const editUser = async (targetId) => {
    if (role !== "admin") return;
    const user = db.users.find((u) => String(u.id) === String(targetId));
    if (!user) return;
    const nextName = window.prompt("Edit user name:", user.name || "");
    if (nextName === null) return;
    const nextEmail = window.prompt("Edit user email:", user.email || "");
    if (nextEmail === null) return;
    const nextRole = window.prompt("Edit role (admin/lawyer/assistant/client):", String(user.role || ""));
    if (nextRole === null) return;
    const normalizedRole = String(nextRole || "").trim().toLowerCase();
    if (!["admin", "lawyer", "assistant", "client"].includes(normalizedRole)) {
      setNotice("Invalid role. Use admin/lawyer/assistant/client.");
      return;
    }
    const nextUsers = db.users.map((u) =>
      String(u.id) === String(targetId)
        ? { ...u, name: nextName.trim() || u.name, email: nextEmail.trim() || u.email, role: normalizedRole }
        : u
    );
    await saveAll({ ...db, users: nextUsers }, "User profile updated.");
  };

  const toggleUserStatus = async (targetId) => {
    if (role !== "admin") return;
    const nextUsers = db.users.map((u) => {
      if (String(u.id) !== String(targetId) || String(u.role || "").toLowerCase() === "admin") return u;
      const nextStatus = String(u.status || "active") === "blocked" ? "active" : "blocked";
      return { ...u, status: nextStatus };
    });
    await saveAll({ ...db, users: nextUsers }, "User status updated.");
  };

  const deleteUser = async (targetId) => {
    if (role !== "admin") return;
    const user = db.users.find((u) => String(u.id) === String(targetId));
    if (!user) return;
    if (String(user.role || "").toLowerCase() === "admin") {
      setNotice("Admin users cannot be deleted.");
      return;
    }

    const approved = window.confirm(`Delete ${user.name}? This will remove related cases, appointments, schedules, documents, and notifications.`);
    if (!approved) return;

    const nextUsers = db.users.filter((u) => String(u.id) !== String(targetId));
    const nextCases = db.cases.filter((c) => String(c.lawyerId || "") !== String(targetId) && String(c.assistantId || "") !== String(targetId) && String(c.clientId || "") !== String(targetId));
    const nextAppointments = db.appointments.filter((a) => String(a.lawyerId || "") !== String(targetId) && String(a.assistantId || "") !== String(targetId) && String(a.clientId || "") !== String(targetId));
    const nextSchedules = db.schedules.filter((s) => String(s.lawyerId || "") !== String(targetId));
    const nextDocuments = db.documents.filter((d) => String(d.lawyerId || "") !== String(targetId) && String(d.ownerId || "") !== String(targetId) && String(d.clientId || "") !== String(targetId));
    const nextNotifications = db.notifications.filter((n) => String(n.userId || "") !== String(targetId) && String(n.lawyerId || "") !== String(targetId));

    await saveAll(
      {
        ...db,
        users: nextUsers,
        cases: nextCases,
        appointments: nextAppointments,
        schedules: nextSchedules,
        documents: nextDocuments,
        notifications: nextNotifications
      },
      "User deleted."
    );
  };

  const createCaseFromRequest = async (appointmentId) => {
    if (role !== "assistant") return;
    const appointment = db.appointments.find((a) => String(a.id || a.appointmentId) === String(appointmentId));
    if (!appointment) return;
    if (String(appointment.assistantId || "") !== String(currentUser.id || "")) return;

    const title = window.prompt("Case title:", `${appointment.type || "General"} Matter`);
    if (title === null) return;
    const priority = window.prompt("Priority (Low/Medium/High):", "Medium");
    if (priority === null) return;
    const details = window.prompt("Case details for lawyer:", "Initial intake and client facts.");
    if (details === null) return;
    const hearingDate = window.prompt("Hearing/Target date (YYYY-MM-DD):", appointment.date || "");
    if (hearingDate === null) return;

    const nextAppointments = db.appointments.map((a) =>
      String(a.id || a.appointmentId) === String(appointmentId) ? { ...a, status: "Accepted by Assistant", payment: "Pending" } : a
    );
    const newCaseId = `C-${Date.now()}`;
    const client = db.users.find((u) => String(u.id) === String(appointment.clientId));
    const nextCases = [
      {
        id: newCaseId,
        caseId: newCaseId,
        title: `${appointment.type || "General"} Matter`,
        client: client?.name || "Client",
        clientName: client?.name || "Client",
        clientId: appointment.clientId || "",
        assistantId: currentUser.id,
        lawyerId: currentUser.lawyerId || appointment.lawyerId || "",
        type: appointment.type || "General",
        caseType: appointment.type || "General",
        priority: priority || "Medium",
        status: "Pending Lawyer Review",
        hearingDate: hearingDate || appointment.date || "",
        lastUpdated: new Date().toISOString(),
        notes: details || "Created from assistant intake.",
        progressNote: "Assistant submitted case for lawyer review."
      },
      ...db.cases
    ];
    await saveAll({ ...db, appointments: nextAppointments, cases: nextCases }, "Assistant accepted request and created case.");
  };

  const selectRequestForHandling = async (appointmentId) => {
    if (role !== "assistant") return;
    const nextAppointments = db.appointments.map((a) =>
      getApptId(a) === String(appointmentId)
        ? { ...a, status: "Handling" }
        : a
    );
    await saveAll({ ...db, appointments: nextAppointments }, "Request moved to Appointment Handling.");
    setAssistantPage("handling");
  };

  const confirmAppointmentByAssistant = async (appointmentId) => {
    if (role !== "assistant") return;
    const nextAppointments = db.appointments.map((a) =>
      getApptId(a) === String(appointmentId)
        ? { ...a, status: "Confirmed", payment: a.payment || "Pending" }
        : a
    );
    await saveAll({ ...db, appointments: nextAppointments }, "Appointment confirmed for client.");
  };

  const communicateWithClient = async (appointmentId) => {
    if (role !== "assistant") return;
    const appointment = db.appointments.find((a) => getApptId(a) === String(appointmentId));
    if (!appointment) return;
    const message = window.prompt("Message for client:", "Your request is under review.");
    if (message === null || !message.trim()) return;
    const nextNotifications = [
      {
        id: `N-${Date.now()}`,
        userId: appointment.clientId,
        title: "Assistant Message",
        message: message.trim(),
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        isRead: false
      },
      ...db.notifications
    ];
    await saveAll({ ...db, notifications: nextNotifications }, "Message sent to client.");
  };

  const updateAssistantCaseData = async (caseId) => {
    if (role !== "assistant") return;
    const item = db.cases.find((c) => getCaseId(c) === String(caseId));
    if (!item) return;
    if (String(item.assistantId || "") !== String(currentUser.id || "")) return;
    const title = window.prompt("Edit case title:", item.title || "");
    if (title === null) return;
    const notes = window.prompt("Edit case details:", item.notes || "");
    if (notes === null) return;
    const hearingDate = window.prompt("Edit hearing date (YYYY-MM-DD):", item.hearingDate || "");
    if (hearingDate === null) return;
    const nextCases = db.cases.map((c) =>
      getCaseId(c) === String(caseId)
        ? { ...c, title: title || c.title, notes: notes || c.notes, hearingDate: hearingDate || c.hearingDate, lastUpdated: new Date().toISOString() }
        : c
    );
    await saveAll({ ...db, cases: nextCases }, "Case data updated by assistant.");
  };

  const updateCaseProgress = async (caseId) => {
    if (role !== "lawyer") return;
    const caseItem = db.cases.find((c) => getCaseId(c) === String(caseId));
    if (!caseItem) return;
    if (String(caseItem.lawyerId || "") !== String(currentUser.id || "")) return;
    const nextStatus = window.prompt("Update status:", caseItem.status || "In Progress");
    if (nextStatus === null) return;
    const note = window.prompt("Progress update note:", caseItem.progressNote || caseItem.notes || "");
    if (note === null) return;

    const nextCases = db.cases.map((c) =>
      getCaseId(c) === String(caseId)
        ? { ...c, status: nextStatus || c.status, progressNote: note || c.progressNote, lastUpdated: new Date().toISOString() }
        : c
    );
    await saveAll({ ...db, cases: nextCases }, "Lawyer progress updated.");
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    if (!["admin", "lawyer"].includes(role)) return;
    const ownerLawyerId = role === "lawyer" ? currentUser.id : scheduleForm.lawyerId;
    if (!ownerLawyerId || !scheduleForm.title || !scheduleForm.date || !scheduleForm.time) {
      setNotice("Please complete all schedule fields.");
      return;
    }
    const eventId = `E-${Date.now()}`;
    const nextSchedules = [
      {
        eventId,
        id: eventId,
        lawyerId: ownerLawyerId,
        title: scheduleForm.title.trim(),
        date: scheduleForm.date,
        time: scheduleForm.time,
        type: scheduleForm.type || "Meeting"
      },
      ...db.schedules
    ];
    await saveAll({ ...db, schedules: nextSchedules }, "Schedule event created.");
    setScheduleForm((prev) => ({ ...prev, title: "", date: "", time: "", type: "Meeting" }));
  };

  const editSchedule = async (eventId) => {
    if (!["admin", "lawyer"].includes(role)) return;
    const event = db.schedules.find((s) => getScheduleId(s) === String(eventId));
    if (!event) return;
    if (role === "lawyer" && String(event.lawyerId) !== String(currentUser.id)) return;
    const nextTitle = window.prompt("Edit schedule title:", event.title || "");
    if (nextTitle === null) return;
    const nextDate = window.prompt("Edit date (YYYY-MM-DD):", event.date || "");
    if (nextDate === null) return;
    const nextTime = window.prompt("Edit time (HH:MM):", event.time || "");
    if (nextTime === null) return;
    const nextSchedules = db.schedules.map((s) =>
      getScheduleId(s) === String(eventId) ? { ...s, title: nextTitle || s.title, date: nextDate || s.date, time: nextTime || s.time } : s
    );
    await saveAll({ ...db, schedules: nextSchedules }, "Schedule updated.");
  };

  const deleteSchedule = async (eventId) => {
    if (!["admin", "lawyer"].includes(role)) return;
    const event = db.schedules.find((s) => getScheduleId(s) === String(eventId));
    if (!event) return;
    if (role === "lawyer" && String(event.lawyerId) !== String(currentUser.id)) return;
    const nextSchedules = db.schedules.filter((s) => getScheduleId(s) !== String(eventId));
    await saveAll({ ...db, schedules: nextSchedules }, "Schedule removed.");
  };

  const addDocument = async (e) => {
    e.preventDefault();
    if (!docForm.caseId || !docForm.title.trim()) {
      setNotice("Please choose case and document title.");
      return;
    }
    if (!docForm.file) {
      setNotice("Please select a file to upload.");
      return;
    }
    const selectedCase = db.cases.find((c) => getCaseId(c) === String(docForm.caseId));
    if (!selectedCase) return;

    if (role === "lawyer" && String(selectedCase.lawyerId || "") !== String(currentUser.id)) return;
    if (role === "assistant") {
      const allowed = String(selectedCase.assistantId || "") === String(currentUser.id) || String(selectedCase.lawyerId || "") === String(currentUser.lawyerId || "");
      if (!allowed) return;
    }
    if (role === "client" && String(selectedCase.clientId || "") !== String(currentUser.id)) return;

    try {
      const fd = new FormData();
      fd.append("file", docForm.file);
      const { fileUrl } = await uploadFile(fd);

      const id = `D-${Date.now()}`;
      const nextDocs = [
        {
          docId: id,
          id,
          caseId: docForm.caseId,
          ownerId: currentUser.id,
          lawyerId: selectedCase.lawyerId || "",
          clientId: selectedCase.clientId || "",
          name: docForm.title.trim(),
          title: docForm.title.trim(),
          category: docForm.category,
          fileType: docForm.category,
          fileUrl: fileUrl || "",
          updatedOn: new Date().toISOString().slice(0, 10),
          uploadDate: new Date().toISOString().slice(0, 10),
          description: `${docForm.category} document`
        },
        ...db.documents
      ];
      await saveAll({ ...db, documents: nextDocs }, "Document uploaded.");
      setDocForm((prev) => ({ ...prev, title: "", file: null }));
      if (docFileRef.current) docFileRef.current.value = "";
    } catch (err) {
      setNotice(err.message || "Upload failed.");
    }
  };

  const renameDocument = async (docId) => {
    const doc = db.documents.find((d) => getDocId(d) === String(docId));
    if (!doc) return;
    if (role === "lawyer" && String(doc.lawyerId || "") !== String(currentUser.id) && String(doc.ownerId || "") !== String(currentUser.id)) return;
    if (role === "assistant") {
      const allowed = String(doc.ownerId || "") === String(currentUser.id) || String(doc.lawyerId || "") === String(currentUser.lawyerId || "");
      if (!allowed) return;
    }
    if (role === "client" && String(doc.clientId || "") !== String(currentUser.id) && String(doc.ownerId || "") !== String(currentUser.id)) return;
    const nextTitle = window.prompt("Rename document:", doc.name || doc.title || "");
    if (nextTitle === null) return;
    const nextDocs = db.documents.map((d) =>
      getDocId(d) === String(docId) ? { ...d, name: nextTitle || d.name, title: nextTitle || d.title, updatedOn: new Date().toISOString().slice(0, 10) } : d
    );
    await saveAll({ ...db, documents: nextDocs }, "Document updated.");
  };

  const removeDocument = async (docId) => {
    const doc = db.documents.find((d) => getDocId(d) === String(docId));
    if (!doc) return;
    if (role === "lawyer" && String(doc.lawyerId || "") !== String(currentUser.id) && String(doc.ownerId || "") !== String(currentUser.id)) return;
    if (role === "assistant") {
      const allowed = String(doc.ownerId || "") === String(currentUser.id) || String(doc.lawyerId || "") === String(currentUser.lawyerId || "");
      if (!allowed) return;
    }
    if (role === "client" && String(doc.clientId || "") !== String(currentUser.id) && String(doc.ownerId || "") !== String(currentUser.id)) return;
    const nextDocs = db.documents.filter((d) => getDocId(d) !== String(docId));
    await saveAll({ ...db, documents: nextDocs }, "Document deleted.");
  };

  const markNotificationRead = async (notifId) => {
    const nextNotifications = db.notifications.map((n) =>
      String(n.id || "") === String(notifId) ? { ...n, isRead: true, read: true } : n
    );
    await saveAll({ ...db, notifications: nextNotifications });
  };

  const markAllNotificationsRead = async () => {
    const clientId = currentUser.id;
    const nextNotifications = db.notifications.map((n) =>
      String(n.userId || "") === String(clientId) ? { ...n, isRead: true, read: true } : n
    );
    await saveAll({ ...db, notifications: nextNotifications }, "All messages marked as read.");
  };

  const bookAppointmentAsClient = async (e) => {
    e.preventDefault();
    if (role !== "client") return;
    if (!apptForm.lawyerId) {
      setNotice("Please select a lawyer before submitting.");
      return;
    }
    if (!apptForm.date || !apptForm.time) {
      setNotice("Please choose a date and time.");
      return;
    }

    // Find assistant assigned to the chosen lawyer (lawyerId field on assistant)
    const assignedAssistant = db.users.find(
      (u) =>
        String(u.role || "").toLowerCase() === "assistant" &&
        String(u.lawyerId || "") === String(apptForm.lawyerId)
    );

    // If an assistant is assigned, request goes to them; otherwise directly to the lawyer
    const routeToUserId = assignedAssistant ? assignedAssistant.id : apptForm.lawyerId;
    const routeToName =
      assignedAssistant
        ? assignedAssistant.name
        : (db.users.find((u) => String(u.id) === String(apptForm.lawyerId))?.name || "Lawyer");
    const appointmentStatus = assignedAssistant ? "Awaiting Assistant Review" : "Awaiting Lawyer Review";

    const newApptId = `A-${Date.now()}`;
    const newAppointment = {
      id: newApptId,
      clientId: currentUser.id,
      lawyerId: apptForm.lawyerId,
      assistantId: assignedAssistant?.id || "",
      date: apptForm.date,
      time: apptForm.time,
      type: apptForm.type,
      status: appointmentStatus,
      payment: "Pending"
    };

    const newNotification = {
      id: `N-${Date.now()}`,
      userId: routeToUserId,
      title: "New Appointment Request",
      message: `Client ${currentUser.name || "Client"} has requested a ${apptForm.type} appointment on ${apptForm.date} at ${apptForm.time}.`,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    await saveAll(
      { ...db, appointments: [newAppointment, ...db.appointments], notifications: [newNotification, ...db.notifications] },
      `Request sent to ${routeToName} for approval.`
    );
    setApptForm({ type: CASE_CATEGORIES[0], date: "", time: "", lawyerId: "" });
  };

  const cancelAppointment = async (apptId) => {
    if (role !== "client") return;
    const appt = db.appointments.find((a) => getApptId(a) === String(apptId));
    if (!appt) return;
    if (String(appt.clientId || "") !== String(currentUser.id)) return;
    const cancellable = ["Awaiting Assistant Review", "Awaiting Lawyer Review", "Pending"];
    if (!cancellable.includes(appt.status)) {
      setNotice("This appointment can no longer be cancelled.");
      return;
    }
    const confirmed = window.confirm("Cancel this appointment request?");
    if (!confirmed) return;
    const nextAppointments = db.appointments.filter((a) => getApptId(a) !== String(apptId));
    await saveAll({ ...db, appointments: nextAppointments }, "Appointment cancelled.");
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const roleUsers = db.users.filter((u) => String(u.role || "").toLowerCase() === role).length;
  const lawyerCases = db.cases.filter((c) => String(c.lawyerId || "") === String(currentUser.id || ""));
  const assistantMine = db.appointments.filter((a) => String(a.assistantId || "") === String(currentUser.id || ""));
  const assistantIncoming = assistantMine.filter((a) => String(a.status || "").toLowerCase().includes("awaiting") || String(a.status || "").toLowerCase().includes("pending"));
  const assistantLawyerAppointments = db.appointments.filter((a) => String(a.lawyerId || "") === String(currentUser.lawyerId || ""));
  const assistantCases = db.cases.filter((c) => String(c.assistantId || "") === String(currentUser.id || ""));
  const assistantSearchText = String(assistantSearch || "").trim().toLowerCase();
  const assistantRequestsFiltered = assistantIncoming.filter((a) =>
    `${a.type || ""} ${a.date || ""} ${a.time || ""}`.toLowerCase().includes(assistantSearchText)
  );
  const assistantHandlingFiltered = assistantMine.filter((a) =>
    `${a.type || ""} ${a.date || ""} ${a.time || ""} ${a.status || ""}`.toLowerCase().includes(assistantSearchText)
  );
  const assistantCasesFiltered = assistantCases.filter((c) =>
    `${c.title || ""} ${getCaseId(c)} ${c.status || ""} ${c.clientName || c.client || ""}`.toLowerCase().includes(assistantSearchText)
  );
  const assistantDocsCasesFiltered = assistantCases.filter((c) =>
    `${c.title || ""} ${getCaseId(c)}`.toLowerCase().includes(assistantSearchText)
  );
  const selectedAssistantCase = assistantCases.find((c) => getCaseId(c) === String(selectedAssistantCaseId || ""));
  const clientAppointments = db.appointments.filter((a) => String(a.clientId || "") === String(currentUser.id || ""));
  const clientCases = db.cases.filter((c) => String(c.clientId || "") === String(currentUser.id || ""));
  const clientNotifications = db.notifications
    .filter((n) => String(n.userId || "") === String(currentUser.id || ""))
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  const clientUnreadCount = clientNotifications.filter((n) => !n.isRead && !n.read).length;
  const visibleSchedules =
    role === "admin"
      ? db.schedules
      : role === "lawyer"
        ? db.schedules.filter((s) => String(s.lawyerId || "") === String(currentUser.id || ""))
        : role === "assistant"
          ? db.schedules.filter((s) => String(s.lawyerId || "") === String(currentUser.lawyerId || ""))
          : [];
  const visibleDocs =
    role === "admin"
      ? db.documents
      : role === "lawyer"
        ? db.documents.filter((d) => String(d.lawyerId || "") === String(currentUser.id || "") || String(d.ownerId || "") === String(currentUser.id || ""))
        : role === "assistant"
          ? db.documents.filter((d) => String(d.ownerId || "") === String(currentUser.id || ""))
          : db.documents.filter((d) => String(d.clientId || "") === String(currentUser.id || "") || String(d.ownerId || "") === String(currentUser.id || ""));
  const selectedAssistantCaseDocs = visibleDocs.filter((d) => getCaseId({ caseId: d.caseId }) === String(selectedAssistantCaseId || ""));
  const docsCaseOptions =
    role === "lawyer"
      ? db.cases.filter((c) => String(c.lawyerId || "") === String(currentUser.id || ""))
      : role === "assistant"
        ? db.cases.filter((c) => String(c.assistantId || "") === String(currentUser.id || ""))
        : role === "client"
          ? db.cases.filter((c) => String(c.clientId || "") === String(currentUser.id || ""))
          : db.cases;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.shell} px-4 py-8 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <img src="/uploads/logo.png" alt="SASF Law Firm Logo" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SASF Law Firm</p>
              <h1 className="font-serif text-3xl text-slate-900">{roleLabel} Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badge}`}>{roleLabel} Workspace</span>
            <button onClick={onLogout} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${theme.accent}`}>
              Logout
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Signed In As" value={name} />
          <MetricCard label="Role" value={roleLabel} />
          <MetricCard label={`Total ${roleLabel}s`} value={String(roleUsers || 1)} />
          <MetricCard label="Platform Users" value={String(db.users.length || 0)} />
        </section>

        {notice ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">{notice}</p> : null}
        {loading ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">Loading workspace data...</p> : null}

        {role === "admin" ? (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <h2 className="font-serif text-4xl text-slate-900">User Management</h2>
            <p className="mt-2 text-sm text-slate-600">Admin can edit, disable/enable, and delete non-admin users.</p>
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {db.users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-200">
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2 capitalize">{u.role}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2 capitalize">{u.status || "active"}</td>
                      <td className="px-3 py-2">
                        {String(u.role || "").toLowerCase() === "admin" ? (
                          <span className="text-xs text-slate-400">Owner</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => editUser(u.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                            <button onClick={() => toggleUserStatus(u.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${theme.accent}`}>
                              {(u.status || "active") === "blocked" ? "Enable" : "Disable"}
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700">
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {role === "lawyer" ? (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <h2 className="font-serif text-4xl text-slate-900">Case Control</h2>
            <p className="text-sm text-slate-600">Cases are created by assistants after category-based request review. Lawyer can update progress and status.</p>
            <div className="space-y-3">
              {lawyerCases.length ? lawyerCases.map((c) => {
                const id = getCaseId(c);
                return (
                  <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-base font-semibold text-slate-900">{c.title || "Untitled Case"}</p>
                    <p className="text-xs text-slate-500">Case ID: {id}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-600">Client: {c.clientName || c.client || "Client"}</span>
                      <select value={c.status || "Open"} onChange={(e) => updateCaseStatus(id, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Pending</option>
                        <option>Closed</option>
                      </select>
                      <button onClick={() => updateCaseProgress(id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${theme.accent}`}>
                        Update Progress
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Progress: {c.progressNote || c.notes || "No progress note yet."}</p>
                  </div>
                );
              }) : <p className="text-sm text-slate-500">No assigned cases yet.</p>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">Manage My Schedule</p>
              <form onSubmit={createSchedule} className="grid gap-3 md:grid-cols-4">
                <input value={scheduleForm.title} onChange={(e) => setScheduleForm((p) => ({ ...p, title: e.target.value }))} placeholder="Event title" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))} required className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))} required className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <button className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${theme.accent}`}>Add Event</button>
              </form>
              <div className="mt-3 space-y-2">
                {visibleSchedules.map((s) => (
                  <div key={getScheduleId(s)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-sm text-slate-700">{s.title} - {s.date} {s.time}</span>
                    <div className="flex gap-2">
                      <button onClick={() => editSchedule(getScheduleId(s))} className="rounded border border-slate-300 px-2 py-1 text-xs">Edit</button>
                      <button onClick={() => deleteSchedule(getScheduleId(s))} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">Documents</p>
              <form onSubmit={addDocument} className="grid gap-3 md:grid-cols-4">
                <select value={docForm.caseId} onChange={(e) => setDocForm((p) => ({ ...p, caseId: e.target.value }))} required className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Select case</option>
                  {docsCaseOptions.map((c) => <option key={getCaseId(c)} value={getCaseId(c)}>{c.title}</option>)}
                </select>
                <input value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} placeholder="Document title" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <select value={docForm.category} onChange={(e) => setDocForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  <option>Evidence</option><option>Contract</option><option>Notice</option><option>Other</option>
                </select>
                <button className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${theme.accent}`}>Submit</button>
                <input ref={docFileRef} type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.pptx" onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files[0] || null }))} className="col-span-full cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700" />
              </form>
              <div className="mt-3 space-y-2">
                {visibleDocs.map((d) => (
                  <div key={getDocId(d)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-sm text-slate-700">{d.name || d.title} ({d.category || d.fileType || "Doc"})</span>
                    <div className="flex gap-2">
                      {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-slate-300 px-2 py-1 text-xs">View</a>}
                      <button onClick={() => renameDocument(getDocId(d))} className="rounded border border-slate-300 px-2 py-1 text-xs">Rename</button>
                      <button onClick={() => removeDocument(getDocId(d))} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {role === "assistant" ? (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-4xl text-slate-900">Assistant Dashboard</h2>
              <button onClick={onLogout} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${theme.accent}`}>Logout</button>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={assistantSearch}
                onChange={(e) => setAssistantSearch(e.target.value)}
                placeholder="Search requests, cases, dates..."
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600">
                Assigned Lawyer: {lawyersOnly.find((l) => String(l.id) === String(currentUser.lawyerId || ""))?.name || "Not assigned"}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["requests", "Initial Page"],
                ["handling", "Appointment Handling"],
                ["cases", "Case Controller"],
                ["documents", "Document Controller"],
                ["schedule", "Lawyer Schedule"]
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setAssistantPage(id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    assistantPage === id ? `${theme.accent} border-transparent text-white` : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {assistantPage === "requests" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">1. Initial Page - Client Book Requests</p>
                <div className="mt-3 space-y-3">
                  {assistantRequestsFiltered.length ? assistantRequestsFiltered.map((a) => {
                    const id = getApptId(a);
                    return (
                      <div key={id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">{a.type} - {a.date} {a.time}</p>
                        <p className="text-xs text-slate-500">Status: {a.status || "Awaiting Assistant Review"}</p>
                        <button onClick={() => selectRequestForHandling(id)} className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${theme.accent}`}>
                          Select
                        </button>
                      </div>
                    );
                  }) : <p className="text-sm text-slate-500">No assigned client requests.</p>}
                </div>
              </div>
            ) : null}

            {assistantPage === "handling" ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">2. Appointment Handling</p>
                <div className="space-y-3">
                  {assistantHandlingFiltered.length ? assistantHandlingFiltered.map((a) => {
                    const id = getApptId(a);
                    return (
                      <div key={id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">{a.type} - {a.date} {a.time}</p>
                        <p className="text-xs text-slate-500">Status: {a.status || "Handling"}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={() => communicateWithClient(id)} className="rounded border border-slate-300 px-3 py-1.5 text-xs">Communicate</button>
                          <button onClick={() => confirmAppointmentByAssistant(id)} className="rounded border border-emerald-300 px-3 py-1.5 text-xs text-emerald-700">Confirm</button>
                          <button
                            onClick={async () => {
                              await createCaseFromRequest(id);
                              setAssistantPage("cases");
                            }}
                            className={`rounded px-3 py-1.5 text-xs font-semibold text-white ${theme.accent}`}
                          >
                            Take Case
                          </button>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-slate-500">No appointments in handling queue.</p>}
                </div>
              </div>
            ) : null}

            {assistantPage === "cases" ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">3. Case Controller</p>
                <div className="space-y-3">
                  {assistantCasesFiltered.length ? assistantCasesFiltered.map((c) => {
                    const id = getCaseId(c);
                    return (
                      <div key={id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">{c.title} ({id})</p>
                        <p className="text-xs text-slate-500">Client: {c.clientName || c.client || "Client"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <select
                            value={c.status || "Pending"}
                            onChange={(e) => updateCaseStatus(id, e.target.value)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>On Hold</option>
                            <option>Closed</option>
                          </select>
                          <button onClick={() => setSelectedAssistantCaseId(id)} className="rounded border border-slate-300 px-3 py-1.5 text-xs">Open in Document Controller</button>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-slate-500">No taken cases yet.</p>}
                </div>
              </div>
            ) : null}

            {assistantPage === "documents" ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">4. Document Controller</p>
                <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-2">
                    {assistantDocsCasesFiltered.length ? assistantDocsCasesFiltered.map((c) => {
                      const id = getCaseId(c);
                      const isActive = String(selectedAssistantCaseId) === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedAssistantCaseId(id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                            isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"
                          }`}
                        >
                          {c.title} ({id})
                        </button>
                      );
                    }) : <p className="text-sm text-slate-500">No cases to manage documents.</p>}
                  </div>
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                    {selectedAssistantCase ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900">{selectedAssistantCase.title} ({getCaseId(selectedAssistantCase)})</p>
                        <p className="text-xs text-slate-500">{selectedAssistantCase.notes || "No case details yet."}</p>
                        <button onClick={() => updateAssistantCaseData(getCaseId(selectedAssistantCase))} className="rounded border border-slate-300 px-3 py-1.5 text-xs">
                          View/Edit Case Data
                        </button>

                        <form onSubmit={addDocument} className="grid gap-2 sm:grid-cols-3">
                          <input type="hidden" value={selectedAssistantCaseId} />
                          <select value={docForm.caseId} onChange={(e) => setDocForm((p) => ({ ...p, caseId: e.target.value }))} className="rounded border border-slate-300 px-2 py-1.5 text-xs">
                            <option value="">Select case</option>
                            {assistantDocsCasesFiltered.map((c) => <option key={getCaseId(c)} value={getCaseId(c)}>{c.title}</option>)}
                          </select>
                          <input value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} placeholder="Doc title" className="rounded border border-slate-300 px-2 py-1.5 text-xs" />
                          <button className={`rounded px-3 py-1.5 text-xs font-semibold text-white ${theme.accent}`}>Submit Doc</button>
                          <input ref={docFileRef} type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.pptx" onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files[0] || null }))} className="col-span-full cursor-pointer rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-500 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700" />
                        </form>
                        <div className="space-y-2">
                          {selectedAssistantCaseDocs.length ? selectedAssistantCaseDocs.map((d) => (
                            <div key={getDocId(d)} className="flex items-center justify-between gap-2 rounded border border-slate-200 px-2 py-1.5 text-xs">
                              <span>{d.name || d.title}</span>
                              <div className="flex gap-2">
                                {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-slate-300 px-2 py-1">View</a>}
                                <button onClick={() => renameDocument(getDocId(d))} className="rounded border border-slate-300 px-2 py-1">Edit</button>
                                <button onClick={() => removeDocument(getDocId(d))} className="rounded border border-rose-300 px-2 py-1 text-rose-600">Delete</button>
                              </div>
                            </div>
                          )) : <p className="text-xs text-slate-500">No documents for selected case.</p>}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Select a case to view/edit case data and documents.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {assistantPage === "schedule" ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">5. Lawyer Schedule</p>
                <p className="text-xs text-slate-500">Red-marked dates indicate the assigned lawyer is busy.</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setAssistantCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    Prev
                  </button>
                  <p className="text-sm font-semibold text-slate-800">
                    {assistantCalendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                  <button
                    onClick={() => setAssistantCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    Next
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const y = assistantCalendarMonth.getFullYear();
                    const m = assistantCalendarMonth.getMonth();
                    const firstDay = new Date(y, m, 1).getDay();
                    const daysInMonth = new Date(y, m + 1, 0).getDate();
                    const cells = [];
                    for (let i = 0; i < firstDay; i += 1) cells.push(<div key={`p-${i}`} className="h-9 rounded bg-transparent" />);
                    for (let d = 1; d <= daysInMonth; d += 1) {
                      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                      const busy = visibleSchedules.some((s) => String(s.date || "") === dateStr);
                      cells.push(
                        <div key={dateStr} className={`grid h-9 place-items-center rounded text-xs ${busy ? "bg-rose-500 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                          {d}
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {role === "client" ? (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-4xl text-slate-900">Client Portal</h2>
              {clientUnreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">
                  {clientUnreadCount} unread {clientUnreadCount === 1 ? "message" : "messages"}
                </span>
              )}
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                { id: "overview", label: "Overview" },
                { id: "cases", label: "Case Status" },
                { id: "documents", label: "Documents" },
                { id: "inbox", label: clientUnreadCount > 0 ? `Inbox (${clientUnreadCount})` : "Inbox" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setClientTab(tab.id)}
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${clientTab === tab.id ? `text-white ${theme.accent}` : "text-slate-600 hover:text-slate-900"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {clientTab === "overview" && (
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Request New Appointment</p>
                  <form onSubmit={bookAppointmentAsClient} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <select
                      value={apptForm.lawyerId}
                      onChange={(e) => setApptForm((p) => ({ ...p, lawyerId: e.target.value }))}
                      required
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">— Select Lawyer —</option>
                      {lawyersOnly.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}{l.department ? ` · ${l.department}` : ""}
                        </option>
                      ))}
                    </select>
                    <select
                      value={apptForm.type}
                      onChange={(e) => setApptForm((p) => ({ ...p, type: e.target.value }))}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      {CASE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={apptForm.date}
                      onChange={(e) => setApptForm((p) => ({ ...p, date: e.target.value }))}
                      required
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={apptForm.time}
                      onChange={(e) => setApptForm((p) => ({ ...p, time: e.target.value }))}
                      required
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                    {apptForm.lawyerId && (() => {
                      const assignedAst = db.users.find(
                        (u) => String(u.role || "").toLowerCase() === "assistant" && String(u.lawyerId || "") === String(apptForm.lawyerId)
                      );
                      return (
                        <p className="col-span-full text-xs text-slate-500">
                          {assignedAst
                            ? `Request will go to ${assignedAst.name} (assistant) for approval.`
                            : "Request will go directly to the selected lawyer for approval."}
                        </p>
                      );
                    })()}
                    <button className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${theme.accent}`}>
                      Request Appointment
                    </button>
                  </form>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">My Appointments</p>
                  <div className="mt-3 space-y-2">
                    {clientAppointments.length ? clientAppointments.map((a) => {
                      const aId = getApptId(a);
                      const isCancellable = ["Awaiting Assistant Review", "Awaiting Lawyer Review", "Pending"].includes(a.status);
                      const apptLawyer = db.users.find((u) => String(u.id) === String(a.lawyerId || ""));
                      return (
                        <div key={aId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{a.type} — {a.date} at {a.time}</p>
                              {apptLawyer && <p className="mt-0.5 text-xs text-slate-500">Lawyer: {apptLawyer.name}</p>}
                              <p className="mt-0.5 text-xs text-slate-500">Status: {a.status || "Pending"}</p>
                            </div>
                            {isCancellable && (
                              <button
                                onClick={() => cancelAppointment(aId)}
                                className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }) : <p className="text-sm text-slate-500">No appointments booked yet.</p>}
                  </div>
                </div>
              </div>
            )}

            {clientTab === "cases" && (
              <div className="space-y-3">
                {clientCases.length ? clientCases.map((c) => {
                  const cId = getCaseId(c);
                  const isExpanded = expandedCase === cId;
                  const statusColorMap = {
                    "Open": "bg-blue-100 text-blue-800",
                    "In Progress": "bg-amber-100 text-amber-800",
                    "Review": "bg-purple-100 text-purple-800",
                    "Pending": "bg-slate-100 text-slate-700",
                    "Pending Lawyer Review": "bg-orange-100 text-orange-800",
                    "Closed": "bg-green-100 text-green-800",
                    "On Hold": "bg-rose-100 text-rose-800",
                    "Accepted by Assistant": "bg-teal-100 text-teal-800"
                  };
                  const statusColor = statusColorMap[c.status] || "bg-slate-100 text-slate-700";
                  const assignedLawyer = db.users.find((u) => String(u.id || "") === String(c.lawyerId || ""));
                  const assignedAssistant = db.users.find((u) => String(u.id || "") === String(c.assistantId || ""));
                  return (
                    <div key={cId} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => setExpandedCase(isExpanded ? null : cId)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
                            {c.status || "In Progress"}
                          </span>
                          <p className="text-sm font-semibold text-slate-900">{c.title || "Untitled Case"}</p>
                        </div>
                        <span className="ml-3 flex-shrink-0 text-xs text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-white px-4 py-4 space-y-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            <div><span className="text-slate-500">Case ID:</span><span className="ml-1 font-medium text-slate-800">{cId}</span></div>
                            <div><span className="text-slate-500">Type:</span><span className="ml-1 font-medium text-slate-800">{c.type || c.caseType || "—"}</span></div>
                            <div><span className="text-slate-500">Priority:</span><span className="ml-1 font-medium text-slate-800">{c.priority || "—"}</span></div>
                            <div><span className="text-slate-500">Hearing Date:</span><span className="ml-1 font-medium text-slate-800">{c.hearingDate || "—"}</span></div>
                            {assignedLawyer && <div><span className="text-slate-500">Assigned Lawyer:</span><span className="ml-1 font-medium text-slate-800">{assignedLawyer.name}</span></div>}
                            {assignedAssistant && <div><span className="text-slate-500">Assigned Assistant:</span><span className="ml-1 font-medium text-slate-800">{assignedAssistant.name}</span></div>}
                            {c.lastUpdated && (
                              <div className="col-span-2"><span className="text-slate-500">Last Updated:</span><span className="ml-1 font-medium text-slate-800">{new Date(c.lastUpdated).toLocaleString()}</span></div>
                            )}
                          </div>
                          {(c.progressNote || c.notes) && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Progress Update</p>
                              <p className="text-sm text-slate-700">{c.progressNote || c.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }) : <p className="text-sm text-slate-500">No active cases yet.</p>}
              </div>
            )}

            {clientTab === "documents" && (
              <div className="space-y-4">
                <form onSubmit={addDocument} className="grid gap-3 md:grid-cols-4">
                  <select value={docForm.caseId} onChange={(e) => setDocForm((p) => ({ ...p, caseId: e.target.value }))} required className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Select case</option>
                    {docsCaseOptions.map((c) => <option key={getCaseId(c)} value={getCaseId(c)}>{c.title}</option>)}
                  </select>
                  <input value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} placeholder="Document title" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <select value={docForm.category} onChange={(e) => setDocForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                    <option>Evidence</option><option>Identity</option><option>Contract</option><option>Other</option>
                  </select>
                  <button className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${theme.accent}`}>Upload</button>
                  <input ref={docFileRef} type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.pptx" onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files[0] || null }))} className="col-span-full cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700" />
                </form>
                <div className="space-y-2">
                  {visibleDocs.length ? visibleDocs.map((d) => (
                    <div key={getDocId(d)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div>
                        <span className="text-sm text-slate-700">{d.name || d.title}</span>
                        {(d.category || d.fileType) && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">{d.category || d.fileType}</span>}
                      </div>
                      <div className="flex gap-2">
                        {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-slate-300 px-2 py-1 text-xs">View</a>}
                        <button onClick={() => renameDocument(getDocId(d))} className="rounded border border-slate-300 px-2 py-1 text-xs">Rename</button>
                        <button onClick={() => removeDocument(getDocId(d))} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600">Delete</button>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No documents uploaded yet.</p>}
                </div>
              </div>
            )}

            {clientTab === "inbox" && (
              <div className="space-y-3">
                {clientNotifications.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{clientNotifications.length} {clientNotifications.length === 1 ? "message" : "messages"}</p>
                    {clientUnreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-xs text-slate-500 underline hover:text-slate-800">
                        Mark all as read
                      </button>
                    )}
                  </div>
                )}
                {clientNotifications.length ? clientNotifications.map((n) => {
                  const isUnread = !n.isRead && !n.read;
                  return (
                    <div
                      key={n.id}
                      className={`rounded-xl border p-4 ${isUnread ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isUnread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" />}
                            <p className="text-sm font-semibold text-slate-900">{n.title || "Message"}</p>
                          </div>
                          <p className="mt-1 text-sm text-slate-700">{n.message}</p>
                          <p className="mt-1.5 text-xs text-slate-400">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : n.date || ""}
                          </p>
                        </div>
                        {isUnread && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="flex-shrink-0 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-slate-500">Your inbox is empty.</p>}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AuthExperience({ onBack, onLoginSuccess, availableLawyers = [] }) {
  const [role, setRole] = useState("client");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const theme = roleThemes[role];
  const canRegister = role !== "admin";

  useEffect(() => {
    if (role === "admin" && mode === "register") {
      setMode("login");
    }
  }, [mode, role]);

  const roleHeading = role === "assistant" ? "Assistant Portal" : role === "lawyer" ? "Lawyer Portal" : role === "admin" ? "Admin Portal" : "Client Portal";
  const roleSubheading =
    role === "assistant"
      ? "Join the team. Create your assistant profile today."
      : role === "lawyer"
        ? "Create your lawyer profile for case and schedule management."
        : role === "client"
          ? "Open a client account for appointments and case tracking."
          : "Secure admin access only. Registration is disabled.";
  const roleBadge = role === "assistant" ? "bg-amber-800" : role === "lawyer" ? "bg-green-800" : role === "client" ? "bg-blue-900" : "bg-purple-900";
  const roleButton = role === "assistant" ? "bg-amber-800 hover:bg-amber-900" : role === "lawyer" ? "bg-green-800 hover:bg-green-900" : role === "client" ? "bg-blue-900 hover:bg-blue-950" : "bg-purple-900 hover:bg-purple-950";
  const signupButtonLabel = role === "assistant" ? "Create Assistant Account" : role === "lawyer" ? "Create Lawyer Account" : "Create Client Account";

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") || "").trim().toLowerCase();
      const password = String(form.get("password") || "");
      const loginResponse = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password, role }
      });

      const loggedInRole = String(loginResponse?.role || "").toLowerCase();
      const loggedInUserId = String(loginResponse?.userId || "");
      const loggedInName = String(loginResponse?.name || "").trim();

      localStorage.setItem(SESSION_KEY, loggedInUserId);

      setMessage("Login successful.");
      setTimeout(() => {
        onLoginSuccess({
          userId: loggedInUserId,
          role: loggedInRole || role,
          name: loggedInName || email
        });
      }, 450);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!canRegister) return;
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const name = String(form.get("full_name") || "").trim();
      const email = String(form.get("email") || "").trim().toLowerCase();
      const phone = String(form.get("phone") || "").trim();
      const password = String(form.get("password") || "");
      const confirmPassword = String(form.get("confirm_password") || "");

      if (!name || !email || !phone) throw new Error("Please complete all required fields.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");

      const state = await apiRequest("/api/load");
      state.users = Array.isArray(state.users) ? state.users : [];
      if (state.users.some((u) => String(u.email || "").toLowerCase() === email)) {
        throw new Error("This email is already registered.");
      }

      const department =
        role === "assistant"
          ? String(form.get("case_category") || "Operations")
          : role === "lawyer"
            ? String(form.get("practice_area") || "General Law")
            : String(form.get("primary_case_type") || "Client Services");

      state.users.push({
        id: `u-${Date.now()}`,
        name,
        email,
        password,
        role,
        phone,
        department,
        level: role === "assistant" ? "Assistant" : role === "lawyer" ? "Associate" : "Client",
        lawyerId: role === "assistant" ? String(form.get("assigned_lawyer") || "") : "",
        image_url: "",
        verified: false,
        status: "active"
      });

      state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
      state.notifications.unshift({
        notifId: `N-${Date.now()}`,
        userId: "u-admin",
        title: "New Registration",
        message: `${name} registered as ${role}.`,
        createdAt: new Date().toISOString(),
        isRead: false
      });

      await apiRequest("/api/save", { method: "POST", body: state });
      setMode("login");
      setMessage("Account created successfully. Please sign in.");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f1ee] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <button onClick={onBack} className="mb-5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          Back to Landing
        </button>

        <section className="rounded-3xl border border-amber-100 bg-[#fbfbfa] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="mb-6 flex justify-center">
            <div className={`grid h-16 w-16 place-items-center rounded-2xl text-xl font-bold text-white shadow-lg ${roleBadge}`}>
              {role === "assistant" ? "A" : role === "lawyer" ? "L" : role === "client" ? "C" : "AD"}
            </div>
          </div>

          <h2 className="text-center text-5xl font-semibold text-slate-800">{roleHeading}</h2>
          <p className="mt-2 text-center text-base text-slate-500">{roleSubheading}</p>

          <div className="mt-6 mb-6 grid grid-cols-4 rounded-xl bg-slate-100 p-1.5">
            {roleOrder.map((key) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                className={`rounded-lg px-1 py-2 text-xs font-semibold capitalize transition ${role === key ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
              >
                {key}
              </button>
            ))}
          </div>

          {mode === "login" || !canRegister ? (
            <>
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ background: theme.accentSoft, color: theme.accent }}>
                {theme.label} Access
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Sign In</h2>
              <p className="mt-1 text-sm text-slate-500">Secure access for the legal workspace</p>

              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <Input name="email" label="Email" type="email" placeholder={`${role}@sasf-law.com`} />
                <PasswordInput name="password" label="Password" placeholder="Enter password" />
                <button type="submit" disabled={submitting} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${roleButton}`}>
                  {submitting ? "Signing In..." : "Sign In"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-slate-900">Create Account</h2>
              <p className="mt-1 text-sm text-slate-500">Registration fields are customized by role.</p>

              <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                <Input name="full_name" label="Full Name" type="text" placeholder="Enter your full name" />
                <Input name="email" label="Email Address" type="email" placeholder="you@sasf-law.com" />
                <Input name="phone" label="Phone Number" type="text" placeholder="+880..." />

                {role === "assistant" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField name="case_category" label="Case Category" options={CASE_CATEGORIES} placeholder="Select..." />
                    <SelectField
                      name="assigned_lawyer"
                      label="Select Lawyer"
                      options={availableLawyers}
                      placeholder="Choose..."
                    />
                  </div>
                ) : null}

                {role === "client" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField name="primary_case_type" label="Primary Case Type" options={CASE_CATEGORIES} placeholder="Select..." />
                    <SelectField name="preferred_contact" label="Preferred Contact" options={["Email", "Phone", "WhatsApp"]} placeholder="Choose..." />
                  </div>
                ) : null}

                {role === "lawyer" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input name="bar_council_id" label="Bar Council ID" type="text" placeholder="Enter ID" />
                    <SelectField name="practice_area" label="Practice Area" options={CASE_CATEGORIES} placeholder="Select..." />
                  </div>
                ) : null}

                <PasswordInput name="password" label="Create Password" placeholder="At least 6 chars" />
                <PasswordInput name="confirm_password" label="Confirm Password" placeholder="Repeat password" />
                <button type="submit" disabled={submitting} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${roleButton}`}>
                  {submitting ? "Creating..." : signupButtonLabel}
                </button>
              </form>
            </>
          )}

          {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
          {message ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}

          {canRegister ? (
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5">
              <button onClick={() => setMode("login")} className={`rounded-lg px-3 py-2 text-base font-semibold transition ${mode === "login" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}>
                Login
              </button>
              <button onClick={() => setMode("register")} className={`rounded-lg px-3 py-2 text-base font-semibold transition ${mode === "register" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}>
                Sign Up
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function SelectField({ name, label, options, placeholder }) {
  const normalized = options.map((item) => (typeof item === "string" ? { label: item, value: item } : item));
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <select
          name={name}
          defaultValue=""
          required
          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {normalized.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">v</span>
      </div>
    </label>
  );
}

function Input({ name, label, type, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function PasswordInput({ name, label, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
function AreaIcon({ name }) {
  if (name === "brief") return <BriefIcon />;
  if (name === "scales") return <ScaleIcon />;
  if (name === "building") return <BuildingIcon />;
  if (name === "shield") return <ShieldIcon />;
  if (name === "document") return <DocumentIcon />;
  if (name === "passport") return <PassportIcon />;
  if (name === "network") return <NetworkIcon />;
  return <UsersIcon />;
}

function BriefIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M6 7h12" />
      <path d="M7 7 4 12h6L7 7Z" fill="none" />
      <path d="M17 7 14 12h6l-3-5Z" fill="none" />
      <path d="M9 21h6" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h1M11 7h1M14 7h1M8 11h1M11 11h1M14 11h1M8 15h1M11 15h1M14 15h1" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v6c0 5 3 7.5 7 9 4-1.5 7-4 7-9V6l-7-3Z" />
      <path d="m9.5 12 2 2 3-3" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="10" r="2" />
      <path d="M4 19a5 5 0 0 1 10 0" />
      <path d="M14 19a4 4 0 0 1 6 0" />
    </svg>
  );
}

function PassportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="11" r="3" />
      <path d="M9 11h6M12 8v6M8 16h8" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M12 7v4M10 11 6.5 16M14 11l3.5 5" />
    </svg>
  );
}

