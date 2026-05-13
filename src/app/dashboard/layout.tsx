import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = createServiceClient();
  const { data: profile } = await supabase.from('profiles').select('*, agencies(*)').eq('clerk_user_id', userId).single();
  if (!profile || !profile.agency_id) redirect('/onboarding');

  const agency = profile.agencies;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar agencyName={agency?.name || 'Agency'} userRole={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userName={profile.full_name || profile.email} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
