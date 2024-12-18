export const DefaultMainMenuItems = {
  menuItems: {
    'default.home': {
      title: 'Home',
      icon: 'home',
      to: '/',
      priority: 100,
    },
    'default.my-group': {
      title: 'My Group',
      icon: 'group',
      priority: 90,
    },
    'default.catalog': {
      title: 'Catalog',
      icon: 'category',
      to: 'catalog',
      priority: 80,
    },
    'default.apis': {
      title: 'APIs',
      icon: 'extension',
      to: 'api-docs',
      priority: 70,
    },
    'default.learning-path': {
      title: 'Learning Paths',
      icon: 'school',
      to: 'learning-paths',
      priority: 60,
    },
    // Hide Create item when Create button is displayed in header
    // 'default.create': {
    //   title: 'Create...',
    //   icon: 'add',
    //   to: 'create',
    //   priority: 50,
    // },
  },
};
