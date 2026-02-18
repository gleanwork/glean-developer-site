import type React from 'react';

interface CardGroupProps {
  cols?: number;
  children?: React.ReactNode;
}

const CardGroup: React.FC<CardGroupProps> = ({ cols = 2, children }) => {
  return (
    <div
      className={`
        grid gap-6 my-6
        ${cols === 1 ? 'grid-cols-1' : ''}
        ${cols === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}
        ${cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
        ${cols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : ''}
      `}
    >
      {children}
    </div>
  );
};

export default CardGroup;
