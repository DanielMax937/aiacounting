'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/client';
import { ChevronDown, ChevronUp, Maximize2, RefreshCw } from 'lucide-react';
import Decimal from 'decimal.js';
import { RecentRecords } from './recent-records';
import { ImageUpload } from './image-upload';
// import { AndroidWebViewDemo } from './android-webview-demo';

interface RecordItem {
  id: string;
  user_id: string;
  amount: number;
  category: 'income' | 'cost';
  tag_id: number;
  created_at: string;
}

interface UserInfo {
  id: string;
  email?: string;
  user_metadata?: any;
}

interface SessionInfo {
  user: UserInfo | null;
  expires_at?: number;
  access_token?: string;
}

export function HomeContent() {
  // Performance optimizations:
  // 1. Session info caching to reduce auth API calls
  // 2. Session expiration checking with 5-minute buffer
  // 3. Memoized calculations for today's totals
  // 4. Periodic session validation to handle token refresh
  // 5. User ID resolution entirely from session (no props needed)
  
  const t = useTranslations('home');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromHongmeng = searchParams.get('from') === 'hongmeng';
  const locale = pathname.split('/')[1] || 'en';
  const [visible, setVisible] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [recordList, setRecordList] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const recordsContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const loadingMoreRef = useRef<HTMLDivElement>(null);
  const lastCreatedAt = useRef<string | null>(null);
  const pageSize = 20;
  const supabase = createClient();
  
  // Helper function to check if session is expired
  const isSessionExpired = useCallback((sessionInfo: SessionInfo | null): boolean => {
    if (!sessionInfo?.expires_at) return true;
    
    // Check if session expires within the next 5 minutes (300 seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // 5 minutes buffer
    
    return sessionInfo.expires_at <= (currentTime + bufferTime);
  }, []);
  
  // Enhanced authentication check with session info caching
  const checkAuthWithSessionInfo = useCallback(async (): Promise<SessionInfo | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      
      if (!session) {
        return null;
      }
      
      const sessionInfo: SessionInfo = {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata
        },
        expires_at: session.expires_at,
        access_token: session.access_token
      };
      
      return sessionInfo;
    } catch (error) {
      console.error('Exception checking auth:', error);
      return null;
    }
  }, [supabase]);
  
  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      setIsCheckingAuth(true);
      
      try {
        // If we have cached session info and it's not expired, use it
        if (sessionInfo && !isSessionExpired(sessionInfo)) {
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        }
        
        // Otherwise, fetch fresh session info
        const freshSessionInfo = await checkAuthWithSessionInfo();
        setSessionInfo(freshSessionInfo);
        
        const isAuth = freshSessionInfo && !isSessionExpired(freshSessionInfo);
        setIsAuthenticated(!!isAuth);
        
        // If session is invalid, redirect to login
        if (freshSessionInfo && !isAuth) {
          router.refresh();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setSessionInfo(null);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const freshSessionInfo = await checkAuthWithSessionInfo();
        setSessionInfo(freshSessionInfo);
        setIsAuthenticated(!!freshSessionInfo);
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        setSessionInfo(null);
        setIsAuthenticated(false);
        router.refresh();
      } else if (event === 'TOKEN_REFRESHED') {
        // Update session info when token is refreshed
        const freshSessionInfo = await checkAuthWithSessionInfo();
        setSessionInfo(freshSessionInfo);
        setIsAuthenticated(!!freshSessionInfo);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, isSessionExpired, checkAuthWithSessionInfo]);
  
  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated || !sessionInfo) return;
    
    const intervalId = setInterval(async () => {
      if (isSessionExpired(sessionInfo)) {
        // Session is expired or about to expire, refresh it
        const freshSessionInfo = await checkAuthWithSessionInfo();
        setSessionInfo(freshSessionInfo);
        
        if (!freshSessionInfo || isSessionExpired(freshSessionInfo)) {
          setIsAuthenticated(false);
          router.push(`/${locale}/login`);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, sessionInfo, isSessionExpired, checkAuthWithSessionInfo, router, locale]);
  
  // Memoized today's date calculation
  const todayDate = useMemo(() => {
    const current = new Date();
    const timestamp = current.toISOString();
    return timestamp.slice(0, 10);
  }, []);
  
  // Memoized today's records filter
  const todayRecordList = useMemo(() => 
    recordList.filter(item => item.created_at.includes(todayDate)),
    [recordList, todayDate]
  );
  
  // Memoized today's income calculation
  const todayTotalIncome = useMemo(() => 
    todayRecordList.reduce((total, item) =>
      item.category === 'income' ? 
      total.plus(item.amount) : 
      total, new Decimal(0)).toNumber(),
    [todayRecordList]
  );
  
  // Memoized today's expenses calculation
  const todayTotalCost = useMemo(() => 
    todayRecordList.reduce((total, item) =>
      item.category === 'cost' ?
      total.plus(item.amount) : 
      total, new Decimal(0)).toNumber(),
    [todayRecordList]
  );
  
  // Fetch records function
  const fetchRecords = useCallback(async (isInitial = true) => {
    // Use session info for more reliable authentication check
    if (!sessionInfo?.user?.id || !isAuthenticated || isSessionExpired(sessionInfo)) {
      if (isInitial) setIsLoading(false);
      return;
    }
    
    if (isInitial) {
      setIsLoading(true);
      lastCreatedAt.current = null;
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      let query = supabase
        .from('records')
        .select('*')
        .eq('user_id', sessionInfo.user.id)
        .order('created_at', { ascending: false })
        .limit(pageSize);
      
      // If not the initial load, get records older than the last one we have
      if (!isInitial && lastCreatedAt.current) {
        query = query.lt('created_at', lastCreatedAt.current);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching records:', error);
        if (isInitial) setRecordList([]);
      } else {
        // Update state with the new records
        if (isInitial) {
          setRecordList(data || []);
        } else {
          if (data && data.length > 0) {
            setRecordList(prevRecords => [...prevRecords, ...data]);
          }
        }
        
        // Check if we have more records to load
        setHasMoreRecords(data && data.length === pageSize);
        
        // Update the last created_at timestamp for pagination
        if (data && data.length > 0) {
          lastCreatedAt.current = data[data.length - 1].created_at;
        }
      }
    } catch (err) {
      console.error('Exception fetching records:', err);
      if (isInitial) setRecordList([]);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [sessionInfo, isAuthenticated, isSessionExpired, supabase]);
  
  // Initial fetch of records
  useEffect(() => {
    fetchRecords(true);
  }, [fetchRecords]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!fullScreen || !loadingMoreRef.current || !hasMoreRecords) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && hasMoreRecords) {
        fetchRecords(false);
      }
    }, { threshold: 0.5 });
    
    observer.observe(loadingMoreRef.current);
    
    return () => {
      if (loadingMoreRef.current) {
        observer.unobserve(loadingMoreRef.current);
      }
    };
  }, [fullScreen, isLoadingMore, hasMoreRecords, fetchRecords]);
  
  // Handle touch events for swipe up gesture
  useEffect(() => {
    if (!recordsContainerRef.current) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchEndY - touchStartY.current;
      
      // If swipe up (negative deltaY) and the gesture is significant (> 50px)
      if (deltaY < -50 && visible) {
        // setFullScreen(true);
      } else if (deltaY < -50 && fullScreen && hasMoreRecords && !isLoadingMore) {
        // Load more records if we're already in full screen and swiping up again
        fetchRecords(false);
      } else if (deltaY > 50 && fullScreen) {
        // Swipe down to exit full screen
        // setFullScreen(false);
      }
      
      touchStartY.current = null;
    };
    
    const element = recordsContainerRef.current;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [visible, fullScreen, fetchRecords, hasMoreRecords, isLoadingMore]);
  
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse">{t('loading')}</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">{t('pleaseLogin')}</p>
        <Link 
          href={`/${locale}/login`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          {t('login')}
        </Link>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse">{t('loading')}</div>
      </div>
    );
  }
  
  return (
    <>
        {/* Content is conditionally displayed based on fullScreen state */}
        <div className={fullScreen ? 'hidden' : 'block'}>
          {/* Today's totals - styled like the legacy Total component */}
          <div className="text-emerald-500 flex flex-col items-center justify-center text-sm my-24">
            <span>{t('todayExpenses')}</span>
            <span className="text-3xl font-bold my-1">￥{todayTotalCost}</span>
            <span className="text-gray-400">{t('income')} ￥{todayTotalIncome}</span>
          </div>
          
          {/* Add record button - styled like the legacy RecordButton component */}
          <div className="flex justify-center items-center my-5">
            <Link 
              href={`/${locale}/records/new`}
              className="text-sm px-8 py-2 bg-emerald-200 border-2 border-emerald-300 rounded-lg text-gray-800"
            >
              {t('addRecord')}
            </Link>
          </div>
        
        {/* Image Upload Component */}
        { sessionInfo?.user?.id && <ImageUpload userId={sessionInfo.user.id} /> }
        </div>
        
        {/* Records section - can expand to full screen on swipe up */}
        <div 
          ref={recordsContainerRef}
          className={`transition-all duration-300 ${
            fullScreen 
              ? 'fixed inset-0 bg-white z-50 overflow-y-auto pb-32' 
              : ''
          }`}
        >
          {fullScreen && (
            <div className="sticky top-0 bg-white py-3 px-4 border-b flex justify-between items-center z-10">
              <h2 className="text-xl font-semibold">{t('recentRecords')}</h2>
              <button 
                onClick={() => setFullScreen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Toggle recent records - styled like the legacy ShowRecordButton component */}
          {!fullScreen && (
            <button 
              onClick={() => setVisible(!visible)}
              className="text-center text-gray-400 my-5 w-full"
            >
              {t('showRecentRecords')}
              {visible ? 
                <ChevronUp className="inline-block ml-1 w-5 h-5 transform transition-transform" /> : 
                <ChevronDown className="inline-block ml-1 w-5 h-5 transform transition-transform" />
              }
            </button>
          )}
          
          {/* Recent records */}
          {(visible || fullScreen) && (
            <div className={`${fullScreen ? '' : 'relative'} pt-4`}>
              <RecentRecords records={recordList} />
              
              {/* Loading more indicator or end of records message */}
              {fullScreen && (
                <div 
                  ref={loadingMoreRef} 
                  className="text-center py-8"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                      <span className="text-sm text-gray-500">{t('loadingMore')}</span>
                    </div>
                  ) : !hasMoreRecords && recordList.length > 0 ? (
                    <div className="text-sm text-gray-500">{t('noMoreRecords')}</div>
                  ) : recordList.length === 0 ? (
                    <div className="text-sm text-gray-500">{t('noRecords')}</div>
                  ) : null}
                </div>
              )}
              
              {/* Expand to full screen button - only shown when records are visible but not in full screen */}
              {visible && !fullScreen && (
                <div className="text-center mt-2 mb-6">
                  <button 
                    onClick={() => setFullScreen(true)}
                    className="text-sm text-gray-500 flex items-center justify-center mx-auto"
                  >
                    <Maximize2 className="w-4 h-4 mr-1" />
                    {t('expandRecords')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
    </>
  );
} 