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

    const isTikTok = window.location.search.includes('mode=tiktok');
    const width = isTikTok ? 720 : 1280;
    const height = isTikTok ? 1280 : 720;

    const startCanvasRecording = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        console.log(`🎬 Capturing ${isTikTok ? 'Vertical' : 'Horizontal'} Canvas Stream...`);
        let recorder;
        try {
            const stream = canvas.captureStream(30); 
            recorder = new RecordRTC(stream, {
                type: 'video',
                mimeType: 'video/webm'
            });
            recorder.startRecording();
            console.log("⏺️ RecordRTC started recording");
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
                // 1. Deep Background
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, width, height);

                // Animated Background Glow
                const time = Date.now() / 1000;
                const glowX = width / 2 + Math.sin(time) * 100;
                const glowY = height / 2 + Math.cos(time * 0.8) * 50;
                const grad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, isTikTok ? 800 : 600);
                grad.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
                grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (phase === 'intro') {
                    // MarketVibe Intelligence Pill
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                    const pillWidth = isTikTok ? 450 : 350;
                    const pillY = isTikTok ? 300 : 180;
                    ctx.beginPath();
                    ctx.roundRect(width / 2 - pillWidth / 2, pillY, pillWidth, 60, 30);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.fillStyle = '#6366f1';
                    ctx.font = `bold ${isTikTok ? 26 : 20}px sans-serif`;
                    ctx.fillText('MARKETVIBE INTELLIGENCE 🛰️', width / 2, pillY + 30);

                    // Daily Gains Title
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `bold ${isTikTok ? 140 : 110}px sans-serif`;
                    ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
                    ctx.shadowBlur = 50;
                    
                    if (isTikTok) {
                        ctx.fillText('Daily', width / 2, 540);
                        ctx.fillStyle = '#6366f1';
                        ctx.fillText('Gains', width / 2, 680);
                    } else {
                        ctx.fillText('Daily ', 640 - 160, 360);
                        ctx.fillStyle = '#6366f1';
                        ctx.fillText('Gains', 640 + 130, 360);
                    }
                    ctx.shadowBlur = 0;

                    // Date
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = `${isTikTok ? 40 : 32}px sans-serif`;
                    ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), width / 2, isTikTok ? 850 : 480);
                }
                else if (phase === 'data' && trend) {
                    if (isTikTok) {
                        ctx.textAlign = 'center';
                        ctx.fillStyle = '#6366f1';
                        ctx.font = 'bold 36px sans-serif';
                        ctx.fillText('BREAKOUT DETECTED', width / 2, 250);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 95px sans-serif';
                        ctx.fillText(trend.niche, width / 2, 360);

                        // Divider
                        ctx.fillStyle = '#6366f1';
                        ctx.fillRect(width / 2 - 60, 420, 120, 8);

                        // Stats Card
                        ctx.fillStyle = 'rgba(255,255,255,0.03)';
                        ctx.beginPath();
                        ctx.roundRect(100, 500, 520, 300, 40);
                        ctx.fill();

                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '30px sans-serif';
                        ctx.fillText('HEAT SCORE', width / 2, 560);
                        ctx.fillStyle = '#6366f1';
                        ctx.font = 'bold 130px sans-serif';
                        ctx.fillText(trend.heatScore ? trend.heatScore.toFixed(1) : '8.4', width / 2, 670);

                        ctx.fillStyle = '#10b981';
                        ctx.font = 'bold 70px sans-serif';
                        ctx.fillText(`+${trend.velocity || '124'}% MOMENTUM`, width / 2, 770);

                        // Insight
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '32px sans-serif';
                        const wrappedText = "Large surge in interest signals massive untapped potential. High ROI potential for builders.";
                        wrapText(ctx, wrappedText, width / 2, 950, 500, 50);

                    } else {
                        // Original Horizontal Data Layout
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#6366f1';
                        ctx.font = 'bold 26px sans-serif';
                        ctx.fillText('BREAKOUT DETECTED', 120, 180);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 85px sans-serif';
                        ctx.fillText(trend.niche, 120, 270);
                        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
                        ctx.fillRect(120, 320, 100, 6);
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '22px sans-serif';
                        ctx.fillText('HEAT SCORE', 120, 380);
                        ctx.fillText('MOMENTUM', 450, 380);
                        ctx.fillStyle = '#6366f1';
                        ctx.font = 'bold 90px sans-serif';
                        ctx.fillText(trend.heatScore ? trend.heatScore.toFixed(1) : '8.4', 120, 470);
                        ctx.fillStyle = '#10b981';
                        ctx.fillText(`+${trend.velocity || '124'}%`, 450, 470);
                        ctx.fillStyle = 'rgba(255,255,255,0.03)';
                        ctx.beginPath();
                        ctx.roundRect(800, 180, 400, 360, 32);
                        ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 34px sans-serif';
                        ctx.fillText('Market Insight', 840, 240);
                        ctx.font = '24px sans-serif';
                        ctx.fillStyle = '#94a3b8';
                        wrapText(ctx, `Large surge in interest signals massive untapped potential. High ROI potential for builders.`, 840, 300, 320, 40);
                    }
                }
                else if (phase === 'conclusion') {
                    ctx.textAlign = 'center';
                    if (isTikTok) {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 50px sans-serif';
                        wrapText(ctx, 'Go from Validation to Closing.', width / 2, 400, 600, 65);

                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '28px sans-serif';
                        ctx.fillText('Built with AI Outreach Studio', width / 2, 580);

                        // Stacking URL boxes for vertical
                        ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                        ctx.beginPath();
                        ctx.roundRect(100, 700, 520, 120, 24);
                        ctx.fill();
                        ctx.strokeStyle = '#6366f1'; ctx.stroke();
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 45px sans-serif';
                        ctx.fillText('marketvibe1.com', width / 2, 750);
                        ctx.font = '20px sans-serif'; ctx.fillStyle = '#94a3b8';
                        ctx.fillText('VALIDATE IDEAS', width / 2, 790);

                        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
                        ctx.beginPath();
                        ctx.roundRect(100, 850, 520, 120, 24);
                        ctx.fill();
                        ctx.strokeStyle = '#a855f7'; ctx.stroke();
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 45px sans-serif';
                        ctx.fillText('outreachstudio.ai', width / 2, 900);
                        ctx.font = '20px sans-serif'; ctx.fillStyle = '#94a3b8';
                        ctx.fillText('GET CUSTOMERS', width / 2, 940);

                    } else {
                        // Original Horizontal Conclusion
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 54px sans-serif';
                        ctx.fillText('Go from Validation to Closing.', 640, 260);
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '22px sans-serif';
                        ctx.fillText('Built with AI Outreach Studio & MarketVibe', 640, 320);
                        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                        ctx.beginPath();
                        ctx.roundRect(140, 380, 480, 80, 16);
                        ctx.fill();
                        ctx.strokeStyle = '#6366f1'; ctx.stroke();
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 35px sans-serif';
                        ctx.fillText('marketvibe1.com', 380, 425);
                        ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
                        ctx.beginPath();
                        ctx.roundRect(660, 380, 480, 80, 16);
                        ctx.fill();
                        ctx.strokeStyle = '#a855f7'; ctx.stroke();
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 35px sans-serif';
                        ctx.fillText('outreachstudio.ai', 900, 425);
                    }
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

    const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
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
    }

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
            <canvas ref={canvasRef} width={width} height={height} style={{ width: `${width}px`, height: `${height}px`, border: '1px solid #1e293b', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} />
        </div>
    );
};

export default VideoPreview;
