import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { AddTagForm } from '@/app/components/tags/add-tag-form';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';

interface AddTagPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AddTagPage({ params }: AddTagPageProps) {
  // In Next.js 15, we need to await the params
  const { locale } = await params;
  
  unstable_setRequestLocale(locale);
  
  // Use getTranslations instead of useTranslations for server components
  const t = await getTranslations('tags');
  
  // Get the current user with redirection enabled
  // This will automatically redirect to login if not authenticated
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
  
  // Only pass the user ID to the client component to avoid serialization issues
  const userId = user?.id || null;

  return (
    <div className="h-screen w-full overflow-hidden">
      <AddTagForm userId={userId} locale={locale} />
    </div>
  );
} 