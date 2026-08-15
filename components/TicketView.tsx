'use client';
import React from 'react';
import QRCode from 'react-qr-code';

interface TicketProps {
    name: string;
    anweshaId: string;
    qrToken: string;
    scheme: 'garbha' | 'garbha_stay';
    venue?: string;
    time?: string;
}

const SCHEMES = {
    garbha: {
        base0: "#4A0F28", base1: "#6E1638", base2: "#8C2A4C",
        gold: "#D9A94E", goldSoft: "#F0CE8F", cream: "#F7ECD8",
        passLabel: "GARBHA NIGHT", pills: ["GARBHA NIGHT"]
    },
    garbha_stay: {
        base0: "#0D1730", base1: "#17223B", base2: "#223A5E",
        gold: "#D9A94E", goldSoft: "#F0CE8F", cream: "#F2EFE2",
        passLabel: "GARBHA NIGHT + STAY", pills: ["GARBHA NIGHT", "OVERNIGHT STAY"]
    }
};

const LOGO_PATH = "M63.4592 6.06908C63.6684 17.6111 63.5236 20.8904 62.5548 26.531C60.9006 36.1641 57.9489 43.3949 52.8675 50.2625C51.6513 51.9064 48.5049 55.6619 47.9756 56.1018C47.139 56.7968 41.3847 57.6724 36.3078 57.877C31.2812 58.0796 24.6609 57.027 19.6261 55.225C15.0922 53.6021 11.321 51.3629 8.02116 48.3346C6.32729 46.7799 3.85582 43.9448 2.85805 42.4118C2.62517 42.054 2.17868 41.4777 1.86578 41.1313C1.55287 40.7849 1.24166 40.3176 1.17413 40.0926C1.02593 39.5993 0 38.5406 0 38.881C0 39.5946 1.14068 41.6924 2.95183 44.3093C6.17381 48.9645 11.9485 54.0599 17.1413 56.8286C20.0442 58.3766 24.5079 59.8894 27.6278 60.3829C31.6282 61.0156 36.5623 61.2173 39.9426 60.8863C42.4492 60.641 43.1883 60.6915 43.1883 61.1082C43.1883 61.432 36.2758 68.3 32.1683 72.0576C23.5241 79.9648 21.1707 82.2787 21.1707 82.87C21.1707 83.0889 21.4989 83.3906 21.9646 83.5995C22.6205 83.8938 23.6418 83.953 27.8395 83.9407C36.829 83.9143 40.3448 84.3694 44.2261 86.0616C49.4895 88.3564 52.2993 92.021 52.3734 96.6881C52.3867 97.5214 52.4689 98.2032 52.5563 98.2032C52.6438 98.2034 52.7151 97.972 52.7151 97.6891C52.7151 97.4062 52.8212 97.0627 52.951 96.9256C53.2827 96.5752 53.5024 93.3715 53.2774 92.1655C52.9463 90.391 50.7748 87.3546 48.3751 85.3106C44.8534 82.3109 38.4695 79.8588 32.7632 79.3139C31.8615 79.2278 31.078 79.0791 31.0221 78.9836C30.9662 78.8881 32.037 77.8147 33.4015 76.5986C36.9891 73.4007 41.4451 68.8725 47.383 62.3913L49.5632 60.0115L51.6155 59.6387C55.0515 59.0146 60.0967 57.718 62.6457 56.804C65.643 55.729 65.9237 55.7183 66.258 56.6647C67.0752 58.9786 67.6796 60.3534 68.3776 61.4852C70.5083 64.94 75.0693 67.9534 79.6676 68.9438C82.189 69.4872 85.8431 69.4289 87.9644 68.8117C91.802 67.6951 94.9295 64.8673 96.8364 60.7899C97.9927 58.3168 98.3268 56.8024 98.1649 54.7641C97.9349 51.8652 96.4941 49.6137 93.7027 47.7909C88.9662 44.6984 83.5746 45.0061 72.2093 49.0178C70.0851 49.7676 68.2239 50.3311 68.0736 50.2703C67.5638 50.0637 66.6645 45.1933 66.0438 39.2777C65.6566 35.5865 65.4315 31.7126 64.9979 21.2757C64.6723 13.4331 64.1467 6.01116 63.5092 0.254777C63.3938 -0.787772 63.375 1.41205 63.4592 6.06908ZM62.7949 41.7537C62.9243 42.2367 63.2412 43.7894 63.4988 45.2038C63.7565 46.6183 64.1602 48.6159 64.3961 49.643C64.652 50.7585 64.7473 51.5919 64.6328 51.7129C64.0999 52.2758 55.3227 55.0434 54.0702 55.0434C53.6595 55.0434 53.9716 54.4027 55.05 53.0308C56.6139 51.0416 59.8321 45.7139 60.962 43.2433C61.5958 41.8575 62.2146 40.7577 62.337 40.7995C62.4594 40.8411 62.6653 41.2704 62.7949 41.7537ZM85.1508 51.8941C89.7833 52.4077 92.3277 56.0649 90.1892 59.1362C89.5323 60.0799 87.8206 61.5362 86.5927 62.1959C85.4218 62.8252 83.0225 63.501 81.4014 63.6584C77.6695 64.0207 73.6019 62.2721 71.4897 59.3976C70.515 58.0715 69.1385 55.1657 69.2888 54.752C69.3475 54.5906 70.4297 54.1402 71.6936 53.7513C77.4156 51.9909 81.2507 51.4616 85.1508 51.8941Z";

