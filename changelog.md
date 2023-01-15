# Changelog

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
