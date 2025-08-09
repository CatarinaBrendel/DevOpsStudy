import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  LineElement, PointElement, LinearScale, TimeSeriesScale,
  Tooltip, Filler, CategoryScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, TimeSeriesScale, CategoryScale, Tooltip, Filler);

export default function TrendChart({ points = [], height = 160 }) {
  const canvasRef = useRef(null);

  const data = useMemo(() => {
    // convert [{t, ms}] to Chart.js format
    const labels = points.map(p => new Date(p.t));
    const values = points.map(p => Number(p.ms ?? 0));
    return { labels, values };
  }, [points]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    elements: { point: { radius: 0 } },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: ctx => ctx[0]?.label ? new Date(ctx[0].label).toLocaleString() : '',
          label: ctx => `${ctx.parsed.y} ms`,
        }
      }
    },
    scales: {
      x: { display: false, grid: { display: false }, type: 'time' },
      y: { display: false, grid: { display: false } }
    }
  }), []);

  const chartData = useMemo(() => {
    // build gradient fill
    let bg = 'rgba(220,53,69,0.15)';   // Bootstrap danger w/ alpha
    let border = 'rgba(220,53,69,1)';

    // create vertical gradient if canvas ready
    let gradient = bg;
    const ctx = canvasRef.current?.getContext?.('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, 'rgba(220,53,69,0.25)');
      g.addColorStop(1, 'rgba(220,53,69,0.0)');
      gradient = g;
    }

    return {
      labels: data.labels,
      datasets: [{
        data: data.values,
        borderColor: border,
        backgroundColor: gradient,
        fill: true,
        borderWidth: 2,
        tension: 0.35,     // smooth curve
        spanGaps: true
      }]
    };
  }, [data, height]);

  return (
    <div style={{ height }}>
      <Line ref={canvasRef} data={chartData} options={options} />
    </div>
  );
}
