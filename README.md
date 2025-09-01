[![CircleCI](https://circleci.com/gh/eightcard/openapi-to-normalizr.svg?style=svg)](https://circleci.com/gh/eightcard/openapi-to-normalizr)

**In conjunction with the migration to Sansan's GitHub Enterprise organization, this will be archived.**

# openapi-to-normalizr

> schemas generator for normalizr

[日本語](README.ja.md)

## Install

```
$ npm install git+ssh://git@github.com/eightcard/openapi-to-normalizr.git
```

## Usage

### generate code

- prepare your yaml file.
- generate schemas (and actionTypes.js, schema.js, models)
  ```bash
  % $(npm bin)/openapi2schemas --config config.js foo.yml
  ```
- about config
  ```js
  {
    templates: { // default: this repo's templates directory
      model: 'for base model',
      override: 'for extends model',
      schema: 'for schemas',
      head: 'for header',
      dependency: 'for dependency',
      models: 'for model index.js',
      actionTypes: 'for actionTypes',
      spec: 'for JS format spec',
      oneOf: 'for oneof schema',
    },
    outputPath: {
      schemas: './tmp/schemas/sample_schema.js',
      actions: './tmp/action_types/sample.js',
      jsSpec: './tmp/sample_api.js',
    },
    modelsDir: 'models output directory', // default: tmp
    usePropType: 'use prop-type?(true/false)',  // default: true
    useTypeScript: 'use TypeScript?(true/false)', // default: false (experiment)
    useTypeScriptAction: 'use TypeScript actionTypes?(true/false)', // default: false (experiment)
    useTypeScriptModel: 'use TypeScript model?(true/false)', // default: false (experiment)
    useTypeScriptSchema: 'use TypeScript schema?(true/false)', // default: false (experiment)
    useTypeScriptSpec: 'use TypeScript spec?(true/false)', // default: false (experiment)
    attributeConverter: 'attribute converter function',
    tags: ['xxx', 'yyy'], // all path include target without tags
  }
  ```

```js
import { createEntitiesReducer, createOpenApiMiddleware } from 'openapi-to-normalizr';
import * as Models from '{your models dir}/index';
import Spec from '{your output dir}/spec';
import { createStore, applyMiddleware, combineReducers } from 'redux';

const reducers = combineReducers({
  entities: createEntitiesReducer(Models),
});

createOpenApiMiddleware(Spec)
  .then((middleware) => {
    return createStore(reducers, applyMiddleware(middleware));
  })
  .then((store) => {
    // React Application code.
  });
```

## API

### createEntitiesReducer(Models, {additionalReducer, initialState})

create reducer that output normalized state as model. (normalized by [normalizr](https://github.com/paularmstrong/normalizr))

#### Models

Type: {[key: string]: Model}

#### additionalReducer

Type: Function

additional reducer that support no automatic merge reduce.

Example:

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

#### initialState

Type: Immutable.Map

reducer's initial state object.

### createOpenApiMiddleware(spec, [httpOptions])

create redux middleware support [swagger-js](https://github.com/swagger-api/swagger-js).

#### spec

Type: Object

OpenAPI Spec

#### httpOptions

Type: Object

Same as httpOptions of swagger-js.

## Release

- release is specified by only tag.

## Contributors

<a href="https://github.com/eightcard/openapi-to-normalizr/graphs/contributors">
  <img src="https://contributors-img.firebaseapp.com/image?repo=eightcard/openapi-to-normalizr" />
</a>

Made with [contributors-img](https://contributors-img.firebaseapp.com).
