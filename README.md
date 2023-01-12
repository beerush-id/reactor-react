# `@beerush/reactor-react`

Reactor for React is a Javascript Proxy helper to transform any object/array into
a reactive state that trigger state change whenever the value is changed.

With Reactor, we can simply assign value to the state without calling the hook,
so instead doing `todo.done = true; setState([ ...todos ])`, we can simply do `todo.done = true` and the
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

Create a reactive object/array state that belongs to a single component, just like `useState()` hook. When the data
changed,
it will trigger the React hook to render the changes.

- **`object`** - The object that will be converted into reactive state.
- **`recursive`** - Convert to reactive object recursively. If set to true, any object/array inside an object/array will
  become reactive.

> If the given object/array is a reactive object/array (has `.subscribe()` function),
> it will subscribe to it to trigger react hook. It won't re-create the reactive object.

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

**`readable<T, R>(name: string, object: object | object[], recursive = true): Reactive<T>;`**

Global State will allow us to share data across the app, anywhere.
Global state will available until the browser reload, and the states will reset.

### Readable

Readable just create a reactive object/array, and don't trigger react hook when the data changed. To update the
component when data changed,
we need convert it to a reactive state using `reactive()` function.

> Use `resistant()` to create a reactive global state that built with `Provider`.

**Example**

```tsx
import { readable, reactive } from '@beerush/reactor-react';

// index.tsx
export default () => {
  const todos = readable('todo-list', []);
  return (
    <TodoList todos={ todos }></TodoList>
  );
}

// todo-form.tsx
export const TodoForm = ({ todos }) => {
  const items = reactive(todos);

  const add = () => {
    items.push({ id: 10, name: 'New Todo' });
  };

  // ...
};

// todo-list.tsx
export const TodoList = ({ todos }) => {
  const items = reactive(todos);

  return (
    <ul>...</ul>
  )
};

```

In the sample above, whenever and wherever the data changed (e.g. todo added or set `todo.done = true`),
**TodoList** and **TodoForm** will be re-rendered. The index won't be re-rendered
because there is no react hook attached.

> Even though `readable()` still need to be converted to reactive state at the
> component level that consume it, it still recommended because it doesn't need to
> wrap the components with `Provider`.

### Resistant

**`resistant<T, R>(name:string, object: object | object[], recursive: boolean = true): Reactive<T>`**

Resistant will allow us to share state across components, anywhere inside the app. Like Readable, but
it has `Provider` built in.

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

Just like Global State, Persistent State also global, but it's persistent. Whenever the state changed,
it'll write the state to `localStorage`. The states will be restored even if the browser reload.

### Writable

**`writable<T, R>(name: string, object: object | object[], recursive = true): Reactive<T>`**

Writable is just like `readable()`, but it's automatically write the state to `localStorage` when the state changed.
Like `readable()`,
we still need to convert it to reactive state at the component leve.

> Using persistent store with SSR will cause an error about different content
> between the server and client.
> It's because the data is not available on the server
> but will be rendered on the browser.
>
> To prevent this, we need to implement `useEffect()` so it only render in the client side.

**Example**

```tsx
import { reactive, writable } from '@beerush/reactor-react';
import { useEffect, useState } from 'react';

const todos = writable('todo-list', []);
const TodoList = () => {
  const [ show, setShow ] = useState(false);
  const items = reactive(todos);

  useEffect(() => setShow());

  return show ? '...' : '';
};
```

### Persistent

**`persistent<T, R>(name:string, object: object | object[], recursive: boolean = true): Reactive<T>`**

Persistent is like `resistant()`, but it also writes the state to `localStorage` when the data changed.
It has `Provider` and `useEffect()` handler built in. During SSR
the component is not rendered because it uses `useEffect()` inside.

> When implementing persistent state, please note that if you change the data structure
> that could break the app, you need to upgrade the store version, or handle it to sync the changes.
>
> To upgrade the store version, we can use `upgrade(VERSION)`. The initial version is `1.0.0`,
> but we can use any string just to differ the version with the current one.
>
> When upgrading the store version, the states will be reset to the initial states.
 
