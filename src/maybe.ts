/**
 * The `Maybe` type encapsulates an optional value. A value of type `Maybe a`
 * either contains a value of type `a` (represented as `Just a`), or it is empty
 * (represented as `Nothing`). Using `Maybe` is a good way to deal with errors
 * or exceptional cases without resorting to drastic measures such as `error`.
 *
 * The `Maybe` type is also a monad. It is a simple kind of error monad, where
 * all errors are represented by `Nothing`. A richer error monad can be built
 * using the `Either` type.
 *
 * @author Lukas Obermann, hackage.haskell.org (texts)
 */

import * as R from 'ramda';
import { List } from './list';

// CONTENT ACCESS KEY

const KEY = Symbol ('Maybe');
const EMPTY = Symbol ('Nothing');


// MAYBE TYPE DEFINITION

export type Maybe<A extends Some> = Just<A> | Nothing;


// CONSTRUCTORS

// Just

interface JustConstructor {
  <A extends Some>(value: A): Just<A>;
  prototype: Just<Some>;
}

interface Just<A extends Some> {
  [KEY]: A;
  toString (): string;
}

export const Just =
  function <A extends Some> (this: Just<A>, value: A) {
    this[KEY] = value;
  } as unknown as JustConstructor;

interface NothingConstructor {
  (): Nothing;
  prototype: Nothing;
}

Just.prototype.toString = function (this: Just<Some>) {
  return `Just ${this[KEY]}`;
}

// Nothing

interface Nothing {
  [EMPTY]: true;
  toString (): string;
}

// tslint:disable-next-line:no-empty
const _Nothing =
  function (this: Nothing) {
    this[EMPTY] = true;
  } as unknown as NothingConstructor;

_Nothing.prototype.toString = () => 'Nothing';

export const Nothing = _Nothing ();

/**
 * `fromNullable :: a -> Maybe a`
 *
 * Creates a new `Maybe` from the given nullable value.
 */
export const fromNullable =
  <A extends Some> (value: A | Nullable): Maybe<A> =>
    value !== null && value !== undefined ? Just (value) : Nothing;


// MAYBE FUNCTIONS (PART 1)

/**
 * `isJust :: Maybe a -> Bool`
 *
 * The `isJust` function returns `true` if its argument is of the form
 * `Just _`.
 */
export const isJust = <A extends Some> (x: Maybe<A>): x is Just<A> => x instanceof Just;

/**
 * `isNothing :: Maybe a -> Bool`
 *
 * The `isNothing` function returns `true` if its argument is `Nothing`.
 */
export const isNothing = <A extends Some> (x: Maybe<A>): x is Nothing => x === Nothing;

/**
 * `fromJust :: Maybe a -> a`
 *
 * The `fromJust` function extracts the element out of a `Just` and throws an
 * error if its argument is `Nothing`.
 *
 * @throws TypeError
 */
export const fromJust =
  <A extends Some> (x: Just<A>): A => {
    if (isJust (x)) {
      return x[KEY];
    }

    throw new TypeError (`Cannot extract a value out of type Nothing.`);
  };

/**
 * `fromMaybe :: a -> Maybe a -> a`
 *
 * The `fromMaybe` function takes a default value and and `Maybe` value. If
 * the `Maybe` is `Nothing`, it returns the default values; otherwise, it
 * returns the value contained in the `Maybe`.
 */
export const fromMaybe =
  <A extends Some> (def: A) => (x: Maybe<A>): A =>
    isJust (x) ? fromJust (x) : def;

// MONAD

/**
 * `(>>=) :: Maybe a -> (a -> Maybe b) -> Maybe b`
 */
export const bind =
  <A extends Some, B extends Some> (m: Maybe<A>) => (f: (value: A) => Maybe<B>): Maybe<B> =>
    isNothing (m) ? m : f (m[KEY]);

/**
 * `(=<<) :: (a -> Maybe b) -> Maybe a -> Maybe b`
 */
export const bind_ =
  <A extends Some, B extends Some> (f: (value: A) => Maybe<B>) => (m: Maybe<A>): Maybe<B> =>
    bind<A, B> (m) (f);

/**
 * `(>>) :: forall a b. m a -> m b -> m b`
 *
 * Sequentially compose two actions, discarding any value produced by the
 * first, like sequencing operators (such as the semicolon) in imperative
 * languages.
 *
 * ```a >> b = a >>= \ _ -> b```
 */
