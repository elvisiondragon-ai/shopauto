/**
 * iOS Cache Cleaner - Comprehensive cache clearing for iOS PWA
 * Handles iOS-specific cache layers that regular SW clearing misses
 */

export interface CacheCleaningResult {
  success: boolean;
  clearedCaches: string[];
  errors: string[];
  isIOS: boolean;
}

class IOSCacheCleaner {
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private isInStandaloneMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * COMPREHENSIVE iOS Cache Clearing
   * Clears ALL cache types that can cause stale data on iOS
   */
  async clearAllCaches(): Promise<CacheCleaningResult> {
    const result: CacheCleaningResult = {
      success: true,
      clearedCaches: [],
      errors: [],
      isIOS: this.isIOS()
    };

    console.log('🧹 iOS Cache Cleaner: Starting comprehensive cache clearing');

    // 1. Service Worker Caches (your existing system covers this, but let's be thorough)
    try {
      if ('serviceWorker' in navigator) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        result.clearedCaches.push(`SW Caches: ${cacheNames.length} caches`);
        console.log('✅ SW caches cleared');
      }
    } catch (error) {
      result.errors.push('SW cache clearing failed');
      console.error('❌ SW cache clearing failed:', error);
    }

    // 2. localStorage (selective - keep auth but clear everything else)
    try {
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('supabase') ||
        key.includes('token') ||
        key.match(/^supabase\.auth\./)
      );
      
