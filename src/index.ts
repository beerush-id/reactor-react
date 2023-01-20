import {
  Action,
  ARRAY_MUTATIONS,
  fetch as load,
  forget,
  History,
  OBJECT_MUTATIONS,
  PersistentStore,
  prefetch as preload,
  purge,
  type ReactAble,
  type Reactive,
  reactive as react,
  ReactiveRequest,
  ReactiveResponse,
  ReactiveStore,
  type Reactivities,
  setBaseURL,
  Subscribe,
  Subscriber,
  Unsubscribe,
  upgrade,
  watch as monitor
} from '@beerush/reactor';
import { useEffect, useRef, useState } from 'react';

const reactStore = ReactiveStore;
const persistStore = PersistentStore;

export function watch<T extends ReactAble>(state: Reactive<T>, props?: string[]): Reactivities<History<T>> {
  const history = useRef<any>(null);

  if (!history.current) {
    history.current = monitor(state);
  }

  const [ , setState ] = useState(state);

  useEffect(() => {
    return history.current.subscribe(() => {
      setState({ ...state });
    }, false, undefined, props);
  });

  return history.current;
}

export function fetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options?: Partial<ReactiveRequest>
): ReactiveResponse<T, R> {
  const loaded = useRef(false);
  const { cache, cachePeriod } = options || {};

  if (typeof options === 'object') {
    delete (options as any).cache;
    delete (options as any).cachePeriod;
  }

  const state = load(url, init, options);
  const [ , setState ] = useState(state);

  useEffect(() => {
    return state.subscribe((o, prop) => {
      if ([ '__status', '__finishedAt' ].includes(prop as never)) {
        loaded.current = true;
        setState(Array.isArray(state) ? [ ...state ] : { ...state as any });
      }
    }, false);
  });

  if (!loaded.current && state.__finishedAt) {
    if (cache === 'reload') {
      state.__refresh();
    } else if (cachePeriod) {
      const period = state.__finishedAt.getTime() + (cachePeriod || 6000);
      const now = new Date().getTime();

      if (now >= period) {
        state.__refresh();
      }
    }
  }

  return state;
}

export function prefetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options?: Partial<ReactiveRequest>
): ReactiveResponse<T> {
  const state = preload(url, init, options);
  const [ , setState ] = useState(state);

  useEffect(() => {
    return state.subscribe((o, prop) => {
      if ([ '__status', '__finishedAt' ].includes(prop as never)) {
        setState(Array.isArray(state) ? [ ...state ] : { ...state as any });
      }
    }, false);
  });

  return state;
}

fetch.ref = load;

export function subscribe<T extends ReactAble>(
  state: Reactive<T>,
  actions?: Action[],
  props?: Array<keyof T> | string[]
) {
  if ('subscribe' in state) {
    return createHook(state, actions, props as string[]);
  } else {
    throw new Error('State must be a Reactive Object/Array!');
  }
}

export function reactive<T extends ReactAble, R extends boolean = false>(
  object: T,
  recursive?: boolean,
  listen?: Action[]
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if ('subscribe' in object) {
    return createHook(object as Reactive<T>, listen);
  } else {
    const state = useRef<Reactivities<T>>(null as never);

    if (!state.current) {
      state.current = react<T, true>(object, recursive);
    }

    const [ , setState ] = useState<Reactive<T>>(state.current as never);

    useEffect(() => {
      return state.current.subscribe(() => {
        setState(Array.isArray(object) ? [ ...state.current as never ] : { ...state.current } as any);
      }, false, listen);
    });

    return state.current;
  }
}

reactive.ref = react;

export function readable<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true
): R extends true ? Reactivities<T> : Reactive<T> {
  if (typeof window === 'undefined') {
    return react<T>(object, recursive) as Reactivities<T>;
  }

  if (!reactStore[name]) {
    reactStore[name] = react<T>(object, recursive) as never;
  }

  return reactStore[name];
}

export function resistant<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive?: boolean,
  actions?: Action[],
  props?: Array<keyof T> | string[]
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive(object, recursive) as never;
  }

  if (!reactStore[name]) {
    reactStore[name] = react(object, recursive) as never;
  }

  return createHook(readable(name, object, recursive), actions, props as string[]);
}

export function writable<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true
): R extends true ? Reactivities<T> : Reactive<T> {
  if (typeof window === 'undefined') {
    return react<T>(object, recursive) as Reactivities<T>;
  }

  if (!persistStore.store[name]) {
    const data = react<T>(object, recursive);
    persistStore.store[name] = { data, recursive } as never;
    data.subscribe(() => {
      persistStore.write();
    }, false);
  }

  return persistStore.store[name].data as Reactivities<T>;
}

export function persistent<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true,
  actions?: Action[],
  props?: Array<keyof T> | string[]
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive(object, recursive) as never;
  }

  return createHook(writable(name, object, recursive), actions, props as string[]);
}

function createHook<T>(object: Reactive<T>, actions?: Action[], props?: string[]): Reactivities<T> {
  const [ , setState ] = useState(object);

  useEffect(() => {
    return object.subscribe(() => {
      setState(Array.isArray(object) ? [ ...object ] : { ...object as any });
    }, false, actions, props);
  });

  return object as Reactivities<T>;
}

export {
  ARRAY_MUTATIONS,
  OBJECT_MUTATIONS,
  Action,
  History,
  Reactive,
  Reactivities,
  ReactAble,
  ReactiveStore,
  PersistentStore,
  Subscribe,
  Subscriber,
  Unsubscribe,
  upgrade,
  forget,
  purge,
  react as reactable,
  ReactiveRequest,
  ReactiveResponse,
  setBaseURL,
};

export * from './writable';