export const then =
  <A extends Some> (m1: Maybe<any>) => (m2: Maybe<A>): Maybe<A> =>
    bind<any, A> (m1) (() => m2);

/**
 * `return :: a -> Just a`
 *
 * Inject a value into a `Maybe` type.
 */
export const mreturn = Just;

/**
 * `liftM2 :: (a1 -> a2 -> r) -> Maybe a1 -> Maybe a2 -> Maybe r`
 *
 * Promote a function to a monad, scanning the monadic arguments from left to
 * right.
 */
export const liftM2 =
  <A1 extends Some, A2 extends Some, B extends Some>
  (fn: (a1: A1) => (a2: A2) => B) =>
  (m1: Maybe<A1>) =>
  (m2: Maybe<A2>): Maybe<B> =>
    bind<A1, B> (m1)
                (a1 => fmap<A2, B> (a2 => fn (a1) (a2))
                                   (m2));

/**
 * `liftM3 :: (a1 -> a2 -> a3 -> r) -> Maybe a1 -> Maybe a2 -> Maybe a3 -> Maybe r`
 *
 * Promote a function to a monad, scanning the monadic arguments from left to
 * right.
 */
export const liftM3 =
  <A1 extends Some, A2 extends Some, A3 extends Some, B extends Some>
  (fn: (a1: A1) => (a2: A2) => (a3: A3) => B) =>
  (m1: Maybe<A1>) =>
  (m2: Maybe<A2>) =>
  (m3: Maybe<A3>): Maybe<B> =>
    bind<A1, B> (m1)
                (a1 => bind<A2, B> (m2)
                                   (a2 => fmap<A3, B> (a3 => fn (a1) (a2) (a3))
                                               (m3)));

/**
 * `liftM4 :: (a1 -> a2 -> a3 -> a4 -> r) -> Maybe a1 -> Maybe a2 -> Maybe a3
-> Maybe a4 -> Maybe r`
  *
  * Promote a function to a monad, scanning the monadic arguments from left to
  * right.
  */
export const liftM4 =
  <A1 extends Some, A2 extends Some, A3 extends Some, A4 extends Some, B extends Some>
  (fn: (a1: A1) => (a2: A2) => (a3: A3) => (a4: A4) => B) =>
  (m1: Maybe<A1>) =>
  (m2: Maybe<A2>) =>
  (m3: Maybe<A3>) =>
  (m4: Maybe<A4>): Maybe<B> =>
    bind<A1, B> (m1)
                (a1 => bind<A2, B> (m2)
                                   (a2 => bind<A3, B> (m3)
                                                      (a3 => fmap<A4, B> (a4 =>
                                                                           fn (a1) (a2) (a3) (a4))
                                                                         (m4))));


// FUNCTOR

/**
 * `fmap :: (a -> b) -> Maybe a -> Maybe b`
 */
export const fmap =
  <A extends Some, B extends Some> (f: (value: A) => B) =>
    bind_<A, B> (R.pipe<A, B, Just<B>> (f, Just));

/**
 * `(<$) :: Functor f => a -> f b -> f a`
 *
 * Replace all locations in the input with the same value. The default
 * definition is `fmap . const`, but this may be overridden with a more
 * efficient version.
 */
export const mapReplace =
  <A extends Some, B extends Some> (x: A) =>
    fmap<B, A> (() => x);


// APPLICATIVE

/**
 * `pure :: a -> Just a`
 *
 * Inject a value into a `Maybe` type.
 */
export const pure = Just;

/**
 * `(<*>) :: Maybe (a -> b) -> Maybe a -> Maybe b`
 */
export const ap =
  <A extends Some, B extends Some> (ma: Maybe<((value: A) => B)>) => (m: Maybe<A>): Maybe<B> =>
    isJust (m) ? fmap<((value: A) => B), B> (f => f (fromJust (m))) (ma) : m;

/**
 * `empty :: () -> Nothing`
 *
 * Returns the empty `Maybe`.
 */
export const empty = () => Nothing;


// FOLDABLE

