import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div className={`border rounded-lg shadow-md p-4 ${className}`}>{children}</div>
);

export const CardContent: React.FC<{ children: ReactNode }> = ({ children }) => <div>{children}</div>;

export const CardHeader: React.FC<{ children: ReactNode }> = ({ children }) => <div className="font-bold text-lg mb-2">{children}</div>;

export const CardTitle: React.FC<{ children: ReactNode }> = ({ children }) => <h2 className="text-xl font-semibold">{children}</h2>; 