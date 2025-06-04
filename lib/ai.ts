const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_Router_API_KEY!

export async function sendChatMessage(messages: Array<{ role: 'user' | 'assistant', content: string }>) {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('API密钥未配置')
    }
    
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
1. 理解用户的描述
2. 提取关键信息：金额、类型（收入/支出）、项目名称
3. 用友好的语言回复用户
4. 如果信息不完整，礼貌地询问缺失的信息

请用简洁、友好的中文回复。`
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