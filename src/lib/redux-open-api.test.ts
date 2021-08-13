import fs from 'fs';
import nock from 'nock';
import createMiddleware, { HttpClient } from './redux-open-api';
import jsYaml from 'js-yaml';
import noop from 'lodash/noop';
import assert from 'assert';
nock.disableNetConnect();

const spec = jsYaml.load(fs.readFileSync('example/timeline.v3.yml', 'utf8'));

describe('middleware', () => {
  const nextFunction = jest.fn();
  const subject = (...args: TODO) => {
    return createMiddleware(spec).then((middleware: TODO) => {
      return middleware()(nextFunction)(...args);
    });
  };

  describe('not open api action', () => {
    const action = 'foo';
    test('call next action.', () =>
      subject(action).then(() => {
        expect(nextFunction).toBeCalledWith(action);
      }));
  });

  const action = {
    type: 'GET_TIMELINE',
    meta: {
      openApi: true,
      id: 'get_timeline',
      schema: {
        200: {},
      },
    },
  };
  describe('open api action (success)', () => {
    beforeEach(() => {
      nock(/.*/).get('/timeline').reply(200, {
        response: 'test response',
      });
    });
    test('call action with response.', () =>
      subject(action).then(() => {
        const expected = Object.assign(action, {
          payload: {
            entities: {},
            result: {
              response: 'test response',
            },
          },
        });
        expect(nextFunction).toBeCalledWith(expected);
      }));
  });

  describe('open api action (success & no-schema)', () => {
    beforeEach(() => {
      nock(/.*/).get('/timeline').reply(202, {
        response: 'no schema',
      });
    });
    test('call action with response.', () =>
      subject(action).then(() => {
        const expected = Object.assign(action, {
          payload: {
            response: 'no schema',
          },
        });
        expect(nextFunction).toBeCalledWith(expected);
      }));
  });

  describe('open api action (failed)', () => {
    beforeEach(() => {
      nock(/.*/).get('/timeline').reply(400);
    });
    test('call action with error.', () =>
      subject(action).then(noop, () => {
        expect(nextFunction.mock.calls[0][0]).toMatchObject({
          error: true,
          type: 'ERROR_GET_TIMELINE',
        });
      }));
  });
});

describe('http client', () => {
  const res = {
    response: 'test response',
  };
  beforeEach(() => {
    nock(/.*/).get('/pets').reply(200, res);
  });

  test('can request', () => {
    return HttpClient({
      url: 'http://localhost/pets',
    }).then((res: TODO) => {
      assert.strictEqual(res.status, 200);
      assert(res.body, res);
    });
  });
});
