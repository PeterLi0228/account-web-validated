const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_Router_API_KEY!

export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'assistant', content: string }>, 
  categories?: Array<{ id: string, name: string, type: string }>
) {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('API密钥未配置')
    }
    
    // 获取当前日期信息
    const { getCurrentDateInfo } = await import('./dateUtils')
    const currentDateInfo = getCurrentDateInfo()
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Simple Accounting',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的记账助手。用户会用自然语言描述他们的收支情况，你需要：

1. 理解用户的描述并提取关键信息
2. 识别和转换中文数字（如"三块"="3", "五毛"="0.5", "十五元"="15"等）
3. 如果能够提取完整的记账信息，请输出JSON格式的数据
4. 如果信息不完整，用自然语言询问缺失信息

**当能够提取完整信息时，请严格按照以下JSON格式输出：**
\`\`\`json
{
  "type": "expense" | "income",
  "amount": 数字,
  "category": "分类名称",
  "description": "具体描述",
  "date": "YYYY-MM-DD",
  "message": "友好的确认消息"
}
\`\`\`

**字段说明：**
- category: 根据用户分类选择最合适的分类名称
- description: 用户的具体描述内容（如"洗衣服"、"买咖啡"、"打车回家"等）
- date: 根据用户描述推断的账单具体日期，格式为YYYY-MM-DD

**用户账本的可用分类：**
${categories ? categories.map(cat => 
  `- ${cat.type === 'expense' ? '支出' : '收入'}：${cat.name.split(';').join('、')}`
).join('\n') : '暂无可用分类'}

**中文数字转换示例：**
- 三块/三元 = 3
- 五毛/五角 = 0.5  
- 十五 = 15
- 二十 = 20
- 三千五 = 3500

**日期识别规则：**
- 今天/刚才/现在 → 使用今天日期
- 昨天/昨日 → 使用昨天日期
- 前天/前日 → 使用前天日期
- 上周一/上周二...上周日 → 计算上周对应日期
- 这周一/这周二...这周日 → 计算本周对应日期
- 上个月/上月 → 使用上个月同一天
- X号/X日 → 使用本月X号（如果已过则推断为下月）
- 没有明确时间表达 → 默认使用今天日期

**当前日期参考：** ${currentDateInfo}，请以此为基准进行日期计算

**输入输出示例：**

用户："洗衣服花了三块"
输出：
\`\`\`json
{
  "type": "expense",
  "amount": 3,
  "category": "日用品",
  "description": "洗衣服",
  "date": "2025-01-10",
  "message": "你记录的支出「洗衣服」3元已添加！"
}
\`\`\`

用户："昨天买咖啡花了十五"
输出：
\`\`\`json
{
  "type": "expense",
  "amount": 15,
  "category": "餐饮",
  "description": "买咖啡",
  "date": "2025-01-09",
  "message": "你记录了昨天的支出「买咖啡」15元！"
}
\`\`\`

用户："上周五吃饭花了50"
输出：
\`\`\`json
{
  "type": "expense",
  "amount": 50,
  "category": "餐饮",
  "description": "吃饭",
  "date": "2025-01-03",
  "message": "你记录了上周五的支出「吃饭」50元！"
}
\`\`\`

**重要说明：**
- 如果找不到匹配的分类，将category设为null或最接近的分类
- description字段必须包含用户的具体描述，这将作为备注保存
- 不要输出项目名称，只需要分类和具体描述

请根据用户描述选择最合适的分类。如果信息不完整，请用自然语言回复，不要输出JSON。`
          },
          ...messages
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API错误响应:', errorText)
      throw new Error(`AI服务错误: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      message: data.choices[0]?.message?.content || '抱歉，我没有理解您的意思，请重新描述。'
    }
  } catch (error) {
    console.error('AI请求失败:', error)
    return {
      success: false,
      message: `抱歉，AI服务暂时不可用：${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

export async function saveAILog(billId: string, userId: string, role: 'user' | 'assistant', content: string) {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const { error } = await supabase
      .from('ai_logs')
      .insert({
        bill_id: billId,
        user_id: userId,
        role,
        content
      })

    if (error) {
      console.error('保存AI日志失败:', error)
    }
  } catch (error) {
    console.error('保存AI日志失败:', error)
  }
} 

export async function saveAILogWithTransaction(billId: string, userId: string, role: 'user' | 'assistant', content: string, linkedTransactionId: string) {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const { error } = await supabase
      .from('ai_logs')
      .insert({
        bill_id: billId,
        user_id: userId,
        role,
        content,
        linked_transaction_id: linkedTransactionId
      })

    if (error) {
      console.error('保存AI日志失败:', error)
    }
  } catch (error) {
    console.error('保存AI日志失败:', error)
  }
} 