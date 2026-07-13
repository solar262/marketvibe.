'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Clipboard,
  Download,
  Gauge,
  Layers3,
  LineChart,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquareText,
  Quote,
  Radar,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UsersRound,
  Zap,
} from 'lucide-react';

const signals = [
  {
    id: 'MV-1041',
    company: 'Northstar Web Studio',
    buyer: 'Agency founder',
    source: 'LinkedIn founder post',
    location: 'Manchester, UK',
    niche: 'Agencies',
    intent: 'Needs clients now',
    score: 94,
    urgency: 'Hot',
    value: 'EUR 4k-12k project',
    pain: 'Publicly asked how other small studios are filling the next 60 days after referrals slowed down.',
    reason: 'The post names a short-term opportunity gap, a clear service category, and an immediate revenue problem.',
    angle:
      'Open with a short opportunity brief: 3 nearby B2B niches, 12 companies showing website refresh signals, and a founder-led outreach script.',
    nextMove: 'Offer a 7-day opportunity sample focused on local B2B service companies.',
    tags: ['web design', 'founder-led', 'opportunity'],
  },
  {
    id: 'MV-1042',
    company: 'Beacon Legal Ops',
    buyer: 'Operations consultant',
    source: 'Public community thread',
    location: 'Dublin, IE',
    niche: 'Consultants',
    intent: 'Seeking growth system',
    score: 88,
    urgency: 'High',
    value: 'EUR 2k-8k monthly retainer',
    pain: 'Asked for non-ad channels to reach funded startups that need process automation.',
    reason: 'The buyer already sells a high-ticket service and is looking for a repeatable customer acquisition channel.',
    angle:
      'Lead with a niche signal feed: funded startups hiring ops roles, mentioning document chaos, or changing tooling.',
    nextMove: 'Send a sample report with 20 startup ops signals and one outreach angle per signal.',
    tags: ['automation', 'startups', 'ops'],
  },
  {
    id: 'MV-1043',
    company: 'Atlas Roofing Group',
    buyer: 'Local business owner',
    source: 'Google Business Profile discussion',
    location: 'Austin, US',
    niche: 'Local Services',
    intent: 'Visibility problem',
    score: 82,
    urgency: 'High',
    value: 'EUR 1k-3k local SEO package',
    pain: 'Owner mentioned that competitors with fewer reviews are showing higher in local search results.',
    reason: 'The problem is specific, public, and maps directly to GBP optimization, reviews, and local SEO.',
    angle:
      'Start with a 3-point visibility audit: map pack rank, review velocity, and category mismatch.',
    nextMove: 'Package as a local growth report for roofing and home services in the same region.',
    tags: ['local SEO', 'reviews', 'GBP'],
  },
  {
    id: 'MV-1044',
    company: 'OrbitCRM',
    buyer: 'SaaS founder',
    source: 'Founder forum post',
    location: 'Berlin, DE',
    niche: 'SaaS',
    intent: 'Needs outbound channel',
    score: 91,
    urgency: 'Hot',
    value: 'EUR 6k-20k annual contract',
    pain: 'Founder said inbound is inconsistent and asked how small SaaS teams find qualified sales conversations.',
    reason: 'Strong sales pain, clear buyer type, and willingness to discuss tooling and process.',
    angle:
      'Position MarketVibe as a weekly feed of companies changing CRMs, hiring sales ops, or complaining about follow-up gaps.',
    nextMove: 'Offer a vertical-specific feed for agencies, clinics, or field-service companies using spreadsheets.',
    tags: ['SaaS', 'outbound', 'CRM'],
  },
  {
    id: 'MV-1045',
    company: 'Luma Skincare',
    buyer: 'Ecommerce operator',
    source: 'Public marketing thread',
    location: 'Toronto, CA',
    niche: 'Ecommerce',
    intent: 'Traffic drop',
    score: 79,
    urgency: 'Medium',
    value: 'EUR 2k-7k growth project',
    pain: 'Operator posted that paid social costs rose while returning customer purchases flattened.',
    reason: 'The signal points to retention, lifecycle email, conversion, and creative testing needs.',
    angle:
      'Lead with a retention-first audit: repeat purchase windows, abandoned checkout, and email revenue share.',
    nextMove: 'Route to ecommerce lifecycle agencies and conversion specialists.',
    tags: ['retention', 'paid social', 'email'],
  },
  {
    id: 'MV-1046',
    company: 'Peak Performance Coaching',
    buyer: 'Business coach',
    source: 'LinkedIn comment',
    location: 'London, UK',
    niche: 'Coaches',
    intent: 'Lead flow problem',
    score: 75,
    urgency: 'Medium',
    value: 'EUR 1k-5k advisory package',
    pain: 'Commented that referrals are unpredictable and content creates likes instead of booked calls.',
    reason: 'The buyer has an active offer but lacks a reliable conversion path from attention to conversations.',
    angle:
      'Offer a founder-led sales sprint with buyer-intent topics, prospect lists, and daily direct message angles.',
    nextMove: 'Send the 7-day sample pack framed around coaches selling B2B transformation offers.',
    tags: ['coaching', 'content', 'sales calls'],
  },
  {
    id: 'MV-1047',
    company: 'ClearPath Automation',
    buyer: 'AI automation agency',
    source: 'Public agency group',
    location: 'Amsterdam, NL',
    niche: 'Agencies',
    intent: 'Seeking agency clients',
    score: 86,
    urgency: 'High',
    value: 'EUR 3k-15k automation build',
    pain: 'Asked which industries have urgent demand for AI workflow automation this quarter.',
    reason: 'The agency is ready to sell but needs market timing, niche focus, and live buyer pain signals.',
    angle:
      'Deliver a signal brief around operations-heavy firms hiring support staff or complaining about manual follow-ups.',
    nextMove: 'Pitch Growth Desk with custom niche tracking and weekly reports.',
    tags: ['AI automation', 'workflow', 'agency'],
  },
  {
    id: 'MV-1048',
    company: 'Harbor Dental Studio',
    buyer: 'Clinic manager',
    source: 'Local business forum',
    location: 'Cork, IE',
    niche: 'Local Services',
    intent: 'Booking gap',
    score: 72,
    urgency: 'Medium',
    value: 'EUR 1k-4k booking system',
    pain: 'Asked for ideas to fill hygiene appointments during weekday afternoons.',
    reason: 'A scheduling gap is visible, practical, and connected to ads, local search, reminders, and CRM automation.',
    angle:
      'Open with a weekday booking recovery plan: review capture, recall reminders, and local offer pages.',
    nextMove: 'Route to clinic marketing or booking automation providers.',
    tags: ['booking', 'healthcare', 'local'],
  },
];

