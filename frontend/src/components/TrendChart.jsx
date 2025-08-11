import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  LineElement, PointElement, LinearScale, TimeScale,
  Tooltip, Filler, CategoryScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Filler);

export default function TrendChart({ points = [], height = 160 }) {
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
          title: (items) => {
            const ts = items?.[0]?.parsed?.x;
            return new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            }).format(ts);
          },
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
    let border = 'rgba(220,53,69,1)';

    return {
      labels: data.labels,
      datasets: [{
        data: points.map(p => ({x: new Date(p.t).getTime(), y: Number(p.ms ?? 0)})),
        backgroundColor: (ctx) => {
          const {chart} = ctx;
          const {ctx: c, chartArea} = chart || {};
          if (!chartArea) {
            return ''
          }
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(220,53,69,0.25)');
          g.addColorStop(1, 'rgba(220,53,69,0.0)');
          return g;
        },
        borderColor: border,
        fill: true,
        borderWidth: 2,
        tension: 0.35,     // smooth curve
        spanGaps: true
      }]
    };
  }, [points]);

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
