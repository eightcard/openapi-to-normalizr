import React, { useState, useEffect, useCallback } from 'react';
import { applyMiddleware, createStore, Store, combineReducers } from 'redux';
import { Provider, useDispatch, useSelector } from 'react-redux';
import thunk from 'redux-thunk';
import { createOpenApiMiddleware, createEntitiesReducer } from '../../dist';
import './App.css';

// 自動生成ファイル
import rawSpec from './autoGen/sample_api';
import * as Models from './autoGen/models';

import { getTimeline, postPost, deletePost } from './actions/timeline';
import timelineReducer from './reducers/timeline';
import Timeline from './components/Timeline';
import Form from './components/Form';

const FormContainer = () => {
  const dispatch = useDispatch();
  const handleSubmit = useCallback((data) => dispatch(postPost(data)), [dispatch]);

  return <Form onRequestSubmit={handleSubmit} />;
};

const TimelineContainer = () => {
  const dispatch = useDispatch();
  const timeline = useSelector(({ timeline, autoEntities }: any) =>
    Models.Post.denormalize(timeline, autoEntities),
  );
  const handleRequestDelete = useCallback((id: number) => dispatch(deletePost({ id })), [dispatch]);

  useEffect(() => {
    dispatch(getTimeline());
  }, [dispatch]);

  return <Timeline timeline={timeline} onRequestDelete={handleRequestDelete} />;
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
