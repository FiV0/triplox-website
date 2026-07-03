---
title: Concepts
description: Some core concepts of the
---

As Triplox is quite different to traditional SQL DBMS systems, there are few concepts to
understand and be sure to have understood before using it.

## Datom

TODO

## DB value

TODO

## Keyword

The Keyword type comes from the Clojure programming language and has made it's way into Triplox (see [here](https://clojure.org/guides/faq#why_keywords)
for why they exist in Clojure). For example `:db/ident` identifies the ident attribute.
They are made up of an optional prefix (i.e. "db") called the `namespace` and the `name` (i.e. "ident").
Namespaces are useful for distinguishing otherwise identical names (for example `:person/id` vs `:order/id`).
There is only one instance of every Keyword. They are interned (ideally)
and thereby use less memory as every instance exists only once in your program.
You can think overwhelmingly think of them as keys in maps. Instead of
writing a map in python like
```python
{"name": "Alan", "city": "London"}
```
you write
```clojure
{:name "Alan" :city "London"}
```
In the context of Triplox you overwhelmingly use keywords for attributes. The closest
thing in other languages is likely an enum. A fixed constant number of tags to describe
some domain. This is also the usage of a keyword as a value makes most sense.
