# ツール

## createEntitiesReducer
- [normalizr](https://github.com/paularmstrong/normalizr)で正規化された `enitites`をモデル化して格納するreducerを準備する関数です。  
  取得したレスポンスを正規化したうえでマージします。
  ```js
  /**
   * @params Models {[key: string]: Model} モデル一覧のオブジェクト(keyはyml記載の名前)
   * @params additionalReducer Function マージでは対応できない処理を追加する関数
   * @params initialState Map reducerのinitial state
   * @returns Function reducer関数を返します
   */
  createEntitiesReducer(Models, {additionalReducer, initialState})
  ```
- このreducerが扱うstateはimmutable.jsのインスタンス群です。  
  **payload経由で取得されたJavaScriptオブジェクト(immutable.jsでもよい)をimmutable.jsのインスタンスに変換しマージする責務を持ちます。**
- additionalReducerの例
  ```js
  import * as ActionTypes from 'actions/actionTypes';
  function additionalReducer(state = Map(), action = {}) {
    const id = action.payload.id;
    switch(action.type) {
      case ActionTypes.DELETE_PETS__ID_:
        return state.removeIn(['Pet', id.toString()]);
      default:
        return state;
    }
  }
  ```
- resetMetaCreator
  該当のaction結果でマージではなく置き換えが必要な場合は `meta.reset = true`とします。  
  以下のようにすることで対応できます。
  ```js
  import { resetMetaCreator } from 'openapi-to-normalizr';
  import { createOpenApiAction, SOME_ACTION } from 'generated_action_types_action_types';

  const someAction = createOpenApiAction(SOME_ACTION, null, resetMetaCreator);
  ```

## createOpenApiMiddleware
- [swagger-js](https://github.com/swagger-api/swagger-js)を使ってAPI定義から通信部分を自動化するmiddlewareを準備します。  
  ```js

  /**
   * @params spec Object OpenAPI形式のJSオブジェクト
   * @params httpOptions Object `swagger-js`のhttpオブジェクトへのオプションと同様(以下は一部)
   * @params httpOptions.requestInterceptor Function
   * @params httpOptions.responseInterceptor Function
   * @returns Promise middleware関数を返す
   */
  createOpenApiMiddleware(spec, [httpOptions]);
  ```
- `openapi2schema`コマンドで生成される `spec.js`をrequireして `spec`引数として利用できます。
- このmiddlewareはAPI定義に従った通信結果をnormalizeする責務を持ちます。(immutable.jsのインスタンスは入り込みません)
- middlewareではエラーをハンドリングして、`ERROR_${ACTION_TYPE}` のアクションを発行します。
  エラー時にはこちらをreducerで利用してください。

## createOpenApiAction
- 自動生成される `action_types/sample.js`から `export`される関数です。  
  I/Fは [redux-actions](https://www.gitbook.com/book/vinnymac/redux-actions)の `createAction` と同様です。
  ```js
  import { createOpenApiAction, GET_PETS__ID_ } from 'action_types/sample';
  const action = createOpenApiAction(GET_PETS__ID_);
  ```
