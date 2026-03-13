/**
 * 导出工具函数
 * @module modules/itinerary/utils/exportUtils
 */

import type { Itinerary, Schedule } from '../types';
import { groupSchedulesByDay, formatDate, calculateBudgetBreakdown } from './itineraryUtils';
import html2canvas from 'html2canvas';

const budgetCategories = [
  { key: 'transport', name: '交通', color: '#52c41a', icon: '✈️' },
  { key: 'accommodation', name: '住宿', color: '#1890ff', icon: '🏨' },
  { key: 'food', name: '餐饮', color: '#fa8c16', icon: '🍽️' },
  { key: 'tickets', name: '门票', color: '#722ed1', icon: '🎫' },
  { key: 'shopping', name: '购物', color: '#eb2f96', icon: '🛍️' },
  { key: 'other', name: '其他', color: '#607D8B', icon: '📦' }
];

const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
};

const downloadFile = (content: string | Blob, filename: string, mimeType: string): boolean => {
  try {
    const safeFilename = sanitizeFilename(filename);
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    setTimeout(() => {
      link.click();
    }, 100);
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('下载文件失败:', error);
    return false;
  }
};

const validateItinerary = (itinerary: Itinerary | null): { valid: boolean; message: string } => {
  if (!itinerary) {
    return { valid: false, message: '行程数据为空' };
  }
  if (!itinerary.title) {
    return { valid: false, message: '行程标题为空' };
  }
  return { valid: true, message: '' };
};

const getBudgetBreakdown = (itinerary: Itinerary): Record<string, number> => {
  const breakdown = (itinerary as any).budgetBreakdown || (itinerary as any).budget_breakdown;
  if (breakdown && typeof breakdown === 'object') {
    return breakdown;
  }
  return calculateBudgetBreakdown(itinerary.budget || 0);
};

/**
 * 生成HTML行程单
 * @param itinerary - 行程数据
 * @returns HTML字符串
 */
