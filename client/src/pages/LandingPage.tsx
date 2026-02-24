import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/shared/hooks/useScrollReveal';
import { Button } from '@/components/ui/button';

const PHRASES = [
  '끊임없이 배워나가는',
  '끝없이 확장해나가는',
  '결국 인간을 위하는 개발자',
];

function RevealSection({
  phrase,
  delay = 0,
}: {
  phrase: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section
      ref={ref}
      className="min-h-[80vh] flex items-center justify-center px-4 transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <p className="text-2xl md:text-4xl font-medium text-center max-w-2xl">
        {phrase}
      </p>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground font-sans">
      {PHRASES.map((phrase, i) => (
        <RevealSection key={phrase} phrase={phrase} delay={i * 100} />
      ))}
      <section className="min-h-[80vh] flex items-center justify-center px-4">
        <Button asChild size="lg">
          <Link to="/main">홈</Link>
        </Button>
      </section>
    </div>
  );
}
