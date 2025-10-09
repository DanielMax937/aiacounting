import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import StatisticsContent from '@/app/components/statistics/statistics-content';
import { createClient } from '@/app/lib/supabase/server';

interface StatisticsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: StatisticsPageProps) {
  const { locale } = await params;
  const t = await getTranslations('statistics');
  
  return {
    title: t('title'),
  };
}

export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const { locale } = await params;
  const t = await getTranslations('statistics');
  
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();

  const isExpired = !session || (session.expires_at! * 1000 < Date.now());

  if (isExpired) {
    console.log("Session is expired or not present");
    redirect(`/${locale}/login`);
  } else {
    console.log("User is still authenticated");
  }
  const user = session?.user!;
  console.log(user);

  return (
    <main className="flex flex-col h-full bg-[#f5f5f5]">
      <StatisticsContent userId={user.id} locale={locale} />
    </main>
  );
} 