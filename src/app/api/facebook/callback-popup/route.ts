import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { exchangeCodeForToken, getLongLivedToken } from '@/lib/facebook/auth';

/**
 * Special callback handler for popup-based OAuth flow
 * Returns an HTML page that communicates with the parent window
 */
export async function GET(request: NextRequest) {
  console.log('=== FACEBOOK POPUP CALLBACK DEBUG ===');
  console.log('Request URL:', request.url);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(
        getPopupHTML('error', 'Not authenticated', null),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');

    // Handle user cancellation or errors
    if (error) {
      let errorMessage = 'Facebook authorization failed';
      if (error === 'access_denied') {
        errorMessage = 'You cancelled the Facebook authorization';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      }
      
      return new NextResponse(
        getPopupHTML('error', errorMessage, null),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      return new NextResponse(
        getPopupHTML('error', 'No authorization code received', null),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Verify state parameter (CSRF protection)
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        if (decodedState.organizationId !== session.user.organizationId) {
          throw new Error('Invalid state parameter');
        }
      } catch {
        return new NextResponse(
          getPopupHTML('error', 'Security validation failed', null),
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
    }

    // Exchange code for access token
    // IMPORTANT: Must pass the same redirect_uri that was used in the OAuth dialog
    const popupRedirectUri = `${baseUrl}/api/facebook/callback-popup`;
    const shortLivedToken = await exchangeCodeForToken(code, popupRedirectUri);
    const userAccessToken = await getLongLivedToken(shortLivedToken);
    
    console.log('✅ Successfully obtained access token');
    console.log('=== END POPUP CALLBACK DEBUG ===');

    // Return success page that communicates with parent
    return new NextResponse(
      getPopupHTML('success', 'Successfully connected to Facebook!', userAccessToken),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: unknown) {
    console.error('❌ Facebook popup callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new NextResponse(
      getPopupHTML('error', errorMessage, null),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Generate HTML page that sends message to parent window and closes
 */
function getPopupHTML(status: 'success' | 'error', message: string, token: string | null): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facebook Authentication</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    .success { color: #10b981; }
    .error { color: #ef4444; }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }
    p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    .spinner {
      border: 3px solid #f3f4f6;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 1rem auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${status}">${status === 'success' ? '✓' : '✗'}</div>
    <h1>${status === 'success' ? 'Success!' : 'Error'}</h1>
    <p>${message}</p>
    <div class="spinner"></div>
    <p style="font-size: 0.875rem; color: #9ca3af;">Closing window...</p>
  </div>
  
  <script>
    (function() {
      // Send message to parent window
      if (window.opener) {
        const messageData = {
          type: 'FACEBOOK_AUTH_${status.toUpperCase()}',
          ${status === 'success' && token ? `token: '${token}',` : ''}
          ${status === 'error' ? `error: '${message.replace(/'/g, "\\'")}',` : ''}
        };
        
        console.log('Sending message to parent:', messageData);
        window.opener.postMessage(messageData, window.location.origin);
      }
      
      // Close window after a short delay
      setTimeout(function() {
        window.close();
      }, 2000);
    })();
  </script>
</body>
</html>
  `.trim();
}

