import {
  forget,
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
import { ElementType, useContext, useState } from 'react';
import { inject } from './context';

export type ReactiveState = {
  Provider: ElementType;
}

const reactStore = ReactiveStore;
const persistStore = PersistentStore;

for (const [ , value ] of Object.entries(persistStore.store)) {
  if ((value as any).provider) {
    inject(value.data, true);
  }
}

export function reactive<T extends ReactAble, R extends boolean = false>(
  object: T,
  recursive?: boolean
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if ('subscribe' in object) {
    const [ , setState ] = useState(object);
    const unsubscribe = (object as Reactive<T>).subscribe(() => {
      setState(Array.isArray(object) ? [ ...object ] : { ...object as any });
      // unsubscribe();
    }, false);

    return object as Reactivities<T>;
  } else {
    const [ state, setState ] = useState<Reactive<T>>(object as never);
    const reacted = react(state, recursive);
    const unsubscribe = reacted.subscribe(() => {
      setState(Array.isArray(state) ? [ ...state as never ] : { ...state } as any);
      // unsubscribe();
    }, false);

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
    persistStore.store[name] = { data, recursive, provider: false } as never;
    data.subscribe(() => {
      persistStore.write();
    }, false);
  }

  return persistStore.store[name].data as Reactivities<T>;
}

export function resistant<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive?: boolean
): (R extends true
    ? Reactivities<T>
    : Reactive<T>) & ReactiveState {
  if (typeof window === 'undefined') {
    inject(object);
    return reactive(object, recursive) as never;
  }

  if (!reactStore[name]) {
    inject(object);
    reactStore[name] = react(object, recursive, [ 'set', 'subscribe', '__context', 'Provider' ]) as never;
  }

  const reacted = reactStore[name] as Reactive<T>;
  const [ , dispatch ] = useContext((reacted as any).__context) as any;
  const unsubscribe = reacted.subscribe((s, p, v, action) => {
    unsubscribe();
    if (typeof dispatch === 'function') {
      dispatch(action);
    }
  }, false);

  return reacted as never;
}

export function persistent<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true
): (R extends true
    ? Reactivities<T>
    : Reactive<T>) & ReactiveState {
  if (typeof window === 'undefined') {
    inject(object, true);
    return reactive(object, recursive) as never;
  }

  if (!persistStore.store[name]) {
    inject(object, true);
    const data = react<T, R>(object, recursive, [ 'set', 'subscribe', '__context', 'Provider' ]);
    data.subscribe(() => persistStore.write());
    persistStore.store[name] = { data, recursive, provider: true } as never;
    persistStore.write();
  }

  const reacted = persistStore.store[name].data as Reactive<T>;
  const [ , emit ] = useContext((reacted as any).__context) as any;
  const unsubscribe = reacted.subscribe((s, p, v, action) => {
    unsubscribe();
    if (typeof emit === 'function') {
      emit(action);
    }
  }, false);

  return reacted as never;
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
  purge
};