export default function TicketSVG({ 
    name, anweshaId, qrToken, scheme, 
    venue = "Fest Arena, IIT Patna", 
    time = "7:00 PM Onwards" 
}: TicketProps) {
    const s = SCHEMES[scheme];
    const uid = React.useId();

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '22px', boxShadow: '0 18px 40px -14px rgba(0,0,0,0.6)' }}>
                <defs>
                    <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="900" y2="380" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={s.base1} />
                        <stop offset="55%" stopColor={s.base0} />
                        <stop offset="100%" stopColor={s.base2} />
                    </linearGradient>
                    <linearGradient id={`titleGold-${uid}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={s.goldSoft} />
                        <stop offset="100%" stopColor={s.gold} />
                    </linearGradient>
                    <mask id={`mask-${uid}`}>
                        <rect x="0" y="0" width="900" height="380" fill="#fff" />
                        <circle cx="660" cy="0" r="18" fill="#000" />
                        <circle cx="660" cy="380" r="18" fill="#000" />
                    </mask>
                </defs>

                <g mask={`url(#mask-${uid})`}>
                    <rect x="0" y="0" width="900" height="380" rx="22" fill={`url(#bg-${uid})`} />

                    {/* Faint diagonal weave texture */}
                    <g opacity="0.05" stroke={s.cream} strokeWidth="1">
                        {Array.from({ length: 14 }).map((_, i) => (
                            <line key={i} x1={-40 + i * 70} y1="0" x2={40 + i * 70} y2="380" />
                        ))}
                    </g>

                    {/* Seam perforation */}
                    <line x1="660" y1="30" x2="660" y2="350" stroke={s.gold} strokeWidth="1.5" strokeDasharray="5 6" opacity="0.55" />

                    {/* Mandala Motif */}
                    <g opacity="0.07" stroke={s.gold} fill="none">
                        {[48, 76, 104, 132].map(r => <circle key={r} cx="560" cy="190" r={r} strokeWidth="1" />)}
                        {Array.from({ length: 18 }).map((_, i) => {
                            const ang = i * (Math.PI * 2 / 18);
                            return <circle key={i} cx={(560 + 132 * Math.cos(ang)).toFixed(1)} cy={(190 + 132 * Math.sin(ang)).toFixed(1)} r="2.6" fill={s.gold} stroke="none" />
                        })}
                    </g>

                    {/* Dancer Silhouette */}
                    <g transform="translate(560,250) scale(1.5)" opacity="0.16" fill={s.gold} stroke={s.gold}>
                        <circle cx="0" cy="-92" r="11" stroke="none" />
                        <path d="M -6,-80 C -10,-50 -8,-30 -34,10 C -14,26 14,26 34,10 C 8,-30 10,-50 6,-80 Z" stroke="none" />
                        <path d="M -6,-78 C -26,-95 -40,-110 -50,-128" fill="none" strokeWidth="7" strokeLinecap="round" />
                        <line x1="-50" y1="-128" x2="-66" y2="-150" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="-66" cy="-150" r="3.4" stroke="none" />
                        <path d="M 6,-78 C 28,-64 46,-46 58,-22" fill="none" strokeWidth="7" strokeLinecap="round" />
                        <line x1="58" y1="-22" x2="76" y2="-4" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="76" cy="-4" r="3.4" stroke="none" />
                    </g>

                    {/* Logo + wordmark */}
                    <g transform="translate(46,28) scale(0.42)">
                        <path d={LOGO_PATH} fill={s.gold} />
                    </g>
                    <text x="90" y="49" fontFamily="'Playfair Display', serif" fontWeight="800" fontSize="25" letterSpacing="1.5" fill={s.cream}>Anwesha</text>
                    <text x="90" y="66" fontFamily="'Poppins', sans-serif" fontWeight="500" fontSize="9.5" letterSpacing="1.8" fill={s.gold} opacity="0.9">INDIAN INSTITUTE OF TECHNOLOGY, PATNA</text>

                    {/* Hero title */}
                    <text x="44" y="146" fontFamily="'Yatra One', cursive" fontSize="50" fill={s.cream}>GARBHA</text>
                    <text x="44" y="194" fontFamily="'Yatra One', cursive" fontSize="50" fill={`url(#titleGold-${uid})`}>NIGHT</text>

                    {/* Rule with ornament */}
                    <line x1="46" y1="213" x2="330" y2="213" stroke={s.gold} strokeWidth="1" opacity="0.55" />
                    <rect x="326" y="208" width="9" height="9" fill={s.gold} transform="rotate(45 330.5 212.5)" />
                    <line x1="341" y1="213" x2="614" y2="213" stroke={s.gold} strokeWidth="1" opacity="0.55" />

                    {/* Venue + Time */}
                    <text x="46" y="233" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9" letterSpacing="2" fill={s.gold} opacity="0.85">VENUE</text>
                    <text x="46" y="253" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="14" fill={s.cream}>{venue}</text>

                    <text x="360" y="233" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9" letterSpacing="2" fill={s.gold} opacity="0.85">TIME</text>
                    <text x="360" y="253" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="14" fill={s.cream}>{time}</text>

                    <line x1="46" y1="267" x2="614" y2="267" stroke={s.gold} strokeWidth="1" opacity="0.3" />

                    {/* Data Block */}
                    <text x="46" y="286" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9.5" letterSpacing="2" fill={s.gold} opacity="0.85">PASS HOLDER</text>
                    <text x="46" y="310" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="22" fill={s.cream}>{name}</text>

                    <text x="340" y="286" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9.5" letterSpacing="2" fill={s.gold} opacity="0.85">ANWESHA ID</text>
                    <text x="340" y="310" fontFamily="'JetBrains Mono', monospace" fontWeight="600" fontSize="17" fill={s.cream}>{anweshaId}</text>

                    <text x="46" y="332" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9.5" letterSpacing="2" fill={s.gold} opacity="0.85">PASS TYPE</text>
                    
                    {/* Dynamic Pills */}
                    {s.pills.map((label, idx) => {
                        const startX = 46 + (idx * 130); // Simple spacing calculation
                        const w = 26 + label.length * 7.4;
                        return (
                            <g key={idx}>
                                <rect x={startX} y={340} width={w} height="26" rx="13" fill={s.gold} />
                                <text x={startX + w / 2} y={357} textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" letterSpacing="1" fill={s.base0}>{label}</text>
                            </g>
                        );
                    })}

                    {/* Right stub: label, large QR, closing ornament */}
                    <text x="780" y="40" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="10" letterSpacing="2.2" fill={s.gold} opacity="0.9">SCAN TO VERIFY</text>
                    <line x1="740" y1="50" x2="820" y2="50" stroke={s.gold} strokeWidth="1" opacity="0.4" />

                    <rect x="675" y="60" width="210" height="210" rx="12" fill={s.cream} />
                    
                    {/* The Dynamic React QR Code! */}
                    <foreignObject x="690" y="75" width="180" height="180">
                        <QRCode value={qrToken} size={180} bgColor={s.cream} fgColor={s.base0} level="M" />
                    </foreignObject>

                    <line x1="715" y1="286" x2="845" y2="286" stroke={s.gold} strokeWidth="1" opacity="0.4" />

                    {/* Stamp Ornament */}
                    <g opacity="0.7" fill={s.gold}>
                        <circle cx="780" cy="315" r="4.5" />
                        {Array.from({ length: 6 }).map((_, i) => {
                            const ang = i * (Math.PI * 2 / 6);
                            return <circle key={i} cx={(780 + 13 * Math.cos(ang)).toFixed(1)} cy={(315 + 13 * Math.sin(ang)).toFixed(1)} r="3.2" />
                        })}
                    </g>
                    
                    <text x="780" y="343" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="8.5" letterSpacing="2" fill={s.gold} opacity="0.7">OFFICIAL ENTRY PASS</text>
                    <text x="893" y="190" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="500" fontSize="9" letterSpacing="2.2" fill={s.gold} opacity="0.5" transform="rotate(90 893 190)">{s.passLabel}</text>

                    {/* Bottom bandhani dot border */}
                    {Array.from({ length: Math.floor((878 - 22) / 15) }).map((_, i) => {
                        const x = 22 + i * 15;
                        if (x > 640 && x < 680) return null; // Clear seam
                        return <circle key={i} cx={x} cy="368" r="1.5" fill={s.gold} opacity="0.35" />
                    })}
                </g>
                <rect x="0.75" y="0.75" width="898.5" height="378.5" rx="21" fill="none" stroke={s.gold} strokeWidth="1.2" opacity="0.5" />
            </svg>
        </div>
    );
}