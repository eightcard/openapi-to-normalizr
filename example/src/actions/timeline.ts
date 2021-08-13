import {
  createOpenApiAction,
  GET_TIMELINE,
  POST_TIMELINE,
  GET_TIMELINE__ID_,
  DELETE_TIMELINE__ID_,
} from '../autoGen/action_types/sample';

export const getTimeline = createOpenApiAction(GET_TIMELINE);
export const postPost = createOpenApiAction(POST_TIMELINE);
export const getPost = createOpenApiAction(GET_TIMELINE__ID_);
export const deletePost = createOpenApiAction(DELETE_TIMELINE__ID_);
