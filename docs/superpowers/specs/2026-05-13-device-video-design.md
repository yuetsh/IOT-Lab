---
title: 设备视频功能
date: 2026-05-13
status: approved
---

## 目标

管理员为每个设备上传一个教学视频，所有公司学生在设备卡片清单上方可直接播放。

## 数据库

`devices` 表新增 `video_filename TEXT` 列（可为空）。无需迁移脚本，使用 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 在启动时执行。

## 后端

### 新增路由（`server/routes/devices.js`）

- `PUT /devices/:id/video` [adminAuth]  
  multer 接收单个视频文件（`video/*`），保存到 `server/uploads/`，文件名用时间戳去重，更新 `devices.video_filename`，返回更新后的 device 对象。

- `DELETE /devices/:id/video` [adminAuth]  
  从磁盘删除文件，清空 `video_filename`，返回更新后的 device 对象。

### db.js

`getDevicesWithItems` 查询已包含 devices 所有字段，加列后自动带出 `video_filename`，无需改动查询。

`updateDevice` 不需要改动（视频通过独立路由管理）。

## 后台管理（`DeviceManager.jsx`）

每个设备卡片底部新增视频区：
- 无视频：显示文件选择 + 上传按钮
- 有视频：显示文件名 + 删除按钮（不需要预览）

## 前台（学生端）

`DeviceProgressGrid` 中设备卡片：
- `video_filename` 存在时，清单上方渲染 `<video controls>` 播放器，`src` 指向 `/uploads/<filename>`
- `video_filename` 为空时，不渲染任何额外元素

## API（`client/src/api.js`）

新增：
- `adminUploadDeviceVideo(deviceId, file)`
- `adminDeleteDeviceVideo(deviceId)`