/**
 * `foldl :: (b -> a -> b) -> b -> Foldable a -> b`
 *
 * Left-associative fold of a structure.
 *
 * In the case of lists, `foldl`, when applied to a binary operator, a
 * starting value (typically the left-identity of the operator), and a list,
 * reduces the list using the binary operator, from left to right:
 *
 * ```foldl f z [x1, x2, ..., xn] == (...((z `f` x1) `f` x2) `f`...) `f` xn```
 *
 * Note that to produce the outermost application of the operator the entire
 * input list must be traversed. This means that `foldl'` will diverge if
 * given an infinite list.
 *
 * Also note that if you want an efficient left-fold, you probably want to use
 * `foldl'` instead of `foldl`. The reason for this is that latter does not
 * force the "inner" results (e.g. `z f x1` in the above example) before
 * applying them to the operator (e.g. to `(f x2)`). This results in a thunk
 * chain `O(n)` elements long, which then must be evaluated from the
 * outside-in.
 *
 * For a general `Foldable` structure this should be semantically identical to,
 *
 * ```foldl f z = foldl f z . toList```
 */
export const foldl =
  <A extends Some, B extends Some> (fn: (acc: B) => (current: A) => B) =>
    (initial: B) => (m: Maybe<A>): B =>
      isJust (m) ? fn (initial) (fromJust (m)) : initial;

/**
 * `elem :: Eq a => a -> Maybe a -> Bool`
 *
 * Does the element occur in the structure?
 *
 * Always returns `False` if the provided `Maybe` is `Nothing`.
 */
export const elem =
  <A extends Some> (e: A) => (m: Maybe<A>): boolean =>
    isJust (m) && e === fromJust (m);

/**
 * `elem_ :: Eq a => Maybe a -> a -> Bool`
 *
 * Does the element occur in the structure?
 *
 * Always returns `False` if the provided `Maybe` is `Nothing`.
 *
 * Flipped version of `elem`.
 */
export const elem_ = <A extends Some> (m: Maybe<A>) => (e: A): boolean => elem (e) (m);

/**
 * `notElem :: Eq a => a -> Maybe a -> Bool`
 *
 * `notElem` is the negation of `elem`.
 */
export const notElem =
  <A extends Some> (e: A) => (m: Maybe<A>): boolean =>
    isJust (m) && e !== fromJust (m);


// ALTERNATIVE

/**
 * `alt :: f a -> f a -> f a`
 *
 * The `alt` function takes a `Maybe` of the same type. If the first `Maybe`
 * is `Nothing`, it returns the second `Maybe`, otherwise it returns the
 * first.
 */
export const alt =
  <A extends Some> (m1: Maybe<A>) => (m2: Maybe<A>): Maybe<A> =>
    isJust (m1) ? m1 : m2;

/**
 * `alt :: f a -> f a -> f a`
 *
 * The `alt` function takes a `Maybe` of the same type. If the second `Maybe`
 * is `Nothing`, it returns the first `Maybe`, otherwise it returns the
 * second.
 *
 * This is the same as `Maybe.alt` but with arguments swapped.
 */
export const alt_ =
  <A extends Some> (m2: Maybe<A>) => (m1: Maybe<A>): Maybe<A> =>
    alt (m1) (m2);

/**
 * `guard :: Alternative f => Bool -> f ()`
 *
 * Conditional failure of Alternative computations. Defined by
```hs
guard True  = pure ()
guard False = empty
```
  * In TypeScript, this is not possible, so instead it's
```ts
guard (true)  = pure (true)
guard (false) = empty ()
```
  */
export const guard = (pred: boolean): Maybe<true> => pred ? Just<true> (true) : Nothing;


// EQ

/**
 * `(==) :: Maybe a -> Maybe a -> Bool`
 *
 * Returns if both given values are equal.
 */
export const equals =
  <A extends Some> (m1: Maybe<A>) => (m2: Maybe<A>): boolean =>
    isNothing (m1) && isNothing (m2)
    || isJust (m1) && isJust (m2) && R.equals (fromJust (m1), fromJust (m2));

/**
 * `(!=) :: Maybe a -> Maybe a -> Bool`
 *
 * Returns if both given values are not equal.
 */
export const notEquals =
  <A extends Some> (m1: Maybe<A>) => (m2: Maybe<A>): boolean =>
    isNothing (m1) && isJust (m2)
    || isJust (m1) && isNothing (m2)
    || isJust (m1) && isJust (m2) && !R.equals (fromJust (m1), fromJust (m2));


