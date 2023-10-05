import fs from 'fs';

import createMiddleware, { HttpClient } from './redux-open-api';
import jsYaml from 'js-yaml';
import noop from 'lodash/noop';
import assert from 'assert';

import { setupServer } from 'msw/node';

import { rest } from 'msw';

type SpecIncludingBaseUrl = { servers?: [{ url?: string }] };

const hasBaseUrl = (value: unknown): value is SpecIncludingBaseUrl =>
  Boolean(value && typeof value === 'object' && 'servers' in value && Array.isArray(value.servers));

const spec = jsYaml.load(fs.readFileSync('example/timeline.v3.yml', 'utf8'));

const baseUrl = hasBaseUrl(spec) ? spec?.servers?.[0]?.url || '' : '';

const server = setupServer();

beforeAll(() => server.listen());

afterAll(() => server.close());

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
      server.resetHandlers(
        rest.get(`${baseUrl}/timeline`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ response: 'test response' }));
        }),
      );
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
      server.resetHandlers(
        rest.get(`${baseUrl}/timeline`, (req, res, ctx) => {
          return res(ctx.status(202), ctx.json({ response: 'no schema' }));
        }),
      );
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
      server.resetHandlers(
        rest.get(`${baseUrl}/timeline`, (req, res, ctx) => {
          return res(ctx.status(400));
        }),
      );
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
  const requestUrl = 'http://localhost/pets';
  const mockedResponse = { response: 'test response' };

  beforeEach(() => {
    server.resetHandlers(
      rest.get(requestUrl, (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockedResponse));
      }),
    );
  });

  test('can request', () => {
    return HttpClient({ url: requestUrl }).then((res: TODO) => {
      assert.strictEqual(res.status, 200);
      assert(res.body, res);
    });
  });
});
