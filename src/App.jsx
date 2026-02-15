import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { createCheckoutSession } from './lib/stripe'
import { sendWelcomeEmail, sendResultsEmail } from './lib/email'
import { generateValidationReport } from './lib/generator'
import ProjectForm from './components/ProjectForm'
import ResultsView from './components/ResultsView'
import PricingTable from './components/PricingTable'
import NameGenerator from './components/NameGenerator'
import LeadsDashboard from './components/LeadsDashboard'
import GrowthScorecard from './components/GrowthScorecard';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { popularNiches } from './lib/niches'

function App() {
  const [step, setStep] = useState('landing'); // 'landing', 'setup', 'fulfillment', 'admin-leads', 'og-preview'
  const [email, setEmail] = useState('')
  const [spots, setSpots] = useState(20)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [results, setResults] = useState(null)
  const [paid, setPaid] = useState(false)
  const [planType, setPlanType] = useState('free') // 'free', 'founder', 'expert'
  const [activeNiche, setActiveNiche] = useState(null)
  const [history, setHistory] = useState([]) // Array of lead records for the user
  const [leadsFeed, setLeadsFeed] = useState([]) // Growth leads for Experts
  const [usageCount, setUsageCount] = useState(0) // Validation count for free tier
  const [currentLeadId, setCurrentLeadId] = useState(null); // ID for sharing
  const [previewId, setPreviewId] = useState(null); // ID for OG preview route

  useEffect(() => {
    // 1. Initial State Sync (Consolidated)
    const params = new URLSearchParams(window.location.search)
    const viewEmail = params.get('view_results')
    const status = params.get('status')
    const resetValue = params.get('secret_reset')
    const savedEmail = localStorage.getItem('marketvibe_lead_email')
    const finalEmail = viewEmail || (status === 'success' ? savedEmail : null)

    // Batch simple state updates
    if (finalEmail) {
      setEmail(finalEmail)
      localStorage.setItem('marketvibe_lead_email', finalEmail)
    }
    if (status === 'success') setPaid(true)

    // 2. Fetch Critical Data (Spots + State recovery)
    const fetchData = async () => {
      try {
        // Increment Website Hits (Non-blocking)
        const hasCounted = sessionStorage.getItem('vibe_session_counted');
        if (!hasCounted) {
          supabase.rpc('increment_hits').then(() => {
            sessionStorage.setItem('vibe_session_counted', 'true');
          }).catch(() => {
            // Fallback for legacy app_settings if RPC isn't available
            supabase.from('app_settings').select('value').eq('key', 'website_hits').single().then(({ data }) => {
              if (data) {
                supabase.from('app_settings').update({ value: (data.value || 0) + 1 }).eq('key', 'website_hits');
              }
            });
          });
        }

        const currentEmail = viewEmail || savedEmail || email;

        const [counterResponse, leadResponse] = await Promise.all([
          supabase.from('app_settings').select('value').eq('key', 'lifetime_deals_remaining').single(),
          currentEmail ? supabase.from('leads').select('*').eq('email', currentEmail).order('created_at', { ascending: false }) : Promise.resolve({ data: [] })
        ])

        if (counterResponse.data) setSpots(counterResponse.data.value)

        const leadRecords = leadResponse.data;
        if (leadRecords && leadRecords.length > 0) {
          // 1. RECOVERY PRIORITY: Find the "best" record (Paid > any with results > latest)
          const paidRecord = leadRecords.find(l => (l.paid || l.status === 'paid') && l.results);
          const anyRecordWithResults = leadRecords.find(l => l.results);
          const leadToRecover = paidRecord || anyRecordWithResults || leadRecords[0];

          if (leadToRecover && leadToRecover.results) {
            setResults(leadToRecover.results);
          }

          // 2. STICKY FOUNDER CHECK: Scan all records for ANY payment
          const anyPaidRecord = leadRecords.find(l => l.paid || l.status === 'paid');
          const isPaidFounder = !!anyPaidRecord || status === 'success';

          if (isPaidFounder) {
            setPaid(true);
            setPlanType(anyPaidRecord?.plan_type || 'founder'); // Default to founder if undefined

            // 2.1 Fetch Expert Fuel (Live Leads) if applicable
            if (anyPaidRecord?.plan_type === 'expert') {
              supabase.from('growth_leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)
                .then(({ data }) => setLeadsFeed(data || []));
            }
          }

          setUsageCount(leadRecords.length);
          const projectHistory = leadRecords.filter(l => l.results);
          setHistory(projectHistory);

          // 4. Auto-redirect only if on landing page and have data
          if (leadToRecover?.results && (window.location.pathname === '/' || window.location.pathname === '')) {
            setStep('fulfillment')
          }
        }
      } catch (err) {
        console.error('Initialization error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // 3. Defer Non-Critical Tasks (RequestIdleCallback for low-priority)
    const handleDeferredTasks = () => {
      if (!supabase) return;
      // Secret reset logic
      if (resetValue) {
        supabase.from('app_settings')
          .update({ value: parseInt(resetValue) })
          .eq('key', 'lifetime_deals_remaining')
          .then(({ error }) => {
            if (!error) setSpots(parseInt(resetValue))
          })
      }

      // Stripe Fulfillment logic (if returning from checkout)
      if (status === 'success' && finalEmail) {
        const urlPlan = params.get('plan') || 'founder';
        supabase.from('leads').select('status, plan_type').eq('email', finalEmail).single().then(({ data }) => {
          if (data && (data.status !== 'paid' || data.plan_type !== urlPlan)) {
            supabase.from('leads').update({
              status: 'paid',
              plan_type: urlPlan
            }).eq('email', finalEmail).then(() => {
              setPlanType(urlPlan);
              setPaid(true);
            })
          }
        })
      }
    }

    if (window.requestIdleCallback) {
      window.requestIdleCallback(handleDeferredTasks)
    } else {
      setTimeout(handleDeferredTasks, 100)
    }

    // 4. Real-Time Tracking & Counter (FOMO)
    let subscription = null;
    if (supabase) {
      subscription = supabase
        .channel('app_settings_changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, payload => {
          if (payload.new.key === 'lifetime_deals_remaining') {
            setSpots(payload.new.value)
          }
        })
        .subscribe()
    }
    // 4.1 Track Website Hit (Silent & Filtered)
    const trackHit = async () => {
      try {
        const isAdmin = window.location.pathname.startsWith('/admin');
        const hasTracked = sessionStorage.getItem('mv_tracked');

        if (!isAdmin && !hasTracked) {
          await supabase.rpc('increment_hits');
          sessionStorage.setItem('mv_tracked', 'true');
        }
      } catch (err) {
        console.warn('Hit tracking skipped (RPC not ready yet)');
      }
    };
    trackHit();

    // 5. pSEO Sub-routing (Detect /validate/:slug)
    const path = window.location.pathname
    if (path.startsWith('/validate/')) {
      const slug = path.split('/').pop()
      const foundNiche = popularNiches.find(n => n.slug === slug)
      if (foundNiche) {
        setActiveNiche(foundNiche)
        // Update Metadata for SEO
        const title = `Validate your ${foundNiche.name} Business Idea - MarketVibe`
        const desc = `Get a data-driven revenue forecast and 30-day execution blueprint for your ${foundNiche.name} startup. Stop guessing, start building.`

        document.title = title

        // Helper to update meta tags
        const updateMeta = (selector, attr, value) => {
          const el = document.querySelector(selector)
          if (el) el.setAttribute(attr, value)
        }

        updateMeta('meta[name="description"]', 'content', desc)
        updateMeta('meta[property="og:title"]', 'content', title)
        updateMeta('meta[property="og:description"]', 'content', desc)
        updateMeta('meta[property="twitter:title"]', 'content', title)
        updateMeta('meta[property="twitter:description"]', 'content', desc)

        // 5.1 Inject Structured Data (How-To Schema for Rich Snippets)
        const schema = {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to Validate your ${foundNiche.name} Business Idea`,
          "description": desc,
          "step": [
            { "@type": "HowToStep", "text": "Connect your email to secure early access." },
            { "@type": "HowToStep", "text": "Describe your startup idea and potential audience." },
            { "@type": "HowToStep", "text": "Receive your 30-day playbook and revenue forecast." }
          ],
          "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "0" },
          "totalTime": "PT60S"
        };

        let script = document.getElementById('seo-schema');
        if (!script) {
          script = document.createElement('script');
          script.id = 'seo-schema';
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.text = JSON.stringify(schema);
      }
    } else if (path.startsWith('/og-preview/')) {
      const id = path.split('/').pop();
      setPreviewId(parseInt(id, 10));
      setStep('og-preview');
      document.title = 'MarketVibe Growth Scorecard 📈';
    } else if (path === '/tools/naming') {
      setStep('tools-naming')
      document.title = 'Startup Name Generator - Free Branding Tool | MarketVibe'
    } else if (path.includes('/admin/leads')) {
      setStep('admin-leads')
      document.title = 'Commander Center - Growth Leads | MarketVibe'
    } else if (path.includes('/privacy')) {
      setStep('privacy')
      document.title = 'Privacy Policy | MarketVibe'
    } else if (path.includes('/terms')) {
      setStep('terms')
      document.title = 'Terms of Service | MarketVibe'
    }

    return () => {
      if (supabase && subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || submitting) return

    setSubmitting(true)
    setErrorMessage('')

    setTimeout(async () => {
      try {
        // 1. Check if user already exists
        const { data: leadRecords } = await supabase
          .from('leads')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false });

        if (leadRecords && leadRecords.length > 0) {
          // Look for latest results
          const leadWithResults = leadRecords.find(l => l.results);
          if (leadWithResults) setResults(leadWithResults.results);

          // Look for ANY paid record for this email
          const paidRecord = leadRecords.find(l => l.paid || l.status === 'paid');
          if (paidRecord) {
            setPaid(true);
            setPlanType(paidRecord.plan_type || 'founder');
          }

          localStorage.setItem('marketvibe_lead_email', email)

          // Priority Recovery: If we have a paid record with results, show it.
          const paidLeadWithResults = leadRecords.find(l => (l.paid || l.status === 'paid') && l.results);
          const latestLeadWithResults = leadRecords.find(l => l.results);
          const bestLead = paidLeadWithResults || latestLeadWithResults;

          if (bestLead && bestLead.results) {
            setResults(bestLead.results);
            setStep('fulfillment');
            setSubmitting(false);
            return;
          }
        }

        // 2. Otherwise, treat as a new lead
        const { error } = await supabase
          .from('leads')
          .insert([{ email, status: 'started_validation' }])

        if (error) throw error

        localStorage.setItem('marketvibe_lead_email', email)
        await sendWelcomeEmail(email)
        setStep('setup')
      } catch (error) {
        console.error("Submission error details:", error)
        setErrorMessage(error?.message || "Connection error. Please try again.")
      } finally {
        setSubmitting(false)
      }
    }, 0)
  }

  const handleProjectSubmit = async (projectData) => {
    setSubmitting(true)
    setErrorMessage('')

    try {
      const report = generateValidationReport(projectData)

      // Targeted Update: Find the record to update (Prefer latest started, or create new)
      const { data: latestRecords } = await supabase
        .from('leads')
        .select('id, status')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);

      const targetId = latestRecords?.[0]?.id;

      if (targetId) {
        // Increment usage count and update record
        await supabase.rpc('increment_usage', { lead_id: targetId });

        await supabase
          .from('leads')
          .update({
            project_name: projectData.name,
            project_description: projectData.description,
            target_audience: projectData.audience,
            results: report,
            status: 'completed_validation'
          })
          .eq('id', targetId);
      }

      localStorage.setItem('marketvibe_lead_email', email)
      setResults(report)
      setCurrentLeadId(targetId);

      // Update history state instantly
      setHistory(prev => [
        { id: targetId, project_name: projectData.name, results: report, created_at: new Date().toISOString() },
        ...prev.filter(p => p.id !== targetId)
      ]);

      // Persistent Paid Check: Ensure founders stay founders (check ALL records for this email)
      const { data: leadRecords } = await supabase
        .from('leads')
        .select('paid, status')
        .eq('email', email);

      const isPaidFounder = leadRecords?.some(l => l.paid || l.status === 'paid') || paid;
      if (isPaidFounder) {
        setPaid(true)
      }

      setStep('fulfillment')

      // Delivery Step: Send Results Email
      await sendResultsEmail(email, projectData.name)
    } catch (error) {
      console.error("Project submission error:", error)
      setErrorMessage(error?.message || "Analysis failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlock = async (planType = 'founder') => {
    setSubmitting(true)
    setErrorMessage('')
    try {
      // Pass the plan type to createCheckoutSession
      await createCheckoutSession(email, planType)
    } catch (error) {
      console.error("Unlock error:", error)
      setErrorMessage(error?.message || "Could not start checkout. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectPlan = (planId) => {
    if (planId === 'pro' || planId === 'expert') {
      const stripeType = planId === 'pro' ? 'founder' : 'expert'
      // If we have an email, go straight to checkout
      if (email) {
        handleUnlock(stripeType)
      } else {
        // Otherwise prompt for email first
        document.getElementById('email-input')?.focus()
        setErrorMessage('Please enter your email first to secure your spot.')
      }
    } else if (planId === 'free') {
      if (email && email.includes('@')) {
        setStep('setup');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const emailInput = document.querySelector('input[type="email"]') || document.getElementById('email-input');
        if (emailInput) {
          emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => emailInput.focus(), 500); // Small delay for scroll to finish
        } else {
          // Fallback: Just go to top where the form usually is
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }

  const handleProjectSelect = (projectId) => {
    const selected = history.find(h => h.id === projectId);
    if (selected) {
      setResults(selected.results);
      setStep('fulfillment');
    }
  };

  if (loading) return <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading...</div>

  if (!supabase) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'white' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Configuration Missing</h2>
        <p>MarketVibe is live, but it's missing the connection keys for Supabase.</p>
      </div>
    )
  }

  return (
    <div className="container">
      <header style={{ padding: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          onClick={() => {
            setResults(null)
            setStep('landing')
          }}
          style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.svg" alt="MarketVibe Logo" style={{ width: '32px', height: '32px' }} />
            MarketVibe
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {paid && history && history.length > 0 && step !== 'admin-leads' && (
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              📁 {history.length} Projects Saved
            </div>
          )}

          {results && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {paid && (
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  background: planType === 'expert' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: planType === 'expert' ? '#10b981' : '#818cf8',
                  border: planType === 'expert' ? '1px solid #10b981' : '1px solid #6366f1'
                }}>
                  {planType.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => {
                  setResults(null)
                  setStep('landing')
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                + New Validation
              </button>
            </div>
          )}
        </div>
      </header>

      {step === 'landing' && (
        <section className="hero">
          <div className="badge">{activeNiche ? `${activeNiche.name} Validation Protocol` : 'Limited Founders Opportunity'}</div>
          <h1>
            {activeNiche ? (
              <>Launch Your {activeNiche.name} <br /> Startup in 30 Days</>
            ) : (
              <>Stop Brainstorming. <br /> Start Validating.</>
            )}
          </h1>
          <p>
            {activeNiche ? (
              `Get an instant data-driven validation for ${activeNiche.name}. MarketVibe generates your niche-specific 30-day execution roadmap and founder assets so you can ship before you build.`
            ) : (
              "MarketVibe is your autonomous launch partner. Transform any business idea into a validated revenue forecast and a 30-day execution playbook in seconds."
            )}
          </p>

          <div className="cta-box floating">
            <div className="counter">
              Only <span className="counter-number">{spots}</span> lifetime deals remaining
            </div>
            <form onSubmit={handleEmailSubmit} className="input-group">
              <input
                id="email-input"
                type="email"
                placeholder="Enter your email for early access"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Connecting...' : 'Validate My Idea — Free'}
              </button>
            </form>
            {errorMessage && <p className="error-text">{errorMessage}</p>}
          </div>

          <PricingTable onSelectPlan={handleSelectPlan} spots={spots} />

          <section className="testimonials" style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Trusted by 100+ Solo Founders</h2>
            <div className="testimonial-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div className="testimonial-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"MarketVibe saved me months of building a product nobody wanted. The revenue forecast was a wake-up call."</p>
                <div style={{ fontWeight: 'bold' }}>— Alex R., SaaS Founder</div>
              </div>
              <div className="testimonial-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"The 30-day blueprint is pure gold. It turned my vague idea into a step-by-step execution plan."</p>
                <div style={{ fontWeight: 'bold' }}>— Sarah M., Indie Hacker</div>
              </div>
            </div>
          </section>
        </section>
      )}

      {step === 'setup' && (
        <section style={{ padding: '4rem 0', textAlign: 'center' }}>
          <ProjectForm onSubmit={handleProjectSubmit} loading={submitting} />
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </section>
      )}

      {step === 'tools-naming' && (
        <section style={{ padding: '4rem 0' }}>
          <NameGenerator onSelectName={(name) => {
            setStep('setup')
          }} />
        </section>
      )}

      {step === 'admin-leads' && (
        <section style={{ padding: '4rem 0' }}>
          <LeadsDashboard />
        </section>
      )}

      {step === 'og-preview' && previewId && (
        <section style={{ padding: '0' }}>
          <GrowthScorecard leadId={previewId} />
        </section>
      )}

      {step === 'fulfillment' && results && (
        <section style={{ padding: '4rem 0' }}>
          <ResultsView
            results={results}
            unlocked={paid}
            planType={planType}
            onUnlock={handleUnlock}
            spots={spots}
            loading={submitting}
            leads={leadsFeed}
            usageCount={usageCount}
            leadId={currentLeadId}
          />
          {errorMessage && <p className="error-text" style={{ textAlign: 'center', marginTop: '1rem' }}>{errorMessage}</p>}
        </section>
      )}

      {step === 'privacy' && <PrivacyPolicy />}
      {step === 'terms' && <TermsOfService />}

      <section className="features">
        <div className="feature-card">
          <h3>Commitment Testing</h3>
          <p>Measure real intent with "Willingness to Pay" indicators rather than generic feedback.</p>
        </div>
        <div className="feature-card">
          <h3>Lead Magnet Builder</h3>
          <p>Automatically generate high-converting landing pages for your MVP in seconds.</p>
        </div>
        <div className="feature-card">
          <h3>Revenue Forecast</h3>
          <p>Get data-driven insights on potential pricing and annual recurring revenue based on early interest.</p>
        </div>
      </section>

      <footer style={{ marginTop: '6rem', padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1rem' }}>Browse Validation Niches 🧭</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.8rem'
            }}>
              {popularNiches.slice(0, 24).map(niche => (
                <a
                  key={niche.slug}
                  href={`/validate/${niche.slug}`}
                  style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#6366f1'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  {niche.name}
                </a>
              ))}
              <span style={{ color: '#334155' }}>+ 80 more niches</span>
            </div>
          </div>

          <div style={{ minWidth: '200px' }}>
            <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1rem' }}>Free Growth Tools 🛠️</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '1rem' }}>
                <a href="/tools/naming" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>Startup Name Generator 🚀</a>
              </li>
              <li style={{ color: '#475569' }}>Market Size Calculator (Soon)</li>
            </ul>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ color: '#475569', textDecoration: 'none' }}>Terms of Service</a>
            <a href="mailto:support@marketvibe1.com" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>Support: support@marketvibe1.com</a>
          </div>
          &copy; 2026 MarketVibe. Built for builders who want to win.
        </div>
      </footer>
    </div>
  )
}

export default App
