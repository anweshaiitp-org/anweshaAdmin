'use client';
import React from 'react';
import QRCode from 'react-qr-code';

type TicketScheme = {
    base0: string;
    base1: string;
    base2: string;
    gold: string;
    goldSoft: string;
    cream: string;
    passLabel: string;
    pills: readonly string[];
    tintColor: string;
    scrim: readonly [number, number, number];
    stub: readonly [number, number];
};

type SchemeName = 'garbha' | 'garbha_stay';

const SCHEMES = {
    garbha: {
        base0: "#4A0F28", base1: "#6E1638", base2: "#8C2A4C",
        gold: "#D9A94E", goldSoft: "#F0CE8F", cream: "#F7ECD8",
        passLabel: "GARBA NIGHT", pills: ["GARBA NIGHT"],
        tintColor: "#5A1230", scrim: [0.0, 0.22, 0.38], stub: [0.08, 0.32]
    },
    garbha_stay: {
        base0: "#0D1730", base1: "#17223B", base2: "#223A5E",
        gold: "#D9A94E", goldSoft: "#F0CE8F", cream: "#F2EFE2",
        passLabel: "GARBA NIGHT + STAY", pills: ["GARBA NIGHT", "OVERNIGHT STAY"],
        tintColor: "#0D1730", scrim: [0.0, 0.45, 0.7], stub: [0.2, 0.6]
    }
};

function fitFont(
    text: string,
    base: number,
    maxWidth: number,
    minSize = 10,
): number {
    if (!text) return base;

    const needed = text.length * base * 0.58;

    if (needed <= maxWidth) return base;

    return Math.max(
        minSize,
        +(maxWidth / (text.length * 0.58)).toFixed(1),
    );
}

function clip(text: string, maxChars: number): string {
    return text.length > maxChars
        ? text.slice(0, maxChars - 1).trimEnd() + '…'
        : text;
}

interface TicketProps {
    name: string;
    anweshaId: string;
    qrToken: string;
    scheme: SchemeName;
    college?: string;
    venue?: string;
    time?: string;
}

