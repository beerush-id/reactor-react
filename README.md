# `@beerush/reactor-react`

Reactor for React is a Javascript Proxy helper to transform any object/array into
a reactive state that trigger state change whenever the value is changed.

With Reactor, we can simply assign value to the state without calling the hook. So, instead
doing `todo.done = true; setState([ ...todos ])`, we can simply do `todo.done = true` and the
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
    <>
      <ul>
        {
          todos.map((todo, i) => {
            return <li key={i} onClick={done}>{todo.name}{todo.done ? ' - Done' : ''}</li>;
          })
        }
      </ul>
      <button onClick={add}>Add Todo</button>
    </>
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
    <>
      <ul>
        {
          todos.map((todo, i) => {
            return <li key={i} onClick={() => todo.done = true}>{todo.name}{todo.done ? ' - Done' : ''}</li>;
          })
        }
      </ul>
      <button onClick={add}>Add Todo</button>
    </>
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
> it will simply subscribe to and register the React hook. It won't re-create the reactive object.

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

Global State will allow us to share data across the app, anywhere. Global state will available until the browser reload,
and the states will reset.

### Readable

**`readable<T, R>(name: string, object: object | object[], recursive = true): Reactive<T>;`**

- **`name`** - The state name.
- **`object`** - The object/array that will be converted to reactive object/array.
- **`recursive`** - Convert recursively, `true` by default.

Readable just create a reactive object/array, and don't trigger react hook when the data changed. To update the
component when data changed, we need convert it to a reactive state using `reactive()` function.

> Use `resistant()` to create a global reactive state that will trigger React hook`.
>
> You can call `readable()` inside or outside a component because it doesn't create a React hook.

**Example**

```tsx
import { reactive, readable } from '@beerush/reactor-react';

// index.tsx
export default () => {
  const todos = readable('todo-list', []);
  return (
    <TodoList todos={ todos }></TodoList>
  );
}

// todo-form.tsx
export const TodoForm = ({ todos }) => {
  reactive(todos);

  const add = () => {
    todos.push({ id: 10, name: 'New Todo' });
  };

  // ...
};

// todo-list.tsx
export const TodoList = ({ todos }) => {
  reactive(todos);

  return (
    <ul>...</ul>
  );
};

```

In the sample above, whenever and wherever the data changed (e.g. todo added or set `todo.done = true`),
**TodoList** and **TodoForm** will be re-rendered. The index won't be re-rendered
because there is no react hook attached.

### Resistant

**`resistant<T, R>(name:string, object: object | object[], recursive: boolean = true): Reactive<T>`**

- **`name`** - The state name.
- **`object`** - The object/array that will be converted into reactive state.
- **`recursive`** - Convert recursively, `true` by default.

Resistant will allow us to share state across components, anywhere inside the app. Just like Readable, but it will
trigger the React hook when the state changed.

> Readable and Resistant are sharing the same Store. So, calling `readable('todos')` and `resistant('todos')` will
> return an identical data.
>
> You need to call `resistant()` inside a component because it will create React hook.

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
  return (
    <>
      <header>
        <UserMenu/>
      </header>
      <main>
        <UserForm/>
      </main>
    </>
  );
}

```

## Persistent State

Just like Global State, Persistent State also global but persistent. Whenever the state changed,
it'll write the state to `localStorage`. The states will be restored when the browser reloads.

### Writable

**`writable<T, R>(name: string, object: object | object[], recursive = true): Reactive<T>`**

Writable is just like `readable()`, but it's automatically write the state to `localStorage` when the data changed.
Like `readable()`, we still need to convert it to reactive state at the component level.

> Using persistent store with SSR will cause an error about different content between the server and client. It's
> because the data is not available on the server but may available on the browser.
>
> To prevent this, we need to implement `useEffect()`, or use the built-in `<Writable>` component, so it'll be rendered
> in the client side only.

**Example**

```tsx
import { reactive, writable, Writable } from '@beerush/reactor-react';
import { useEffect, useState } from 'react';

const todos = writable('todo-list', []);

const TodoList = () => {
  const [ show, setShow ] = useState(false);
  const items = reactive(todos);

  useEffect(() => setShow());

  return (
    <Writable>...</Writable>
  );
};
```

### Persistent

**`persistent<T, R>(name:string, object: object | object[], recursive: boolean = true): Reactive<T>`**

