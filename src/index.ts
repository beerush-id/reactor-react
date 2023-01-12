import {
  forget,
  PersistentStore,
  purge,
  type ReactAble,
  type Reactive as ReactiveBase,
  reactive as react,
  ReactiveStore,
  type Reactivities as ReactivitiesBase,
  Subscribe,
  Subscriber,
  Unsubscribe,
  upgrade
} from '@beerush/reactor';
import { ElementType, useContext, useState } from 'react';
import { inject } from './context';

export type Reactive<T> = ReactiveBase<T> & {
  Provider: ElementType;
}
export type Reactivities<T> = ReactivitiesBase<T> & {
  Provider: ElementType;
}

const reactStore = ReactiveStore;
const persistStore = PersistentStore;

for (const [ , value ] of Object.entries(persistStore.store)) {
  inject(value.data, true);
}

export function reactive<T extends ReactAble, R extends boolean = false>(
  object: T,
  recursive?: boolean
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  const [ state, setState ] = useState<Reactive<T>>(object as never);
  const reacted = react(state, recursive);
  const unsubscribe = reacted.subscribe(() => {
    unsubscribe();
    setState(Array.isArray(state) ? [ ...state as never ] : { ...state } as any);
  }, false);

  return reacted as never;
}

export function resistant<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive?: boolean
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if (typeof window === 'undefined') {
    inject(object);
    return reactive(object, recursive);
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
  recursive?: boolean
): R extends true
   ? Reactivities<T>
   : Reactive<T> {
  if (typeof window === 'undefined') {
    inject(object, true);
    return reactive(object, recursive);
  }

  if (!persistStore.store[name]) {
    inject(object, true);
    const data = react<T, R>(object, recursive, [ 'set', 'subscribe', '__context', 'Provider' ]);
    data.subscribe(() => persistStore.write());
    persistStore.store[name] = { data, recursive } as never;
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
