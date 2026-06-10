import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { Palette as C } from '@/constants/theme';

export function useRefreshControl(onRefresh: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[C.primary]}
      tintColor={C.primary}
      progressBackgroundColor={C.card}
    />
  );

  return { refreshing, refreshControl, refresh };
}
