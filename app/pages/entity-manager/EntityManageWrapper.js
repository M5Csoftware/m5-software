'use client';
import { EntityProvider } from '@/app/Context/EntityContext';
import React from 'react';

const EntityManagerWrapper = ({ children }) => {
  return <EntityProvider>{children}</EntityProvider>;
};

export default EntityManagerWrapper;
