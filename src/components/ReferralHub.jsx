
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ReferralHub = () => {
    const [referralCode, setReferralCode] = useState(null);
    const [referralCount, setReferralCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Retrieve the last generated lead ID from localStorage to identify the user
        const storedLeadId = localStorage.getItem('marketvibe_lead_id');

        if (storedLeadId) {
            fetchReferralData(storedLeadId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchReferralData = async (leadId) => {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('referral_code, referrals_count')
                .eq('id', leadId)
                .single();

            if (data) {
                setReferralCode(data.referral_code);
                setReferralCount(data.referrals_count || 0);
            }
        } catch (err) {
            console.error("Error fetching referral data:", err);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}?ref=${referralCode}`;
        navigator.clipboard.writeText(url);
        alert("Referral link copied! Share it with 3 friends.");
    };

    const target = 3;
    const progress = Math.min((referralCount / target) * 100, 100);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading referral status...</div>;

    if (!referralCode) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <h2>Start Validating to Unlock Referrals</h2>
            <p>Once you submit your first idea, you'll get a unique link to earn free upgrades.</p>

            <button
                onClick={() => {
                    const fakeId = 'demo_' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('marketvibe_lead_id', fakeId);
                    setReferralCode('DEMO-User-123');
                    setReferralCount(1);
                }}
                style={{
                    marginTop: '2rem',
                    background: 'transparent',
                    border: '1px dashed #6366f1',
                    color: '#6366f1',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                }}
            >
                [Admin] Simulate Validation
            </button>
        </div>
    );

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
            <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '1.5rem',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '0.4rem 1rem',
                    borderRadius: '2rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                }}>
                    VIRAL UNLOCK PROGRAM 🚀
                </span>

                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '1.5rem 0' }}>
                    Unlock the Expert Report for FREE
                </h1>

                <p style={{ fontSize: '1.2rem', color: '#e0e7ff', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                    Invite 3 fellow founders to validate their ideas. Once they sign up, you'll get the $49 Expert Analysis dashboard instantly.
                </p>

                {/* Progress Bar */}
                <div style={{ background: 'rgba(0,0,0,0.2)', height: '1.5rem', borderRadius: '1rem', overflow: 'hidden', margin: '2rem auto', maxWidth: '500px', position: 'relative' }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: '#34d399',
                        transition: 'width 0.5s ease-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'black'
                    }}>
                        {progress >= 100 && "UNLOCKED!"}
                    </div>
                </div>
                <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '2rem' }}>
                    {referralCount} / {target} Founders Referred
                </p>

                {/* Link Box */}
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: '500px',
                    margin: '0 auto',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <code style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>
                        {window.location.origin}?ref={referralCode}
                    </code>
                    <button
                        onClick={copyLink}
                        style={{
                            background: 'white',
                            color: '#4f46e5',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.3rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralHub;
