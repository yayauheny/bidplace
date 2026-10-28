import { Redirect, useLocalSearchParams } from 'expo-router';

import {
  SEARCH_OVERLAY_PARAM,
  SEARCH_OVERLAY_QUERY_PARAM,
  SEARCH_OVERLAY_TAB_PARAM,
} from '../../../features/search/search-overlay-route';

export default function AuthorShareAlias() {
  const {
    slug,
    sort,
    category,
    categories,
    overlay,
    oq,
    otab,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    preview,
  } = useLocalSearchParams<{
    slug: string;
    sort?: string;
    category?: string;
    categories?: string;
    overlay?: string;
    oq?: string;
    otab?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    preview?: string;
  }>();
  return (
    <Redirect
      href={{
        pathname: '/seller/[slug]',
        params: {
          slug,
          ...(sort ? { sort } : {}),
          ...(category ? { category } : {}),
          ...(categories ? { categories } : {}),
          // Search overlay state lives in the query and must survive the
          // alias hop, like the author filters above.
          ...(overlay ? { [SEARCH_OVERLAY_PARAM]: overlay } : {}),
          ...(oq ? { [SEARCH_OVERLAY_QUERY_PARAM]: oq } : {}),
          ...(otab ? { [SEARCH_OVERLAY_TAB_PARAM]: otab } : {}),
          ...(utm_source ? { utm_source } : {}),
          ...(utm_medium ? { utm_medium } : {}),
          ...(utm_campaign ? { utm_campaign } : {}),
          ...(utm_content ? { utm_content } : {}),
          ...(preview !== undefined ? { preview } : {}),
        },
      }}
    />
  );
}
