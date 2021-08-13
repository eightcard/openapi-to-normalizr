import React, { useCallback } from 'react';
import './Form.css';

const Form = ({ onRequestSubmit }: { onRequestSubmit: (data: any) => void }) => {
  const handleSubmit = useCallback(
    (e) => {
      const form = e.target;
      e.preventDefault();
      onRequestSubmit({
        publisher: {
          publisherKind: 1,
          personId: 10,
        },
        text: form.text.value,
        postedAt: new Date().toISOString(),
      });
    },
    [onRequestSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className='form'>
      <textarea name='text' placeholder='いまどうしてる？' className='textarea' />
      <button type='submit' className='submitButton'>
        送信
      </button>
    </form>
  );
};
export default Form;
