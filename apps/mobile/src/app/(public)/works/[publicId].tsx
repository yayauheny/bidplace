import { Redirect, useLocalSearchParams } from 'expo-router';

import {
  SEARCH_OVERLAY_PARAM,
  SEARCH_OVERLAY_QUERY_PARAM,
  SEARCH_OVERLAY_TAB_PARAM,
} from '../../../features/search/search-overlay-route';

export default function WorkShareAlias() {
  const { publicId, tab, overlay, oq, otab } = useLocalSearchParams<{
    publicId: string;
    tab?: string;
    overlay?: string;
    oq?: string;
    otab?: string;
  }>();
  return (
    <Redirect
      href={{
        pathname: '/product/[publicId]',
        params: {
          publicId,
          ...(tab ? { tab } : {}),
          // Search overlay state lives in the query and must survive the
          // alias hop, like the Work tab above.
          ...(overlay ? { [SEARCH_OVERLAY_PARAM]: overlay } : {}),
          ...(oq ? { [SEARCH_OVERLAY_QUERY_PARAM]: oq } : {}),
          ...(otab ? { [SEARCH_OVERLAY_TAB_PARAM]: otab } : {}),
        },
      }}
    />
  );
}