const TicketSVG = React.forwardRef<SVGSVGElement, TicketProps>(
    function TicketSVG(
        {
            name,
            anweshaId,
            qrToken,
            scheme,
            college,
            venue = 'K.K. Arena, IIT Patna',
            time = '7:00 PM Onwards',
        },
        ref,
    ) {
        const s = SCHEMES[scheme];
        const uid = React.useId().replace(/:/g, '');

        // Keep the rest of your existing component here.
    const backgroundHref = scheme === 'garbha_stay'
        ? '/ticket/background_blue.png'
        : '/ticket/background_red.png';

    const nameText = clip(name || '', 40);
    const nameSize = fitFont(nameText, 22, 285, 13);

    const collegeText = clip(college?.trim() || '—', 52);
    const collegeSize = fitFont(collegeText, 13, 270, 9.5);

    const label = { fontFamily: "'Poppins', sans-serif", fontWeight: 600, letterSpacing: 2, fill: s.goldSoft, opacity: 0.9 };

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <svg
                ref={ref}
                viewBox="0 0 900 380"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label={`Entry pass for ${name}, ${s.passLabel}`}
                style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '22px', boxShadow: '0 18px 40px -14px rgba(0,0,0,0.6)' }}
            >
                <defs>
                    <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="900" y2="380" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={s.base1} />
                        <stop offset="55%" stopColor={s.base0} />
                        <stop offset="100%" stopColor={s.base2} />
                    </linearGradient>
                    {/* Darkens the stub so the white QR plate pops on any background art */}
                    <linearGradient id={`stub-${uid}`} x1="660" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={s.tintColor} stopOpacity={s.stub[0]} />
                        <stop offset="100%" stopColor={s.tintColor} stopOpacity={s.stub[1]} />
                    </linearGradient>
                    {/* Soft scrim under the left info block: fades in from the artwork downward */}
                    <linearGradient id={`info-${uid}`} x1="0" y1="190" x2="0" y2="380" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={s.tintColor} stopOpacity={s.scrim[0]} />
                        <stop offset="45%" stopColor={s.tintColor} stopOpacity={s.scrim[1]} />
                        <stop offset="100%" stopColor={s.tintColor} stopOpacity={s.scrim[2]} />
                    </linearGradient>
                    <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
                    </filter>
                    <mask id={`mask-${uid}`}>
                        <rect x="0" y="0" width="900" height="380" rx="22" fill="#fff" />
                        <circle cx="660" cy="0" r="18" fill="#000" />
                        <circle cx="660" cy="380" r="18" fill="#000" />
                    </mask>
                </defs>

                <g mask={`url(#mask-${uid})`}>
                    <rect x="0" y="0" width="900" height="380" rx="22" fill={`url(#bg-${uid})`} />
                    <image href={backgroundHref} x="0" y="0" width="900" height="380" preserveAspectRatio="none" />

                    {/* Faint diagonal weave texture */}
                    <g opacity="0.05" stroke={s.cream} strokeWidth="1">
                        {Array.from({ length: 14 }).map((_, i) => (
                            <line key={i} x1={-40 + i * 70} y1="0" x2={40 + i * 70} y2="380" />
                        ))}
                    </g>

                    {/* Stub tint for contrast */}
                    <rect x="660" y="0" width="240" height="380" fill={`url(#stub-${uid})`} />

                    {/* Left info scrim */}
                    <rect x="0" y="190" width="660" height="190" fill={`url(#info-${uid})`} />

                    {/* Seam perforation */}
                    <line x1="660" y1="30" x2="660" y2="350" stroke={s.gold} strokeWidth="1.5" strokeDasharray="5 6" opacity="0.65" />

                    {/* Logo */}
                    <image href="/ticket/anwesha-logo.png" x="46" y="24" width="190" height="58" preserveAspectRatio="xMinYMid meet" />

                    {/* Garba Night artwork */}
                    <image href="/ticket/garba.png" x="135" y="58" width="230" height="150" preserveAspectRatio="none" />
                    <image href="/ticket/night.png" x="365" y="90" width="230" height="86" preserveAspectRatio="none" />

                    {/* Rule with ornament */}
                    <svg x="46" y="204" width="568" height="18" viewBox="63 250 2274 102" preserveAspectRatio="none">
                        <image href="/ticket/border.png" x="0" y="0" width="2400" height="600" />
                    </svg>

                    {/* Venue + Time */}
                    <text x="46" y="233" {...label} fontSize="9">VENUE</text>
                    <text x="46" y="253" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="14" fill={s.cream}>{venue}</text>

                    <text x="340" y="233" {...label} fontSize="9">TIME</text>
                    <text x="340" y="253" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="14" fill={s.cream}>{time}</text>

                    {/* Row 1: Pass holder | Anwesha ID */}
                    <text x="46" y="286" {...label} fontSize="9.5">PASS HOLDER</text>
                    <text x="46" y="310" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize={nameSize} fill={s.cream}>{nameText}</text>

                    <text x="340" y="286" {...label} fontSize="9.5">ANWESHA ID</text>
                    <text x="340" y="310" fontFamily="'JetBrains Mono', monospace" fontWeight="600" fontSize="17" fill={s.cream}>{anweshaId}</text>

                    {/* Row 2: Pass type | College */}
                    <text x="46" y="332" {...label} fontSize="9.5">PASS TYPE</text>

                    {s.pills.map((pill:string, idx:number) => {
                        const startX = 46 + (idx * 130);
                        const w = 26 + pill.length * 7.4;
                        return (
                            <g key={idx}>
                                <rect x={startX} y={340} width={w} height="26" rx="13" fill={s.gold} />
                                <text x={startX + w / 2} y={357} textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" letterSpacing="1" fill={s.base0}>{pill}</text>
                            </g>
                        );
                    })}

                    <text x="340" y="332" {...label} fontSize="9.5">COLLEGE</text>
                    <text x="340" y="357" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize={collegeSize} fill={s.cream}>{collegeText}</text>

                    {/* Right stub */}
                    <text x="780" y="40" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="10" letterSpacing="2.2" fill={s.goldSoft}>SCAN TO VERIFY</text>
                    <line x1="740" y1="50" x2="820" y2="50" stroke={s.gold} strokeWidth="1" opacity="0.6" />

                    {/* QR plate: pure white, near-black modules, works on red and blue */}
                    <rect x="675" y="60" width="210" height="210" rx="14" fill="#FFFFFF" stroke={s.gold} strokeWidth="2.5" filter={`url(#shadow-${uid})`} />
                    {/* <QRCode x={690} y={75} value={qrToken} size={180} bgColor="#FFFFFF" fgColor="#0A0A0A" level="M" /> */}
                    <g transform="translate(690 75)">
    <QRCode
        value={qrToken}
        size={180}
        bgColor="#FFFFFF"
        fgColor="#0A0A0A"
        level="M"
    />
</g>
                    {/* Stamp ornament */}
                    <g opacity="0.85" fill={s.gold}>
                        <circle cx="780" cy="304" r="4.5" />
                        {Array.from({ length: 6 }).map((_, i) => {
                            const ang = i * (Math.PI * 2 / 6);
                            return <circle key={i} cx={(780 + 13 * Math.cos(ang)).toFixed(1)} cy={(304 + 13 * Math.sin(ang)).toFixed(1)} r="3.2" />;
                        })}
                    </g>

                    <text x="780" y="340" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9" letterSpacing="2" fill={s.goldSoft}>OFFICIAL ENTRY PASS</text>
                    <text x="893" y="190" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="500" fontSize="9" letterSpacing="2.2" fill={s.goldSoft} opacity="0.6" transform="rotate(90 893 190)">{s.passLabel}</text>
                </g>
                {/* Border that follows the two semicircle notches */}
                <path
                    d="M 22.25 1.25
                       H 640.79
                       A 19.25 19.25 0 0 0 679.21 1.25
                       H 877.75
                       A 21 21 0 0 1 898.75 22.25
                       V 357.75
                       A 21 21 0 0 1 877.75 378.75
                       H 679.21
                       A 19.25 19.25 0 0 0 640.79 378.75
                       H 22.25
                       A 21 21 0 0 1 1.25 357.75
                       V 22.25
                       A 21 21 0 0 1 22.25 1.25 Z"
                    fill="none"
                    stroke={s.gold}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    opacity="0.85"
                />
            </svg>
        </div>
    );
});

export default TicketSVG;