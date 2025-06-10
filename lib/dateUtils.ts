// 日期处理工具函数

/**
 * 获取当前日期的中文描述信息，用于AI提示词
 */
export function getCurrentDateInfo(): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const chineseDate = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  })
  
  return `今天是 ${chineseDate}（${dateStr}）`
}

/**
 * 验证AI返回的日期是否合理
 * @param dateStr AI返回的日期字符串 YYYY-MM-DD
 * @returns 验证后的日期字符串，如果不合理则返回今天
 */
export function validateAIDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    
    // 检查日期格式是否有效
    if (isNaN(date.getTime())) {
      console.warn('AI返回的日期格式无效:', dateStr)
      return now.toISOString().split('T')[0]
    }
    
    // 检查日期是否过于久远（超过1年前或1个月后）
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    
    if (date < oneYearAgo || date > oneMonthLater) {
      console.warn('AI返回的日期超出合理范围:', dateStr)
      return now.toISOString().split('T')[0]
    }
    
    return dateStr
  } catch (error) {
    console.warn('AI日期验证失败:', error)
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * 格式化日期为用户友好的中文格式
 * @param dateStr YYYY-MM-DD格式的日期
 * @returns 中文日期格式
 */
export function formatDateToChinese(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    
    // 判断是否是今天、昨天、前天
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays === 2) return '前天'
    if (diffDays === -1) return '明天'
    
    // 判断是否是本周
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    if (date >= startOfWeek && diffDays > 0) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `本${weekdays[date.getDay()]}`
    }
    
    // 判断是否是上周
    const lastWeekStart = new Date(startOfWeek)
    lastWeekStart.setDate(startOfWeek.getDate() - 7)
    const lastWeekEnd = new Date(startOfWeek)
    lastWeekEnd.setTime(lastWeekEnd.getTime() - 1)
    
    if (date >= lastWeekStart && date <= lastWeekEnd) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `上${weekdays[date.getDay()]}`
    }
    
    // 默认返回月日格式
    return date.toLocaleDateString('zh-CN', { 
      month: 'long', 
      day: 'numeric'
    })
  } catch (error) {
    return dateStr
  }
} 