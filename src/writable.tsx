import React, { useEffect, useState } from 'react';

export const isWritable = typeof window !== 'undefined';

export const Writable: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ writable, setWritable ] = useState(false);

  useEffect(() => {
    if (isWritable) {
      setWritable(true);
    }
  });

  return (
    <>{ writable ? children : [] }</>
  );
};
