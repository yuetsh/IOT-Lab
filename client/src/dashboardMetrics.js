export function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function statusLabel(status) {
  const labels = {
    complete: '已完成',
    in_progress: '进行中',
    not_started: '未开始',
  };
  return labels[status] || '未开始';
}

export function statusTone(status) {
  if (status === 'complete') return 'complete';
  if (status === 'in_progress') return 'progress';
  return 'idle';
}

export function formatCount(current, total) {
  return `${Number(current) || 0}/${Number(total) || 0}`;
}

const DEVICE_PALETTE = [
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#ec4899', // pink
  '#22c55e', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#8b5cf6', // violet
  '#e11d48', // rose
  '#3b82f6', // blue
];

export function deviceColor(deviceId, index) {
  return DEVICE_PALETTE[index % DEVICE_PALETTE.length];
}
