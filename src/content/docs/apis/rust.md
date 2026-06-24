---
title: Rust API
description: The Triplox Rust client.
---

The Triplox Rust client is published on [crates.io](https://crates.io/crates/triplox).

## Installation

Add the dependency to your `Cargo.toml`:

```toml
[dependencies]
triplox = "0.1.0-alpha.4"
```

The client is async, so you'll also need an async runtime such as [`tokio`](https://crates.io/crates/tokio).

## Example

The following program defines a small schema, inserts two entities, and runs a Datalog query against a db value.
You will need a running Triplox server. See the [quick start](/getting-started/quick-start/) for how to launch one.

```rust
use anyhow::Result;
use edn::kw;
use edn::Keyword;
use triplox::client::ClientNode;
use triplox::node::{Database, QueryNode, SubmitNode, TransactionResult};
use triplox::ops::{DataType, TxOp};

/// Build a schema attribute definition as a Put document.
/// This mirrors the internal `plain_schema_attribute` helper.
fn schema_attribute(name: &str, value_type: &str) -> TxOp {
    TxOp::put([
        (kw!(:db/ident), DataType::Keyword(Keyword::plain(name))),
        (kw!(:db/valueType), DataType::Keyword(Keyword::namespaced("db.type", value_type))),
        (kw!(:db/cardinality), DataType::Keyword(kw!(:db.cardinality/one))),
    ])
}

#[tokio::main]
async fn main() -> Result<()> {
    let addr = "http://127.0.0.1:5490";
    println!("Connecting to {addr}...");
    let node = ClientNode::connect(addr).await?;
    println!("Connected.");

    // 1. Define schema attributes
    let schema_ops = vec![
        schema_attribute("name", "string"),
        schema_attribute("age", "long"),
    ];
    let result = node.execute_tx(schema_ops).await?;
    match &result {
        TransactionResult::TxCommited(tx_key) => {
            println!("Schema defined (tx_id={}).", tx_key.tx_id);
        }
        TransactionResult::TxAborted(_, err) => {
            anyhow::bail!("Schema transaction aborted: {err}");
        }
    }

    // 2. Insert some data
    let data_ops = vec![
        TxOp::put([
            (kw!(:name), "alice".into()),
            (kw!(:age), 30_i64.into()),
        ]),
        TxOp::put([
            (kw!(:name), "bob".into()),
            (kw!(:age), 25_i64.into()),
        ]),
    ];
    let result = node.execute_tx(data_ops).await?;
    match &result {
        TransactionResult::TxCommited(tx_key) => {
            println!("Data inserted (tx_id={}).", tx_key.tx_id);
        }
        TransactionResult::TxAborted(_, err) => {
            anyhow::bail!("Data transaction aborted: {err}");
        }
    }

    // 3. Open a DB value and query
    let db = node.db().await?;
    println!("Opened DB value (tx_eid={}).", db.tx_basis().tx_eid);

    let rows = db
        .query(r#"{:find [?e ?name ?age]
                   :where [[?e :name ?name]
                           [?e :age ?age]]}"#)
        .await?;

    println!("Query returned {} row(s):", rows.len());
    for row in &rows {
        println!("  {:?}", row);
    }

    println!("Done.");

    Ok(())
}
```
