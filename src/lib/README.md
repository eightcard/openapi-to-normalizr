# ツール

## createEntitiesReducer

- [normalizr](https://github.com/paularmstrong/normalizr)で正規化された `enitites`をモデル化して格納する reducer を準備する関数です。
  取得したレスポンスを正規化したうえでマージします。
  ```js
  /**
   * @params Models {[key: string]: Model} モデル一覧のオブジェクト(keyはyml記載の名前)
   * @params additionalReducer Function マージでは対応できない処理を追加する関数
   * @params initialState Map reducerのinitial state
   * @returns Function reducer関数を返します
   */
  createEntitiesReducer(Models, { additionalReducer, initialState });
  ```
- この reducer が扱う state は immutable.js のインスタンス群です。
  **payload 経由で取得された JavaScript オブジェクト(immutable.js でもよい)を immutable.js のインスタンスに変換しマージする責務を持ちます。**
- additionalReducer の例
  ```js
  import * as ActionTypes from 'actions/actionTypes';
  function additionalReducer(state = Map(), action = {}) {
    const id = action.payload.id;
    switch (action.type) {
      case ActionTypes.DELETE_PETS__ID_:
        return state.removeIn(['Pet', id.toString()]);
      default:
        return state;
    }
  }
  ```
- resetMetaCreator
  該当の action 結果でマージではなく置き換えが必要な場合は `meta.reset = true`とします。
  以下のようにすることで対応できます。

  ```js
  import { resetMetaCreator } from 'openapi-to-normalizr';
  import { createOpenApiAction, SOME_ACTION } from 'generated_action_types_action_types';

  const someAction = createOpenApiAction(SOME_ACTION, null, resetMetaCreator);
  ```

## createOpenApiMiddleware

- [swagger-js](https://github.com/swagger-api/swagger-js)を使って API 定義から通信部分を自動化する middleware を準備します。

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

- `openapi2schema`コマンドで生成される `spec.js`を require して `spec`引数として利用できます。
- この middleware は API 定義に従った通信結果を normalize する責務を持ちます。(immutable.js のインスタンスは入り込みません)
- middleware ではエラーをハンドリングして、`ERROR_${ACTION_TYPE}` のアクションを発行します。
  エラー時にはこちらを reducer で利用してください。

## createOpenApiAction

- 自動生成される `action_types/sample.js`から `export`される関数です。
  I/F は [redux-actions](https://www.gitbook.com/book/vinnymac/redux-actions)の `createAction` と同様です。
  ```js
  import { createOpenApiAction, GET_PETS__ID_ } from 'action_types/sample';
  const action = createOpenApiAction(GET_PETS__ID_);
  ```
