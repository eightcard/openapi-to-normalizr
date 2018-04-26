import nock from 'nock';
import sinon from 'sinon';
import createMiddleware from './redux-open-api';
import spec from '../../examples/petstore.v3';
import noop from 'lodash/noop';
nock.disableNetConnect();

describe('middleware', () => {
  const nextFunction = sinon.spy();
  const subject = (...args) => {
    return createMiddleware(spec).then((middleware) => {
      return middleware()(nextFunction)(...args);
    });
  };

  describe('not open api action', () => {
    const action = 'foo';
    it('call next action.', () => subject(action).then(() => {
      sinon.assert.calledWith(nextFunction, action);
    }));
  });

  const action = {
    type: 'GET_PETS',
    meta: {
      openApi: true,
      id: 'get_pets',
      schema: {200: {}}
    },
  };
  describe('open api action (success)', () => {
    beforeEach(() => {
      nock(/.*/).get('/pets').reply(200, {response: 'test response'});
    });
    it('call action with response.', () => subject(action).then(() => {
      const expect = Object.assign(action, {payload: {entities: {}, result: {response: 'test response'}}});
      sinon.assert.calledWith(nextFunction, expect);
    }));
  });

  describe('open api action (failed)', () => {
    beforeEach(() => {
      nock(/.*/).get('/pets').reply(400);
    });
    it('call action with error.', () => subject(action).then(noop, () => {
      sinon.assert.calledWith(nextFunction, sinon.match({error: true}));
    }));
  });
});
