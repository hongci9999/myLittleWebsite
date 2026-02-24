import { Link } from 'react-router-dom'
import { MAIN_NAV } from '@/shared/config/nav'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MainPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">myLittleWebsite</h1>
      <p className="text-muted-foreground mb-8">
        자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MAIN_NAV.map(({ path, label, description }) => (
          <Card
            key={path}
            className="hover:border-primary/50 transition-colors"
          >
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link to={path}>이동</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