const generateItineraryHTML = (itinerary: Itinerary): string => {
  const schedules = itinerary.schedules || [];
  const groupedSchedules = groupSchedulesByDay(schedules);
  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => parseInt(a) - parseInt(b));
  const breakdown = getBudgetBreakdown(itinerary);

  const generateBudgetHTML = () => {
    return budgetCategories.map(cat => {
      const amount = breakdown[cat.key] || 0;
      const percentage = itinerary.budget > 0 ? ((amount / itinerary.budget) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 1.2rem; margin-right: 8px;">${cat.icon}</span>
            ${cat.name}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            ¥${amount.toLocaleString()}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280;">
            ${percentage}%
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${cat.color}; height: 100%; width: ${percentage}%;"></div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  // 生成每日行程HTML
  const generateDailyScheduleHTML = () => {
    if (sortedDays.length === 0) {
      return '<p style="color: #6b7280; text-align: center;">暂无详细日程安排</p>';
    }

    const periodMap: Record<string, { icon: string; label: string; time: string }> = {
      morning: { icon: '🌅', label: '上午', time: '09:00' },
      afternoon: { icon: '☀️', label: '下午', time: '14:00' },
      evening: { icon: '🌙', label: '晚上', time: '19:00' }
    };

    return sortedDays.map((day, index) => {
      const schedules = groupedSchedules[parseInt(day)];
      const sortedSchedules = schedules.sort((a, b) => {
        const periodOrder = ['morning', 'afternoon', 'evening'];
        return periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
      });

      const activitiesHTML = sortedSchedules.map(schedule => {
        const period = periodMap[schedule.period] || { icon: '📍', label: '活动', time: '12:00' };
        return `
          <div class="activity" style="display: flex; gap: 15px; padding: 12px 0; border-bottom: 1px dashed #e5e7eb;">
            <div class="activity-time" style="width: 60px; font-weight: 600; color: #667eea; flex-shrink: 0;">
              ${period.time}
            </div>
            <div class="activity-content" style="flex: 1;">
              <div class="activity-title" style="font-weight: 500; margin-bottom: 4px;">
                ${period.icon} ${period.label} · ${schedule.activity}
              </div>
              <div class="activity-location" style="font-size: 0.875rem; color: #6b7280; margin-bottom: 4px;">
                📍 ${schedule.location}
              </div>
              ${schedule.notes ? `<div class="activity-notes" style="font-size: 0.875rem; color: #9ca3af;">💡 ${schedule.notes}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="day-card" style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #667eea;">
          <div class="day-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #e5e7eb;">
            <div class="day-title" style="font-weight: 600; font-size: 1.1rem; color: #1f2937;">
              第 ${day} 天
            </div>
            <div class="day-date" style="color: #6b7280; font-size: 0.875rem;">
              ${itinerary.start_date ? formatDate(new Date(new Date(itinerary.start_date).getTime() + (parseInt(day) - 1) * 24 * 60 * 60 * 1000)) : `第 ${day} 天`}
            </div>
          </div>
          ${activitiesHTML}
        </div>
      `;
    }).join('');
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${itinerary.title} - 行程单</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
            color: #1f2937;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header .subtitle {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            padding: 30px 40px;
            background: #f9fafb;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .section {
            padding: 30px 40px;
            border-bottom: 1px solid #e5e7eb;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-title .icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 10px;
        }
        .info-item .label {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .info-item .value {
            font-weight: 600;
            color: #1f2937;
        }
        .budget-table {
            width: 100%;
            border-collapse: collapse;
        }
        .budget-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
        }
        .budget-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .budget-total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .budget-total .label {
            font-size: 1.1rem;
        }
        .budget-total .value {
            font-size: 1.75rem;
            font-weight: 700;
        }
        .day-card {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #e5e7eb;
        }
        .day-title {
            font-weight: 600;
            font-size: 1.1rem;
            color: #1f2937;
        }
        .day-date {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .activity {
            display: flex;
            gap: 15px;
            padding: 12px 0;
            border-bottom: 1px dashed #e5e7eb;
        }
        .activity:last-child {
            border-bottom: none;
        }
        .activity-time {
            width: 60px;
            font-weight: 600;
            color: #667eea;
            flex-shrink: 0;
        }
        .activity-content {
            flex: 1;
        }
        .activity-title {
            font-weight: 500;
            margin-bottom: 4px;
        }
        .activity-location {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 4px;
        }
        .activity-notes {
            font-size: 0.875rem;
            color: #9ca3af;
        }
        .footer {
            background: #1f2937;
            color: white;
            padding: 20px 40px;
            text-align: center;
            font-size: 0.875rem;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
            justify-content: center;
        }
        .tag {
            padding: 6px 12px;
            background: rgba(255,255,255,0.2);
            color: white;
            border-radius: 20px;
            font-size: 0.875rem;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
        @media (max-width: 768px) {
            .stats { grid-template-columns: repeat(2, 1fr); }
            .info-grid { grid-template-columns: 1fr; }
            .header { padding: 24px; }
            .section { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${itinerary.title}</h1>
            <div class="subtitle">${itinerary.departure} → ${(itinerary.destinations || []).join('、')}</div>
            <div class="tags">
                ${(itinerary.interests || '').split(/[,，]/).map(i => i.trim()).filter(Boolean).map(interest => `<span class="tag">${interest}</span>`).join('')}
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">${itinerary.days}</div>
                <div class="stat-label">天</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(itinerary.destinations || []).length}</div>
                <div class="stat-label">目的地</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${itinerary.companion_type}</div>
                <div class="stat-label">同行</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(itinerary as any).travelStyle || '休闲'}</div>
                <div class="stat-label">风格</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">
                <div class="icon">📋</div>
                基本信息
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <div>
                        <div class="label">出发日期</div>
                        <div class="value">${itinerary.start_date || '-'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div>
                        <div class="label">返回日期</div>
                        <div class="value">${itinerary.end_date || '-'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div>
                        <div class="label">出发地</div>
                        <div class="value">${itinerary.departure}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div>
                        <div class="label">目的地</div>
                        <div class="value">${(itinerary.destinations || []).join('、')}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">
                <div class="icon">💰</div>
                预算明细
            </div>
            <table class="budget-table">
                <thead>
                    <tr>
                        <th>项目</th>
                        <th style="text-align: right;">金额</th>
                        <th style="text-align: right;">占比</th>
                        <th>可视化</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateBudgetHTML()}
                </tbody>
            </table>
            <div class="budget-total">
                <span class="label">总预算</span>
                <span class="value">¥${itinerary.budget?.toLocaleString()}</span>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">
                <div class="icon">📅</div>
                每日行程
            </div>
            ${generateDailyScheduleHTML()}
        </div>
        
        <div class="footer">
            <p>Generated by 江浙沪旅游行程规划系统</p>
            <p style="margin-top: 5px; opacity: 0.7;">导出时间：${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * 生成行程文本内容
 * @param itinerary - 行程数据
 * @returns 格式化的文本内容
 */
const generateItineraryText = (itinerary: Itinerary): string => {
  const schedules = itinerary.schedules || [];
  const groupedSchedules = groupSchedulesByDay(schedules);
  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => parseInt(a) - parseInt(b));
  const breakdown = getBudgetBreakdown(itinerary);

  let text = `╔══════════════════════════════════════════════════════════════╗\n`;
  text += `║                    ${(itinerary.title || '未命名行程').padEnd(46)} ║\n`;
  text += `╚══════════════════════════════════════════════════════════════╝\n\n`;

  text += `【基本信息】\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `  出行天数：${itinerary.days || 0} 天\n`;
  text += `  总预算：¥${(itinerary.budget || 0).toLocaleString()}\n`;
  text += `  出发地：${itinerary.departure || '未设置'}\n`;
  text += `  目的地：${(itinerary.destinations || []).join('、') || '未设置'}\n`;
  text += `  同行人员：${itinerary.companion_type || '未设置'}\n`;
  text += `  兴趣偏好：${itinerary.interests || '未设置'}\n`;
  text += `  创建时间：${formatDate(itinerary.created_at)}\n\n`;

  text += `【预算明细】\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  budgetCategories.forEach(cat => {
    const amount = breakdown[cat.key] || 0;
    const percentage = itinerary.budget > 0 ? ((amount / itinerary.budget) * 100).toFixed(1) : '0.0';
    text += `  ${cat.icon} ${cat.name.padEnd(6)}：¥${amount.toLocaleString().padStart(10)} (${percentage}%)\n`;
  });
  text += `  ─────────────────────────────────────────────────────────\n`;
  text += `  💰 总预算：¥${(itinerary.budget || 0).toLocaleString()}\n\n`;

  text += `【详细行程】\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (sortedDays.length === 0) {
    text += `  暂无详细日程安排\n`;
  } else {
    const periodMap: Record<string, string> = {
      morning: '🌅 上午',
      afternoon: '☀️ 下午',
      evening: '🌙 晚上'
    };

    sortedDays.forEach((day) => {
      text += `┌─────────────────────────────────────────────────────────────┐\n`;
      text += `│ 第 ${day.padStart(2, '0')} 天                                                    │\n`;
      text += `└─────────────────────────────────────────────────────────────┘\n\n`;

      const periodOrder = ['morning', 'afternoon', 'evening'];
      const sortedSchedules = groupedSchedules[parseInt(day)].sort((a, b) => {
        return periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
      });

      sortedSchedules.forEach((schedule) => {
        text += `  ${periodMap[schedule.period] || schedule.period}\n`;
        text += `  ├─ 活动：${schedule.activity}\n`;
        text += `  ├─ 地点：${schedule.location}\n`;
        if (schedule.notes) {
          text += `  └─ 提示：${schedule.notes}\n`;
        }
        text += `\n`;
      });
    });
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `祝您旅途愉快！\n`;
  text += `生成时间：${formatDate(new Date())}\n`;

  return text;
};

/**
 * 导出为HTML
 * @param itinerary - 行程数据
 * @returns 是否导出成功
 */
export const exportAsHTML = (itinerary: Itinerary): boolean => {
  const validation = validateItinerary(itinerary);
  if (!validation.valid) {
    console.error('HTML导出失败:', validation.message);
    return false;
  }

  try {
    const htmlContent = generateItineraryHTML(itinerary);
    const timestamp = formatDate(new Date(), 'YYYY-MM-DD');
    const filename = `行程单-${itinerary.title}-${timestamp}.html`;
    return downloadFile(htmlContent, filename, 'text/html;charset=utf-8');
  } catch (error) {
    console.error('HTML导出异常:', error);
    return false;
  }
};

/**
 * 导出为TXT
 * @param itinerary - 行程数据
 * @returns 是否导出成功
 */
export const exportAsTXT = (itinerary: Itinerary): boolean => {
  const validation = validateItinerary(itinerary);
  if (!validation.valid) {
    console.error('TXT导出失败:', validation.message);
    return false;
  }

  try {
    const content = generateItineraryText(itinerary);
    const timestamp = formatDate(new Date(), 'YYYY-MM-DD');
    const filename = `行程-${itinerary.title}-${timestamp}.txt`;
    return downloadFile(content, filename, 'text/plain;charset=utf-8');
  } catch (error) {
    console.error('TXT导出异常:', error);
    return false;
  }
};

/**
 * 导出为Excel (CSV格式)
 * @param itinerary - 行程数据
 * @returns 是否导出成功
 */
export const exportAsExcel = (itinerary: Itinerary): boolean => {
  const validation = validateItinerary(itinerary);
  if (!validation.valid) {
    console.error('Excel导出失败:', validation.message);
    return false;
  }

  try {
    const breakdown = getBudgetBreakdown(itinerary);
    const schedules = itinerary.schedules || [];
    const groupedSchedules = groupSchedulesByDay(schedules);
    const sortedDays = Object.keys(groupedSchedules).sort((a, b) => parseInt(a) - parseInt(b));

    let csvContent = '\uFEFF';

    csvContent += '行程信息\n';
    csvContent += `标题,${itinerary.title || '未命名'}\n`;
    csvContent += `出发地,${itinerary.departure || '未设置'}\n`;
    csvContent += `目的地,"${(itinerary.destinations || []).join(', ')}"\n`;
    csvContent += `开始日期,${itinerary.start_date || '-'}\n`;
    csvContent += `结束日期,${itinerary.end_date || '-'}\n`;
    csvContent += `行程天数,${itinerary.days || 0}\n`;
    csvContent += `同行人员,${itinerary.companion_type || '未设置'}\n`;
    csvContent += `兴趣偏好,"${itinerary.interests || '未设置'}"\n`;
    csvContent += `总预算,${itinerary.budget || 0}\n\n`;

    csvContent += '预算明细\n';
    csvContent += '项目,金额,占比\n';
    budgetCategories.forEach(cat => {
      const amount = breakdown[cat.key] || 0;
      const percentage = itinerary.budget > 0 ? ((amount / itinerary.budget) * 100).toFixed(1) : '0.0';
      csvContent += `${cat.name},${amount},${percentage}%\n`;
    });
    csvContent += `总预算,${itinerary.budget || 0},100%\n\n`;

    csvContent += '日程安排\n';
    csvContent += '天数,时段,活动,地点,备注\n';

    const periodMap: Record<string, string> = {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上'
    };

    if (sortedDays.length > 0) {
      sortedDays.forEach(day => {
        const daySchedules = groupedSchedules[parseInt(day)];
        const periodOrder = ['morning', 'afternoon', 'evening'];
        const sortedDaySchedules = daySchedules.sort((a, b) => {
          return periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
        });

        sortedDaySchedules.forEach(schedule => {
          csvContent += `第${day}天,${periodMap[schedule.period] || schedule.period},${schedule.activity || ''},${schedule.location || ''},"${schedule.notes || ''}"\n`;
        });
      });
    } else {
      csvContent += '暂无日程安排,,,\n';
    }

    const timestamp = formatDate(new Date(), 'YYYY-MM-DD');
    const filename = `行程表-${itinerary.title}-${timestamp}.csv`;
    return downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  } catch (error) {
    console.error('Excel导出异常:', error);
    return false;
  }
};

/**
 * 导出为日历文件 (iCal格式)
 * @param itinerary - 行程数据
 * @returns 是否导出成功
 */
export const exportAsCalendar = (itinerary: Itinerary): boolean => {
  const validation = validateItinerary(itinerary);
  if (!validation.valid) {
    console.error('日历导出失败:', validation.message);
    return false;
  }

  try {
    const formatDateToICS = (dateStr: string) => {
      if (!dateStr) return '';
      return dateStr.replace(/-/g, '');
    };

    let icalContent = 'BEGIN:VCALENDAR\n';
    icalContent += 'VERSION:2.0\n';
    icalContent += 'PRODID:-//TravelPlanner//CN\n';
    icalContent += 'CALSCALE:GREGORIAN\n';
    icalContent += 'METHOD:PUBLISH\n';

    icalContent += 'BEGIN:VEVENT\n';
    icalContent += `UID:itinerary-${itinerary.id || Date.now()}@travelplanner\n`;
    icalContent += `SUMMARY:${itinerary.title || '未命名行程'}\n`;
    icalContent += `DTSTART;VALUE=DATE:${formatDateToICS(itinerary.start_date || '')}\n`;
    icalContent += `DTEND;VALUE=DATE:${formatDateToICS(itinerary.end_date || '')}\n`;
    icalContent += `DESCRIPTION:江浙沪旅游行程\\n出发地: ${itinerary.departure || '未设置'}\\n目的地: ${(itinerary.destinations || []).join(', ')}\\n预算: ¥${itinerary.budget || 0}\\n同行: ${itinerary.companion_type || '未设置'}\\n兴趣: ${itinerary.interests || '未设置'}\n`;
    icalContent += `LOCATION:${(itinerary.destinations || []).join(', ')}\n`;
    icalContent += 'STATUS:CONFIRMED\n';
    icalContent += 'END:VEVENT\n';

    const schedules = itinerary.schedules || [];
    const groupedSchedules = groupSchedulesByDay(schedules);
    const sortedDays = Object.keys(groupedSchedules).sort((a, b) => parseInt(a) - parseInt(b));

    sortedDays.forEach(day => {
      const daySchedules = groupedSchedules[parseInt(day)];
      daySchedules.forEach((schedule, index) => {
        const startDate = itinerary.start_date ? new Date(itinerary.start_date) : new Date();
        startDate.setDate(startDate.getDate() + parseInt(day) - 1);
        const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');

        const timeMap: Record<string, string> = {
          morning: '090000',
          afternoon: '140000',
          evening: '190000'
        };

        icalContent += 'BEGIN:VEVENT\n';
        icalContent += `UID:schedule-${itinerary.id || Date.now()}-${day}-${index}@travelplanner\n`;
        icalContent += `SUMMARY:${schedule.activity || '活动'}\n`;
        icalContent += `DTSTART;TZID=Asia/Shanghai:${dateStr}T${timeMap[schedule.period] || '120000'}\n`;
        icalContent += `DTEND;TZID=Asia/Shanghai:${dateStr}T${timeMap[schedule.period] ? String(parseInt(timeMap[schedule.period]) + 20000).padStart(6, '0') : '140000'}\n`;
        icalContent += `DESCRIPTION:地点: ${schedule.location || '未知'}${schedule.notes ? '\\n备注: ' + schedule.notes : ''}\n`;
        icalContent += `LOCATION:${schedule.location || '未知'}\n`;
        icalContent += 'STATUS:CONFIRMED\n';
        icalContent += 'END:VEVENT\n';
      });
    });

    icalContent += 'END:VCALENDAR';

    const timestamp = formatDate(new Date(), 'YYYY-MM-DD');
    const filename = `行程日历-${itinerary.title}-${timestamp}.ics`;
    return downloadFile(icalContent, filename, 'text/calendar;charset=utf-8');
  } catch (error) {
    console.error('日历导出异常:', error);
    return false;
  }
};

/**
 * 生成图片Data URL
 * @param element - DOM元素
 * @param format - 图片格式
 * @param quality - 图片质量 (1-3)
 * @returns Data URL
 */
export const generateImageDataUrl = async (
  element: HTMLElement,
  format: 'png' | 'jpg' = 'png',
  quality: number = 2
): Promise<string> => {
  if (!element) {
    throw new Error('DOM元素不存在');
  }

  const scale = quality === 1 ? 1 : quality === 2 ? 2 : 3;

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
    });

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const imageQuality = format === 'jpg' ? 0.9 : undefined;

    return canvas.toDataURL(mimeType, imageQuality);
  } catch (error) {
    console.error('html2canvas渲染失败:', error);
    throw new Error('图片生成失败');
  }
};

/**
 * 下载图片
 * @param dataUrl - 图片Data URL
 * @param filename - 文件名
 * @returns 是否下载成功
 */
export const downloadImage = (dataUrl: string, filename: string): boolean => {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = sanitizeFilename(filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    
    setTimeout(() => {
      link.click();
    }, 100);
    
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('图片下载失败:', error);
    return false;
  }
};

/**
 * 导出行程到文件 (兼容旧版)
 * @param itinerary - 行程数据
 * @param format - 导出格式
 * @returns 是否导出成功
 */
export const exportItineraryToFile = (
  itinerary: Itinerary,
  format: 'txt' | 'json' | 'html' | 'excel' | 'calendar' = 'txt'
): boolean => {
  const validation = validateItinerary(itinerary);
  if (!validation.valid) {
    console.error('导出失败:', validation.message);
    return false;
  }

  switch (format) {
    case 'json':
      const jsonContent = JSON.stringify(itinerary, null, 2);
      return downloadFile(jsonContent, `${itinerary.title}.json`, 'application/json');
    case 'html':
      return exportAsHTML(itinerary);
    case 'excel':
      return exportAsExcel(itinerary);
    case 'calendar':
      return exportAsCalendar(itinerary);
    case 'txt':
    default:
      return exportAsTXT(itinerary);
  }
};

export default exportItineraryToFile;
