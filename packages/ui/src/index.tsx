import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  variant?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'red';
}

const variantColors = {
  cyan: { border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8' },
  purple: { border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' },
  emerald: { border: 'rgba(52, 211, 153, 0.3)', text: '#34d399' },
  amber: { border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' },
  red: { border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  variant = 'cyan',
}) => {
  const c = variantColors[variant];
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: `1px solid ${c.border}`,
        borderRadius: '14px',
        padding: '16px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px' }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: c.text, margin: '6px 0 2px 0' }}>
        {value} {unit && <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>{unit}</span>}
      </div>
      {subtext && <div style={{ fontSize: '11px', color: '#64748b' }}>{subtext}</div>}
    </div>
  );
};

export interface StatusBadgeProps {
  status: 'OPTIMAL' | 'TIGHT' | 'INSUFFICIENT' | 'PASSED' | 'FAILED' | 'ONLINE' | 'HALTED';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isGood = ['OPTIMAL', 'PASSED', 'ONLINE'].includes(status);
  const isWarn = ['TIGHT'].includes(status);

  const bg = isGood
    ? 'rgba(52, 211, 153, 0.15)'
    : isWarn
    ? 'rgba(251, 191, 36, 0.15)'
    : 'rgba(239, 68, 68, 0.15)';
  const border = isGood
    ? 'rgba(52, 211, 153, 0.3)'
    : isWarn
    ? 'rgba(251, 191, 36, 0.3)'
    : 'rgba(239, 68, 68, 0.3)';
  const text = isGood ? '#34d399' : isWarn ? '#fbbf24' : '#f87171';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '9999px',
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.5px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: text,
        }}
      />
      {status}
    </span>
  );
};

export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  variant = 'primary',
  style,
  ...props
}) => {
  const bg =
    variant === 'danger'
      ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
      : variant === 'ghost'
      ? 'rgba(30, 41, 59, 0.6)'
      : 'linear-gradient(135deg, #0284c7, #6366f1)';

  return (
    <button
      style={{
        background: bg,
        color: '#ffffff',
        border: variant === 'ghost' ? '1px solid rgba(148, 163, 184, 0.2)' : 'none',
        borderRadius: '10px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: variant === 'ghost' ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.4)',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};