const offers = [
  {
    name: 'Radar',
    price: 'EUR 299/mo',
    customers: 500,
    annual: 1794000,
    icon: Radar,
    note: 'Daily high-intent opportunities, intent scores, pain summaries, and outreach angles.',
  },
  {
    name: 'Growth Desk',
    price: 'EUR 750/mo + setup',
    customers: 20,
    annual: 210000,
    icon: Target,
    note: 'Custom niche tracking, weekly reports, CRM export, and monthly strategy call.',
  },
  {
    name: 'Agency Partner',
    price: 'EUR 2,500/mo',
    customers: 5,
    annual: 150000,
    icon: UsersRound,
    note: 'White-label reports, team seats, multiple niches, and client-ready opportunity lists.',
  },
  {
    name: 'Data Licence',
    price: 'EUR 25k-60k/yr',
    customers: 2,
    annual: 100000,
    icon: Layers3,
    note: 'Custom buyer-signal feeds, API/export access, compliance documentation, and onboarding.',
  },
];

const testimonials = [
  {
    quote:
      'Proof Pack delivery must use source-backed opportunities where available and label unevidenced intent clearly.',
    name: 'Source-backed delivery',
    role: 'Delivery standard',
  },
  {
    quote:
      'Every delivery is reviewed before customer handoff so the output stays relevant, explainable, and ready to use.',
    name: 'Quality review',
    role: 'Delivery standard',
  },
  {
    quote:
      'Customers are responsible for lawful, accurate outreach and should not treat scores as guaranteed sales outcomes.',
    name: 'Responsible outreach',
    role: 'Responsible use',
  },
];

