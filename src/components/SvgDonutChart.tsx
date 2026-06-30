import React, { useState, useMemo } from 'react';
import type { Transaction } from '../services/dbService';
import { currencyService, type CurrencyCode } from '../services/currency';

interface SvgDonutChartProps {
  transactions: Transaction[];
  primaryCurrency: CurrencyCode;
  onSelectCategory?: (category: string | null) => void;
}

const CATEGORIES: Record<string, { color: string; hoverColor: string }> = {
  Food: { color: '#00F5FF', hoverColor: '#66FAFF' },        // Electric Cyan
  Transport: { color: '#BD00FF', hoverColor: '#D966FF' },   // Velvet Purple
  Bills: { color: '#FFCC00', hoverColor: '#FFE066' },       // Neon Gold
  Entertainment: { color: '#FF2D55', hoverColor: '#FF738F' }, // Cyber Pink
  Salary: { color: '#39FF14', hoverColor: '#80FF66' },      // Neon Mint
  Other: { color: '#8E8E93', hoverColor: '#AEAEB2' },       // Steel Muted
};

export const SvgDonutChart: React.FC<SvgDonutChartProps> = ({ transactions, primaryCurrency, onSelectCategory }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const expenses = useMemo(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, t) => sum + t.amount, 0);
  }, [expenses]);

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

    let accumulatedPercentage = 0;
    return Object.entries(map)
      .map(([category, amount]) => {
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        const startPercentage = accumulatedPercentage;
        accumulatedPercentage += percentage;

        return {
          category,
          amount,
          percentage,
          startPercentage,
          color: CATEGORIES[category]?.color || CATEGORIES.Other.color,
          hoverColor: CATEGORIES[category]?.hoverColor || CATEGORIES.Other.hoverColor,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpense]);

  // Donut SVG Parameters
  const size = 220;
  const radius = 70;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="glass rounded-3xl p-6 flex flex-col items-center justify-between h-full min-h-[340px] relative overflow-hidden">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Expense Allocation</h3>
        <span className="text-xs bg-secondary/15 text-secondary border border-secondary/30 rounded-full px-2.5 py-0.5 font-bold">
          Live Breakdown
        </span>
      </div>

      {totalExpense === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10">
          <p className="text-text-muted text-sm">No expenses compiled yet</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 w-full">
          {/* Donut SVG */}
          <div className="relative w-[220px] h-[220px] flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#1A1A1C"
                strokeWidth={strokeWidth}
              />
              {chartData.map((item, index) => {
                const strokeDashoffset = circumference - (item.percentage / 100) * circumference;
                const strokeDasharray = `${circumference} ${circumference}`;
                const rotation = (item.startPercentage / 100) * 360;
                const isHovered = hoveredIndex === index;

                return (
                  <circle
                    key={item.category}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={isHovered ? item.hoverColor : item.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 8px ${item.color}80)` : 'none',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onSelectCategory?.(item.category)}
                  />
                );
              })}
            </svg>

            {/* Central Tooltip Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {hoveredIndex !== null ? (
                <>
                  <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                    {chartData[hoveredIndex].category}
                  </span>
                  <span className="text-white text-xl font-black mt-0.5">
                    {currencyService.format(chartData[hoveredIndex].amount, primaryCurrency)}
                  </span>
                  <span className="text-primary text-xs font-bold mt-0.5">
                    {chartData[hoveredIndex].percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                    Total Outflow
                  </span>
                  <span className="text-white text-2xl font-black mt-0.5">
                    {currencyService.format(totalExpense, primaryCurrency)}
                  </span>
                  <span className="text-text-muted text-[10px] mt-0.5">
                    {chartData.length} Categories
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex-1 flex flex-col gap-3 justify-center w-full md:w-auto max-w-[200px]">
            {chartData.map((item, index) => {
              const isHovered = hoveredIndex === index;
              return (
                <div
                  key={item.category}
                  className={`flex items-center justify-between p-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isHovered ? 'bg-white/5 border-l-4' : 'hover:bg-white/2'
                  }`}
                  style={{ borderLeftColor: isHovered ? item.color : 'transparent' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectCategory?.(item.category)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white text-xs font-medium">{item.category}</span>
                  </div>
                  <span className="text-text-muted text-xs font-semibold">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SvgDonutChart;