Persistent is like `resistant()`, but it also writes the state to `localStorage` when the state changed, and
then trigger a React hook when the state changed.

> Writable & Persistent are sharing the same Store. Calling `writable('todos')` and `persistent('todos')` will return
> and identical data.
>
> You need to call `persistent()` inside a component because it will create a React hook.

> When implementing persistent state, please note that if you change the data structure
> that could break the app, you need to upgrade the store version, or handle it to sync the changes.
>
> To upgrade the store version, we can use `upgrade(VERSION)`. The initial version is `1.0.0`,
> but we can use any string just to differ the version with the current one.
>
> When upgrading the store version, the states will be reset to the initial states.


**`.subscribe(handler: Function, init = true, actions?: Action[]): () => Unsubscribe`**

- **`handler`** - Function to handle the change notification.
- **`init`** - Indicate to call the handler at the first subscribe call.
- **`actions`** - Array of mutation type to listen to specific mutations.

The subscription function will return a function to unsubscribe from it. When the unsubscribe function called, you will
not get notified for a data changes anymore.

**Example**

```js
// Subscribe for data changes.
const unsub = obj.subscribe(() => {
  console.log('Data changed!');
});

// Stop getting notified for data chagnes.
unsub();

// Subscribe for "set" and "delete" property only.
obj.subscribe(() => {
  // ...
}, false, [ 'set', 'delete' ]);

// Subscribe for "set" property using alias.
obj.subscribe.for([ 'set' ], (o, prop, value) => {
  console.log(`Property ${prop} changed to ${value}`);
});

// Subscribe for "array mutations" only.
import { ARRAY_MUTATIONS } from '@beerush/reactor-react';

obj.subscribe(() => {
  // ...
}, false, ARRAY_MUTATIONS);

// Subscribe for ".push()" method only.
obj.subscribe(() => {
  // ...
}, false, [ 'push' ]);

```

#### Subscription Handler

**`(self: object | object[], prop: string, value: unknown, action: Action, path: string) => void`**

A function to handle the data changes notification.

- **`self`** - The object itself.
- **`prop`** - The changed property, empty string on array methods (`push`, `splice`, etc).
- **`value`** - New value added to the property.
- **`action`** - The data change type. (`set`|`delete` or array mutable methods `push`|`splice` etc).
- **`path`** - The full path of the changed object (e.g, `children.0.name`).

**Example**
```js
obj.subscribe((o, prop, value, action) => {
  console.log(`Object changes: ${action} ${prop} with ${value}`);
});

```

## Optimization

While using reactive state is fun and easy, we also need to make sure that we use it at the right place. Let's take a
look the sample below:

**Not Recommended**

```tsx

// index.tsx
import { resistant } from '@beerush/reactor-react';

export default () => {
  const dailyTodos = resistant('daily-todos', []);
  const dailyTasks = resistant('daily-tasks', []);

  return (
    <>
      <TodoList todos={ dailyTodos }/>
      <TodoList todos={ dailyTasks }/>
    </>
  );
}

```

**Recommended**

```tsx

// index.tsx
import { readable } from '@beerush/reactor-react';
import { TodoList } from './todo-list.tsx';

const dailyTodos = readable('daily-todos', []);
const dailyTasks = readable('daily-tasks', []);

export default () => {
  return (
    <>
      <TodoList todos={ dailyTodos }/>
      <TodoList todos={ dailyTasks }/>
    </>
  );
}
```

```tsx
// todo-list.tsx
import { reactive } from '@beerush/reactor-react';

export const TodoList = ({ todos }) => {
  reactive(todos);

  return (
    <>...</>
  );
};

```

From the samples above, the first sample is `not recommended` because the index component is not directly consuming the
states, but it'll be re-rendered whenever the state inside `dailyTodos` or `dailyTasks` changed. It will cause both todo
list re-rendered while actually it doesn't need to. For example, if we add new todo to the `dailyTodos`, todo list
with `dailyTasks` will be re-rendered as well.

The second sample is recommended because the only re-rendered component is the one that changed. For example, if we add
new todo to the `dailyTodos`, only todo list with `dailyTodos` that re-rendered. Todo list with `dailyTasks` will not
re-render because no changes in its state.

We also put the `readable()` calls outside the component because we are accessing global states, so we don't need to
re-create them. Putting the `readable()` calls inside a component will recall it everytime the component renders. 
