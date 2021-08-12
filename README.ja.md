# OpenAPI to normalizr

## 概要

- [OpenAPI](https://github.com/OAI/OpenAPI-Specification)で記述された API 定義から [normalizr](https://github.com/paularmstrong/normalizr)で利用できるスキーマ定義を生成します。
- [swagger-js](https://github.com/swagger-api/swagger-js)を使った通信用 middleware(内部でレスポンスを正規化)と、正規化したデータを格納する reducer を提供します。
- リポジトリ内にサンプルがあるので手元で挙動が確認できます。  
  [Example](./example/README.md)

## インストール

```bash
% npm i git+ssh://git@github.com/eightcard/openapi-to-normalizr.git
```

## 使い方

1. コードの自動生成

   - OpenAPI 形式の YAML を準備
   - スキーマコードとモデルコードを生成
     ```bash
     % node_modules/.bin/openapi2schemas --config config.js foo.yml
     ```
   - config
     ```js
     {
       templates: { // テンプレートパス
         model: 'ベースモデル用',
         override: '継承モデル用',
         schema: 'スキーマ用',
         head: 'ヘッダー用',
         dependency: '依存import用',
         models: 'モデルindex用',
         actionTypes: 'actionTypes用',
         spec: 'SpecのJS化用',
         oneOf: 'oneOf展開用',
       },
       outputPath: {
         schemas: 'スキーマファイル出力パス',
         actions: 'action typeファイル出力パス',
         jsSpec: 'JS版スペック出力パス',
       },
       modelsDir: 'モデル出力先',
       usePropType: 'prop-type利用(true/false)',
       useTypeScript: 'TypeScript利用(true/false)',
       attributeConverter: '属性コンバート用関数',
       tags: ['xxx', 'yyy'], // 指定したタグで生成対象を制限(未指定時はすべてのパスが対象)
     }
     ```

2. 自動生成コードの利用

   - `redux`の middleware を利用した API リクエストと `normalizr` を利用したレスポンス正規化を行います。

     ```js
     import { applyMiddleware, createStore } from 'redux';
     // 自動生成ファイルがtmp配下に生成された場合
     import rawSpec from 'tmp/spec';
     import * as Models from 'tmp/models';
     import * as ActionTypes from 'tmp/actions/actionTypes';
     const createEntitiesAction = ActionTypes.createOpenApiAction;
     import { createEntitiesReducer, createOpenApiMiddleware } from 'openapi-to-normalizr';

     // JS形式のSpecを渡してAPI通信を自動で行なうmiddlewareを準備する
     createOpenApiMiddleware(rawSpec).then((middleware) => {
       const store = createStore(
         // Modelクラスを渡してreducerで正規化＆モデル化してもらう
         createEntitiesReducer(Models),
         applyMiddleware(middleware),
       );
       const action = createEntitiesAction(ActionTypes.GET_PETS__ID_);
       store.dispatch(action({ id: 1 }));
     });
     ```

   - [examples](./examples/README.md)では簡単な API 定義から動作確認するサンプルがあります。
   - [src/lib](./src/lib/README.md)に `createEntitiesReducer`, `createOpenApiMiddleware`の仕様があります。
     各ツールのコンセプトはこちらを参照ください。

## デプロイ

- babel 処理 (lint -> test -> build)
  ```sh
  % yarn build:dist
  ```
- lint (bin, src が対象)
  ```sh
  % yarn eslint
  ```
- test (src/lib 下と spec 下の yml パースのテスト)
  ```sh
  % yarn test
  ```

## その他

### パスの ID について

- パスごとの `operationId` は利用しない。
- 自動的に以下の規約で ID が振られることになる。
  - `/` -> `_`
  - `{foo}` -> `_foo_`
- Redux アクションの type などではこの ID を大文字にしたものを利用する。

### モデルについて

- swagger-ui で表現できないため、ディレクトリには分割しない。
- ドメイン依存するような場合はモデル名自体で対応する。
- モデル名は `UpperCamelCase`
  例: `User`, `CompanyAccount`

### components の定義

以下の場所にそれぞれスキーマを定義する。

- `components.schemas`: モデル定義
- `components.requestBodies` : モデル定義などを利用したリクエスト定義
- `components.responses` : モデル定義などを利用したレスポンス定義

### 拡張について

OpenAPI では `^x-` の形式で拡張を許容している。
https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#specification-extensions

このツールでは以下の拡張を実装する。

- x-id-attribute
  文字列形式でエンティティ化するときの ID 相当の属性を指定する。(未指定時は `id`)
  ネストしている属性を利用する場合、`xxx.yyy` のような指定もできる。
- x-attribute-as
  文字列形式で同モデル内での属性エイリアスを定義する。 (非推奨)
- x-enum-key-attributes
  プロパティの中に enum で指定しているものを保持している場合に、そのキーを指定する。
