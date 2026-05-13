# IoT Detection Copy Design

## Goal

Align student and teacher-facing copy with the course topic: IoT device detection.

## Scope

- Use "检测小组" for learner groups in visible UI copy and server error messages.
- Use "物联网设备检测实验平台" as the student-facing platform name.
- Use course-lab wording such as "设备检测清单", "检测记录截图", and "教师后台".
- Keep database columns, route names, component names, and API method names unchanged.

## Student Experience

The student entry and dashboard should read as a course lab workflow. Students choose a detection group, complete IoT device detection checklist items, upload detection record screenshots, and submit short checks after each activity.

## Teacher Experience

The admin area should read as a teacher dashboard for detection groups. Navigation, charts, progress tables, gallery text, and management screens should use "检测小组" and "检测记录截图" instead of generic company or operations wording.

## Validation

- Run client lint.
- Run client production build.
- Confirm no visible Chinese copy still uses "公司" or "企业" for learner groups except internal code identifiers.