const proofMetrics = [
  { label: 'Proof Pack', value: 'EUR 99', detail: 'One-off source-backed sample delivery.', icon: Radar },
  { label: 'Radar', value: 'EUR 299/mo', detail: 'Recurring dashboard access after onboarding.', icon: UsersRound },
  { label: 'Growth Desk', value: 'EUR 750/mo', detail: 'Managed delivery for focused niches and territories.', icon: LineChart },
];

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Proof Pack', path: '/sample' },
];

const publicPaths = new Set(navItems.map((item) => item.path));
const systemPaths = new Set(['/signup', '/thank-you']);
const calendlyUrl = 'https://calendly.com/marketvibe/growth-desk';
const typeformUrl = 'https://form.typeform.com/to/marketvibe-partner';
const niches = ['All', ...Array.from(new Set(signals.map((signal) => signal.niche)))];
const intents = ['All', ...Array.from(new Set(signals.map((signal) => signal.intent)))];

const currency = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function App() {
  const [route, setRoute] = useState('/');
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('All');
  const [intent, setIntent] = useState('All');
  const [minScore, setMinScore] = useState(70);
  const [selectedId, setSelectedId] = useState(signals[0].id);
  const [saved, setSaved] = useState(['MV-1041', 'MV-1044']);
  const [copiedId, setCopiedId] = useState('');
  const [sampleNiche, setSampleNiche] = useState('Agencies');
  const [sampleOffer, setSampleOffer] = useState('web design and AI automation retainers');
  const [brief, setBrief] = useState('');
  const [lead, setLead] = useState({ name: '', email: '', company: '', niche: 'Agencies' });
  const [leadStatus, setLeadStatus] = useState('');

  useEffect(() => {
    const normalized = window.location.pathname === '/purple-preview' ? '/' : normalizeRoute(window.location.pathname);
    if (window.location.pathname !== '/purple-preview' && normalized !== window.location.pathname) {
      window.history.replaceState({}, '', normalized);
    }

    const handlePopState = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('marketvibe_saved', JSON.stringify(saved));
  }, [saved]);

  const filteredSignals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return signals
      .filter((signal) => (niche === 'All' ? true : signal.niche === niche))
      .filter((signal) => (intent === 'All' ? true : signal.intent === intent))
      .filter((signal) => signal.score >= minScore)
      .filter((signal) => {
        if (!normalizedQuery) return true;
        const haystack = [
          signal.company,
          signal.buyer,
          signal.location,
          signal.pain,
          signal.reason,
          signal.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => b.score - a.score);
  }, [intent, minScore, niche, query]);

  const selectedSignal =
    filteredSignals.find((signal) => signal.id === selectedId) || filteredSignals[0] || signals[0];
  const savedSignals = signals.filter((signal) => saved.includes(signal.id));
  const hotSignals = filteredSignals.filter((signal) => signal.score >= 85);
  const revenueTotal = offers.reduce((sum, offer) => sum + offer.annual, 0);
  const samplePackSignals = signals
    .filter((signal) => signal.niche === sampleNiche)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const navigate = (path, event) => {
    if (event) event.preventDefault();
    const target = new URL(path, window.location.origin);
    const normalized = normalizeRoute(target.pathname);
    if (normalized === route && target.search === window.location.search) return;
    window.history.pushState({}, '', path);
    setRoute(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSaved = (id) => {
    setSaved((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  };

  const copyAngle = async (signal) => {
    await navigator.clipboard.writeText(signal.angle);
    setCopiedId(signal.id);
    window.setTimeout(() => setCopiedId(''), 1300);
  };

  const exportCsv = () => {
    const rows = [
      ['id', 'company', 'buyer', 'niche', 'intent', 'score', 'location', 'pain', 'angle'],
      ...filteredSignals.map((signal) => [
        signal.id,
        signal.company,
        signal.buyer,
        signal.niche,
        signal.intent,
        signal.score,
        signal.location,
        signal.pain,
        signal.angle,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marketvibe-intent-signals.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildBrief = () => {
    const lines = [
      `MarketVibe Proof Pack: ${sampleNiche}`,
      `Offer focus: ${sampleOffer}`,
      '',
      'Highest-priority signals:',
      ...samplePackSignals.map(
        (signal, index) =>
          `${index + 1}. ${signal.company} | ${signal.score}/100 | ${signal.pain} Outreach angle: ${signal.angle}`,
      ),
      '',
      'Recommended next move:',
      'Send a niche-specific 7-day proof pack with public source links, pain summaries, and one respectful outreach angle per opportunity.',
    ];
    setBrief(lines.join('\n'));
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setLeadStatus('Opening secure checkout...');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: lead.niche, email: lead.email }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Checkout could not be started.');
      }
      window.location.assign(payload.url);
    } catch (error) {
      setLeadStatus(error instanceof Error ? error.message : 'Checkout could not be started.');
    }
  };

  const sharedProps = {
    route,
    navigate,
    filteredSignals,
    selectedSignal,
    savedSignals,
    hotSignals,
    query,
    setQuery,
    niche,
    setNiche,
    intent,
    setIntent,
    minScore,
    setMinScore,
    setSelectedId,
    saved,
    toggleSaved,
    copiedId,
    copyAngle,
    exportCsv,
    revenueTotal,
    sampleNiche,
    setSampleNiche,
    sampleOffer,
    setSampleOffer,
    brief,
    buildBrief,
    lead,
    setLead,
    leadStatus,
    submitLead,
  };

  return (
    <div className="app-shell">
      <Header route={route} navigate={navigate} />
      <main>
        {route === '/' && <HomePage {...sharedProps} />}
        {route === '/pricing' && <PricingPage revenueTotal={revenueTotal} navigate={navigate} />}
        {route === '/sample' && <SamplePage {...sharedProps} />}
        {route === '/signup' && <SignupPage navigate={navigate} />}
        {route === '/thank-you' && <ThankYouPage navigate={navigate} />}
      </main>
    </div>
  );
}

function Header({ route, navigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={(event) => navigate('/', event)} aria-label="MarketVibe home">
        <span className="brand-mark">
          <Radar size={22} />
        </span>
        <span>
          <strong>MarketVibe</strong>
          <small>Buyer-intent radar</small>
        </span>
      </button>

      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a
            className={route === item.path ? 'active' : ''}
            href={item.path}
            key={item.path}
            onClick={(event) => navigate(item.path, event)}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <a className="topbar-cta" href="/sample" onClick={(event) => navigate('/sample', event)}>
        <Zap size={16} />
        Get proof pack
      </a>
    </header>
  );
}

function HomePage({ navigate, filteredSignals, selectedSignal, hotSignals }) {
  return (
    <>
      <section className="hero-portal">
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">
              <Activity size={15} />
              Live intent command center
            </p>
            <h1>Know who needs your service before competitors do.</h1>
            <p>
              MarketVibe turns public business pain into organized, scored, actionable opportunities
              for agencies, consultants, SaaS teams, and local growth providers.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="/sample" onClick={(event) => navigate('/sample', event)}>
                Get proof pack
                <ArrowRight size={17} />
              </a>
              <a className="secondary-action" href="/pricing" onClick={(event) => navigate('/pricing', event)}>
                Compare plans
                <Radar size={17} />
              </a>
            </div>
          </div>

          <div className="command-panel" aria-label="MarketVibe live metrics">
            <div className="panel-header">
              <span>
                <Gauge size={17} />
                Signal quality
              </span>
              <strong>{Math.round(average(filteredSignals.map((signal) => signal.score)))}</strong>
            </div>
            <div className="signal-strip">
              {filteredSignals.slice(0, 5).map((signal) => (
                <div
                  className={signal.id === selectedSignal.id ? 'strip-item active' : 'strip-item'}
                  key={signal.id}
                >
                  <span>{signal.company}</span>
                  <strong>{signal.score}</strong>
                </div>
              ))}
            </div>
            <div className="pulse-row">
              <span>Radar feed</span>
              <div className="pulse-track">
                <span style={{ width: '76%' }} />
              </div>
              <strong>{hotSignals.length} hot</strong>
            </div>
          </div>
        </div>
      </section>

      <ProofMetrics />
      <Testimonials />

      <section className="visual-band">
        <div className="visual-copy">
          <p className="eyebrow">
            <Sparkles size={15} />
            Built for proof
          </p>
          <h2>From public pain signal to a respectful first conversation.</h2>
          <p>
            The front-stage product is simple: show a niche-specific proof pack, explain why each
            signal matters, and give the buyer a practical outreach angle.
          </p>
        </div>
        <div className="portal-visual">
          <img src="/marketvibe-command-center.png" alt="MarketVibe command center interface" />
        </div>
      </section>

      <ComplianceBand />
    </>
  );
}

function EnginePage({
  filteredSignals,
  selectedSignal,
  savedSignals,
  query,
  setQuery,
  niche,
  setNiche,
  intent,
  setIntent,
  minScore,
  setMinScore,
  setSelectedId,
  saved,
  toggleSaved,
  copiedId,
  copyAngle,
  exportCsv,
}) {
  return (
    <section className="page-section engine-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <SlidersHorizontal size={15} />
            Intent engine
          </p>
          <h2>Score the signals before the market catches up.</h2>
        </div>
        <button className="secondary-action" type="button" onClick={exportCsv}>
          <Download size={17} />
          Export CSV
        </button>
      </div>

      <div className="workspace-grid">
        <aside className="control-rail" aria-label="Radar filters">
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pain, niche, company"
            />
          </label>

          <label>
            <span>Niche</span>
            <select value={niche} onChange={(event) => setNiche(event.target.value)}>
              {niches.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Intent</span>
            <select value={intent} onChange={(event) => setIntent(event.target.value)}>
              {intents.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Minimum score: {minScore}</span>
            <input
              type="range"
              min="60"
              max="95"
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
            />
          </label>

          <div className="saved-list">
            <div className="rail-title">
              <BookmarkCheck size={16} />
              Saved
            </div>
            {savedSignals.length ? (
              savedSignals.map((signal) => (
                <button
                  type="button"
                  key={signal.id}
                  onClick={() => setSelectedId(signal.id)}
                  className="saved-item"
                >
                  <span>{signal.company}</span>
                  <strong>{signal.score}</strong>
                </button>
              ))
            ) : (
              <p>No saved opportunities yet.</p>
            )}
          </div>
        </aside>

        <div className="signal-board" aria-label="Buyer-intent opportunities">
          {filteredSignals.map((signal) => (
            <article
              className={signal.id === selectedSignal.id ? 'signal-card selected' : 'signal-card'}
              key={signal.id}
            >
              <button className="signal-main" type="button" onClick={() => setSelectedId(signal.id)}>
                <span className="score-badge">{signal.score}</span>
                <span>
                  <strong>{signal.company}</strong>
                  <small>
                    {signal.buyer} | {signal.location}
                  </small>
                </span>
                <ChevronRight size={18} />
              </button>

              <p>{signal.pain}</p>
              <div className="tag-row">
                <span className={`urgency ${signal.urgency.toLowerCase()}`}>{signal.urgency}</span>
                <span>{signal.intent}</span>
                <span>{signal.niche}</span>
              </div>

              <div className="card-actions">
                <button type="button" title="Copy outreach angle" onClick={() => copyAngle(signal)}>
                  <Clipboard size={16} />
                  {copiedId === signal.id ? 'Copied' : 'Angle'}
                </button>
                <button type="button" title="Save opportunity" onClick={() => toggleSaved(signal.id)}>
                  {saved.includes(signal.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  {saved.includes(signal.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="insight-drawer" aria-label="Selected opportunity">
          <div className="drawer-header">
            <span className="score-ring">{selectedSignal.score}</span>
            <div>
              <p className="eyebrow">Selected signal</p>
              <h3>{selectedSignal.company}</h3>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Public source</dt>
              <dd>{selectedSignal.source}</dd>
            </div>
            <div>
              <dt>Revenue fit</dt>
              <dd>{selectedSignal.value}</dd>
            </div>
            <div>
              <dt>Why it matters</dt>
              <dd>{selectedSignal.reason}</dd>
            </div>
            <div>
              <dt>Outreach angle</dt>
              <dd>{selectedSignal.angle}</dd>
            </div>
            <div>
              <dt>Next move</dt>
              <dd>{selectedSignal.nextMove}</dd>
            </div>
          </dl>

          <div className="drawer-actions">
            <button type="button" onClick={() => toggleSaved(selectedSignal.id)}>
              {saved.includes(selectedSignal.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
              {saved.includes(selectedSignal.id) ? 'In workspace' : 'Add workspace'}
            </button>
            <button type="button" onClick={exportCsv}>
              <Download size={17} />
              Export
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PricingPage({ revenueTotal, navigate }) {
  return (
    <>
      <section className="page-section pricing-page">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <Building2 size={15} />
              Pricing
            </p>
            <h2>Offer ladder built for serious opportunity buyers.</h2>
          </div>
          <a className="primary-action" href="/sample" onClick={(event) => navigate('/sample', event)}>
            Get proof pack
            <ArrowRight size={17} />
          </a>
        </div>

        <div className="offer-grid">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.name}>
              <offer.icon size={22} />
              <h3>{offer.name}</h3>
              <strong>{offer.price}</strong>
              <p>{offer.note}</p>
              <div className="offer-foot">
                <span>{offer.customers} target customers</span>
                <span>{currency.format(offer.annual)} annual route</span>
              </div>
              <PricingButton offer={offer} navigate={navigate} />
            </article>
          ))}
        </div>

        <div className="revenue-note">
          <LineChart size={20} />
          <span>{currency.format(revenueTotal)} projected annual offer mix with room for churn and discounts.</span>
        </div>
      </section>

      <ProofMetrics />
      <Testimonials />
    </>
  );
}

function SamplePage({
  sampleNiche,
  setSampleNiche,
  sampleOffer,
  setSampleOffer,
  brief,
  buildBrief,
  lead,
  setLead,
  leadStatus,
  submitLead,
}) {
  return (
    <section className="page-section sample-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <Sparkles size={15} />
            Proof Pack
          </p>
          <h2>Turn interest into a EUR 49-99 proof product.</h2>
        </div>
      </div>

      <div className="sample-layout">
        <form className="sample-builder" onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>Target niche</span>
            <select value={sampleNiche} onChange={(event) => setSampleNiche(event.target.value)}>
              {niches
                .filter((item) => item !== 'All')
                .map((item) => (
                  <option key={item}>{item}</option>
                ))}
            </select>
          </label>
          <label>
            <span>Offer focus</span>
            <input value={sampleOffer} onChange={(event) => setSampleOffer(event.target.value)} />
          </label>
          <button type="button" className="primary-action" onClick={buildBrief}>
            <MessageSquareText size={17} />
            Build brief
          </button>
        </form>

        <div className="brief-output">
          <div className="brief-title">
            <BriefcaseBusiness size={18} />
            Sample brief
          </div>
          <pre>{brief || 'Choose a niche and build a buyer-intent proof pack brief.'}</pre>
        </div>

        <form className="lead-capture" onSubmit={submitLead}>
          <div className="brief-title">
            <Mail size={18} />
            Request queue
          </div>
          <input
            required
            placeholder="Name"
            value={lead.name}
            onChange={(event) => setLead({ ...lead, name: event.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={lead.email}
            onChange={(event) => setLead({ ...lead, email: event.target.value })}
          />
          <input
            required
            placeholder="Company"
            value={lead.company}
            onChange={(event) => setLead({ ...lead, company: event.target.value })}
          />
          <select value={lead.niche} onChange={(event) => setLead({ ...lead, niche: event.target.value })}>
            {niches
              .filter((item) => item !== 'All')
              .map((item) => (
                <option key={item}>{item}</option>
              ))}
          </select>
          <button type="submit">
            <Send size={17} />
            Continue to checkout
          </button>
          {leadStatus && <p className="status-line">{leadStatus}</p>}
        </form>
      </div>
    </section>
  );
}

function ProofMetrics() {
  return (
    <section className="metrics-band" aria-label="Proof metrics">
      {proofMetrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}

function Testimonials() {
  return (
    <section className="testimonial-strip" aria-label="Operating safeguards">
      {testimonials.map((testimonial) => (
        <article className="testimonial-card" key={testimonial.name}>
          <Quote size={20} />
          <p>{testimonial.quote}</p>
          <strong>{testimonial.name}</strong>
          <span>{testimonial.role}</span>
        </article>
      ))}
    </section>
  );
}

function ComplianceBand() {
  return (
    <section className="compliance-band">
      <div className="compliance-copy">
        <p className="eyebrow">
          <ShieldCheck size={15} />
          Compliance posture
        </p>
        <h2>Sell intelligence and prioritization, not spam automation.</h2>
        <p>
          MarketVibe is positioned around public business signals, clear source context,
          business-relevant data, opt-out handling, and respectful outreach angles.
        </p>
      </div>
      <div className="compliance-list">
        <span>
          <LockKeyhole size={16} />
          Public signals only
        </span>
        <span>
          <MapPin size={16} />
          Source context preserved
        </span>
        <span>
          <Send size={16} />
          No spam automation
        </span>
        <span>
          <ShieldCheck size={16} />
          GDPR-aware workflows
        </span>
      </div>
    </section>
  );
}

function PricingButton({ offer, navigate }) {
  if (offer.name === 'Radar') {
    return (
      <a className="offer-cta" href="/signup?plan=radar" onClick={(event) => navigate('/signup?plan=radar', event)}>
        Start with Radar
        <ArrowRight size={16} />
      </a>
    );
  }

  if (offer.name === 'Growth Desk') {
    return (
      <a className="offer-cta" href={calendlyUrl} target="_blank" rel="noreferrer">
        Book Growth Desk
        <ArrowRight size={16} />
      </a>
    );
  }

  return (
    <a className="offer-cta" href={typeformUrl} target="_blank" rel="noreferrer">
      {offer.name === 'Agency Partner' ? 'Apply as Partner' : 'Talk to sales'}
      <ArrowRight size={16} />
    </a>
  );
}

function SignupPage({ navigate }) {
  const plan = new URLSearchParams(window.location.search).get('plan') || 'radar';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const submitSignup = async (event) => {
    event.preventDefault();
    setStatus('Opening subscription checkout...');

    try {
      const response = await fetch('/api/subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Subscription checkout could not be started.');
      window.location.assign(payload.url);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Subscription checkout could not be started.');
    }
  };

  return (
    <section className="page-section system-page">
      <div className="system-panel">
        <p className="eyebrow">
          <Zap size={15} />
          Start subscription
        </p>
        <h2>Start with {plan.charAt(0).toUpperCase() + plan.slice(1)}.</h2>
        <p>Enter the billing email for your MarketVibe workspace and continue to Stripe checkout.</p>
        <form onSubmit={submitSignup}>
          <input
            required
            type="email"
            placeholder="Billing email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="primary-action">
            Continue to Stripe
            <ArrowRight size={17} />
          </button>
        </form>
        {status && <p className="status-line">{status}</p>}
      </div>
    </section>
  );
}

function ThankYouPage({ navigate }) {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  return (
    <section className="page-section system-page">
      <div className="system-panel">
        <p className="eyebrow">
          <ShieldCheck size={15} />
          Payment received
        </p>
        <h2>Your MarketVibe order is in motion.</h2>
        <p>
          We have your payment confirmation and will prepare your paid Proof Pack delivery.
        </p>
        {sessionId && <p className="session-line">Session: {sessionId}</p>}
        <a className="primary-action" href="/sample" onClick={(event) => navigate('/sample', event)}>
          Back to Proof Pack
          <ArrowRight size={17} />
        </a>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="metric-card">
      <Icon size={21} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function normalizeRoute(pathname) {
  return publicPaths.has(pathname) || systemPaths.has(pathname) ? pathname : '/';
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default App;




