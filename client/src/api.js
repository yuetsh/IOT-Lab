const BASE = '/api';

async function request(method, path, body) {
  const opts = { method, headers: {} };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getCompanies: () => request('GET', '/companies'),
  getDevices: () => request('GET', '/devices'),
  getProgress: (companyId) => request('GET', `/progress/${companyId}`),
  addProgress: (company_id, checklist_item_id) => request('POST', '/progress', { company_id, checklist_item_id }),
  removeProgress: (company_id, item_id) => request('DELETE', `/progress/${company_id}/${item_id}`),
  uploadScreenshot: (company_id, device_id, file) => {
    const form = new FormData();
    form.append('company_id', company_id);
    if (device_id) form.append('device_id', device_id);
    form.append('file', file);
    return request('POST', '/screenshots', form);
  },
  getScreenshots: (companyId) => request('GET', `/screenshots/${companyId}`),
};
