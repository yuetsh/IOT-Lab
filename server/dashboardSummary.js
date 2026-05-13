'use strict';

function calculatePercent(completed, total) {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function getCompanyStatus(completedItems, totalItems) {
  if (!totalItems || completedItems <= 0) {
    return 'not_started';
  }

  if (completedItems >= totalItems) {
    return 'complete';
  }

  return 'in_progress';
}

function normalizeCompletedIds(completedItemIds) {
  if (completedItemIds instanceof Set) return completedItemIds;
  return new Set((completedItemIds || []).map(Number));
}

function sortScreenshots(screenshots) {
  return [...(screenshots || [])].sort((a, b) => {
    const uploadedAtCompare = String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || ''));
    if (uploadedAtCompare !== 0) {
      return uploadedAtCompare;
    }

    return (b.id || 0) - (a.id || 0);
  });
}

function buildCompanySummary({ company, devices, completedItemIds, screenshots }) {
  const completedIds = normalizeCompletedIds(completedItemIds);

  const deviceSummaries = (devices || []).map(device => {
    const checklistItems = (device.checklist_items || []).map(item => ({
      ...item,
      completed: completedIds.has(Number(item.id)),
    }));
    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter(item => item.completed).length;

    return {
      ...device,
      checklist_items: checklistItems,
      total_items: totalItems,
      completed_items: completedItems,
      completion_percent: calculatePercent(completedItems, totalItems),
      status: getCompanyStatus(completedItems, totalItems),
    };
  });

  const totalItems = deviceSummaries.reduce((sum, device) => sum + device.total_items, 0);
  const completedItems = deviceSummaries.reduce((sum, device) => sum + device.completed_items, 0);
  const orderedScreenshots = sortScreenshots(screenshots);

  return {
    company,
    total_items: totalItems,
    completed_items: completedItems,
    completion_percent: calculatePercent(completedItems, totalItems),
    status: getCompanyStatus(completedItems, totalItems),
    screenshot_count: orderedScreenshots.length,
    latest_screenshot: orderedScreenshots[0] || null,
    devices: deviceSummaries,
  };
}

function getCompanyCompletedItemIds(progressByCompany, companyId) {
  if (progressByCompany instanceof Map) {
    return progressByCompany.get(Number(companyId)) || progressByCompany.get(companyId) || [];
  }

  return progressByCompany?.[companyId] || [];
}

function buildAdminOverview({ companies, devices, progressByCompany, screenshots }) {
  const allCompanies = companies || [];
  const allDevices = devices || [];
  const allScreenshots = screenshots || [];
  const companySummaries = allCompanies.map(company => buildCompanySummary({
    company,
    devices: allDevices,
    completedItemIds: getCompanyCompletedItemIds(progressByCompany, company.id),
    screenshots: allScreenshots,
  }));

  const statusCounts = {
    complete: companySummaries.filter(summary => summary.status === 'complete').length,
    in_progress: companySummaries.filter(summary => summary.status === 'in_progress').length,
    not_started: companySummaries.filter(summary => summary.status === 'not_started').length,
  };
  const totalCompletionPercent = companySummaries.reduce(
    (sum, summary) => sum + summary.completion_percent,
    0
  );

  const companyRankings = companySummaries
    .map(summary => ({
      company_id: summary.company.id,
      company_name: summary.company.name,
      completed_items: summary.completed_items,
      total_items: summary.total_items,
      completion_percent: summary.completion_percent,
      status: summary.status,
    }))
    .sort((a, b) => b.completion_percent - a.completion_percent || String(a.company_name).localeCompare(String(b.company_name), 'zh-Hans-CN'));

  const screenshotChart = allCompanies.map(company => ({
    company_id: company.id,
    company_name: company.name,
    screenshot_count: allScreenshots.filter(screenshot => screenshot.company_id === company.id).length,
  }));

  const deviceBottlenecks = allDevices
    .map(device => {
      const deviceItems = device.checklist_items || [];
      const completedItems = allCompanies.reduce((sum, company) => {
        const completedIds = normalizeCompletedIds(getCompanyCompletedItemIds(progressByCompany, company.id));
        return sum + deviceItems.filter(item => completedIds.has(Number(item.id))).length;
      }, 0);
      const totalItems = deviceItems.length * allCompanies.length;

      return {
        device_id: device.id,
        device_name: device.name,
        completed_items: completedItems,
        total_items: totalItems,
        completion_percent: calculatePercent(completedItems, totalItems),
      };
    });

  const companyCards = companySummaries.map(summary => ({
    company_id: summary.company.id,
    company_name: summary.company.name,
    total_items: summary.total_items,
    completed_items: summary.completed_items,
    completion_percent: summary.completion_percent,
    status: summary.status,
    screenshot_count: summary.screenshot_count,
    unfinished_items: Math.max(summary.total_items - summary.completed_items, 0),
    devices: summary.devices.map(device => ({
      device_id: device.id,
      device_name: device.name,
      total_items: device.total_items,
      completed_items: device.completed_items,
      completion_percent: device.completion_percent,
      status: device.status,
      checklist_items: device.checklist_items.map(item => ({
        id: item.id,
        label: item.label,
        sort_order: item.sort_order,
        completed: item.completed,
      })),
    })),
  }));

  return {
    summary: {
      company_count: allCompanies.length,
      device_count: allDevices.length,
      checklist_item_count: allDevices.reduce((sum, device) => sum + (device.checklist_items || []).length, 0),
      screenshot_count: allScreenshots.length,
      complete_company_count: statusCounts.complete,
      in_progress_company_count: statusCounts.in_progress,
      not_started_company_count: statusCounts.not_started,
      average_completion_percent: calculatePercent(totalCompletionPercent, companySummaries.length * 100),
    },
    status_distribution: [
      { status: 'complete', label: '已完成', count: statusCounts.complete },
      { status: 'in_progress', label: '进行中', count: statusCounts.in_progress },
      { status: 'not_started', label: '未开始', count: statusCounts.not_started },
    ],
    company_rankings: companyRankings,
    screenshot_chart: screenshotChart,
    device_bottlenecks: deviceBottlenecks,
    company_cards: companyCards,
  };
}

module.exports = {
  calculatePercent,
  getCompanyStatus,
  buildCompanySummary,
  buildAdminOverview,
};
