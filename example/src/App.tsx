import { useState, useEffect, useCallback } from 'react';
import { applyMiddleware, createStore, Store, combineReducers } from 'redux';
import { Provider, useDispatch, useSelector } from 'react-redux';
import thunk from 'redux-thunk';
import { createOpenApiMiddleware, createEntitiesReducer } from 'openapi-to-normalizr';
import './App.css';

// 自動生成ファイル
import rawSpec from './autoGen/sample_api';
import * as Models from './autoGen/models';

import { getTimeline, postPost, deletePost } from './actions/timeline';
import timelineReducer from './reducers/timeline';
import Timeline from './components/Timeline';
import Form from './components/Form';
import isEqual from 'lodash/isEqual';

const FormContainer = () => {
  const dispatch = useDispatch();
  const handleSubmit = useCallback((data: any) => dispatch(postPost(data)), [dispatch]);

  return <Form onRequestSubmit={handleSubmit} />;
};

const TimelineContainer = () => {
  const dispatch = useDispatch();
  const timeline = useSelector(
    ({ timeline, autoEntities }: { timeline: number[]; autoEntities: unknown }) =>
      Models.Post.denormalize(timeline, autoEntities),
    isEqual,
  );
  const handleRequestDelete = useCallback((id: number) => dispatch(deletePost({ id })), [dispatch]);

  useEffect(() => {
    dispatch(getTimeline());
  }, [dispatch]);

  return <Timeline timeline={timeline.reverse()} onRequestDelete={handleRequestDelete} />;
};

const App = () => {
  const [store, setStore] = useState<Store>();

  useEffect(() => {
    const reducer = combineReducers({
      timeline: timelineReducer,
      autoEntities: createEntitiesReducer(Models),
    });

    createOpenApiMiddleware(rawSpec).then((middleware: any) => {
      setStore(createStore(reducer, applyMiddleware(thunk, middleware)));
    });
  }, []);

  if (!store) return null;

  return (
    <Provider store={store}>
      <div className='container'>
        <FormContainer />
        <TimelineContainer />
      </div>
    </Provider>
  );
};

export default App;
