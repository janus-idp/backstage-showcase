import React from 'react';
import { apis } from './apis';
import DynamicRoot from './components/DynamicRoot';

const AppRoot = () => (
  <DynamicRoot apis={apis} afterInit={() => import('./components/AppBase')} />
);

export default AppRoot;
