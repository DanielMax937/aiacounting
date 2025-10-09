import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import WishlistContent from '@/app/components/wishlist/wishlist-content';

interface WishlistPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: WishlistPageProps) {
  const { locale } = await params;
  const t = await getTranslations('wishlist');

  return {
    title: t('title'),
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale } = await params;
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

  return <WishlistContent
    userId={user.id}
    locale={locale}
    hasActivatedInviteCode={true}
  />;
} 