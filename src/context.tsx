import { createContext, useEffect, useReducer, useState } from 'react';

export function inject<T>(object: T, suspense?: boolean) {
  const reducer = (state: any, action: string) => {
    if (action) {
      return Array.isArray(state) ? [ ...state ] : { ...state };
    } else {
      return state;
    }
  };

  const Context = createContext([] as any);

  const Provider = ({ children }: any) => {
    const [ state, dispatch ] = useReducer(reducer, object);

    if (suspense) {
      const [ show, setShow ] = useState(false);

      useEffect(() => {
        setShow(true);
      });

      return show ? (
        <Context.Provider value={ [ state, dispatch ] }>
          { children }
        </Context.Provider>
      ) : '';
    } else {
      return (
        <Context.Provider value={ [ state, dispatch ] }>
          { children }
        </Context.Provider>
      );
    }
  };

  Object.defineProperty(object, '__context', {
    value: Context,
    enumerable: false
  });

  Object.defineProperty(object, 'Provider', {
    value: Provider,
    enumerable: false
  });
}
