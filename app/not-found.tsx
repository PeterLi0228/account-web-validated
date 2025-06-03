import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-700">
            页面未找到
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            抱歉，您访问的页面不存在或已被移动。
          </p>
          <div className="space-y-2">
            <Link href="/" className="block">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                返回首页
              </Button>
            </Link>
            <Link href="/bills" className="block">
              <Button variant="outline" className="w-full">
                账本管理
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 