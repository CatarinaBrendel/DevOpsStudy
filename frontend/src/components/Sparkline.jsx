// components/Sparkline.jsx
function catmullRom2bezier(points, step, padX, normY) {
  if (points.length < 2) return "";

  let d = `M ${padX} ${normY(points[0])}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i !== points.length - 2 ? points[i + 2] : p2;

    const x1 = padX + (i - 1 < 0 ? 0 : i - 1) * step;
    const x2 = padX + i * step;
    const x3 = padX + (i + 1) * step;
    const x4 = padX + (i + 2 >= points.length ? i + 1 : i + 2) * step;

    const y1 = normY(p0);
    const y2 = normY(p1);
    const y3 = normY(p2);
    const y4 = normY(p3);

    const cp1x = x2 + (x3 - x1) / 6;
    const cp1y = y2 + (y3 - y1) / 6;
    const cp2x = x3 - (x4 - x2) / 6;
    const cp2y = y3 - (y4 - y2) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x3} ${y3}`;
  }

  return d;
}

export default function Sparkline({
  points = [],
  status = "up",
  width = 96,
  height = 24
}) {
  if (!points || points.length < 2) return null;

  const padX = 2, padY = 2;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(1, max - min);
  const step = (width - padX * 2) / (points.length - 1);
  const normY = v =>
    (height - padY) - ((v - min) / span) * (height - padY * 2);

  const pathD = catmullRom2bezier(points, step, padX, normY);

  const color =
    status.toLowerCase() === "down"
      ? "#ef4444"
      : status.toLowerCase() === "unknown"
      ? "#f59e0b"
      : "#22c55e";

  const lastX = padX + (points.length - 1) * step;
  const lastY = normY(points[points.length - 1]);

  return (
    <svg width={width} height={height} className="sparkline">
      <defs>
        <linearGradient id={`spark-gradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>

      <path
        d={pathD}
        fill="none"
        stroke={`url(#spark-gradient-${status})`}
        strokeWidth={1.5} // thinner
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}
