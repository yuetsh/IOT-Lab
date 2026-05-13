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
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  getCompanies: () => request('GET', '/companies'),
  getDevices: () => request('GET', '/devices'),
  getProgress: (companyId) => request('GET', `/progress/${companyId}`),
  getCompanySummary: (companyId) => request('GET', `/progress/company/${companyId}/summary`),
  addProgress: (company_id, checklist_item_id) => request('POST', '/progress', { company_id, checklist_item_id }),
  removeProgress: (company_id, item_id) => request('DELETE', `/progress/${company_id}/${item_id}`),
  submitQuizAnswer: (stage_key, company_id, option_id) => (
    request('POST', `/quizzes/${stage_key}/submissions`, { company_id, option_id })
  ),
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
      request(method, path, body, { 'x-admin-password': import.meta.env.VITE_ADMIN_PASSWORD || 'admin123' });
    return {
      adminGetCompanies: () => adminRequest('GET', '/companies'),
      adminCreateCompany: (name) => adminRequest('POST', '/companies', { name }),
      adminDeleteCompany: (id) => adminRequest('DELETE', `/companies/${id}`),

      adminGetDevices: () => adminRequest('GET', '/devices'),
      adminCreateDevice: (name, sort_order = 0) => adminRequest('POST', '/devices', { name, sort_order }),
      adminUpdateDevice: (id, name, sort_order) => adminRequest('PUT', `/devices/${id}`, { name, sort_order }),
      adminDeleteDevice: (id) => adminRequest('DELETE', `/devices/${id}`),
      adminUploadDeviceVideo: (id, file, onProgress) => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append('file', file);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch { resolve(null); }
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || xhr.statusText)); }
            catch { reject(new Error(xhr.statusText)); }
          }
        };
        xhr.onerror = () => reject(new Error('上传失败'));
        xhr.open('PUT', `${BASE}/devices/${id}/video`);
        xhr.setRequestHeader('x-admin-password', import.meta.env.VITE_ADMIN_PASSWORD || 'admin123');
        xhr.send(form);
      }),
      adminDeleteDeviceVideo: (id) => adminRequest('DELETE', `/devices/${id}/video`),

      adminCreateItem: (device_id, label, sort_order = 0) => adminRequest('POST', '/checklist-items', { device_id, label, sort_order }),
      adminUpdateItem: (id, label, sort_order) => adminRequest('PUT', `/checklist-items/${id}`, { label, sort_order }),
      adminDeleteItem: (id) => adminRequest('DELETE', `/checklist-items/${id}`),

      adminGetAllProgress: () => adminRequest('GET', '/progress/admin/all'),
      adminGetStats: () => adminRequest('GET', '/progress/admin/stats'),
      adminGetOverview: () => adminRequest('GET', '/progress/admin/overview'),

      adminGetQuizzes: () => adminRequest('GET', '/quizzes/admin'),
      adminCreateQuiz: (activity_key, title, prompt, options) => (
        adminRequest('POST', '/quizzes/admin', { activity_key, title, prompt, options })
      ),
      adminUpdateQuiz: (stage_key, title, prompt, options) => (
        adminRequest('PUT', `/quizzes/admin/${stage_key}`, { title, prompt, options })
      ),
      adminDeleteQuiz: (stage_key) => (
        adminRequest('DELETE', `/quizzes/admin/${stage_key}`)
      ),

      adminGetAllScreenshots: () => adminRequest('GET', '/screenshots'),
      adminDeleteScreenshot: (id) => adminRequest('DELETE', `/screenshots/${id}`),

      adminResetData: () => adminRequest('POST', '/admin/reset'),
	      adminSeedData: () => adminRequest('POST', '/admin/seed'),
    };
  })(),
};
