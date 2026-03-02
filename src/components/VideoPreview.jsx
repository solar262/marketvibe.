import React, { useState, useEffect, useRef } from 'react';
import RecordRTC from 'recordrtc';
import trends from '../lib/trends_cache.json';

const VideoPreview = () => {
    console.log("⚛️ VideoPreview Rendering...");
    const [trend, setTrend] = useState(null);
    const [phase, setPhase] = useState('intro'); // intro, data, conclusion
    const [isRecording, setIsRecording] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        console.log("🧩 VideoPreview Mounted");
        if (trends && trends.length > 0) {
            console.log("📉 Trend Loaded:", trends[0].niche);
            setTrend(trends[0]);
        } else {
            console.warn("⚠️ No trends found in cache!");
        }

        // Listen for bot commands
        window.startRecording = async () => {
            console.log("🎬 window.startRecording called!");
            setIsRecording(true);
            await startCanvasRecording();
            await runSequence();
        };
        window.mv_hydration_status = 'READY';
        console.log("✅ window.startRecording attached & Hydration READY");
    }, []);

    const startCanvasRecording = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        console.log("🎬 Capturing Canvas Stream...");
        let recorder;
        try {
            const stream = canvas.captureStream(30); // Higher FPS for smooth look
            recorder = new RecordRTC(stream, {
                type: 'video',
                mimeType: 'video/webm'
            });
            recorder.startRecording();
            console.log("⏺️ RecordRTC started recording via captureStream");
        } catch (e) {
            console.error("❌ MediaRecorder/RecordRTC Init Failed:", e.message);
            window.mv_capture_log = [`Error: ${e.message}`];
            return;
        }

        window.mv_capture_log = ["Recording started"];
        let framesCaptured = 0;

        const renderLoop = () => {
            if (window.videoFinished) {
                console.log("⏹️ Stopping Recorder. Total frames:", framesCaptured);
                window.mv_capture_log.push(`Stop (${framesCaptured})`);
                recorder.stopRecording(() => {
                    const blob = recorder.getBlob();
                    console.log("📦 Blob generated, size:", blob.size);
                    window.mv_capture_log.push(`Blob size: ${blob.size}`);
                    const reader = new FileReader();
                    reader.onload = () => {
                        console.log("📤 Sending video data to worker...");
                        window.mv_capture_log.push("Sending data");
                        window.onVideoData(reader.result);
                    };
                    reader.readAsDataURL(blob);
                });
                return;
            }

            try {
                // --- Premium Manual Canvas Drawing ---
                // 1. Deep Background
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, 1280, 720);

                // Animated Background Glow
                const time = Date.now() / 1000;
                const glowX = 640 + Math.sin(time) * 100;
                const glowY = 360 + Math.cos(time * 0.8) * 50;
                const grad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 600);
                grad.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
                grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 1280, 720);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (phase === 'intro') {
                    // MarketVibe Intelligence Pill
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                    const pillWidth = 350;
                    ctx.beginPath();
                    ctx.roundRect(640 - pillWidth / 2, 180, pillWidth, 50, 25);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = '#6366f1';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.fillText('MARKETVIBE INTELLIGENCE 🛰️', 640, 205);

                    // Daily Gains Title
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 110px sans-serif';
                    ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
                    ctx.shadowBlur = 40;
                    ctx.fillText('Daily ', 640 - 160, 360);
                    ctx.fillStyle = '#6366f1';
                    ctx.fillText('Gains', 640 + 130, 360);
                    ctx.shadowBlur = 0;

                    // Date
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '32px sans-serif';
                    ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 640, 480);
                }
                else if (phase === 'data' && trend) {
                    ctx.textAlign = 'left';

                    ctx.fillStyle = '#6366f1';
                    ctx.font = 'bold 26px sans-serif';
                    ctx.fillText('BREAKOUT DETECTED', 120, 180);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 85px sans-serif';
                    ctx.fillText(trend.niche, 120, 270);

                    // Divider
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
                    ctx.fillRect(120, 320, 100, 6);

                    // Stats
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '22px sans-serif';
                    ctx.fillText('HEAT SCORE', 120, 380);
                    ctx.fillText('MOMENTUM', 450, 380);

                    ctx.fillStyle = '#6366f1';
                    ctx.font = 'bold 90px sans-serif';
                    ctx.fillText(trend.heatScore ? trend.heatScore.toFixed(1) : '8.4', 120, 470);

                    ctx.fillStyle = '#10b981';
                    ctx.fillText(`+${trend.velocity || '124'}%`, 450, 470);

                    // Side Insight Box
                    ctx.fillStyle = 'rgba(255,255,255,0.03)';
                    ctx.beginPath();
                    ctx.roundRect(800, 180, 400, 360, 32);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 34px sans-serif';
                    ctx.fillText('Market Insight', 840, 240);

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '24px sans-serif';
                    const wrapText = (text, x, y, maxWidth, lineHeight) => {
                        let words = text.split(' ');
                        let line = '';
                        for (let n = 0; n < words.length; n++) {
                            let testLine = line + words[n] + ' ';
                            let metrics = ctx.measureText(testLine);
                            if (metrics.width > maxWidth && n > 0) {
                                ctx.fillText(line, x, y);
                                line = words[n] + ' ';
                                y += lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        ctx.fillText(line, x, y);
                    };
                    wrapText(`Large surge in interest signals massive untapped potential. High ROI potential for builders.`, 840, 300, 320, 40);
                }
                else if (phase === 'conclusion') {
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 64px sans-serif';
                    ctx.fillText('Build your empire.', 640, 280);

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '24px sans-serif';
                    ctx.fillText('Get the full founder playbook at:', 640, 350);

                    // URL Box
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                    ctx.beginPath();
                    ctx.roundRect(340, 400, 600, 110, 24);
                    ctx.fill();
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = '#6366f1';
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 55px sans-serif';
                    ctx.fillText('marketvibe1.com', 640, 465);
                }

                framesCaptured++;
                if (framesCaptured % 20 === 0) {
                    window.mv_capture_log.push(`Fr ${framesCaptured}`);
                }
            } catch (err) {
                console.error("Render error:", err);
                window.mv_capture_log.push(`Err: ${err.message}`);
            }

            setTimeout(renderLoop, 33); // ~30 FPS
        };

        renderLoop();
    };

    const runSequence = async () => {
        setPhase('intro');
        await new Promise(r => setTimeout(r, 4000));
        setPhase('data');
        await new Promise(r => setTimeout(r, 8000));
        setPhase('conclusion');
        await new Promise(r => setTimeout(r, 4000));
        window.videoFinished = true;
    };

    if (!trend) return <div style={{ background: '#0f172a', height: '100vh' }} />;

    return (
        <div data-testid="video-preview-loaded" style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={canvasRef} width="1280" height="720" style={{ width: '1280px', height: '720px', border: '1px solid #1e293b', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} />
        </div>
    );
};

export default VideoPreview;
