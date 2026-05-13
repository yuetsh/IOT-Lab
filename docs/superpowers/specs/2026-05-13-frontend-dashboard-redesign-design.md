# Frontend Dashboard Redesign Design

Date: 2026-05-13

## Summary

Redesign the student and admin frontends into a unified dark control-console experience. The student side becomes a company experiment dashboard. The admin side becomes a company-focused completion dashboard with charts, so teachers can immediately understand how each company is progressing.

This design keeps the existing core data model: companies, devices, checklist items, progress, and screenshots. Screenshots remain bound to companies only, not to individual devices.

## Confirmed Decisions

- Redesign both student and admin pages.
- Use a dark control-console visual direction.
- Use a dashboard layout on both sides.
- Allow small backend/API changes where they make the dashboard cleaner.
- Keep screenshots company-level.
- Make the admin dashboard emphasize each company's completion status.
- Include appropriate information charts, including donut/pie-style summaries and bar charts.

## Goals

- Let students see their company's total progress, device progress, and screenshot upload status at a glance.
- Let teachers quickly compare company completion status without starting from a dense matrix table.
- Add charts that answer real classroom management questions:
  - How many companies are complete, in progress, or not started?
  - Which companies are ahead or behind?
  - Which devices are slowing the class down?
  - Which companies have submitted screenshots?
- Preserve existing core workflows: select company, check off tasks, upload screenshots, manage companies, manage devices, view screenshots.

## Non-Goals

- No device-level screenshot upload in this redesign.
- No authentication redesign.
- No replacement of SQLite.
- No drag-and-drop ordering for companies, devices, or checklist items unless added separately later.
- No new automated test framework in this design pass.

## Student Experience

The student app still starts with company selection. After a company is selected, the main page becomes a company experiment dashboard.

The dashboard includes:

- Header with product name, current company name, and a switch-company action.
- Total progress summary with completed checklist count, total checklist count, and percentage.
- Device progress grid, with one card per device.
- Each device card shows the device name, completed item count, total item count, completion state, and checklist items.
- Company screenshot panel showing upload control, latest upload status, and company screenshot count.

The student page remains task-oriented. The dashboard should not bury the checklist interactions behind tabs or modals.

## Admin Experience

The admin app keeps a side navigation, but the default route becomes a dashboard focused on company completion.

The dashboard includes:

- Page header: "各家公司完成情况".
- Summary cards:
  - Company count.
  - Average completion rate.
  - Fully completed company count.
  - Total uploaded screenshot count.
- Donut chart for company completion status:
  - Complete.
  - In progress.
  - Not started.
- Company completion ranking as horizontal bars.
- Screenshot submission bar chart by company.
- Device bottleneck chart showing overall completion by device.
- Company progress cards as the main detailed area.

Each company card includes:

- Company name.
- Total completion percentage.
- Completed checklist count and total checklist count.
- Screenshot count.
- Unfinished item count.
- Per-device mini progress bars.
- Visual status: complete, in progress, not started.

Existing admin pages remain available:

- Company management.
- Device and checklist management.
- Progress detail view.
- Screenshot gallery.

These pages should adopt the same dark control-console visual language.

## Information Charts

Use charts only where they improve decision-making.

Required charts:

- Donut chart: company completion status distribution.
- Large number/progress display: class average completion rate.
- Horizontal bar chart: company completion ranking.
- Vertical bar chart: screenshot count by company.
- Horizontal bar chart: device bottleneck completion rates.

The implementation can use CSS-based charts for the first pass to avoid adding a charting dependency. If the chart complexity grows later, a dedicated chart library can be introduced in a separate change.

## Frontend Architecture

Add student-facing dashboard components:

- `StudentDashboard`
- `ProgressSummary`
- `DeviceProgressGrid`
- `DeviceProgressCard`
- `CompanyScreenshotPanel`

Add admin-facing dashboard components:

