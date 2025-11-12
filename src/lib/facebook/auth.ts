import axios from 'axios';

const FB_GRAPH_VERSION = 'v19.0';
const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/facebook/callback`;

export async function getPageAccessToken(userAccessToken: string, pageId: string) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}`,
      {
        params: {
          fields: 'access_token,name',
          access_token: userAccessToken,
        },
      }
    );

    return {
      pageAccessToken: response.data.access_token,
      pageName: response.data.name,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const fbError = error.response.data.error;
      throw new Error(
        `Facebook API Error (${fbError.code}): ${fbError.message} - Failed to get page access token for Page ID: ${pageId}`
      );
    }
    throw error;
  }
}

export async function getInstagramBusinessAccount(pageAccessToken: string) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/me`,
      {
        params: {
          fields: 'instagram_business_account{id,username,profile_picture_url}',
          access_token: pageAccessToken,
        },
      }
    );

    return response.data.instagram_business_account;
  } catch (error) {
    return null;
  }
}

interface FacebookPageResponse {
  id: string;
  name: string;
  access_token: string;
}

type FacebookPagesApiResponse = {
  data: FacebookPageResponse[];
  paging?: { next?: string };
};

/**
 * Fetch all user's Facebook pages with pagination support
 * Handles pagination to retrieve ALL pages (not just the first 25)
 */
export async function getUserPages(userAccessToken: string): Promise<FacebookPageResponse[]> {
  const allPages: FacebookPageResponse[] = [];
  let currentUrl: string | null = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts`;
  
  try {
    while (currentUrl) {
      const response = await axios.get<FacebookPagesApiResponse>(currentUrl, {
        params: {
          access_token: userAccessToken,
          limit: 100, // Fetch 100 pages per request (max allowed)
        },
      });

      const responseData: FacebookPagesApiResponse = response.data;

      // Add pages from current batch
      if (responseData.data && responseData.data.length > 0) {
        allPages.push(...responseData.data);
      }

      // Check if there are more pages to fetch
      currentUrl = responseData.paging?.next || null;
    }

    return allPages;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const fbError = error.response.data.error;
      throw new Error(
        `Facebook API Error (${fbError.code}): ${fbError.message} - Failed to fetch user pages`
      );
    }
    throw error;
  }
}

/**
 * Exchange OAuth authorization code for user access token
 * @param code - Authorization code from Facebook
 * @param redirectUri - Must match the redirect_uri used in the OAuth dialog (optional, defaults to regular callback)
 */
export async function exchangeCodeForToken(code: string, redirectUri?: string): Promise<string> {
  // Use provided redirect_uri or fall back to the default
  const uri = redirectUri || REDIRECT_URI;
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          redirect_uri: uri,
          code,
        },
      }
    );

    return response.data.access_token;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const fbError = error.response.data.error;
      throw new Error(
        `Facebook API Error (${fbError.code}): ${fbError.message} - Failed to exchange code for access token. Redirect URI used: ${uri}`
      );
    }
    throw error;
  }
}

/**
 * Get long-lived user access token (60 days)
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    return response.data.access_token;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const fbError = error.response.data.error;
      throw new Error(
        `Facebook API Error (${fbError.code}): ${fbError.message} - Failed to get long-lived token`
      );
    }
    throw error;
  }
}

/**
 * Get detailed page information with Instagram account
 */
export async function getPageDetails(pageAccessToken: string, pageId: string) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}`,
      {
        params: {
          fields: 'id,name,access_token,instagram_business_account{id,username}',
          access_token: pageAccessToken,
        },
      }
    );

    return {
      pageId: response.data.id,
      pageName: response.data.name,
      pageAccessToken: response.data.access_token,
      instagramAccount: response.data.instagram_business_account || null,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const fbError = error.response.data.error;
      throw new Error(
        `Facebook API Error (${fbError.code}): ${fbError.message} - Failed to get page details for Page ID: ${pageId}`
      );
    }
    throw error;
  }
}

/**
 * Generate Facebook OAuth URL
 */
export function generateOAuthUrl(state?: string, isPopup?: boolean): string {
  // Use popup callback if in popup mode
  const callbackPath = isPopup ? '/api/facebook/callback-popup' : '/api/facebook/callback';
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}${callbackPath}`;
  
  const params = new URLSearchParams({
    client_id: FB_APP_ID!,
    redirect_uri: redirectUri,
    scope: [
      'pages_show_list',
      'pages_messaging',
      'pages_read_engagement',
      'pages_manage_metadata',
    ].join(','),
    response_type: 'code',
    display: isPopup ? 'popup' : 'page', // Facebook will optimize UI for popup
    ...(state && { state }),
  });

  return `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

