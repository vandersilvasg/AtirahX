import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient, getSupabaseModule } from '@/lib/supabaseClientLoader';

type OrderConfig = {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
};

type FilterConfig = {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';
  value: unknown;
};

type RowRecord = Record<string, unknown>;

export type UseRealtimeListOptions<T> = {
  table: string;
  schema?: string;
  select?: string;
  order?: OrderConfig;
  limit?: number;
  filters?: FilterConfig[];
  /** Default primary key. Override if your table uses a different key */
  primaryKey?: keyof T & string;
};

function compareValues(value: unknown, filterValue: unknown, operator: FilterConfig['operator']): boolean {
  switch (operator) {
    case 'eq':
      return value === filterValue;
    case 'neq':
      return value !== filterValue;
    case 'gt':
      return value !== null && value !== undefined && filterValue !== null && filterValue !== undefined && value > filterValue;
    case 'gte':
      return value !== null && value !== undefined && filterValue !== null && filterValue !== undefined && value >= filterValue;
    case 'lt':
      return value !== null && value !== undefined && filterValue !== null && filterValue !== undefined && value < filterValue;
    case 'lte':
      return value !== null && value !== undefined && filterValue !== null && filterValue !== undefined && value <= filterValue;
    case 'like':
    case 'ilike':
      return String(value ?? '').includes(String(filterValue ?? ''));
    case 'is':
      return value === filterValue;
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(value);
    default:
      return true;
  }
}

function sortRows<T extends RowRecord>(rows: T[], order?: OrderConfig): T[] {
  if (!order) {
    return rows;
  }

  const { column, ascending = true, nullsFirst = false } = order;
  rows.sort((a, b) => {
    const av = a?.[column];
    const bv = b?.[column];

    if (av === bv) return 0;
    if (av === null || av === undefined) return nullsFirst ? -1 : 1;
    if (bv === null || bv === undefined) return nullsFirst ? 1 : -1;
    return ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  return rows;
}

export function useRealtimeList<T extends RowRecord = RowRecord>(options: UseRealtimeListOptions<T>) {
  const {
    table,
    schema = 'public',
    select = '*',
    order,
    limit,
    filters,
    primaryKey = 'id' as keyof T & string,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef<boolean>(false);
  const orderKey = useMemo(() => JSON.stringify(order ?? null), [order]);
  const filtersKey = useMemo(() => JSON.stringify(filters ?? []), [filters]);
  const stableOrder = useMemo<OrderConfig | undefined>(() => {
    if (orderKey === 'null') return undefined;
    return JSON.parse(orderKey) as OrderConfig;
  }, [orderKey]);
  const stableFilters = useMemo<FilterConfig[] | undefined>(() => {
    const parsed = JSON.parse(filtersKey) as FilterConfig[];
    return parsed.length > 0 ? parsed : undefined;
  }, [filtersKey]);

  useEffect(() => {
    console.log(`[useRealtimeList] Mounting hook for table: ${table}`);
    console.log('[useRealtimeList] Parameters:', { schema, select, order: stableOrder, limit, filters: stableFilters });

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchInitial() {
      console.log(`[useRealtimeList] Starting fetch for ${table}...`);

      const supabase = await getSupabaseClient();
      let query = supabase.from(table).select(select);

      if (stableFilters && stableFilters.length > 0) {
        console.log(`[useRealtimeList] Applying ${stableFilters.length} filter(s)`);
        stableFilters.forEach((filter) => {
          query = query[filter.operator](filter.column, filter.value);
        });
      }

      if (stableOrder) {
        console.log(`[useRealtimeList] Ordering by: ${stableOrder.column} (${stableOrder.ascending ? 'ASC' : 'DESC'})`);
        query = query.order(stableOrder.column, {
          ascending: stableOrder.ascending ?? true,
          nullsFirst: stableOrder.nullsFirst ?? false,
        });
      }

      if (limit) {
        console.log(`[useRealtimeList] Limiting to ${limit} rows`);
        query = query.limit(limit);
      }

      const { data: rows, error: fetchError } = await query;
      console.log(`[useRealtimeList] Fetch completed for ${table}:`, { rowCount: rows?.length, error: fetchError });

      if (!isMounted) {
        console.log('[useRealtimeList] Component unmounted, ignoring result');
        return;
      }

      if (fetchError) {
        console.error(`[useRealtimeList] Error fetching ${table}:`, fetchError);
        setError(fetchError.message);
        setData([]);
      } else {
        console.log(`[useRealtimeList] Loaded ${rows?.length || 0} rows for ${table}`);
        setData((rows as unknown as T[]) ?? []);
      }

      setLoading(false);
      hasLoadedRef.current = true;
    }

    void fetchInitial();

    console.log(`[useRealtimeList] Creating realtime channel for ${table}`);
    let channelCleanup = () => {};

    void (async () => {
      const supabaseModule = await getSupabaseModule();
      if (!isMounted) {
        return;
      }

      const channel = supabaseModule.supabase
        .channel(`realtime:${schema}.${table}`)
        .on('postgres_changes', { event: '*', schema, table }, (payload) => {
          console.log(`[useRealtimeList] Change detected in ${table}:`, payload.eventType);

          setData((current) => {
            const next = [...current];
            const pk = primaryKey as string;

            const matchesFilters = (item: RowRecord | null | undefined) => {
              if (!stableFilters || stableFilters.length === 0) return true;
              return stableFilters.every((filter) => {
                const value = item?.[filter.column];
                return compareValues(value, filter.value, filter.operator);
              });
            };

            if (payload.eventType === 'INSERT') {
              if (matchesFilters(payload.new)) {
                next.unshift(payload.new as T);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedRow = payload.new as T;
              const index = next.findIndex((row) => row?.[pk] === updatedRow?.[pk]);

              if (matchesFilters(payload.new)) {
                if (index !== -1) {
                  next[index] = updatedRow;
                } else {
                  next.unshift(updatedRow);
                }
              } else if (index !== -1) {
                next.splice(index, 1);
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedRow = payload.old as Partial<T> | null;
              const index = next.findIndex((row) => row?.[pk] === deletedRow?.[pk]);
              if (index !== -1) {
                next.splice(index, 1);
              }
            }

            return sortRows(next, stableOrder);
          });
        })
        .subscribe((status) => {
          console.log(`[useRealtimeList] Channel status for ${table}:`, status);
        });

      channelCleanup = () => {
        supabaseModule.supabase.removeChannel(channel);
      };
    })();

    return () => {
      console.log(`[useRealtimeList] Cleaning up hook for ${table}`);
      isMounted = false;
      channelCleanup();
    };
  }, [table, schema, select, limit, primaryKey, orderKey, filtersKey, stableOrder, stableFilters]);

  const count = useMemo(() => data.length, [data]);

  return { data, setData, loading, error, count, hasLoaded: hasLoadedRef.current } as const;
}
