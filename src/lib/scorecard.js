/**
 * Generates a viral scorecard image from project data using HTML5 Canvas.
 * No external dependencies required.
 */
export const generateScorecard = async (projectData) => {
    const { name, results } = projectData;
    const { revenueForecast, landingPage } = results;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient (Sleek Dark Mode)
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#0f172a'); // Slate 900
    gradient.addColorStop(1, '#1e1b4b'); // Indigo 950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // 2. Subtle Grid Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1200; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 630);
        ctx.stroke();
    }
    for (let j = 0; j < 630; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(1200, j);
        ctx.stroke();
    }

    // 3. Branding
    ctx.fillStyle = '#6366f1'; // Indigo 500
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillText('MARKETVIBE', 60, 80);

    // 4. "VALIDATED" Status Stamp
    ctx.rotate(-0.05);
    ctx.fillStyle = '#10b981'; // Emerald 500
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('✓ PROTOCOL VALIDATED', 850, 90);
    ctx.resetTransform();

    // 5. Project Name & Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Inter, sans-serif';
    const displayName = (name || 'New Project').toUpperCase();
    ctx.fillText(displayName, 60, 200);

    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.font = '32px Inter, sans-serif';
    const displayHeadline = landingPage.headline.length > 50
        ? landingPage.headline.substring(0, 50) + '...'
        : landingPage.headline;
    ctx.fillText(displayHeadline, 60, 260);

    // 6. Metrics Cards (The "Meat")
    const drawCard = (x, y, label, value, color) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.roundRect(x, y, 520, 200, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(label, x + 40, y + 60);

        ctx.fillStyle = color;
        ctx.font = 'bold 72px Inter, sans-serif';
        ctx.fillText(value, x + 40, y + 140);
    };

    drawCard(60, 340, 'EST. YEAR 1 REVENUE', `$${revenueForecast.estimatedAnnualRevenue}`, '#10b981');
    drawCard(620, 340, 'TARGET MARKET SIZE', revenueForecast.totalAddressableMarket, '#ffffff');

    // 7. Footer / CTA
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('Validate your idea at marketvibe1.com', 60, 580);

    return canvas.toDataURL('image/png');
};
