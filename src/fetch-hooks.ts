import { type ReactAble, type Reactive, type ReactiveRequest, type Reactivities, resistant } from '@beerush/reactor';
import { replace, replaceItems } from '@beerush/utils';
import { useEffect, useRef, useState } from 'react';

export type FetchProps<T> = {
  data: T;
  status: number;
  statusText: string;
  request: {
    url: string;
    options: Partial<ReactiveRequest>;
  };

  refresh: (options?: Partial<ReactiveRequest>, update?: boolean) => void;
  push: (data?: Partial<T>, options?: Partial<ReactiveRequest>, update?: boolean) => void;

  finishedAt?: Date;
  response?: Response;
  error?: Error;
}
export type FetchState<T extends ReactAble, R extends boolean = true> = R extends true
                                                                        ? Reactivities<FetchProps<T>>
                                                                        : Reactive<FetchProps<T>>;

const activeRequests: {
  [key: string]: Promise<Response>
} = {};

export function useFetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options: Partial<ReactiveRequest> = {}
): FetchState<T, R> {
  const state = usePrefetch(url, init, options);

  useLoader(state);

  return state;
}

export function usePrefetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options: Partial<ReactiveRequest>
): FetchState<T, R> {
  const state = initFetch<T, R>(url, init, options, { status: 0, statusText: '', finishedAt: null as never });
  const [ , setState ] = useState(state);

  useEffect(() => {
    return state.subscribe((o, prop) => {
      if ([ 'status', 'finishedAt' ].includes(prop as never)) {
        setState({ ...state });
      }
    }, false);
  });

  return state;
}

export function useLoader<T extends ReactAble, R extends boolean = true>(state: FetchState<T>): FetchState<T, R> {
  const loaded = useRef(false);
  const { cache, cachePeriod } = state.request.options;
  const [ , setState ] = useState(state);

  useEffect(() => {
    return state.subscribe((o, prop) => {
      if ([ 'status', 'finishedAt' ].includes(prop as never)) {
        loaded.current = true;
        setState({ ...state });
      }
    }, false);
  });

  if (!loaded.current && typeof window !== 'undefined') {
    if (state.finishedAt) {
      if (cache === 'reload') {
        state.refresh();
      } else if (cachePeriod && state.finishedAt) {
        const expired = state.finishedAt.getTime() + (cachePeriod || 6000);
        const current = new Date().getTime();

        if (current >= expired) {
          state.refresh();
        }
      }
    } else {
      state.refresh();
    }
  }

  return state;
}

export function initFetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options: Partial<ReactiveRequest> = {},
  initStatus = {
    status: 200,
    statusText: 'Ok',
    finishedAt: new Date()
  }
): FetchState<T, R> {
  const optKeys = Object.keys(options)
    .filter(k => ![ 'cache', 'cachePeriod', 'recursive' ].includes(k))
    .map(k => `[${ k }:${ JSON.stringify(options[k as never]) }]`);
  const key = `fetch:${ url }${ optKeys.join('') }`;
  const state: FetchState<T, false> = resistant<T, R>(
    key,
    { data: init } as never,
    typeof options.recursive === 'boolean' ? options.recursive : true
  ) as never;

  if (typeof state.refresh !== 'function') {
    Object.assign(state, {
      ...initStatus,
      request: { url, options },
      error: null,
      response: null,
      refresh: (opt?: Partial<ReactiveRequest>, update = true) => {
        if (key in activeRequests) {
          return;
        }

        if (state.status) {
          Object.assign(state, {
            status: 0,
            statusText: '',
            error: null
          });
        }

        activeRequests[key] = fetch(url, (opt || options));
        activeRequests[key]
          .then(async response => {
            state.response = response;

            if (response.status < 400) {
              if (update) {
                try {
                  const data = await response.json();

                  if (JSON.stringify(data) !== JSON.stringify(state.data)) {
                    if (Array.isArray(data) && Array.isArray(state.data)) {
                      replaceItems(state.data, data);
                    } else {
                      replace(state.data, data);
                    }
                  }
                } catch (error) {
                  Object.assign(state, {
                    error,
                    status: 500,
                    statusText: (error as Error).message,
                  });

                  return;
                }
              }
            } else {
              state.error = new Error(response.statusText);
            }

            const { status, statusText } = response;
            Object.assign(state, { status, statusText });
          })
          .catch(error => {
            Object.assign(state, {
              error,
              status: 500,
              statusText: error.message,
            });
          })
          .finally(() => {
            state.finishedAt = new Date();
            delete activeRequests[key];
          });
      },
      push: (data?: Partial<T>, opt?: Partial<ReactiveRequest>, update = true) => {
        if (data) {
          state.refresh({
            method: 'post',
            body: JSON.stringify(data) as never,
            ...(opt || options || {})
          }, update);
        } else if (!opt || (opt && !opt.body)) {
          state.refresh({
            method: 'post',
            body: JSON.stringify(state.data) as never,
            ...(opt || options || {})
          }, update);
        } else {
          state.refresh({
            method: 'post',
            ...(opt || options || {})
          }, update);
        }
      },
    });
  }

  return state as never;
}
