import assert from 'assert';
import { createReducer } from './entities-reducer';
import { Map, Record } from 'immutable';

class DummyClass extends Record({id: undefined, name: undefined}) {} // eslint-disable-line no-undefined
const additionalReducer = (state) => state;

describe('createReducer', () => {
  let initialState;
  const subject = () => createReducer({dummy: DummyClass}, {initialState, additionalReducer});

  afterEach(() => {
    initialState = undefined;
  });

  it('get reducer function', () => {
    assert(typeof subject() === 'function');
  });

  it('can send initialState', () => {
    initialState = Map({foo: 'bar'});
    const reducer = subject();
    assert.deepStrictEqual(reducer(), initialState);
  });

  it('reducer can reduce entities with openAPI action', () => {
    const reducer = subject();
    const initialState = reducer();

    const action = {
      meta: {
        openApi: true,
      },
      payload: {
        entities: {
          dummy: {
            1: {
              id: 1,
              name: 'foo-bar',
            },
          },
          other: {
            2: {
              id: 2,
              name: 'bar-baz',
            },
          }
        },
      },
    };

    const nextState = reducer(initialState, action);

    assert.deepStrictEqual(nextState.toJS(), {
      dummy: {
        // instantiate registered class
        1: {
          id: 1,
          name: 'foo-bar',
        },
      },
      other: {
        2: {
          id: 2,
          name: 'bar-baz',
        },
      },
    });
  });

  it('concat array', () => {
    const reducer = subject();
    const initialState = reducer(reducer(), {
      meta: {
        openApi: true,
      },
      payload: {
        entities: {
          dummy: {
            1: {
              id: 1,
              name: ['foo', 'bar'],
            },
          },
          foo: {
            2: {
              id: 2,
              name: 'bar-baz',
              rest: true,
            }
          }
        },
      },
    });

    const action = {
      meta: {
        openApi: true,
      },
      payload: {
        entities: {
          dummy: {
            1: {
              id: 1,
              name: ['foo', 'baz'],
            },
          },
          foo: {
            2: {
              id: 2,
              name: 'bar-baz',
            }
          }
        },
      },
    };

    const nextState = reducer(initialState, action);

    const expect = {
      dummy: {
        1: {
          id: 1,
          name: ['foo', 'bar', 'foo', 'baz'], // concat
        },
      },
      foo: {
        2: {
          id: 2,
          name: 'bar-baz',
          rest: true,
        },
      },
    };

    // Immutable.jsのままだと "__ownerID" がマッチしない
    assert.deepStrictEqual(nextState.toJS(), expect);
  });
});
