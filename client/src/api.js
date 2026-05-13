const BASE = '/api';

async function request(method, path, body, extraHeaders = {}) {
  const opts = { method, headers: { ...extraHeaders } };
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

  // Admin methods — include X-Admin-Password header
  ...(() => {
    const adminRequest = (method, path, body) =>
      request(method, path, body, { 'x-admin-password': 'admin123' });
    return {
      adminGetCompanies: () => adminRequest('GET', '/companies'),
      adminCreateCompany: (name) => adminRequest('POST', '/companies', { name }),
      adminDeleteCompany: (id) => adminRequest('DELETE', `/companies/${id}`),

      adminGetDevices: () => adminRequest('GET', '/devices'),
      adminCreateDevice: (name, sort_order = 0) => adminRequest('POST', '/devices', { name, sort_order }),
      adminUpdateDevice: (id, name, sort_order) => adminRequest('PUT', `/devices/${id}`, { name, sort_order }),
      adminDeleteDevice: (id) => adminRequest('DELETE', `/devices/${id}`),

      adminCreateItem: (device_id, label, sort_order = 0) => adminRequest('POST', '/checklist-items', { device_id, label, sort_order }),
      adminUpdateItem: (id, label, sort_order) => adminRequest('PUT', `/checklist-items/${id}`, { label, sort_order }),
      adminDeleteItem: (id) => adminRequest('DELETE', `/checklist-items/${id}`),

      adminGetAllProgress: () => adminRequest('GET', '/progress/admin/all'),
      adminGetStats: () => adminRequest('GET', '/progress/admin/stats'),

      adminGetAllScreenshots: () => adminRequest('GET', '/screenshots'),
      adminDeleteScreenshot: (id) => adminRequest('DELETE', `/screenshots/${id}`),
    };
  })(),
};
