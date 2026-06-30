import React, { useState, useMemo } from 'react';
import type { Transaction } from '../services/dbService';
import { currencyService, type CurrencyCode } from '../services/currency';

interface SvgTrendChartProps {
  transactions: Transaction[];
  primaryCurrency: CurrencyCode;
}

export const SvgTrendChart: React.FC<SvgTrendChartProps> = ({ transactions, primaryCurrency }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Process data: 7 days historical + 3 days projected
  const chartPoints = useMemo(() => {
    const points: { dateLabel: string; amount: number; isForecast: boolean }[] = [];
    const now = new Date();
    
    // 1. Generate last 7 days of historical data
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      points.push({ dateLabel, amount: 0, isForecast: false });
      
      // Sum historical expenses
      const expenses = transactions.filter(t => t.type === 'expense' && t.date.split('T')[0] === dateStr);
      points[6 - i].amount = expenses.reduce((sum, t) => sum + t.amount, 0);
    }

    // 2. Compute Velocity (Average daily spend) & Slope for forecasting
    const historicalAmounts = points.map(p => p.amount);
    const averageVelocity = historicalAmounts.reduce((sum, val) => sum + val, 0) / 7;
    
    // Simple slope calculation (linear trend of last 3 days)
    const slope = ((historicalAmounts[6] - historicalAmounts[4]) / 2) || 0;

    // 3. Project next 3 days
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short' }) + ' (F)';
      
      // Forecasting formula: baseline velocity + trend slope + organic fluctuation
      const fluctuation = Math.sin(i * 1.5) * (averageVelocity * 0.15);
      const projectedAmount = Math.max(0, averageVelocity + (slope * 0.25 * i) + fluctuation);

      points.push({
        dateLabel,
        amount: Math.round(projectedAmount * 100) / 100,
        isForecast: true,
      });
    }

    return points;
  }, [transactions]);

  const maxAmount = useMemo(() => {
    const max = Math.max(...chartPoints.map(p => p.amount));
    return max > 0 ? max : 100;
  }, [chartPoints]);

  // Chart Dimensions
  const width = 500;
  const height = 180;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate coordinates
  const pointsCoords = useMemo(() => {
    return chartPoints.map((p, index) => {
      const x = padding + (index / (chartPoints.length - 1)) * chartWidth;
      const ratio = p.amount / maxAmount;
      const y = padding + chartHeight - ratio * chartHeight;
      return { x, y, ...p };
    });
  }, [chartPoints, maxAmount, chartWidth, chartHeight]);

  // Split into Historical and Forecast paths
  const historicalCoords = useMemo(() => pointsCoords.filter(p => !p.isForecast), [pointsCoords]);
  const forecastCoords = useMemo(() => {
    // Include the last historical point so the forecast line connects continuously
    const lastHist = pointsCoords[6];
    return [lastHist, ...pointsCoords.filter(p => p.isForecast)];
  }, [pointsCoords]);

  // Build SVG Path helper
  const getCurvePath = (coords: typeof pointsCoords) => {
    if (coords.length === 0) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const historicalPathD = useMemo(() => getCurvePath(historicalCoords), [historicalCoords]);
  const forecastPathD = useMemo(() => getCurvePath(forecastCoords), [forecastCoords]);

  // Full closed path for gradient fill under the entire curve
  const fillD = useMemo(() => {
    if (pointsCoords.length === 0) return '';
    const fullPathD = getCurvePath(pointsCoords);
    const first = pointsCoords[0];
    const last = pointsCoords[pointsCoords.length - 1];
    return `${fullPathD} L ${last.x} ${padding + chartHeight} L ${first.x} ${padding + chartHeight} Z`;
  }, [pointsCoords, chartHeight]);

  return (
    <div className="glass rounded-3xl p-6 flex flex-col justify-between h-full min-h-[340px] relative overflow-hidden">
      
      <div className="w-full flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Outflow Velocity</h3>
          <p className="text-text-muted text-xs mt-0.5">7-Day Trend & 3-Day AI Forecast</p>
        </div>
        <span className="text-xs bg-secondary/15 text-secondary border border-secondary/30 rounded-full px-2.5 py-0.5 font-bold animate-pulse">
          AI Forecast Active
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-end w-full relative">
        
        {/* Interactive Tooltip Overlay */}
        {hoveredPoint !== null && (
          <div 
            className="absolute bg-surface-elevated border border-white/10 rounded-xl px-3 py-2 shadow-2xl z-10 pointer-events-none"
            style={{
              left: Math.min(pointsCoords[hoveredPoint].x - 50, width - 130),
              top: Math.max(pointsCoords[hoveredPoint].y - 55, 5),
            }}
          >
            <p className="text-text-muted text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
              {pointsCoords[hoveredPoint].isForecast && (
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
              )}
              {pointsCoords[hoveredPoint].dateLabel}
            </p>
            <p className="text-white text-xs font-black mt-0.5">
              {currencyService.format(pointsCoords[hoveredPoint].amount, primaryCurrency)}
            </p>
            {pointsCoords[hoveredPoint].isForecast && (
              <span className="text-secondary text-[8px] font-bold block uppercase mt-0.5">Predicted Outflow</span>
            )}
          </div>
        )}

        {/* SVG Chart */}
        <div className="w-full h-[180px]">
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="glow-mint" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradient fill under the line */}
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#39FF14" stopOpacity="0.15" />
                <stop offset="70%" stopColor="#00F5FF" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + chartHeight * ratio;
              return (
                <line
                  key={i}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Gradient Fill under Curve */}
            {fillD && (
              <path d={fillD} fill="url(#chartGradient)" />
            )}

            {/* Historical Solid Line (Neon Mint) */}
            {historicalPathD && (
              <path
                d={historicalPathD}
                fill="none"
                stroke="#39FF14"
                strokeWidth="2.5"
                filter="url(#glow-mint)"
              />
            )}

            {/* Forecast Dashed Line (Electric Cyan) */}
            {forecastPathD && (
              <path
                d={forecastPathD}
                fill="none"
                stroke="#00F5FF"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                filter="url(#glow-cyan)"
              />
            )}

            {/* Vertical Guide Line on Hover */}
            {hoveredPoint !== null && (
              <line
                x1={pointsCoords[hoveredPoint].x}
                y1={padding}
                x2={pointsCoords[hoveredPoint].x}
                y2={padding + chartHeight}
                stroke={pointsCoords[hoveredPoint].isForecast ? "rgba(0, 245, 255, 0.25)" : "rgba(57, 255, 20, 0.25)"}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )}

            {/* Interactive Circles */}
            {pointsCoords.map((pt, index) => {
              const isHovered = hoveredPoint === index;
              const dotColor = pt.isForecast ? '#00F5FF' : '#39FF14';
              return (
                <g key={index}>
                  {/* Invisible larger hover trigger area */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="16"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Visible point circle */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? '5' : '3'}
                    fill={isHovered ? '#FFFFFF' : dotColor}
                    stroke="#09090A"
                    strokeWidth="1.5"
                    className="pointer-events-none transition-all duration-200"
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 5px ${dotColor})` : 'none',
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* X Axis Labels */}
        <div className="flex justify-between px-2 mt-2 border-t border-white/5 pt-3">
          {chartPoints.map((p, idx) => (
            <span 
              key={idx} 
              className={`text-[8px] font-semibold uppercase tracking-wider ${
                p.isForecast ? 'text-secondary/75' : 'text-text-muted'
              }`}
            >
              {p.dateLabel.split(' ')[0]}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SvgTrendChart;
