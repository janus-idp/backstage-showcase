import DynamicRoot from './components/DynamicRoot';
import { apis } from './apis';
import React from 'react';

const AppRoot = () => (
  <DynamicRoot apis={apis} afterInit={() => import('./components/AppBase')} />
);

export default AppRoot;
