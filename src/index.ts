import {
  Action,
  ARRAY_MUTATIONS,
  forget,
  OBJECT_MUTATIONS,
  PersistentStore,
  purge,
  type ReactAble,
  type Reactive,
  reactive as react,
  ReactiveStore,
  type Reactivities,
  Subscribe,
  Subscriber,
  Unsubscribe,
  upgrade
} from '@beerush/reactor';
import { useEffect, useState } from 'react';

const reactStore = ReactiveStore;
const persistStore = PersistentStore;

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
    const [ state, setState ] = useState<Reactive<T>>(object as never);
    const reacted = react(state, recursive);

    useEffect(() => {
      return reacted.subscribe(() => {
        setState(Array.isArray(state) ? [ ...state as never ] : { ...state } as any);
      }, false, listen);
    });

    return reacted as Reactivities<T>;
  }
}

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
  listen?: Action[]
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive(object, recursive) as never;
  }

  if (!reactStore[name]) {
    reactStore[name] = react(object, recursive) as never;
  }

  return createHook(readable(name, object, recursive), listen);
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
  listen?: Action[]
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive(object, recursive) as never;
  }

  return createHook(writable(name, object, recursive), listen);
}

function createHook<T>(object: Reactive<T>, actions?: Action[]): Reactivities<T> {
  const [ , setState ] = useState(object);

  useEffect(() => {
    return object.subscribe(() => {
      setState(Array.isArray(object) ? [ ...object ] : { ...object as any });
    }, false, actions);
  });

  return object as Reactivities<T>;
}

export {
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
  OBJECT_MUTATIONS,
  ARRAY_MUTATIONS,
};

export * from './writable';
