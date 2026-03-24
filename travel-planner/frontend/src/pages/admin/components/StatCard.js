import React from 'react';

const StatCard = ({ title, value, icon, color, trend, trendLabel, prefix = '' }) => {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="stat-card-v2">
      <div
        className="stat-card-v2-icon"
        style={{ background: `linear-gradient(135deg, ${color}18, ${color}35)`, color }}
      >
        {icon}
      </div>
      <div className="stat-card-v2-info">
        <span className="stat-card-v2-label">{title}</span>
        <span className="stat-card-v2-value">{prefix}{formattedValue}</span>
        {trend !== undefined && (
          <span className={`stat-card-v2-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? '+' : ''}{trend} {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
