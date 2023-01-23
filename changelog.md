# Changelog

## v0.9.0

- Add `useFetch()` hook.
- Add `usePrefetch()` hook.
- Add `initFetch()` function.
- Add `useLoader()` hook.

## v0.8.0

- Add `subscribe.for(actions, props, state)` function.
- Add `subscribe.props(props, state)` function.
- Add `subscribe.actions(actions, state)` function.

## v0.7.2

- Add `setBaseURL()` to set the `fetch()` base url when no `url` given (or `url = ''`), so the request url will
  become `BASE_URL/{location.pathname}{location.search}`.

## v0.7.1

- Fix missing `watch()` typings.

## v0.7.0

- Fix `reactive()` that always re-create a reactive object during re-render.
- The request only happens in browser or any environment where `window.fetch` exist. This could fix the unused request
  during SSR since the renders doesn't actually wait for the request because the returned object is a Reactive object (
  non-blocking), not a promise.
- The `__refresh()` function now can accept two arguments, `opt` and `update`. The `opt` is a request options to
  override the initial options, and the `update` argument is to tell the function to update the data or not (default
  is `true`).
- The `__request` object now held the url and request options (`{ url, options }`) for detailed reference.
- Add `prefetch()` function that returns almost the same object as `fetch()`. The difference is, `prefetch()` don't
  do the request, so you need to call the `__refresh()` to run the request. The returned object also has a success
  status (`__status: 200, ...`) without a `response` object.
- Added `__push()` function to the `ReactiveResponse` object to do a write request. This function also can take two
  arguments like `__refresh()`. If no options defined or no `body` in the options, the function will use the initial
  data as the request `body`. By default, this function will do a `post` request. You can set the `method` options
  to `put` or `patch` if you don't want to do a `post` request.
- Added `watch()` function to record the changed properties of an object/array.
- When calling `fetch()` or `prefetch()` but the `url` is an empty string, it'll automatically use
  the `location.pathname` and `location.search` to prevent accessing to a wrong cache.

## v0.6.0

- Update dependency for important bug fixes.

## v0.5.0

- Allow to listen to specific property changes. E.g, `subscribe(todo, ['set'], ['name', 'done'])`.

## v0.4.0

- New `subscribe()` function to simply subscribe to a reactive object/array to create a React hook.

## v0.3.0

- New `fetch()` function that turns native `fetch()` into a reactive request and automatically trigger React hook.
- Added `fetch.ref()` that create a reactive request but don't trigger any React hook.
- Added `reactive.ref()` that create a reactive object but don't trigger any React hook.

## v0.2.0

- Removed `Provider` from the reactive object as no longer needed. Once the object becomes reactive, we can use it
  anywhere without wrapping it under a `Provider` at the top level anymore!
- Performance improvements, tested with 10.000 todos and no performance difference between using `reactive`
  and `useState`.

## v0.1.0

- Added `reactive()` function to convert an object/array into reactive state that trigger React hook when state changed.
- Added `readable()` function to create a Global State but don't trigger React hook.
- Added `resistant()` function to create a Global State and trigger React hook the state changed.
- Added `writable()` function to create a Persistent State but don't trigger React hook.
- Added `persistent()` function to create a Persistent State and trigger React hook when the state changed.
