import assert from 'assert';
import { createReducer } from './entities-reducer';
import { Map, Record } from 'immutable';

class DummyClass extends Record({
  id: undefined, // eslint-disable-line no-undefined
  name: undefined, // eslint-disable-line no-undefined
  label: 'default',
}) {}
const additionalReducer = (state: TODO) => state;

describe('createReducer', () => {
  let initialState: TODO;
  const subject = () =>
    createReducer(
      {
        dummy: DummyClass,
      },
      {
        initialState,
        additionalReducer,
      },
    );

  afterEach(() => {
    initialState = undefined; // eslint-disable-line no-undefined
  });

  test('get reducer function', () => {
    assert(typeof subject() === 'function');
  });

  test('can send initialState', () => {
    initialState = Map({
      foo: 'bar',
    });
    const reducer = subject();
    assert.deepStrictEqual(reducer(), initialState);
  });

  test('reducer can reduce entities', () => {
    const reducer = subject();
    let state = reducer();

    const firstAction = {
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
          },
        },
      },
    };

    state = reducer(state, firstAction);

    assert.deepStrictEqual(state.toJS(), {
      dummy: {
        // instantiate registered class
        1: {
          id: 1,
          name: 'foo-bar',
          label: 'default',
        },
      },
      other: {
        2: {
          id: 2,
          name: 'bar-baz',
        },
      },
    });

    const secondAction = {
      payload: {
        entities: {
          dummy: {
            1: {
              id: 1,
              label: 'some label',
            },
          },
          other: {
            2: {
              id: 2,
              rest: true,
            },
          },
        },
      },
    };

    state = reducer(state, secondAction);

    assert.deepStrictEqual(state.toJS(), {
      dummy: {
        1: {
          id: 1,
          name: 'foo-bar',
          label: 'some label',
        },
      },
      other: {
        2: {
          id: 2,
          name: 'bar-baz',
          rest: true,
        },
      },
    });
  });

  test('concat array', () => {
    const reducer = subject();
    const initialState = reducer(reducer(), {
      payload: {
        entities: {
          dummy: {
            1: {
              id: 1,
              name: ['foo', 'bar'],
              label: 'default',
            },
          },
          foo: {
            2: {
              id: 2,
              name: 'bar-baz',
              rest: true,
            },
          },
        },
      },
    });

    const action = {
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
            },
          },
        },
      },
    };

    const nextState = reducer(initialState, action);

    const expect = {
      dummy: {
        1: {
          id: 1,
          name: ['foo', 'bar', 'foo', 'baz'], // concat
          label: 'default',
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

  test('reset when reset=true', () => {
    const reducer = subject();
    const initialState = reducer(reducer(), {
      payload: {
        entities: {
          dummy: {
            1: {
              id: 1,
              name: 'foo',
            },
          },
          foo: {
            2: {
              id: 2,
              name: 'bar-baz',
              rest: true,
            },
          },
        },
      },
    });

    const action = {
      meta: {
        reset: true,
      },
      payload: {
        entities: {
          dummy: {
            1: {
              id: 1,
            },
          },
          foo: {
            2: {
              id: 2,
              name: 'bar-baz',
            },
          },
        },
      },
    };

    const nextState = reducer(initialState, action);

    const expect = {
      dummy: {
        1: {
          id: 1,
          // eslint-disable-next-line no-undefined
          name: undefined, // initialized
          // eslint-disable-next-line no-undefined
          label: 'default', // initialized
        },
      },
      foo: {
        2: {
          id: 2,
          name: 'bar-baz',
        },
      },
    };

    // Immutable.jsのままだと "__ownerID" がマッチしない
    assert.deepStrictEqual(nextState.toJS(), expect);
  });
});
