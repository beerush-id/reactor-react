# `@beerush/reactor-react`

Reactor for React is a Javascript Proxy helper to transform any object/array into
a reactive state that trigger state change whenever the value is changed.

With Reactor, we can simply assign value to the state without calling the hook,
so instead doing `setState([ ...todos ])`, we can simply do `todo.done = true` and the
component will be updated. With recursive enabled, doing `user.todos[0].done = true` also possible!

Let's take a look the sample below:

**Without Reactor**

```jsx
import { useState } from 'react';

const Todos = () => {
  const [ todos, setTodos ] = useState([]);

  const add = () => {
    setTodos([
      ...todos,
      {
        name: 'New Todo',
        done: false
      }
    ]);
  };

  const done = (todo) => {
    todo.done = true;
    setTodos([ ...todos ]);
  };

  return (
    <ul>
      {
        todos.map((todo, i) => {
          return <li key={i} onClick={done}>{todo.name}{todo.done ? ' - Done' : ''}</li>;
        })
      }
    </ul>
  );
};

```

**With Reactor**

```jsx
import { reactive } from '@beerush/reactor-react';

const Todos = () => {
  const todos = reactive([], true);

  const add = () => {
    todos.push({
      name: 'New Todo',
      done: false
    });
  };

  return (
    <ul>
      {
        todos.map((todo, i) => {
          return <li key={i} onClick={() => todo.done = true}>{todo.name}{todo.done ? ' - Done' : ''}</li>;
        })
      }
    </ul>
  );
};

```

## Reactive

**`reactive<T>(object: object | object[], recursive: boolean = false): Reactive<T>`**

Create a reactive object/array that belongs to a single component, just like `useState()` hook.

- **`object`** - The object that will be converted into reactive state.
- **`recursive`** - Convert to reactive object recursively. If set to true, any object/array inside an object/array will
  become reactive.

**Example**

```tsx
import { reactive } from '@beerush/reactor-react';

type Auth = {
  loading: boolean;
}

// Change Loading... to Loaded! after 5 seconds.
const Auth = () => {
  const state = reactive<Auth>({ loading: true });

  setTimeout(() => {
    state.loading = false;
  }, 5000);

  return state.loading ? (<h1>Loading...</h1>) : (<h1>Loaded!</h1>);
};
```

## Global State

**`resistant<T, R>(name:string, object: object | object[], recursive: boolean = true): Reactive<T>`**

Global State (named state) will allow us to share state across components, anywhere inside the app.

- **`name`** - The state name.
- **`object`** - The object that will be converted into reactive state.
- **`recursive`** - Convert recursively, `true` by default.

For example, in the header we have a component that display the current user's name, and in the Edit User form
we're also using the same data. When the name in the form updated, the name in the header also updated.

**Example**

```tsx
import { resistant } from '@beerush/reactor-react';

type User = {
  name: string;
}

const user = resistant('current-user', {});

// user-menu.tsx
export const UserMenu = () => {
  const user = resistant<User>('current-user');
  return (<span>{ user.name || 'No Name' }</span>);
};

// user-form.tsx
export const UserForm = () => {
  const user = resistant<User>('current-user');
  return (
          <form action="">
            <input type="text" value={ user.name } onChange={ e => user.name = e.target.value }/>
          </form>
  );
};

// index.tsx
export default () => {
  const { Provider } = resistant<User>('current-user');

  return (
          <Provider>
            <header>
              <UserMenu/>
            </header>
            <main>
              <UserForm/>
            </main>
          </Provider>
  );
}

```

## Persistent State

**`persistent<T, R>(name:string, object: object | object[], recursive: boolean = true): Reactive<T>`**

Just like Global State, Persistent State also global, but it's persistent. Whenever the state changed,
it'll write the state to `localStorage`. The state is restored when the browser reloaded, and during SSR
the component is not rendered because it uses `useEffect()` inside.

> When implementing persistent state, please note that if you change the data structure
> that could break the app, you need to upgrade the store version, or handle it to sync the changes.
> 
> To upgrade the store version, we can use `upgrade(VERSION)`. The initial version is `1.0.0`,
> but we can use any string to make sure the version is different.
> 
> When upgrading the store version, the states will be reset to the initial states.
 
