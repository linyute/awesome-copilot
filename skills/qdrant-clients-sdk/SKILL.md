---
name: qdrant-clients-sdk
description: "Qdrant 為各種程式語言提供用戶端 SDK，允許輕鬆地與 Qdrant 部署進行整合。"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Qdrant 用戶端 SDK

Qdrant 具有以下官方支援的用戶端 SDK：

- Python — [qdrant-client](https://github.com/qdrant/qdrant-client) · 安裝指令：`pip install qdrant-client[fastembed]`
- JavaScript / TypeScript — [qdrant-js](https://github.com/qdrant/qdrant-js) · 安裝指令：`npm install @qdrant/js-client-rest`
- Rust — [rust-client](https://github.com/qdrant/rust-client) · 安裝指令：`cargo add qdrant-client`
- Go — [go-client](https://github.com/qdrant/go-client) · 安裝指令：`go get github.com/qdrant/go-client`
- .NET — [qdrant-dotnet](https://github.com/qdrant/qdrant-dotnet) · 安裝指令：`dotnet add package Qdrant.Client`
- Java — [java-client](https://github.com/qdrant/java-client) · 於 Maven Central 提供：https://central.sonatype.com/artifact/io.qdrant/client


## API 參考

與 Qdrant 的所有互動都可以透過 REST API 或 gRPC API 進行。如果您是第一次使用 Qdrant 或正在製作原型，我們建議使用 REST API。

* REST API - [OpenAPI 參考](https://api.qdrant.tech/api-reference) - [GitHub](https://github.com/qdrant/qdrant/blob/master/docs/redoc/master/openapi.json)
* gRPC API - [gRPC protobuf 定義](https://github.com/qdrant/qdrant/tree/master/lib/api/src/grpc/proto)

## 程式碼範例

若要取得特定用戶端和案例的程式碼範例，您可以向為 Qdrant 用戶端精選的程式碼片段庫發送搜尋請求。

```bash
curl -X GET "https://snippets.qdrant.tech/search?language=python&query=how+to+upload+points"
```

可用語言：`python`, `typescript`, `rust`, `java`, `go`, `csharp`


回應範例：

```markdown

## 程式碼片段 1

*qdrant-client* (最新版本) — https://search.qdrant.tech/md/documentation/manage-data/points/

使用 Python qdrant_client (PointStruct) 將多個向量嵌入點上傳到 Qdrant 集合中，包含 id、payload (例如：顏色) 以及用於相似性搜尋的 3D 向量。它支援平行上傳 (parallel=4) 和重試原則 (max_retries=3) 以實現穩健的索引編製。此操作是等冪的 (idempotent)：使用相同的 id 重新上傳會覆寫現有點；如果未提供 id，Qdrant 會自動產生 UUID。

client.upload_points(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={
                "color": "red",
            },
            vector=[0.9, 0.1, 0.1],
        ),
        models.PointStruct(
            id=2,
            payload={
                "color": "green",
            },
            vector=[0.1, 0.9, 0.1],
        ),
    ],
    parallel=4,
    max_retries=3,
)
```

預設回應格式為 markdown，如果需要 JSON 格式的程式碼片段輸出，您可以在查詢字串中加入 `&format=json`。
