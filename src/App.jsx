import React, { useState, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabase'
import { sendWelcomeEmail, sendResultsEmail } from './lib/email'
import { generateValidationReport } from './lib/generator'
import { createCheckoutSession } from './lib/stripe'
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
import NewsArticle from './components/NewsArticle';
import BlogIndex from './components/BlogIndex';
import BlogPost from './components/BlogPost';
import ReferralHub from './components/ReferralHub';
import LaunchpadDirectory from './components/LaunchpadDirectory';
import LaunchpadSubmit from './components/LaunchpadSubmit';
import LaunchpadListing from './components/LaunchpadListing';
import InvestorLanding from './components/InvestorLanding';
import InvestorDashboard from './components/InvestorDashboard';
import SocialCommandCenter from './components/SocialCommandCenter';
import TwitterBotDashboard from './components/TwitterBotDashboard';
import EmailCapturePopup from './components/EmailCapturePopup';
import Library from './components/Library';
import VideoPreview from './components/VideoPreview';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import About from './components/About';
import Contact from './components/Contact';

import NewsletterSignup from './components/NewsletterSignup';
import { popularNiches } from './lib/niches'

const VerifyingPortal = () => {
  useEffect(() => {
    const timer = setTimeout(() => window.location.reload(), 4000);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

const updateMetaTags = (title, description, image = '/og-preview.png') => {
  if (title) document.title = title;

  const tags = {
    'description': description,
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
  };

  Object.entries(tags).forEach(([name, value]) => {
    if (!value) return;
    let el = document.querySelector(`meta[name="${name}"]`) ||
      document.querySelector(`meta[property="${name}"]`);
    if (el) el.setAttribute('content', value);
  });
};

function App() {
  const [step, setStep] = useState(() => {
    const rawPath = window.location.pathname.toLowerCase();
    const p = rawPath.replace(/\/$/, '') || '/';
    console.log('[Router] Initializing path:', p);

    if (p.includes('/investor')) return 'investors';
    if (rawPath.startsWith('/og-preview/')) return 'og-preview';
    if (p === '/tools/naming') return 'tools-naming';
    if (p.includes('/admin/leads')) return 'admin-leads';
    if (p.includes('/privacy')) return 'privacy';
    if (p.includes('/terms')) return 'terms';
    if (p.includes('/about')) return 'about';
    if (p.includes('/contact')) return 'contact';
    if (p === '/hub') return 'hub';
    if (p === '/tools/market-size') return 'market-size';
    if (p === '/insights') return 'insights';
    if (rawPath.startsWith('/validate/')) return 'p-seo';
    if (p === '/newsroom') return 'newsroom';
    if (rawPath.startsWith('/news/')) return 'news-article';
    if (p === '/blog') return 'blog-index';
    if (rawPath.startsWith('/blog/')) return 'blog-post';
    if (p === '/launchpad') return 'launchpad';
    if (p === '/launchpad/submit') return 'launchpad-submit';
    if (rawPath.startsWith('/launchpad/listing/')) return 'launchpad-listing';
    if (p === '/admin/video-preview') return 'video-preview';
    if (p.startsWith('/admin')) {
      if (p.includes('social')) return 'social-command';
      if (p.includes('twitter-bot')) return 'twitter-bot';
      return 'admin';
    }
    return 'landing';
  });

  const [email, setEmail] = useState('')
  const [spots, setSpots] = useState(20)
  const [investorSpots, setInvestorSpots] = useState(12)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [results, setResults] = useState(null)
  const [paid, setPaid] = useState(false)
  const [planType, setPlanType] = useState('free')
  const [activeNiche, setActiveNiche] = useState(null)
  const [history, setHistory] = useState([])
  const [leadsFeed, setLeadsFeed] = useState([])
  const [usageCount, setUsageCount] = useState(0)
  const [currentLeadId, setCurrentLeadId] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [selectedProjectName, setSelectedProjectName] = useState('')
  const [fomoTimer, setFomoTimer] = useState(900)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const viewEmail = params.get('view_results')
    const status = params.get('status')
    const savedEmail = localStorage.getItem('marketvibe_lead_email')
    const finalEmail = viewEmail || (status === 'success' ? savedEmail : null)

    const badgeId = params.get('lid') || params.get('ref_badge');
    const isBadgeRef = params.get('ref') === 'badge' || !!params.get('ref_badge');

    if (isBadgeRef && badgeId && supabase) {
      const logBadgeHit = async () => {
        try {
          const referrer = document.referrer || 'direct';
          const domain = referrer !== 'direct' ? new URL(referrer).hostname : 'direct';
          const { data: existing } = await supabase.from('badge_hits').select('*').eq('lead_id', badgeId).eq('source_domain', domain).single();
          if (existing) {
            await supabase.from('badge_hits').update({ click_count: existing.click_count + 1, last_hit_at: new Date().toISOString() }).eq('id', existing.id);
          } else {
            await supabase.from('badge_hits').insert({ lead_id: badgeId, source_domain: domain, click_count: 1 });
          }
        } catch (e) { console.error("Badge hit error:", e); }
      };
      logBadgeHit();
    }

    if (finalEmail) {
      setEmail(finalEmail)
      localStorage.setItem('marketvibe_lead_email', finalEmail)
    }

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
          if (status === 'success' && !record.paid) {
            await supabase.from('leads').update({ paid: true, status: 'paid', plan_type: localStorage.getItem('mv_pending_plan') || 'founder' }).eq('id', record.id);
            setPaid(true);
            setPlanType(localStorage.getItem('mv_pending_plan') || 'founder');
          }
          const { data: leadRecords } = await supabase.from('leads').select('*').eq('email', record.email);
          const anyPaidRecord = leadRecords?.find(l => l.paid || l.status === 'paid');
          if (anyPaidRecord) {
            setPaid(true);
            setPlanType(anyPaidRecord.plan_type || 'founder');
          }
          setUsageCount(leadRecords?.length || 0);
          setHistory(leadRecords?.filter(l => l.results) || []);
        }

        const { data: settings } = await supabase.from('app_settings').select('key, value');
        if (settings) {
          const ldr = settings.find(s => s.key === 'lifetime_deals_remaining');
          const isr = settings.find(s => s.key === 'investor_seats_remaining');
          if (ldr) setSpots(ldr.value);
          if (isr) setInvestorSpots(isr.value);
        }
      } catch (err) { console.error('Data check error:', err) } finally { setLoading(false) }
    }
    fetchData()

    const hasCounted = sessionStorage.getItem('vibe_session_counted');
    if (!hasCounted && supabase) {
      (async () => {
        try { await supabase.rpc('increment_hits'); } catch (e) { }
      })();
      sessionStorage.setItem('vibe_session_counted', 'true');
    }
  }, [])

  const activePath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/'

  useEffect(() => {
    if (activePath === '/investors' || activePath === '/investor') {
      setStep('investors')
      updateMetaTags('Investor Access | MarketVibe', 'Private access to vetted startup opportunities.');
    } else if (activePath.startsWith('/og-preview/')) {
      const id = activePath.split('/').pop()
      setPreviewId(parseInt(id, 10))
      setStep('og-preview')
    } else if (activePath === '/tools/naming') {
      setStep('tools-naming')
    } else if (activePath === '/hub') {
      setStep('hub')
    } else if (activePath === '/tools/market-size') {
      setStep('market-size')
    } else if (activePath === '/insights') {
      setStep('insights')
    } else if (activePath === '/about') {
      setStep('about')
    } else if (activePath === '/contact') {
      setStep('contact')
    } else if (activePath.startsWith('/validate/')) {
      const slug = activePath.split('/').pop()
      const foundNiche = popularNiches.find(n => n.slug === slug)
      if (foundNiche) { setStep('p-seo'); setActiveNiche(foundNiche); }
    } else if (activePath === '/library') {
      setStep('library')
    } else if (activePath === '/newsroom') {
      setStep('newsroom')
    } else if (activePath.startsWith('/news/')) {
      setStep('news-article')
    } else if (activePath === '/blog') {
      setStep('blog-index')
    } else if (activePath.startsWith('/blog/')) {
      setStep('blog-post')
    } else if (activePath === '/launchpad') {
      setStep('launchpad')
    } else if (activePath === '/launchpad/submit') {
      setStep('launchpad-submit')
    } else if (activePath.startsWith('/launchpad/listing/')) {
      setStep('launchpad-listing')
    } else if (activePath === '/admin/video-preview') {
      setStep('video-preview')
    } else if (activePath.startsWith('/admin')) {
      if (activePath.includes('social')) setStep('social-command');
      else if (activePath.includes('twitter-bot')) setStep('twitter-bot');
      else setStep('admin');
    }
  }, [activePath])

  // --- SEO: Dynamic Breadcrumb Schema ---
  useEffect(() => {
    const crumbs = [{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.marketvibe1.com" }];
    if (step !== 'landing') {
        const labels = {
            'blog-index': 'Intelligence Blog',
            'blog-post': 'Analysis',
            'newsroom': 'Newsroom',
            'hub': 'Launchpad',
            'launchpad': 'Launchpad',
            'market-size': 'Market Size Calculator',
            'tools-naming': 'Naming Engine',
            'fulfillment': 'Business Report'
        };
        crumbs.push({ 
            "@type": "ListItem", 
            "position": 2, 
            "name": labels[step] || step.charAt(0).toUpperCase() + step.slice(1), 
            "item": `https://www.marketvibe1.com${window.location.pathname}`
        });
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": crumbs
    };

    let script = document.getElementById('breadcrumb-schema');
    if (!script) {
        script = document.createElement('script');
        script.id = 'breadcrumb-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    script.text = JSON.stringify(breadcrumbSchema);
  }, [step]);

  const handleUnlock = async (plan = 'founder') => {
    if (!email) {
      window.dispatchEvent(new CustomEvent('mv_trigger_capture'));
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem('mv_pending_plan', plan);
      await createCheckoutSession(email, plan);
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.message || 'Payment engine offline. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'fulfillment' && !paid) {
      const timer = setInterval(() => setFomoTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
      return () => clearInterval(timer);
    }
  }, [step, paid]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    try {
      const { data: leadRecords } = await supabase.from('leads').select('*').eq('email', email).order('created_at', { ascending: false });
      if (leadRecords?.length > 0) {
        const bestLead = leadRecords.find(l => (l.paid || l.status === 'paid') && l.results) || leadRecords.find(l => l.results);
        if (bestLead) { setResults(bestLead.results); setStep('fulfillment'); setSubmitting(false); return; }
      }
      setStep('setup')
    } finally { setSubmitting(false) }
  }

  const handleProjectSubmit = async (projectData) => {
    setSubmitting(true)
    try {
      const report = generateValidationReport(projectData)
      setResults(report)
      setStep('fulfillment')
    } finally { setSubmitting(false) }
  }

  const handleSelectProject = (projectId) => {
    const selected = history.find(h => h.id === projectId);
    if (selected) { setResults(selected.results); setStep('fulfillment'); }
  };

  if (!supabase) return <div>⚠️ Database offline</div>

  const isInvestorRoute = window.location.pathname.toLowerCase().includes('/investor');
  const isInvestorDashboard = isInvestorRoute && window.location.pathname.toLowerCase().includes('/dashboard');

  return (
    <ErrorBoundary>
      <div className={(isInvestorRoute || isInvestorDashboard) ? "full-width" : "container"}>
        {!isInvestorRoute && !isInvestorDashboard && (
          <header style={{ padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div onClick={() => setStep('landing')} style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6366f1', cursor: 'pointer' }}>MarketVibe</div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <a href="/newsroom" onClick={(e) => { e.preventDefault(); setStep('newsroom'); }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Newsroom</a>
              <a href="/hub" onClick={(e) => { e.preventDefault(); setStep('hub'); }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Launchpad</a>
            </div>
          </header>
        )}

        <main>
          {(() => {
            switch (step) {
              case 'investors': return <InvestorLanding onNavigate={(p) => { window.location.href = p; }} spots={investorSpots} />;
              case 'investor-dashboard': return <InvestorDashboard supabase={supabase} />;
              case 'setup': return <ProjectForm onSubmit={handleProjectSubmit} submitting={submitting} />;
              case 'fulfillment': return <ResultsView results={results} email={email} unlocked={paid} onUnlock={handleUnlock} spots={spots} loading={loading} fomoTimer={fomoTimer} />;
              case 'admin': return <AdminDashboard />;
              case 'launchpad':
              case 'hub': return <LaunchpadDirectory supabase={supabase} />;
              case 'launchpad-submit': return <LaunchpadSubmit supabase={supabase} />;
              case 'newsroom': return <Newsroom />;
              case 'news-article': return <NewsArticle />;
              case 'p-seo': return <ResultsView results={generateValidationReport(activeNiche)} email={email} unlocked={true} onUnlock={handleUnlock} />;
              case 'video-preview': return <VideoPreview />;
              case 'privacy': return <PrivacyPolicy />;
              case 'terms': return <TermsOfService />;
              case 'about': return <About />;
              case 'contact': return <Contact />;
              case 'landing':
              default: return <LandingPage />;
            }
          })()}
        </main>

        <EmailCapturePopup supabase={supabase} onEmailCaptured={setEmail} />
        
        {!isInvestorRoute && !isInvestorDashboard && (
          <footer style={{ marginTop: '5rem', padding: '4rem 0', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#6366f1', marginBottom: '1rem' }}>MarketVibe</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '300px' }}>
                  Autonomous startup validation and revenue intelligence. Built for the 2026 founder.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</div>
                  <a href="/hub" onClick={(e) => { e.preventDefault(); setStep('hub'); }} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Launchpad</a>
                  <a href="/tools/naming" onClick={(e) => { e.preventDefault(); setStep('tools-naming'); }} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Naming Tool</a>
                  <a href="/blog" onClick={(e) => { e.preventDefault(); setStep('blog-index'); }} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Intelligence Blog</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</div>
                  <a href="/about" onClick={(e) => { e.preventDefault(); setStep('about'); }} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>About Us</a>
                  <a href="/contact" onClick={(e) => { e.preventDefault(); setStep('contact'); }} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Contact</a>
                  <a href="/privacy" onClick={(e) => { e.preventDefault(); setStep('privacy'); }} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a>
                  <a href="/terms" onClick={(e) => { e.preventDefault(); setStep('terms'); }} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Terms</a>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '4rem', paddingOver: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem', textAlign: 'center', color: '#cbd5e1', fontSize: '0.8rem' }}>
              &copy; 2026 MarketVibe Intelligence Unit. All rights reserved.
            </div>
          </footer>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
