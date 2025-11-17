import { prisma } from '@/lib/db';
import type { ConnectedPage } from '@/hooks/use-connected-pages';

/**
 * Server-side function to fetch connected Facebook pages
 */
export async function getConnectedPages(organizationId: string): Promise<ConnectedPage[]> {
  try {
    const pages = await prisma.facebookPage.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        pageId: true,
        pageName: true,
        instagramAccountId: true,
        instagramUsername: true,
        isActive: true,
        lastSyncedAt: true,
        autoSync: true,
      },
    });

    return pages.map((page) => ({
      id: page.id,
      pageId: page.pageId,
      pageName: page.pageName,
      instagramAccountId: page.instagramAccountId,
      instagramUsername: page.instagramUsername,
      isActive: page.isActive,
      lastSyncedAt: page.lastSyncedAt?.toISOString() || null,
      autoSync: page.autoSync,
    }));
  } catch (error) {
    console.error('Error fetching connected pages:', error);
    return [];
  }
}

/**
 * Server-side function to fetch contact counts for multiple pages
 */
export async function getContactCounts(
  organizationId: string,
  pageIds: string[]
): Promise<Record<string, number>> {
  if (pageIds.length === 0) return {};

  try {
    const counts = await prisma.contact.groupBy({
      by: ['facebookPageId'],
      where: {
        facebookPage: {
          organizationId,
          id: { in: pageIds },
        },
      },
      _count: {
        id: true,
      },
    });

    const countsMap: Record<string, number> = {};
    counts.forEach((count) => {
      if (count.facebookPageId) {
        countsMap[count.facebookPageId] = count._count.id;
      }
    });

    // Ensure all pageIds have a count (default to 0)
    pageIds.forEach((pageId) => {
      if (!(pageId in countsMap)) {
        countsMap[pageId] = 0;
      }
    });

    return countsMap;
  } catch (error) {
    console.error('Error fetching contact counts:', error);
    return {};
  }
}

import type { SyncJob } from '@/hooks/use-sync-jobs';

/**
 * Server-side function to fetch active sync jobs
 */
export async function getActiveSyncJobs(
  organizationId: string,
  pageIds: string[]
): Promise<Record<string, SyncJob>> {
  if (pageIds.length === 0) return {};

  try {
    const jobs = await prisma.syncJob.findMany({
      where: {
        facebookPage: {
          organizationId,
          id: { in: pageIds },
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        syncedContacts: true,
        failedContacts: true,
        totalContacts: true,
        tokenExpired: true,
        startedAt: true,
        completedAt: true,
        facebookPageId: true,
      },
      // Get only the latest job per page
      distinct: ['facebookPageId'],
    });

    const jobsMap: Record<string, SyncJob> = {};
    jobs.forEach((job) => {
      if (job.facebookPageId) {
        jobsMap[job.facebookPageId] = {
          id: job.id,
          status: job.status,
          syncedContacts: job.syncedContacts,
          failedContacts: job.failedContacts,
          totalContacts: job.totalContacts,
          tokenExpired: job.tokenExpired,
          startedAt: job.startedAt?.toISOString() || null,
          completedAt: job.completedAt?.toISOString() || null,
        };
      }
    });

    return jobsMap;
  } catch (error) {
    console.error('Error fetching active sync jobs:', error);
    return {};
  }
}

