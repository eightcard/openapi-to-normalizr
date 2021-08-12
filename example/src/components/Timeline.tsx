import React from 'react';
import './Timeline.css';

const Timeline = ({
  timeline,
  onRequestDelete,
}: {
  timeline: any[];
  onRequestDelete: (id: number) => void;
}) => (
  <ul className='timeline'>
    {timeline.map((post: any) => (
      <li key={post.id} className='post'>
        <img className='avatar' src={post.publisher.logo ?? '/avatar.png'} alt='avatar' />
        <div className='contents'>
          <span className='publisher'>{post.publisher.name}</span>
          <span>{new Date(post.postedAt).toLocaleString('ja-JP')}</span>
          <p className='text'>{post.text}</p>
        </div>
        <button className='deleteButton' onClick={() => onRequestDelete(post.id)}>
          x
        </button>
      </li>
    ))}
  </ul>
);

export default Timeline;
