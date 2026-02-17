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
import CaseStudyHub from './components/CaseStudyHub';
import MarketSizeCalculator from './components/MarketSizeCalculator';
import NicheValidator from './components/NicheValidator';
import AuthorityInsights from './components/AuthorityInsights';
import Newsroom from './components/Newsroom';
import BlogIndex from './components/BlogIndex';
import BlogPost from './components/BlogPost';
import ReferralHub from './components/ReferralHub';
import AdminDashboard from './components/AdminDashboard';
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
  const [previewId, setPreviewId] = useState(null); // ID for preview route
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false); // Modal for checkout email
  const [pendingPlan, setPendingPlan] = useState(null); // Plan to unlock after email
  const [selectedProjectName, setSelectedProjectName] = useState(''); // Name from generator

  useEffect(() => {
    // 1. Initial State Sync (Consolidated)
    const params = new URLSearchParams(window.location.search)
    const currentLoc = window.location.pathname;

    // Admin Route
    if (currentLoc === '/admin') {
      setStep('admin');
      return;
    }

    const viewEmail = params.get('view_results')
    const status = params.get('status')
    const savedEmail = localStorage.getItem('marketvibe_lead_email')
    const finalEmail = viewEmail || (status === 'success' ? savedEmail : null)

    // 1.1 Detect Badge Referral (Phase 38)
    const badgeId = params.get('lid') || params.get('ref_badge');
    const isBadgeRef = params.get('ref') === 'badge' || !!params.get('ref_badge');

    if (isBadgeRef && badgeId && supabase) {
      const logBadgeHit = async () => {
        try {
          const referrer = document.referrer || 'direct';
          const domain = referrer !== 'direct' ? new URL(referrer).hostname : 'direct';

          const { data: existing } = await supabase
            .from('badge_hits')
            .select('*')
            .eq('lead_id', badgeId)
            .eq('source_domain', domain)
            .single();

          if (existing) {
            await supabase.from('badge_hits').update({
              click_count: existing.click_count + 1,
              last_hit_at: new Date().toISOString()
            }).eq('id', existing.id);
          } else {
            await supabase.from('badge_hits').insert({
              lead_id: badgeId,
              source_domain: domain,
              click_count: 1
            });
          }
          console.log(`🛰️ Viral badge hit detected from ${domain}`);
        } catch (e) {
          console.error("Badge hit error:", e);
        }
      };
      logBadgeHit();
    }

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
        if (!hasCounted && supabase) {
          supabase.rpc('increment_hits').catch(() => {
            // Fallback for legacy app_settings
            supabase.from('app_settings').select('value').eq('key', 'website_hits').single().then(({ data }) => {
              if (data) supabase.from('app_settings').update({ value: (data.value || 0) + 1 }).eq('key', 'website_hits');
            });
          });
          sessionStorage.setItem('vibe_session_counted', 'true');
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
            const { data: feed } = await supabase.from('growth_leads')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(5);
            setLeadsFeed(feed || []);
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
      const resetValue = params.get('reset_spots'); // Assuming this is how resetValue is obtained
      if (resetValue) {
        (async () => {
          const { error } = await supabase.from('app_settings')
            .update({ value: parseInt(resetValue) })
            .eq('key', 'lifetime_deals_remaining');
          if (!error) setSpots(parseInt(resetValue));
        })();
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
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        const leadId = params.get('lid');

        if (!isAdmin && !hasTracked) {
          await supabase.rpc('increment_hits');
          sessionStorage.setItem('mv_tracked', 'true');
        }
      } catch (err) {
        console.warn('Hit tracking skipped (RPC or Params not ready yet)');
      }
    };
    trackHit();

    // 5. pSEO Sub-routing (Detect /validate/:slug)
    const path = window.location.pathname.replace(/\/$/, '') || '/'
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
    } else if (path === '/hub') {
      setStep('hub')
      document.title = 'Hall of Fame - Validated Idea Case Studies | MarketVibe'
    } else if (path === '/tools/market-size') {
      setStep('market-size')
      document.title = 'Free TAM SAM SOM Calculator | MarketVibe'
    } else if (path === '/insights') {
      setStep('insights')
      document.title = 'Market Intelligence: Startup Trends 2026 | MarketVibe'
    } else if (path.startsWith('/validate/')) {
      setStep('p-seo')
    } else if (path === '/newsroom') {
      setStep('newsroom')
      document.title = 'The Newsroom: Breaking Market Trends | MarketVibe'
    } else if (path === '/blog') {
      setStep('blog-index')
      document.title = 'Growth Blog: Market Trends & Analysis | MarketVibe'
    } else if (path.startsWith('/blog/')) {
      setStep('blog-post')
    } else if (path === '/viral') {
      setStep('viral')
    }

    // Capture Referral Code
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('marketvibe_referrer', refCode);
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
        // Generate Referral Code for new user
        const referralCode = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
        const referrer = localStorage.getItem('marketvibe_referrer');

        const { data, error } = await supabase
          .from('leads')
          .insert([{
            email: email,
            referral_code: referralCode,
            referred_by: referrer,
            status: 'started_validation'
          }])
          .select()

        if (error) throw error

        // If referred, increment the referrer's count (optimistic)
        if (referrer) {
          await supabase.rpc('increment_referral', { referrer_code: referrer });
        }

        // Store ID for session
        localStorage.setItem('marketvibe_lead_id', data[0].id);

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
    // alert(`Debug: App.jsx handleUnlock fired for ${planType}`); // CRITICAL DEBUG
    setSubmitting(true)
    setErrorMessage('')
    try {
      // Pass the plan type to createCheckoutSession
      await createCheckoutSession(email, planType)
    } catch (error) {
      console.error("Unlock error:", error)
      const msg = error?.message || "Could not start checkout. Please try again.";
      setErrorMessage(msg);
      alert(msg); // Ensure mobile users see the error
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectPlan = (planId) => {
    if (planId === 'pro' || planId === 'expert') {
      const stripeType = planId === 'pro' ? 'founder' : 'expert'
      // If we have an email, go straight to checkout
      if (email && email.includes('@')) {
        handleUnlock(stripeType)
      } else {
        // New Logic: Trigger Checkout Modal instead of scrolling to top
        setPendingPlan(stripeType);
        setCheckoutModalOpen(true);
      }
    } else if (planId === 'free') {
      if (email && email.includes('@')) {
        setStep('setup');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // New Logic: Trigger Checkout Modal instead of scrolling to top
        setPendingPlan(planId);
        setCheckoutModalOpen(true);
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

  if (loading) return <div style={{ color: 'white', padding: '10rem', textAlign: 'center' }}>⚡ Scanning the horizon...</div>

  if (!supabase) return <div style={{ color: '#ef4444', padding: '10rem', textAlign: 'center' }}>⚠️ Database connection missing.</div>

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
            <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
              © 2024 MarketVibe. All rights reserved.
              <br />
              <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>v3.1 (DEBUG BUILD) - {new Date().toLocaleTimeString()}</span>
            </p>
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

          <div style={{
            margin: '4rem auto 0',
            maxWidth: '1200px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '1rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <div style={{
              background: '#ef4444',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
              LIVE SIGNALS
            </div>
            <div style={{
              display: 'flex',
              gap: '3rem',
              color: '#94a3b8',
              fontSize: '0.85rem',
              animation: 'ticker 30s linear infinite'
            }}>
              {popularNiches.slice(0, 10).map((n, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981' }}>●</span>
                  New Validation: {n.name}
                </span>
              ))}
              {/* Loop for seamless scroll */}
              {popularNiches.slice(0, 10).map((n, i) => (
                <span key={`l-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981' }}>●</span>
                  New Validation: {n.name}
                </span>
              ))}
            </div>
          </div>

          <section style={{ padding: '4rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '2rem', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>The Founder's Toolkit 🛠️</h2>
              <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '1rem auto' }}>
                Free high-precision tools used by our autonomous agents to find and validate market gaps.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              padding: '0 2rem'
            }}>
              {[
                {
                  title: 'Brand Builder',
                  desc: 'Generate viral-ready names for your next pivot.',
                  icon: '🚀',
                  color: '#6366f1',
                  action: () => {
                    if (email) setStep('tools-naming');
                    else {
                      setErrorMessage('Please enter your email to unlock the Founder Toolkit.');
                      document.getElementById('email-input')?.focus();
                      document.getElementById('email-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                },
                {
                  title: 'TAM Calculator',
                  desc: 'Calculate your market size with VC-grade precision.',
                  icon: '📊',
                  color: '#10b981',
                  action: () => {
                    if (email) setStep('market-size');
                    else {
                      setErrorMessage('Please enter your email to unlock the Founder Toolkit.');
                      document.getElementById('email-input')?.focus();
                      document.getElementById('email-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                },
                {
                  title: 'Trend Newsroom',
                  desc: 'Real-time breakout trends detected by our Sentinel agent.',
                  icon: '📰',
                  color: '#ef4444',
                  action: () => {
                    if (email) setStep('newsroom');
                    else {
                      setErrorMessage('Please enter your email to unlock the Founder Toolkit.');
                      document.getElementById('email-input')?.focus();
                      document.getElementById('email-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                },
                {
                  title: 'Market Intelligence',
                  desc: 'Anonymized data from 1,700+ global startup validations.',
                  icon: '🛰️',
                  color: '#ec4899',
                  action: () => {
                    if (email) setStep('insights');
                    else {
                      setErrorMessage('Please enter your email to unlock the Founder Toolkit.');
                      document.getElementById('email-input')?.focus();
                      document.getElementById('email-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }
              ].map((tool, idx) => (
                <div
                  key={idx}
                  onClick={tool.action}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = tool.color;
                    e.currentTarget.style.background = `rgba(${parseInt(tool.color.slice(1, 3), 16)}, ${parseInt(tool.color.slice(3, 5), 16)}, ${parseInt(tool.color.slice(5, 7), 16)}, 0.05)`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{tool.icon}</div>
                  <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>{tool.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>{tool.desc}</p>
                  <div style={{ marginTop: '1.5rem', color: tool.color, fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Access Tool <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
          <ProjectForm onSubmit={handleProjectSubmit} loading={submitting} initialName={selectedProjectName} />
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </section>
      )}

      {step === 'tools-naming' && (
        <section style={{ padding: '4rem 0' }}>
          <NameGenerator onSelectName={(name) => {
            setSelectedProjectName(name)
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
            onUnlock={handleUnlock}
            spots={spots}
            loading={submitting}
            planType={planType}
            leads={leadsFeed}
            usageCount={usageCount}
            leadId={currentLeadId}
          />
          {errorMessage && <p className="error-text" style={{ textAlign: 'center', marginTop: '1rem' }}>{errorMessage}</p>}
        </section>
      )}

      {/* Checkout Email Modal */}
      {checkoutModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#0f172a', padding: '2.5rem', borderRadius: '1.5rem',
            border: '1px solid #334155', maxWidth: '450px', width: '90%',
            textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Where should we send your receipt?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Enter your email to create your account and proceed to secure checkout.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (email && email.includes('@')) {
                setCheckoutModalOpen(false);
                handleUnlock(pendingPlan);
              } else {
                setErrorMessage('Please enter a valid email.');
              }
            }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '1rem', marginBottom: '1rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #475569',
                  color: 'white', borderRadius: '0.75rem', fontSize: '1rem'
                }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  style={{
                    flex: 1, padding: '1rem', borderRadius: '0.75rem',
                    border: '1px solid #475569', color: '#94a3b8',
                    background: 'transparent', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2, padding: '1rem', borderRadius: '0.75rem',
                    border: 'none', background: '#6366f1', color: 'white',
                    fontWeight: 'bold', cursor: 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Processing...' : 'Continue to Payment →'}
                </button>
              </div>
              {errorMessage && <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>{errorMessage}</p>}
            </form>
          </div>
        </div>
      )}

      {step === 'admin' && <AdminDashboard />}
      {step === 'privacy' && <PrivacyPolicy />}
      {step === 'terms' && <TermsOfService />}
      {step === 'hub' && <CaseStudyHub />}
      {step === 'market-size' && <MarketSizeCalculator onGetBlueprint={() => {
        setStep('setup');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />}
      {step === 'p-seo' && <NicheValidator />}
      {step === 'insights' && <AuthorityInsights />}
      {step === 'newsroom' && <Newsroom />}
      {step === 'blog-index' && <BlogIndex />}
      {step === 'blog-post' && <BlogPost />}
      {step === 'viral' && <ReferralHub />}
      {step === 'admin' && <AdminDashboard />}
      {step === 'privacy' && <PrivacyPolicy />}
      {step === 'terms' && <TermsOfService />}
      {step === 'hub' && <CaseStudyHub />}

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
              <li style={{ marginBottom: '1rem' }}>
                <a href="/tools/market-size" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold' }}>Market Size Calculator 📊</a>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <a href="/hub" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 'bold' }}>Validation Hall of Fame 🏆</a>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <a href="/insights" style={{ color: '#ec4899', textDecoration: 'none', fontWeight: 'bold' }}>Market Intelligence 🛰️</a>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <a
                  href="/newsroom"
                  onClick={(e) => { e.preventDefault(); setStep('newsroom'); window.scrollTo(0, 0); }}
                  style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Trend Newsroom 📰 <span style={{ fontSize: '0.7rem', verticalAlign: 'top' }}>LIVE</span>
                </a>
              </li>
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
