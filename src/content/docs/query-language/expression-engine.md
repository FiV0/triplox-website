---
title: Expression Engine
description: Built-in predicates and functions.
---

The expression engine evaluates the predicates and functions that appear inside
Datalog `:where` clauses. It is a row-at-a-time evaluator over a tree of
expressions built from variables, literals and supported predicates and functions.

There are two ways to use an expression in a clause:

- **Predicates** — a boolean expression that filters rows.
  ```clojure
  [(< ?age 30)]
  ```
- **Function binding** — an expression whose result is bound to a new
  variable.
  ```clojure
  [(+ ?x 1) ?y]
  [(upper ?name) ?upper-name]
  ```

## Predicates

Predicates return a `boolean` and are used as filters.

| Predicate    | Syntax         | Argument types              |
| ------------ | -------------- | --------------------------- |
| `<`          | `(< a b)`      | any comparable, same kind   |
| `<=`         | `(<= a b)`     | any comparable, same kind   |
| `>`          | `(> a b)`      | any comparable, same kind   |
| `>=`         | `(>= a b)`     | any comparable, same kind   |
| `=`          | `(= a b)`      | any                         |
| `not=`, `!=` | `(not= a b)`   | any                         |
| `not`        | `(not x)`      | `boolean`                   |

## Functions

Functions return a value and are used in a function binding to
introduce a new variable.

### Arithmetic

| Function    | Syntax       | Argument types                                | Result  |
| ----------- | ------------ | --------------------------------------------- | ------- |
| `+`         | `(+ a b)`    | `long`/`double`                               | `long`/`double` |
| `-`         | `(- a b)`    | `long`/`double`                               | `long`/`double` |
| `*`         | `(* a b)`    | `long`/`double`                               | `long`/`double` |
| `/`, `quot` | `(/ a b)`    | `long`/`double`                               | `long`/`double` |
| `mod`       | `(mod a b)`  | `long`/`double`                               | `long`/`double` |
| `abs`       | `(abs x)`    | `long`/`double`                               | `long`/`double` |

Notes:

- Integer arithmetic uses checked operations — overflow makes the row drop out.
- Division or modulo by zero is treated as no result rather than an error.
- Mixed `long`/`double` arithmetic promotes both sides to `double`.

### String

| Function | Syntax           | Argument types                                                                                  | Result   |
| -------- | ---------------- | ----------------------------------------------------------------------------------------------- | -------- |
| `concat` | `(concat a b)`   | `string`, `string`                                                                              | `string` |
| `upper`  | `(upper s)`      | `string`                                                                                        | `string` |
| `lower`  | `(lower s)`      | `string`                                                                                        | `string` |
| `strlen` | `(strlen s)`     | `string`                                                                                        | `long`   |
| `str`    | `(str x)`        | `long`, `bigint`, `double`, `float`, `boolean`, `string`, `uuid`                                | `string` |

Notes:

- `str` falls back to a debug-style representation for any argument type not
  listed above.

### Date/Time

| Function | Syntax      | Argument type | Result |
| -------- | ----------- | ------------- | ------ |
| `year`   | `(year t)`  | `instant`     | `long` |
| `month`  | `(month t)` | `instant`     | `long` |

## Evaluation semantics

- Expressions evaluate against a row's variable bindings. An unbound variable,
  a type mismatch, or an arithmetic failure (overflow, divide-by-zero) all
  produce "no result" — the row is excluded from a predicate and produces no
  binding from a function.
- Predicate evaluation returns `true` only when the expression yields
  `boolean true`; anything else is treated as `false`.
- Expressions can be nested freely, for example:
  ```clojure
  [(not (< ?x 10))]
  [(+ (* ?x 2) 10) ?y]
  ```
