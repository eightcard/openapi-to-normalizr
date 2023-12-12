import { GET_TIMELINE, POST_TIMELINE, DELETE_TIMELINE__ID_ } from '../autoGen/action_types/sample';
import { handleActions } from 'redux-actions';

type NormalizedPayload = {
  entities: unknown;
  result: TODO;
};
const reducer = handleActions<number[], NormalizedPayload, { requestPayload: TODO }>(
  {
    [GET_TIMELINE]: (state, { payload }) => payload.result,
    [POST_TIMELINE]: (state, { payload }) => [...state, payload.result],
    [DELETE_TIMELINE__ID_]: (state, { meta }) =>
      state.filter((id) => id !== meta.requestPayload.id),
  },
  [],
);

export default reducer;