- `AdminDashboard`
- `AdminSummaryCards`
- `CompletionDonut`
- `CompanyRankChart`
- `ScreenshotBarChart`
- `DeviceBottleneckChart`
- `CompanyProgressCards`

Shared helper functions should compute percentages, status labels, and safe totals in one place instead of duplicating calculation logic across components.

CSS should be organized around the two existing style files unless the implementation clearly benefits from a shared dashboard stylesheet. The visual system should define reusable tokens for:

- Page background.
- Panel background.
- Border color.
- Primary accent.
- Success, warning, and neutral status colors.
- Text hierarchy.

## Backend/API Design

Keep existing routes and add two dashboard-oriented aggregate endpoints.

### Student Company Summary

`GET /api/progress/company/:company_id/summary`

Returns:

- Company id and name.
- Total checklist item count.
- Completed checklist item count.
- Overall completion percentage.
- Device summaries:
  - Device id.
  - Device name.
  - Total item count.
  - Completed item count.
  - Completion percentage.
  - Checklist items with completion state.
- Screenshot count for the company.
- Latest screenshot metadata, if available.

### Admin Overview

`GET /api/progress/admin/overview`

Requires admin auth.

Returns:

- Summary totals:
  - Company count.
  - Device count.
  - Checklist item count.
  - Screenshot count.
  - Average completion percentage.
  - Complete company count.
  - In-progress company count.
  - Not-started company count.
- Company cards:
  - Company id.
  - Company name.
  - Total item count.
  - Completed item count.
  - Completion percentage.
  - Status.
  - Screenshot count.
  - Unfinished item count.
  - Per-device progress.
- Company ranking data.
- Screenshot chart data.
- Device bottleneck data.

These endpoints should be computed from existing tables. No schema migration is required for the confirmed design.

## Data Rules

- A company is `complete` when total checklist items is greater than zero and completed count equals total count.
- A company is `not_started` when completed count is zero.
- A company is `in_progress` when completed count is greater than zero but less than total count.
- If there are no checklist items, percentages should be `0`, and the UI should show an empty-state message instead of implying progress.
- Screenshot count is company-level.

## Error And Empty States

Student side:

- If companies fail to load, show a clear error panel.
- If no company exists, ask the student to contact the teacher.
- If no devices or checklist items exist, show a setup-needed empty state.
- If progress save fails, revert the checkbox state and show an error.
- If screenshot upload fails, keep the selected file and show the error.

Admin side:

- If overview data fails to load, show an error panel with retry guidance.
- If no companies exist, dashboard should show a setup-needed empty state.
- If no devices or checklist items exist, show that progress charts require checklist setup.
- If no screenshots exist, screenshot chart should show an empty state instead of fake bars.

## Visual Design

The theme should feel like a control console, but the UI must remain readable for classroom use.

Guidelines:

- Dark background with layered panels.
- Use teal/green for complete states.
- Use amber for in-progress or needs-attention states.
- Use slate/gray for not-started or empty states.
- Keep cards compact and data-first.
- Avoid oversized marketing-style hero sections.
- Avoid decorative gradient blobs or purely atmospheric graphics.
- Ensure mobile layouts stack cleanly and text does not overflow buttons or cards.

## Validation

Run:

- `npm run lint --prefix client`
- `npm run build`

Manual verification:

- Student can select a company.
- Student dashboard loads summary data.
- Student can check and uncheck checklist items.
- Failed progress saves revert the local checkbox state.
- Student can upload a company-level screenshot.
- Admin dashboard shows company-focused charts and company cards.
- Admin company/device/checklist/screenshot management pages remain accessible.
- Screenshot gallery still displays company-level screenshots.

## Implementation Notes

- Prefer existing React and CSS patterns.
- Do not introduce a chart library unless CSS-based charts become too limited during implementation.
- Keep route handlers small: validate inputs, call `server/db.js`, return JSON.
- Add aggregate database helper functions in `server/db.js` rather than assembling dashboard data in route modules.
- Keep the existing endpoints working for compatibility while adding dashboard endpoints.