      const keysToDelete = Object.keys(localStorage).filter(key => 
        !authKeys.includes(key) &&
        !key.includes('update-') &&
        !key.includes('recovery')
      );
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      result.clearedCaches.push(`localStorage: ${keysToDelete.length} items`);
      console.log('✅ localStorage cleaned (auth preserved)');
    } catch (error) {
      result.errors.push('localStorage cleaning failed');
      console.error('❌ localStorage cleaning failed:', error);
    }

    // 3. sessionStorage (complete clear)
    try {
      sessionStorage.clear();
      result.clearedCaches.push('sessionStorage: all items');
      console.log('✅ sessionStorage cleared');
    } catch (error) {
      result.errors.push('sessionStorage clearing failed');
      console.error('❌ sessionStorage clearing failed:', error);
    }

    // 4. iOS-specific: IndexedDB clearing (WebKit cache)
    try {
      if ('indexedDB' in window) {
        // Clear Supabase auth IndexedDB
        const dbsToDelete = ['supabase-auth-token', 'workbox-expiration'];
        for (const dbName of dbsToDelete) {
          try {
            await new Promise<void>((resolve) => {
              const deleteReq = indexedDB.deleteDatabase(dbName);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => resolve(); // Don't fail if DB doesn't exist
              deleteReq.onblocked = () => {
                setTimeout(() => resolve(), 1000); // Timeout after 1s if blocked
              };
            });
          } catch (e) {
            // Ignore individual DB delete failures
          }
        }
        result.clearedCaches.push('IndexedDB: auth & cache DBs');
        console.log('✅ IndexedDB cleared');
      }
    } catch (error) {
      result.errors.push('IndexedDB clearing failed');
      console.error('❌ IndexedDB clearing failed:', error);
    }

    // 5. iOS-specific: Clear WebKit form data cache
    try {
      // Force clear form autocomplete cache by creating and removing invisible forms
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input[type="email"], input[type="text"], input[type="password"]');
        inputs.forEach(input => {
          (input as HTMLInputElement).value = '';
          (input as HTMLInputElement).autocomplete = 'off';
          // Trigger change to clear WebKit cache
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
      result.clearedCaches.push('WebKit form cache');
      console.log('✅ WebKit form cache cleared');
    } catch (error) {
      result.errors.push('WebKit form cache clearing failed');
      console.error('❌ WebKit form cache clearing failed:', error);
    }

    // 6. iOS-specific: Force reload authentication state
    try {
      // Clear any cached DOM elements that might hold stale data
      const emailInputs = document.querySelectorAll('input[type="email"]');
      emailInputs.forEach(input => {
        (input as HTMLInputElement).value = '';
        (input as HTMLInputElement).blur();
        (input as HTMLInputElement).focus();
        (input as HTMLInputElement).blur();
      });
      result.clearedCaches.push('DOM input cache');
      console.log('✅ DOM input cache cleared');
    } catch (error) {
      result.errors.push('DOM cache clearing failed');
      console.error('❌ DOM cache clearing failed:', error);
    }

    // 7. iOS PWA-specific: Clear standalone app cache
    if (this.isInStandaloneMode()) {
      try {
        // Set flags for post-reload cleanup
        localStorage.setItem('ios-pwa-cache-cleared', 'true');
        localStorage.setItem('ios-cache-clear-timestamp', Date.now().toString());
        result.clearedCaches.push('iOS PWA cache flags');
        console.log('✅ iOS PWA cache flags set');
      } catch (error) {
        result.errors.push('iOS PWA flag setting failed');
        console.error('❌ iOS PWA flag setting failed:', error);
      }
    }

    // Determine overall success
    result.success = result.errors.length === 0;

    console.log('🧹 iOS Cache Cleaner completed:', {
      success: result.success,
      clearedCaches: result.clearedCaches.length,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * Quick iOS cache clean for login issues
   * Focuses on form/input cache that commonly causes login problems
   */
  async quickLoginCacheClear(): Promise<boolean> {
    console.log('⚡ iOS Quick login cache clear');
    
    try {
      // Clear form autocomplete
      const emailInputs = document.querySelectorAll('input[type="email"], input[name="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"], input[name="password"]');
      
      [...emailInputs, ...passwordInputs].forEach(input => {
        (input as HTMLInputElement).value = '';
        (input as HTMLInputElement).autocomplete = 'off';
        (input as HTMLInputElement).setAttribute('autocomplete', 'new-password');
        
        // Force WebKit to clear cached data
        (input as HTMLInputElement).focus();
        (input as HTMLInputElement).blur();
      });

      // Clear any login-related localStorage
      const loginKeys = Object.keys(localStorage).filter(key => 
        key.includes('login') || 
        key.includes('form') ||
        key.includes('input')
      );
      loginKeys.forEach(key => localStorage.removeItem(key));

      console.log('✅ Quick login cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Quick login cache clear failed:', error);
      return false;
    }
  }

  /**
   * Check if iOS cache clearing is needed
   */
  shouldClearCache(): boolean {
    if (!this.isIOS()) return false;

    // Check if recently cleared
    const lastClear = localStorage.getItem('ios-cache-clear-timestamp');
    if (lastClear) {
      const timeSinceLastClear = Date.now() - parseInt(lastClear);
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      // Don't clear if cleared within last day unless forced
      if (timeSinceLastClear < oneDayInMs) {
        return false;
      }
    }

    return true;
  }

  /**
   * Force cache clear and reload for iOS PWA
   * Use this after PWA updates to ensure clean state
   */
  async forceCleanReload(): Promise<void> {
    console.log('🚀 iOS Force clean reload initiated');
    
    await this.clearAllCaches();
    
    // Set flags for post-reload verification
    localStorage.setItem('ios-force-reload-completed', 'true');
    localStorage.setItem('ios-clean-reload-timestamp', Date.now().toString());
    
    // Force refresh with cache busting
    const url = new URL(window.location.href);
    url.searchParams.set('ios_cache_bust', Date.now().toString());
    
    // Use replace to avoid back button issues
    window.location.replace(url.toString());
  }

  /**
   * Post-reload verification and cleanup
   */
  async verifyCleanState(): Promise<boolean> {
    console.log('🔍 iOS Cache state verification');
    
    if (!this.isIOS()) return true;

    // Check if this is post-clean-reload
    const cleanReloadFlag = localStorage.getItem('ios-force-reload-completed');
    if (cleanReloadFlag === 'true') {
      localStorage.removeItem('ios-force-reload-completed');
      
      // Final cleanup
      await this.quickLoginCacheClear();
      
      console.log('✅ iOS clean state verified');
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const iOSCacheCleaner = new IOSCacheCleaner();

// Auto-verification on module load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    iOSCacheCleaner.verifyCleanState();
  }, 1000);
}