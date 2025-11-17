import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface OAuthState {
  token: string | null;
  error: string | null;
  isProcessing: boolean;
}

/**
 * Hook for handling Facebook OAuth flow
 */
export function useFacebookOAuth() {
  const [state, setState] = useState<OAuthState>({
    token: null,
    error: null,
    isProcessing: false,
  });
  const [showPageSelector, setShowPageSelector] = useState(false);
  const searchParams = useSearchParams();

  // Handle OAuth callback from URL params
  useEffect(() => {
    const facebookAuth = searchParams.get('facebook_auth');
    const fbToken = searchParams.get('fb_token');
    const error = searchParams.get('error');
    const errorDetails = searchParams.get('error_details');

    if (error && !state.isProcessing) {
      setState({ token: null, error, isProcessing: true });

      let errorMessage = 'Failed to connect Facebook';
      switch (error) {
        case 'access_denied':
          errorMessage = 'Facebook authorization was cancelled';
          break;
        case 'missing_code':
          errorMessage = 'Invalid Facebook response';
          break;
        case 'invalid_state':
          errorMessage = 'Security validation failed';
          break;
        case 'callback_failed':
          errorMessage = errorDetails
            ? `Failed to complete Facebook connection: ${decodeURIComponent(errorDetails)}`
            : 'Failed to complete Facebook connection. Check server logs for details.';
          break;
      }

      toast.error(errorMessage, { duration: 10000 });
      
      // Clear error from URL
      window.history.replaceState({}, '', '/settings/integrations');
      
      setState({ token: null, error: null, isProcessing: false });
    }

    if (facebookAuth === 'success' && fbToken && !state.isProcessing) {
      setState({ token: fbToken, error: null, isProcessing: true });
      setShowPageSelector(true);
      
      // Clear params from URL
      window.history.replaceState({}, '', '/settings/integrations');
      
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [searchParams, state.isProcessing]);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
        if (event.data.token) {
          setState({ token: event.data.token, error: null, isProcessing: false });
          setShowPageSelector(true);
        }
      } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
        const errorMessage = event.data.error || 'Failed to connect Facebook';
        toast.error(errorMessage);
        setState({ token: null, error: errorMessage, isProcessing: false });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connectFacebook = useCallback(() => {
    // Open OAuth in popup window for better UX
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '/api/facebook/oauth?popup=true',
      'Facebook Login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Monitor popup closure
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        // Popup closed - user may have completed or cancelled
        // The message handler will process the result
      }
    }, 500);

    // Cleanup interval after 5 minutes
    setTimeout(() => clearInterval(checkPopup), 5 * 60 * 1000);
  }, []);

  const resetOAuth = useCallback(() => {
    setState({ token: null, error: null, isProcessing: false });
    setShowPageSelector(false);
  }, []);

  return {
    token: state.token,
    error: state.error,
    showPageSelector,
    setShowPageSelector,
    connectFacebook,
    resetOAuth,
  };
}

