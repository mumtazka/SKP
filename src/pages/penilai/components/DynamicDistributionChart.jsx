import React from 'react';

const DynamicDistributionChart = ({ skp }) => {
    // 1. Calculate Counts to find DOMINANT category
    const counts = {
        'Sangat Kurang': 0,
        'Kurang/Misconduct': 0,
        'Butuh Perbaikan': 0,
        'Baik': 0,
        'Sangat Baik': 0
    };

    const allItems = [
        ...(skp.realisasi?.utama || []),
        ...(skp.realisasi?.tambahan || [])
    ];

    allItems.forEach(item => {
        if (!item || !item.rating) return;
        const r = item.rating.toLowerCase();

        if (r.includes('sangat buruk') || r.includes('sangat kurang')) counts['Sangat Kurang']++;
        else if (r.includes('buruk') || r.includes('kurang') || r.includes('misconduct')) counts['Kurang/Misconduct']++;
        else if (r.includes('cukup') || r.includes('butuh perbaikan')) counts['Butuh Perbaikan']++;
        else if (r.includes('sangat baik')) counts['Sangat Baik']++;
        else if (r.includes('baik')) counts['Baik']++;
    });

    // Find Dominant Category (Modus)
    let dominantCategory = 'Baik';
    let maxCount = -1;

    // Priority order in case of tie? Favors higher rating?
    // Let's iterate in order
    ['Sangat Baik', 'Baik', 'Butuh Perbaikan', 'Kurang/Misconduct', 'Sangat Kurang'].forEach(cat => {
        if (counts[cat] >= maxCount) { // Use >= to favor higher rating if tie? No, order is reverse.
            // If we want to favor "Sangat Baik" on tie, checking it first with > maxCount works.
            // If we check "Sangat Baik" first (count=5), max=5. Then "Baik" (count=5), not > 5. So "Sangat Baik" wins.
            // But wait, standard logic usually takes average.
            // Let's stick to simple max count for now as requested "Dominan".
        }
    });

    // Simple max check
    Object.entries(counts).forEach(([cat, count]) => {
        if (count > maxCount) {
            maxCount = count;
            dominantCategory = cat;
        }
    });

    // 2. Define Template Paths (Standardized Curves matching Guidelines)
    // Canvas: 600x150. Baseline y=120. Top y=10.
    // X Centers: SK(60), K(180), BP(300), B(420), SB(540)

    const templates = {
        'Sangat Baik': {
            // ISTIMEWA: Exponential Rise (True J-Curve: Flat then Shoot up)
            path: "M60,120 C400,120 480,100 540,10",
            fill: "M60,120 C400,120 480,100 540,10 L540,120 L60,120 Z",
            colorStops: [{ offset: "0%", color: "#22c55e" }, { offset: "100%", color: "#15803d" }] // Green
        },
        'Baik': {
            // BAIK: Skewed Right Bell (Peak at Baik)
            path: "M60,120 C300,120 360,20 420,20 C480,20 540,100 540,100",
            fill: "M60,120 C300,120 360,20 420,20 C480,20 540,100 540,100 L540,120 L60,120 Z",
            colorStops: [{ offset: "0%", color: "#3b82f6" }, { offset: "100%", color: "#1d4ed8" }] // Blue
        },
        'Butuh Perbaikan': {
            // BUTUH PERBAIKAN: Normal Bell (Peak at Center)
            path: "M60,120 C100,120 200,20 300,20 C400,20 500,120 540,120",
            fill: "M60,120 C100,120 200,20 300,20 C400,20 500,120 540,120 L540,120 L60,120 Z",
            colorStops: [{ offset: "0%", color: "#eab308" }, { offset: "100%", color: "#ca8a04" }] // Yellow
        },
        'Kurang/Misconduct': {
            // KURANG: Skewed Left Bell (Peak at Kurang)
            path: "M60,100 C60,100 120,20 180,20 C240,20 300,120 540,120",
            fill: "M60,100 C60,100 120,20 180,20 C240,20 300,120 540,120 L540,120 L60,120 Z",
            colorStops: [{ offset: "0%", color: "#f97316" }, { offset: "100%", color: "#c2410c" }] // Orange
        },
        'Sangat Kurang': {
            // SANGAT KURANG: Convex Exponential Decay (Drop sharp then flat)
            path: "M60,10 C100,90 200,120 540,120",
            fill: "M60,10 C100,90 200,120 540,120 L540,120 L60,120 Z",
            colorStops: [{ offset: "0%", color: "#ef4444" }, { offset: "100%", color: "#b91c1c" }] // Red
        }
    };

    const template = templates[dominantCategory] || templates['Baik'];

    // Points for X-Axis labels
    const points = [
        { x: 60, label: 'Sangat', label2: 'Kurang' },
        { x: 180, label: 'Kurang/', label2: 'Misconduct' },
        { x: 300, label: 'Butuh', label2: 'Perbaikan' },
        { x: 420, label: 'Baik', label2: '' },
        { x: 540, label: 'Sangat Baik', label2: '' },
    ];

    const height = 180; // Increased to accommodate labels
    const graphHeight = 120; // Keep baseline at 120 to match hardcoded templates
    const width = 600;

    return (
        <div className="flex justify-center w-full overflow-x-auto">
            <div className="min-w-[600px] px-4">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                    {/* Axis Line */}
                    <line x1="0" y1={graphHeight} x2={width} y2={graphHeight} stroke="#e5e7eb" strokeWidth="2" />

                    {/* Definitions */}
                    <defs>
                        <linearGradient id="gradientCurve" x1="0%" y1="0%" x2="100%" y2="0%">
                            {template.colorStops && template.colorStops.map((stop, i) => (
                                <stop key={i} offset={stop.offset} stopColor={stop.color} />
                            ))}
                            {!template.colorStops && (
                                <>
                                    <stop offset="0%" stopColor="#22c55e" />
                                    <stop offset="100%" stopColor="#22c55e" />
                                </>
                            )}
                        </linearGradient>
                        <linearGradient id="gradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                            {template.colorStops && template.colorStops.map((stop, i) => (
                                <stop key={i} offset={stop.offset} stopColor={stop.color} />
                            ))}
                        </linearGradient>
                    </defs>

                    {/* Area under curve */}
                    <path
                        d={template.fill}
                        fill="url(#gradientArea)"
                        opacity="0.15"
                    />

                    {/* Dynamic Curve */}
                    <path
                        d={template.path}
                        fill="none"
                        stroke="url(#gradientCurve)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Labels */}
                    <g className="text-xs font-medium fill-gray-500">
                        {points.map((p, i) => (
                            <React.Fragment key={i}>
                                <text x={p.x} y={graphHeight + 20} textAnchor="middle">{p.label}</text>
                                {p.label2 && <text x={p.x} y={graphHeight + 32} textAnchor="middle">{p.label2}</text>}
                            </React.Fragment>
                        ))}
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default DynamicDistributionChart;
