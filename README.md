# OpenAPI to normalizr

## 概要
- [OpenAPI](https://github.com/OAI/OpenAPI-Specification)で記述されたAPI定義から [normalizr](https://github.com/paularmstrong/normalizr)で利用できるスキーマ定義を生成します。
- [swagger-js](https://github.com/swagger-api/swagger-js)を使った通信用middlewareと、レスポンスを正規化するreducerを提供します。

## インストール
```bash
% npm i git+ssh://git@github.com/MtBlue81/openapi-to-normalizr.git
```

## 使い方
1. コードの自動生成
    - OpenAPI形式のYAMLを準備
    - モデルコードを生成
      ```bash
      % node_modules/.bin/openapi2models --config config.js foo.yml
      ```
    - スキーマコードを生成
      ```bash
      % node_modules/.bin/openapi2schemas --config config.js foo.yml
      ```
    - config仕様
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
        modelsDir: 'モデル出力先',
        outputDir: 'actions,schemasの出力先',
        useFlow: 'flowtype利用(true/false)',
        usePropType: 'prop-type利用(true/false)',
        attributeConverter: '属性コンバート用関数',
      }
      ```
      
2. 自動生成コードの利用
    - `redux`のmiddlewareを利用したAPIリクエストと `normalizr` を利用したレスポンス正規化を行います。
      ```js
      import { applyMiddleware, createStore } from 'redux';
      // 自動生成ファイルがtmp配下に生成された場合
      import rawSpec from 'tmp/spec';
      import * as Models from 'tmp/models';
      import * as ActionTypes from 'tmp/actions/actionTypes';
      const createEntitiesAction = ActionTypes.createAction;
      import { createEntitiesReducer, createOpenApiMiddleware } from 'openapi-to-normalizr';

      // JS形式のSpecを渡してAPI通信を自動で行なうmiddlewareを準備する
      createOpenApiMiddleware(rawSpec).then((middleware) => {
        const store = createStore(
          // Modelクラスを渡してreducerで正規化＆モデル化してもらう
          createEntitiesReducer(Models),
          applyMiddleware(middleware)
        );
        const action = createEntitiesAction(ActionTypes.GET_PETS__ID_);
        store.dispatch(action({id: 1}));
      });
      ``` 
    - [examples](./examples/README.md)では簡単なAPI定義から動作確認するサンプルがあります。
    - [src/lib](./src/lib/README.md)に `createEntitiesReducer`, `createOpenApiMiddleware`の仕様があります。
      

## その他
### パスのIDについて
- パスごとの `operationId` は利用しない。  
- 自動的に以下の規約でIDが振られることになる。  
   - `/` -> `_` 
   -  `{foo}` -> `_foo_`
-  ReduxアクションのtypeなどではこのIDを大文字にしたものを利用する。

### モデルについて
- swagger-uiで表現できないため、ディレクトリには分割しない。  
- ドメイン依存するような場合はモデル名自体で対応する。
- モデル名は `UpperCamelCase`  
  例: `User`, `CompanyAccount`
  
### componentsの定義
以下の場所にそれぞれスキーマを定義していく。
- `components.schemas`: モデル定義
- `components.requests` : モデル定義などを利用したリクエスト定義
- `components.responses` : モデル定義などを利用したレスポンス定義
  
### 拡張について
OpenAPIでは `^x-` の形式で拡張を許容している。  
https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#specification-extensions

このツールでは以下の拡張を実装する。
- x-id-attribute  
  文字列形式でエンティティ化するときのID相当の属性を指定する。(未指定時は `id`)
  ネストしている属性を利用する場合、`xxx.yyy` のような指定もできる。
- x-attribute-as
  文字列形式で同モデル内での属性エイリアスを定義する。 (非推奨)

