import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateOAuthUrl } from '@/lib/facebook/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required environment variables
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    // Log environment variables for debugging
    console.log('=== FACEBOOK OAUTH DEBUG ===');
    console.log('NEXT_PUBLIC_APP_URL:', appUrl || '❌ NOT SET');
    console.log('FACEBOOK_APP_ID:', appId ? '✅ Set' : '❌ NOT SET');
    console.log('FACEBOOK_APP_SECRET:', appSecret ? '✅ Set' : '❌ NOT SET');
    console.log('Redirect URI will be:', `${appUrl}/api/facebook/callback`);

    // Check if required environment variables are set
    if (!appUrl) {
      console.error('❌ NEXT_PUBLIC_APP_URL is not set in environment variables');
      const errorUrl = new URL('/settings/integrations', request.url);
      errorUrl.searchParams.set('error', 'missing_app_url');
      errorUrl.searchParams.set('error_details', 'NEXT_PUBLIC_APP_URL environment variable is not configured. Check your .env file.');
      return NextResponse.redirect(errorUrl);
    }

    if (!appId || !appSecret) {
      console.error('❌ Facebook credentials not configured');
      const errorUrl = new URL('/settings/integrations', request.url);
      errorUrl.searchParams.set('error', 'missing_facebook_credentials');
      errorUrl.searchParams.set('error_details', 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not configured. Check your .env file.');
      return NextResponse.redirect(errorUrl);
    }

    // Check if using localhost
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
      console.warn('⚠️  Using localhost URL. Facebook OAuth requires a public URL.');
      console.warn('⚠️  Consider using ngrok for local testing: https://ngrok.com');
    }

    // Check if this is a popup flow
    const isPopup = request.nextUrl.searchParams.get('popup') === 'true';
    console.log('OAuth flow type:', isPopup ? 'Popup' : 'Regular redirect');

    // Generate state parameter for CSRF protection (can store organizationId)
    const state = Buffer.from(
      JSON.stringify({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        isPopup,
      })
    ).toString('base64');

    const oauthUrl = generateOAuthUrl(state, isPopup);
    console.log('Generated OAuth URL:', oauthUrl);
    console.log('✅ Redirecting to Facebook OAuth...');
    console.log('=== END DEBUG ===');

    // Redirect to Facebook OAuth dialog
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    const err = error as Error;
    console.error('❌ Facebook OAuth initiation error:', err);
    const errorUrl = new URL('/settings/integrations', request.url);
    errorUrl.searchParams.set('error', 'oauth_failed');
    errorUrl.searchParams.set('error_details', encodeURIComponent(err.message || 'Failed to initiate Facebook OAuth'));
    return NextResponse.redirect(errorUrl);
  }
}

