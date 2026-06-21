import { cn } from "@/lib/utils";

export function OrderScanIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="100%"
      viewBox="0 0 680 480"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
    >
      <defs>
        <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#F5A623" stopOpacity={0.08} />
        </linearGradient>
      </defs>

      <rect
        x={40}
        y={40}
        width={600}
        height={400}
        rx={24}
        fill="url(#bgGlow)"
      />

      {/* Document / order note */}
      <g transform="translate(190,120)">
        <rect
          x={0}
          y={0}
          width={180}
          height={240}
          rx={10}
          fill="#FFFFFF"
          stroke="#E8E4F0"
          strokeWidth={1.5}
          transform="rotate(-4 90 120)"
        />
        <g transform="rotate(-4 90 120)">
          <line x1={24} y1={36} x2={120} y2={36} stroke="#D8D3E8" strokeWidth={3} strokeLinecap="round" />
          <line x1={24} y1={56} x2={156} y2={56} stroke="#E8E4F0" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={24} y1={72} x2={140} y2={72} stroke="#E8E4F0" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={24} y1={88} x2={150} y2={88} stroke="#E8E4F0" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={24} y1={116} x2={100} y2={116} stroke="#D8D3E8" strokeWidth={3} strokeLinecap="round" />
          <line x1={24} y1={136} x2={156} y2={136} stroke="#E8E4F0" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={24} y1={152} x2={128} y2={152} stroke="#E8E4F0" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={24} y1={180} x2={90} y2={180} stroke="#D8D3E8" strokeWidth={3} strokeLinecap="round" />
          <line x1={24} y1={200} x2={146} y2={200} stroke="#E8E4F0" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </g>

      {/* Phone with scan frame */}
      <g transform="translate(355,95)">
        <rect x={0} y={0} width={150} height={270} rx={22} fill="#0D0B1A" />
        <rect x={8} y={8} width={134} height={254} rx={16} fill="#171328" />
        <rect x={55} y={14} width={40} height={6} rx={3} fill="#0D0B1A" />

        {/* Scan frame */}
        <rect
          x={22}
          y={40}
          width={106}
          height={140}
          rx={8}
          fill="none"
          stroke="#F5A623"
          strokeWidth={2}
          strokeDasharray="6 5"
        />
        <line x1={22} y1={65} x2={34} y2={40} stroke="#F5A623" strokeWidth={2} strokeLinecap="round" />
        <line x1={128} y1={65} x2={116} y2={40} stroke="#F5A623" strokeWidth={2} strokeLinecap="round" />
        <rect x={22} y={63} width={106} height={3} fill="#F5A623" opacity={0.85} />

        {/* Scan success check */}
        <g transform="translate(96,196)">
          <circle cx={0} cy={0} r={20} fill="#7C3AED" />
          <path
            d="M -8 0 L -2 6 L 8 -7"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Progress bar */}
        <rect x={22} y={226} width={106} height={10} rx={5} fill="#2A2640" />
        <rect x={22} y={226} width={70} height={10} rx={5} fill="#F5A623" />
      </g>

      {/* Decorative sparkles */}
      <g transform="translate(120,90)">
        <circle cx={0} cy={0} r={16} fill="#F5A623" />
        <path
          d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z"
          fill="#0D0B1A"
        />
      </g>
      <g transform="translate(545,375)">
        <circle cx={0} cy={0} r={11} fill="#7C3AED" />
        <path
          d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}
