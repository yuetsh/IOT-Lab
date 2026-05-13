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
  'var(--device-color-0)', // teal
  'var(--device-color-1)', // amber
  'var(--device-color-2)', // indigo
  'var(--device-color-3)', // pink
  'var(--device-color-4)', // green
  'var(--device-color-5)', // cyan
  'var(--device-color-6)', // orange
  'var(--device-color-7)', // violet
  'var(--device-color-8)', // rose
  'var(--device-color-9)', // blue
];

export function deviceColor(deviceId, index) {
  return DEVICE_PALETTE[index % DEVICE_PALETTE.length];
}
