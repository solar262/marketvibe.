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
import LaunchpadDirectory from './components/LaunchpadDirectory';
import LaunchpadSubmit from './components/LaunchpadSubmit';
import LaunchpadListing from './components/LaunchpadListing';
import InvestorLanding from './components/InvestorLanding';
import InvestorDashboard from './components/InvestorDashboard';
import SocialCommandCenter from './components/SocialCommandCenter';
import TwitterBotDashboard from './components/TwitterBotDashboard';
import EmailCapturePopup from './components/EmailCapturePopup';
import Library from './components/Library';
import { popularNiches } from './lib/niches'

const VerifyingPortal = () => {
  useEffect(() => {
    const timer = setTimeout(() => window.location.reload(), 4000);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

function App() {
  const [step, setStep] = useState(() => {
    const rawPath = window.location.pathname.toLowerCase();
    const p = rawPath.replace(/\/$/, '') || '/';
    console.log('[Router] Initializing path:', p);

    // Priority: Specific sub-routes first
    if (p.includes('/investor')) return 'investors';

    if (rawPath.startsWith('/og-preview/')) return 'og-preview';
    if (p === '/tools/naming') return 'tools-naming';
    if (p.includes('/admin/leads')) return 'admin-leads';
    if (p.includes('/privacy')) return 'privacy';
    if (p.includes('/terms')) return 'terms';
    if (p === '/hub') return 'hub';
    if (p === '/tools/market-size') return 'market-size';
    if (p === '/insights') return 'insights';
    if (rawPath.startsWith('/validate/')) return 'p-seo';
    if (p === '/newsroom') return 'newsroom';
    if (p === '/blog') return 'blog-index';
    if (rawPath.startsWith('/blog/')) return 'blog-post';
    if (p === '/launchpad') return 'launchpad';
    if (p === '/launchpad/submit') return 'launchpad-submit';
    if (rawPath.startsWith('/launchpad/listing/')) return 'launchpad-listing';
    if (p.startsWith('/admin')) {
      if (p.includes('social')) return 'social-command';
      if (p.includes('twitter-bot')) return 'twitter-bot';
      return 'admin';
    }
    return 'landing';
  });

  const [email, setEmail] = useState('')
  const [spots, setSpots] = useState(20)
  const [investorSpots, setInvestorSpots] = useState(12) // Default starting FOMO
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
  const [fomoTimer, setFomoTimer] = useState(900); // 15 minute countdown
  const [notification, setNotification] = useState(null); // Live social proof

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // 1. Initial Data Recovery (Consolidated)
    const viewEmail = params.get('view_results')
    const status = params.get('status')
    const savedEmail = localStorage.getItem('marketvibe_lead_email')
    const finalEmail = viewEmail || (status === 'success' ? savedEmail : null)

    // 1.1 Detect Badge Referral
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
        } catch (e) {
          console.error("Badge hit error:", e);
        }
      };
      logBadgeHit();
    }

    if (finalEmail) {
      setEmail(finalEmail)
      localStorage.setItem('marketvibe_lead_email', finalEmail)
    }

    // 2. Fetch Critical Data (Spots + State recovery)
    const fetchData = async () => {
      if (!supabase) return;
      setLoading(true)
      try {
        const lid = params.get('lid') || localStorage.getItem('mv_lead_id');
        const urlEmail = params.get('email');

        let record = null;
        if (lid) {
          const { data } = await supabase.from('leads').select('*').eq('id', lid).single();
          record = data;
        } else if (urlEmail) {
          const { data } = await supabase.from('leads').select('*').eq('email', urlEmail).order('created_at', { ascending: false }).limit(1).single();
          record = data;
        }

        if (record) {
          setEmail(record.email);
          setResults(record.results);
          setCurrentLeadId(record.id);

          const { data: leadRecords } = await supabase.from('leads').select('*').eq('email', record.email);
          const anyPaidRecord = leadRecords?.find(l => l.paid || l.status === 'paid');

          if (anyPaidRecord) {
            setPaid(true);
            setPlanType(anyPaidRecord.plan_type || 'founder');
            if (anyPaidRecord.plan_type === 'investor' && window.location.pathname.toLowerCase().includes('/investor')) {
              setStep('investor-dashboard');
            }
          } else if (status === 'success') {
            setPlanType('verifying');
          }
          setUsageCount(leadRecords?.length || 0);
          setHistory(leadRecords?.filter(l => l.results) || []);
        } else if (status === 'success') {
          setPlanType('verifying');
        }

        // Global Settings
        const { data: settings } = await supabase.from('app_settings').select('key, value');
        if (settings) {
          const ldr = settings.find(s => s.key === 'lifetime_deals_remaining');
          const isr = settings.find(s => s.key === 'investor_seats_remaining');
          if (ldr) setSpots(ldr.value);
          if (isr) setInvestorSpots(isr.value);
        }
      } catch (err) {
        console.error('Data check error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Increment Website Hits (Non-blocking)
    const hasCounted = sessionStorage.getItem('vibe_session_counted');
    if (!hasCounted && supabase) {
      /* (async () => {
        try {
          const { error } = await supabase.rpc('increment_hits');
          if (error) {
            const { data } = await supabase.from('app_settings').select('value').eq('key', 'website_hits').single();
            if (data) await supabase.from('app_settings').update({ value: (data.value || 0) + 1 }).eq('key', 'website_hits');
          }
        } catch (e) {
          console.error("Hit counter error:", e);
        }
      })(); */
      sessionStorage.setItem('vibe_session_counted', 'true');
    }

    // Real-time FOMO tracking
    let subscription = null
    if (supabase) {
      subscription = supabase.channel('app_settings_changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, payload => {
          if (payload.new.key === 'lifetime_deals_remaining') setSpots(payload.new.value)
          if (payload.new.key === 'investor_seats_remaining') setInvestorSpots(payload.new.value)
        }).subscribe()
    }

    return () => {
      if (supabase && subscription) supabase.removeChannel(subscription)
    }
  }, [])

  // 5. Reactive Routing Logic
  const activePath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/'

  useEffect(() => {
    if (activePath === '/investor' || activePath === '/investors' || activePath === '/investor/dashboard') {
      // We set the step to 'investors' (Landing) first. 
      // It will only upgrade to 'investor-dashboard' in fetchData if the DB confirms them.
      setStep('investors')
      document.title = 'Investor Access | MarketVibe Deal Flow'
    } else if (activePath.startsWith('/og-preview/')) {
      const id = activePath.split('/').pop()
      setPreviewId(parseInt(id, 10))
      setStep('og-preview')
      document.title = 'MarketVibe Growth Scorecard 📈'
    } else if (activePath === '/tools/naming') {
      setStep('tools-naming')
      document.title = 'Startup Name Generator - Free Branding Tool | MarketVibe'
    } else if (activePath.includes('/admin/leads')) {
      setStep('admin-leads')
      document.title = 'Commander Center - Growth Leads | MarketVibe'
    } else if (activePath.includes('/privacy')) {
      setStep('privacy')
      document.title = 'Privacy Policy | MarketVibe'
    } else if (activePath.includes('/terms')) {
      setStep('terms')
      document.title = 'Terms of Service | MarketVibe'
    } else if (activePath === '/hub') {
      setStep('hub')
      document.title = 'Hall of Fame - Validated Idea Case Studies | MarketVibe'
    } else if (activePath === '/tools/market-size') {
      setStep('market-size')
      document.title = 'Free TAM SAM SOM Calculator | MarketVibe'
    } else if (activePath === '/insights') {
      setStep('insights')
      document.title = 'Market Intelligence: Startup Trends 2026 | MarketVibe'
    } else if (activePath.startsWith('/validate/')) {
      const slug = activePath.split('/').pop()
      const foundNiche = popularNiches.find(n => n.slug === slug)
      if (foundNiche) {
        setStep('p-seo')
        setActiveNiche(foundNiche)
        const title = `Validate your ${foundNiche.name} Business Idea - MarketVibe`
        document.title = title
      }
    } else if (activePath === '/library') {
      setStep('library')
      document.title = 'MarketVibe Intelligence Library - 100+ Startup Blueprints'
    } else if (activePath === '/newsroom') {
      setStep('newsroom')
      document.title = 'The Newsroom: Breaking Market Trends | MarketVibe'
    } else if (activePath === '/blog') {
      setStep('blog-index')
      document.title = 'Growth Blog: Market Trends & Analysis | MarketVibe'
    } else if (activePath.startsWith('/blog/')) {
      setStep('blog-post')
    } else if (activePath === '/viral') {
      setStep('viral')
    } else if (activePath === '/launchpad') {
      setStep('launchpad')
      document.title = 'MarketVibe Launchpad - Discover Validated Startups'
    } else if (activePath === '/launchpad/submit') {
      setStep('launchpad-submit')
      document.title = 'Submit to Launchpad | MarketVibe'
    } else if (activePath.startsWith('/launchpad/listing/')) {
      setStep('launchpad-listing')
    } else if (activePath.startsWith('/admin')) {
      if (activePath.includes('social')) {
        setStep('social-command')
        document.title = 'Social Command Center | MarketVibe'
      } else if (activePath.includes('twitter-bot')) {
        setStep('twitter-bot')
        document.title = 'Twitter Bot Dashboard | MarketVibe'
      } else {
        setStep('admin')
        document.title = 'Command Center | MarketVibe'
      }
    }
  }, [activePath])

  useEffect(() => {
    if (step === 'fulfillment' && !paid) {
      const timer = setInterval(() => {
        setFomoTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, paid]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    setErrorMessage('')
    try {
      const { data: leadRecords } = await supabase.from('leads').select('*').eq('email', email).order('created_at', { ascending: false });
      if (leadRecords && leadRecords.length > 0) {
        const leadWithResults = leadRecords.find(l => l.results);
        if (leadWithResults) setResults(leadWithResults.results);
        const paidRecord = leadRecords.find(l => l.paid || l.status === 'paid');
        if (paidRecord) {
          setPaid(true);
          setPlanType(paidRecord.plan_type || 'founder');
        }
        localStorage.setItem('marketvibe_lead_email', email)
        const bestLead = leadRecords.find(l => (l.paid || l.status === 'paid') && l.results) || leadRecords.find(l => l.results);
        if (bestLead && bestLead.results) {
          setResults(bestLead.results);
          setStep('fulfillment');
          setSubmitting(false);
          return;
        }
      }
      const referralCode = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
      const referrer = localStorage.getItem('marketvibe_referrer');
      const { data, error } = await supabase.from('leads').insert([{ email: email, referral_code: referralCode, referred_by: referrer, status: 'started_validation' }]).select()
      if (error) throw error
      localStorage.setItem('marketvibe_lead_id', data[0].id);
      localStorage.setItem('marketvibe_lead_email', email)
      await sendWelcomeEmail(email)
      setStep('setup')
    } catch (error) {
      setErrorMessage(error?.message || "Connection error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleProjectSubmit = async (projectData) => {
    setSubmitting(true)
    setErrorMessage('')
    try {
      const report = generateValidationReport(projectData)
      const { data: latestRecords } = await supabase.from('leads').select('id').eq('email', email).order('created_at', { ascending: false }).limit(1);
      const targetId = latestRecords?.[0]?.id;
      if (targetId) {
        // try { await supabase.rpc('increment_usage', { lead_id: targetId }); } catch (e) { }
        await supabase.from('leads').update({ project_name: projectData.name, project_description: projectData.description, target_audience: projectData.audience, results: report, status: 'completed_validation' }).eq('id', targetId);
      }
      setResults(report)
      setCurrentLeadId(targetId);
      setHistory(prev => [{ id: targetId, project_name: projectData.name, results: report, created_at: new Date().toISOString() }, ...prev.filter(p => p.id !== targetId)]);
      setStep('fulfillment')
      await sendResultsEmail(email, projectData.name)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlock = async (type = 'founder') => {
    setSubmitting(true)
    try {
      await createCheckoutSession(email, type)
    } catch (error) {
      alert(error?.message || "Could not start checkout.");
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectPlan = (planId) => {
    const type = planId === 'pro' ? 'founder' : (planId === 'expert' ? 'expert' : 'free');
    if (email && email.includes('@')) {
      if (type === 'free') setStep('setup'); else handleUnlock(type);
    } else {
      setPendingPlan(type);
      setCheckoutModalOpen(true);
    }
  }

  const handleProjectSelect = (projectId) => {
    const selected = history.find(h => h.id === projectId);
    if (selected) {
      setResults(selected.results);
      setStep('fulfillment');
    }
  };

  if (!supabase) return <div style={{ color: '#ef4444', padding: '10rem', textAlign: 'center', background: '#0f172a', minHeight: '100vh' }}>⚠️ Database connection missing.</div>

  const isInvestorRoute = window.location.pathname.toLowerCase().includes('/investor');
  const isInvestorDashboard = isInvestorRoute && window.location.pathname.toLowerCase().includes('/dashboard');

  return (
    <div className={(isInvestorRoute || isInvestorDashboard) ? "full-width" : "container"}>
      {/* Hide main header on specialized portal pages */}
      {!isInvestorRoute && !isInvestorDashboard && (
        <header style={{ padding: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => { setResults(null); setStep('landing'); }} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/logo.svg" alt="MarketVibe Logo" style={{ width: '32px', height: '32px' }} />
              MarketVibe
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href="/launchpad" style={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              padding: '6px 14px',
              borderRadius: '20px',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}>🚀 Launchpad</a>
            <a href="/library" onClick={(e) => { e.preventDefault(); setStep('library'); }} style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>📚 Library</a>
          </div>
        </header>
      )}

      {/* Main Content Router */}
      {(() => {
        switch (step) {
          case 'investors': return <InvestorLanding onNavigate={(p) => { window.location.href = p; }} spots={investorSpots} />;
          case 'investor-dashboard':
            // SECURITY GUARD: Only trust the DB planType, not just 'paid' UI state
            if (planType === 'verifying') {
              return (
                <div style={{ textAlign: 'center', padding: '10rem', background: '#0a0a1a', minHeight: '100vh', color: 'white' }}>
                  <h2 style={{ marginBottom: '1rem' }}>⚡ Verifying Investor Access...</h2>
                  <p style={{ color: '#64748b' }}>Securing your private deal flow link. Please wait a moment.</p>
                  <div style={{ marginTop: '2rem', fontSize: '2rem', animation: 'spin 2s linear infinite' }}>⌛</div>
                  <VerifyingPortal />
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
              );
            }
            if (planType !== 'investor') return <InvestorLanding onNavigate={(p) => { window.location.href = p; }} spots={investorSpots} />;
            return <InvestorDashboard supabase={supabase} />;
          case 'setup': return <ProjectForm onSubmit={handleProjectSubmit} submitting={submitting} email={email} usageCount={usageCount} history={history} onSelectProject={handleProjectSelect} />;
          case 'fulfillment': return <ResultsView results={results} email={email} onUnlock={handleUnlock} unlocked={paid} planType={planType} history={history} onSelectProject={handleProjectSelect} />;
          case 'admin-leads': return <LeadsDashboard supabase={supabase} />;
          case 'og-preview': return previewId ? <GrowthScorecard leadId={previewId} supabase={supabase} /> : null;
          case 'tools-naming': return <NameGenerator onSelectName={(n) => { setSelectedProjectName(n); setStep('setup'); }} />;
          case 'admin': return <AdminDashboard />;
          case 'privacy': return <PrivacyPolicy />;
          case 'terms': return <TermsOfService />;
          case 'hub': return <CaseStudyHub />;
          case 'market-size': return <MarketSizeCalculator onGetBlueprint={() => { setStep('setup'); window.scrollTo(0, 0); }} />;
          case 'library': return <Library onSelectNiche={(n) => { setActiveNiche(n); setStep('p-seo'); window.scrollTo(0, 0); }} />;
          case 'p-seo': return <NicheValidator niche={activeNiche} />;
          case 'insights': return <AuthorityInsights />;
          case 'newsroom': return <Newsroom />;
          case 'blog-index': return <BlogIndex />;
          case 'blog-post': return <BlogPost />;
          case 'viral': return <ReferralHub />;
          case 'launchpad': return <LaunchpadDirectory supabase={supabase} />;
          case 'launchpad-submit': return <LaunchpadSubmit supabase={supabase} />;
          case 'launchpad-listing': return <LaunchpadListing listingId={window.location.pathname.split('/').pop()} onBack={() => { window.location.href = '/launchpad'; }} supabase={supabase} />;
          case 'social-command': return <SocialCommandCenter />;
          case 'twitter-bot': return <TwitterBotDashboard />;
          case 'landing':
          default:
            return (
              <>
                {loading && <div style={{ textAlign: 'center', padding: '2rem', color: '#6366f1' }}>⚡ Initializing...</div>}
                <section className="hero">
                  <div className="badge">{activeNiche ? `${activeNiche.name} Protocol` : 'Limited Founders Opportunity'}</div>
                  <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {activeNiche ? `Launch Your ${activeNiche.name} Empire` : 'Build a $10k/mo Business in 30 Days.'}
                  </h1>
                  <p style={{ fontSize: '1.25rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                    {activeNiche ? `Get instant validation for ${activeNiche.name}.` : "Get a revenue forecast and 30-day roadmap generated instantly by AI."}
                  </p>
                  <div className="cta-box floating">
                    <div className="counter" style={{ color: '#ef4444', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '2rem', marginBottom: '1.5rem' }}>
                      🔥 Only {spots} Founder Spots Left
                    </div>
                    <form onSubmit={handleEmailSubmit} className="input-group">
                      <input type="email" placeholder="Enter your email" required disabled={submitting} value={email} onChange={(e) => setEmail(e.target.value)} />
                      <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Connecting...' : 'Get My Free Report'}</button>
                    </form>
                    {errorMessage && <p className="error-text">{errorMessage}</p>}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>Want to launch a validated idea instead?</p>
                      <a href="/launchpad" style={{ color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Browse Recent Launches →
                      </a>
                    </div>
                  </div>
                </section>
                <PricingTable onSelectPlan={handleSelectPlan} spots={spots} />
              </>
            );
        }
      })()}

      {!isInvestorRoute && !isInvestorDashboard && (
        <footer style={{ marginTop: '6rem', padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <a href="/investors" style={{ color: '#f59e0b', fontWeight: 'bold', textDecoration: 'none' }}>Investor Portal</a>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); setStep('privacy'); }} style={{ color: '#64748b', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); setStep('terms'); }} style={{ color: '#64748b', textDecoration: 'none' }}>Terms</a>
          </div>
          <p style={{ color: '#475569', fontSize: '0.8rem' }}>&copy; 2026 MarketVibe. Built for the survivors. v3.5</p>
        </footer>
      )}

      {checkoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '1rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Secure Your Spot 🚀</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUnlock(pendingPlan); setCheckoutModalOpen(false); }}>
              <input type="email" placeholder="your@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155' }} />
              <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 'bold' }}>Continue →</button>
            </form>
            <button onClick={() => setCheckoutModalOpen(false)} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      <EmailCapturePopup supabase={supabase} onEmailCaptured={setEmail} />
    </div>
  )
}

export default App
