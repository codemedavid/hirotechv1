import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { IntegrationsClient } from '@/components/settings/integrations-client';
import { getConnectedPages, getContactCounts, getActiveSyncJobs } from '@/lib/data/connected-pages';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Connect your Facebook pages for Messenger bulk messaging',
};

async function getTotalContacts(organizationId: string) {
  try {
    const count = await prisma.contact.count({
      where: {
        facebookPage: {
          organizationId,
        },
      },
    });
    return count;
  } catch (error) {
    console.error('Error fetching total contacts:', error);
    return 0;
  }
}

export default async function IntegrationsPage() {
  const session = await auth();
  
  if (!session?.user?.id || !session.user.organizationId) {
    redirect('/login');
  }

  const organizationId = session.user.organizationId;

  // Fetch all data in parallel for optimal performance
  const [totalContacts, pages] = await Promise.all([
    getTotalContacts(organizationId),
    getConnectedPages(organizationId),
  ]);

  // Fetch contact counts and sync jobs for connected pages
  const pageIds = pages.map((p) => p.id);
  const [contactCounts, activeSyncJobs] = await Promise.all([
    getContactCounts(organizationId, pageIds),
    getActiveSyncJobs(organizationId, pageIds),
  ]);

  return (
    <IntegrationsClient
      initialTotalContacts={totalContacts}
      initialPages={pages}
      initialContactCounts={contactCounts}
      initialActiveSyncJobs={activeSyncJobs}
    />
  );
}
