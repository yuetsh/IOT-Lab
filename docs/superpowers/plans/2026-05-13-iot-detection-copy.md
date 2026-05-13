# IoT Detection Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update visible app copy so the student and admin flows match an IoT device detection course.

**Architecture:** This is a text-only UI and message update. Existing data shape keeps `company` and `device` identifiers; only Chinese user-facing strings change.

**Tech Stack:** Vite, React, Express, SQLite, HeroUI.

---

### Task 1: Update Student Copy

**Files:**
- Modify: `client/src/student/CompanySelect.jsx`
- Modify: `client/src/student/StudentDashboard.jsx`
- Modify: `client/src/student/CompanyScreenshotPanel.jsx`
- Modify: `client/src/student/CompanyWorkspace.jsx`
- Modify: `client/src/student/DeviceProgressGrid.jsx`
- Modify: `client/src/student/ProgressSummary.jsx`

- [x] Replace platform and group wording with "物联网设备检测实验平台" and "检测小组".
- [x] Replace activity wording with "设备检测清单" and "检测记录截图".
- [x] Keep component props and API calls unchanged.

### Task 2: Update Admin Copy

**Files:**
- Modify: `client/src/admin/AdminApp.jsx`
- Modify: `client/src/admin/AdminDashboard.jsx`
- Modify: `client/src/admin/AdminSummaryCards.jsx`
- Modify: `client/src/admin/CompletionDonut.jsx`
- Modify: `client/src/admin/CompanyManager.jsx`
- Modify: `client/src/admin/CompanyProgressCards.jsx`
- Modify: `client/src/admin/CompanyRankChart.jsx`
- Modify: `client/src/admin/ProgressOverview.jsx`
- Modify: `client/src/admin/ScreenshotBarChart.jsx`
- Modify: `client/src/admin/ScreenshotGallery.jsx`
- Modify: `client/src/admin/DeviceBottleneckChart.jsx`
- Modify: `client/src/admin/DeviceManager.jsx`

- [x] Replace "公司" and "企业" learner-group copy with "检测小组".
- [x] Replace screenshot chart/gallery wording with "检测记录截图".
- [x] Rename generic device dashboard copy where needed to "设备检测".

### Task 3: Update Server Messages And Verify

**Files:**
- Modify: `server/routes/companies.js`
- Modify: `server/routes/progress.js`

- [x] Replace user-facing validation and not-found errors with "检测小组".
- [x] Run `rtk npm run lint --prefix client`.
- [x] Run `rtk npm run build`.
- [x] Search visible source strings for stale "公司" or "企业" wording that should now be "检测小组".