// ORD

/**
 * `(>) :: Maybe a -> Maybe a -> Bool`
 *
 * Returns if the first value is greater than the second value.
 *
 * If one of the values is `Nothing`, `(>)` always returns `false`.
 */
export const gt =
  <A extends number | string> (m1: Maybe<A>) => (m2: Maybe<A>): boolean =>
    fromMaybe (false) (liftM2<A, A, boolean> (x1 => x2 => x1 > x2) (m1) (m2));

/**
 * `(<) :: Maybe a -> Maybe a -> Bool`
 *
 * Returns if the first value is lower than the second value.
 *
 * If one of the values is `Nothing`, `(<)` always returns `false`.
 */
export const lt =
  <A extends number | string> (m1: Maybe<A>) => (m2: Maybe<A>): boolean =>
    fromMaybe (false) (liftM2<A, A, boolean> (x1 => x2 => x1 < x2) (m1) (m2));

/**
 * `(>=) :: Maybe a -> Maybe a -> Bool`
 *
 * Returns if the first value is greater than or equals the second
 * value.
 *
 * If one of the values is `Nothing`, `(>=)` always returns `false`.
 */
export const gte =
  <A extends number | string> (m1: Maybe<A>) => (m2: Maybe<A>): boolean =>
    fromMaybe (false) (liftM2<A, A, boolean> (x1 => x2 => x1 >= x2) (m1) (m2));

/**
 * `(<=) :: Maybe a -> Maybe a -> Bool`
 *
 * Returns if the first value is lower than or equals the second
 * value.
 *
 * If one of the values is `Nothing`, `(<=)` always returns `false`.
 */
export const lte =
  <A extends number | string> (m1: Maybe<A>) => (m2: Maybe<A>): boolean =>
    fromMaybe (false) (liftM2<A, A, boolean> (x1 => x2 => x1 <= x2) (m1) (m2));


// SHOW

/**
 * `show :: Maybe m => m a -> String`
 */
export const show = (m: Maybe<any>): string => m.toString ();


// SEMIGROUP

// /**
//  * `mappend :: Semigroup a => Maybe a -> Maybe a -> Maybe a`
//  *
//  * Concatenates the `Semigroup`s contained in the two `Maybe`s, if both are of
//  * type `Just a`. If at least one of them is `Nothing`, it returns the first
//  * element.
//  */
// export const mappend = <U, S extends Semigroup<U>> (m1: Maybe<S>) => (m2: Maybe<S>): Maybe<S> =>
//   isJust (m1) && isJust (m2)
//     ? Just (mappend (fromJust (m1), fromJust (m2)))
//     : m1;


// MAYBE FUNCTIONS (PART 2)

/**
 * `maybe :: b -> (a -> b) -> Maybe a -> b`
 *
 * The `maybe` function takes a default value, a function, and a `Maybe`
 * value. If the `Maybe` value is `Nothing`, the function returns the default
 * value. Otherwise, it applies the function to the value inside the `Just`
 * and returns the result.
 */
export const maybe =
  <A extends Some, B extends Some> (def: B) => (fn: (x: A) => B) => (m: Maybe<A>): B =>
    foldl<A, B> (() => fn) (def) (m);

/**
 * `listToMaybe :: [a] -> Maybe a`
 *
 * The `listToMaybe` function returns `Nothing` on an empty list or `Just a`
 * where `a` is the first element of the list.
 */
export const listToMaybe =
  <A extends Some> (list: List<A>): Maybe<A> =>
    list .null () ? Nothing : Just (List.head (list));

/**
 * `maybeToList :: Maybe a -> [a]`
 *
 * The `maybeToList` function returns an empty list when given `Nothing` or a
 * singleton list when not given `Nothing`.
 */
export const maybeToList =
  <A extends Some> (m: Maybe<A>): List<A> =>
    isJust (m) ? List.of (fromJust (m)) : List.empty ();

/**
 * `catMaybes :: [Maybe a] -> [a]`
 *
 * The `catMaybes` function takes a list of `Maybe`s and returns a list of all
 * the `Just` values.
 */
export const catMaybes =
  <A extends Some> (list: List<Maybe<A>>): List<A> =>
    List.map<Just<A>, A> (fromJust) (list .filter (isJust));

