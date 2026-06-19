---
title: Datalog
description: The Triplox Datalog query language.
---
The main query language for Triplox is a variant of [Datalog](https://en.wikipedia.org/wiki/Datalog). Datalog is a logic-based query language inspired by [Prolog](https://en.wikipedia.org/wiki/Prolog). A Datalog program consists of a set of facts. These facts are the Datoms that sit in our covering indexes. Everything else is derived from these facts (modulo incoming parameters).
### Triple pattern
You match a certain pattern against these facts. Consider the pattern `[?e :person/age 42]` . `?e` is a free variable meaning it "joins" against any triple in the indices for which the latter two hold true. It would find us the entities of people with age 42. Most of the time you want to know more about entities.  For this aspect of Datalog has the concept of unification.
Consider the query [^2]
```clojure
{:find  [?e ?x]
 :where [[?e :age 42]
         [?e :likes ?x]]}
```
The clauses in the `:where` specify the triples we are interested in. In this case people of age 42 and and what they like.  First we find people of age 42 and then the unification of `?e` happens. The `?e`  now gets unified with the second triple pattern where we are looking for things people like (if they like anything ;)) by unifying their likings with `?x`. I am simplifying how Triplox actually does variable joins under the hood (I have described the join algorithm here), but this a good conceptual start for understanding unification. The `find` part is purely about the projection of the join variables.  Unification is the most fundamental part of Datalog and everything else follows naturally.
### Or
By default everything in the where clause is a conjuction (an `and`) of the facts that satisfy the triples. If you want to express disjunctions you need an `or` clause.
```clojure
{:find [?e]
 :where [[?e :age 42]
         (or [?e :likes "ice cream"]]
             [?e :likes "donuts"])]}

```
In this case, the outer unification can happen against any of the inner `or `branches. The above query will find us people who are 42 years old and like donuts or ice cream. A person who likes both ice cream and donuts will only appear once in the output.
### And
In `or` clauses disjunction is the default. If you want to get back to conjunction you need to use `and` clause.
```clojure
{:find [?e]
 :where [[?e :age 42]
         (or [?e :likes "icecream"]
             (and [?e :profession "programmer"]
                  [?e :likes "donuts"]))]}
```
The above query finds us people who are 42 years old and who like icecream or are professional programmers who like donuts.
### Not
In case you want to exclude certain types of facts you need to use the `not` clause.
```clojure
{:find [?e]
 :where [[?e :age 42]
         (not [?e :likes "icecream"]]}
```
This will find us people of age 42 who don't like ice cream. Be aware that a `not` works like an anti-join than an actual negation of facts. For example you cannot write the query
```clojure
{:find [?e]
 :where [(not [?e :likes "icecream"]]}
```
to find people who don't like ice cream. This is a bit contrary to classical literature Datalog where this query would be accepted.
### Predicates and Functions
Predicates are used to filter matching tuples and functions are used to create new join variables.
```clojure
{:find [?e ?birth-year]
 :where [[?e :person/age ?age]
         [(> ?age 30)]
         [(- 2026 ?age) ?birth-year]]}
```
This finds us people older than 30 and their birth year. The second where clause is a predicate filter and the final clause creates the birth year variable.

This gives you a little introduction tour of EDN Datalog. I have not touched rules which are the most powerful aspect of Datalog.
