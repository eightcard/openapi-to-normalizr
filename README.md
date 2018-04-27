[![CircleCI](https://circleci.com/gh/eightcard/openapi-to-normalizr.svg?style=svg)](https://circleci.com/gh/eightcard/openapi-to-normalizr)
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
- generate models
  ```bash
  % $(npm bin)/openapi2models --config config.js foo.yml
  ```
- generate schemas (and actionTypes.js, schema.js)
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
    modelsDir: 'models output directory', // default: tmp
    outputDir: 'actions,schemas output directory', // default: tmp
    useFlow: 'use flowtype?(true/false)', // default: false (experiment)
    usePropType: 'use prop-type?(true/false)',  // default: true
    attributeConverter: 'attribute converter function',
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

createOpenApiMiddleware(Spec).then((middleware) => {
  return createStore(
    reducers,
    applyMiddleware(middleware)
  );
}).then((store) => {
  // React Application code.
});
```


## API

### createEntitiesReducer(Models, {additionalReducer})
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
  switch(action.type) {
    case ActionTypes.DELETE_PETS__ID_:
      return state.removeIn(['Pet', id.toString()]);
    default:
      return state;
  }
}
```

### createOpenApiMiddleware(spec, [httpOptions])
create redux middleware support [swagger-js](https://github.com/swagger-api/swagger-js).

#### spec
Type: Object

OpenAPI Spec 

#### httpOptions
Type: Object

Same as httpOptions of swagger-js.