/**
 * `mapMaybe :: (a -> Maybe b) -> [a] -> [b]`
 *
 * The `mapMaybe` function is a version of `map` which can throw out elements.
 * If particular, the functional argument returns something of type `Maybe b`.
 * If this is `Nothing`, no element is added on to the result list. If it is
 * `Just b`, then `b` is included in the result list.
 */
export const mapMaybe =
  <A extends Some, B extends Some> (fn: (x: A) => Maybe<B>) =>
    List.foldr<A, List<B>>
      (x => acc => R.pipe (fn, maybe<B, List<B>> (acc) (List.cons (acc))) (x))
      (List.of ());


// CUSTOM MAYBE FUNCTIONS

/**
 * `normalize :: (a | Maybe a) -> Maybe a`
 *
 * Creates a new `Maybe` from the given nullable value. If the value is
 * already an instance of `Maybe`, it will just return the value.
 */
export const normalize =
  <A extends Some> (value: A | Nullable | Maybe<A>): Maybe<A> =>
    value instanceof Just || value instanceof _Nothing ? value : fromNullable (value);

/**
 * `(==) :: Maybe a -> Maybe a -> Bool`
 *
 * Returns if both given values are shallowly equal. Used only for selector
 * memoization.
 *
 * @internal
 */
export const INTERNAL_shallowEquals =
  <A extends Some>(m1: Maybe<A>) => (m2: Maybe<A>): boolean =>
    isNothing (m1) && isNothing (m2)
    || isJust (m1) && isJust (m2) && fromJust (m1) === fromJust (m2);

interface Ensure {
  /**
   * `ensure :: (a -> Bool) -> a -> Maybe a`
   *
   * Creates a new `Just a` from the given value if the given predicate
   * evaluates to `True` and the given value is not nullable. Otherwise returns
   * `Nothing`.
   */
  <A extends Some, A_ extends A> (
    pred: (value: A) => value is A_
  ): (value: A | Nullable) => Maybe<A_>;
  /**
   * `ensure :: (a -> Bool) -> a -> Maybe a`
   *
   * Creates a new `Just a` from the given value if the given predicate
   * evaluates to `True` and the given value is not nullable. Otherwise returns
   * `Nothing`.
   */
  <A extends Some> (pred: (value: A) => boolean): (value: A | Nullable) => Maybe<A>;
}

/**
 * `ensure :: (a -> Bool) -> a -> Maybe a`
 *
 * Creates a new `Just a` from the given value if the given predicate
 * evaluates to `True` and the given value is not nullable. Otherwise returns
 * `Nothing`.
 */
export const ensure: Ensure =
  <A extends Some> (pred: (value: A) => boolean) => (value: A | Nullable): Maybe<A> =>
    bind<A, A> (fromNullable (value))
               (x => pred (x) ? Just (x) : Nothing);

/**
 * `imapMaybe :: (Int -> a -> Maybe b) -> [a] -> [b]`
 *
 * The `imapMaybe` function is a version of `map` which can throw out
 * elements. If particular, the functional argument returns something of type
 * `Maybe b`. If this is `Nothing`, no element is added on to the result list.
 * If it is `Just b`, then `b` is included in the result list.
 */
export const imapMaybe =
  <A extends Some, B extends Some> (fn: (index: number) => (x: A) => Maybe<B>) =>
    List.ifoldr<A, List<B>>
      (index => x => acc => R.pipe (fn (index), maybe<B, List<B>> (acc) (List.cons (acc))) (x))
      (List.of ());

/**
 * `maybeToReactNode :: Maybe JSXElement -> ReactNode`
 *
 * The `maybeToReactNode` function returns `null` when given `Nothing` or
 * returns the JSX Element inside when given a `Just`.
 *
 * Note: Do not use in application flow, only use when return value is
 * directly used by React. Why? `null` is unsafe! But it's required by React
 * if you do not want an element to be displayed.
 */
export const maybeToReactNode =
  <A extends JSX.Element | string> (m: Maybe<A>): React.ReactNode =>
    isJust (m) ? fromJust (m) : null;

// TYPE HELPERS

export type MaybeContent<T> = T extends Maybe<infer I> ? I : never;

// tslint:disable-next-line:interface-over-type-literal
export type Some = {};
export type Nullable = null | undefined;
