import { MenuItem } from './extractDynamicConfig';
import { compareMenuItems } from './extractDynamicConfigFrontend';

describe('compareMenuItems', () => {
  it('should correctly order items based on priority', () => {
    const item1: MenuItem = {
      name: 'item1',
      title: 'Item 1',
      icon: 'icon1',
      children: [],
      priority: 1,
    };
    const item2: MenuItem = {
      name: 'item2',
      title: 'Item 2',
      icon: 'icon2',
      children: [],
      priority: 2,
    };

    expect(compareMenuItems(item1, item2)).toBeGreaterThan(0);
    expect(compareMenuItems(item2, item1)).toBeLessThan(0);
  });

  it('should treat undefined priority as 0', () => {
    const item1: MenuItem = {
      name: 'item1',
      title: 'Item 1',
      icon: 'icon1',
      children: [],
      priority: 1,
    };
    const itemWithoutPriority: MenuItem = {
      name: 'itemWithoutPriority',
      title: 'No Priority',
      icon: 'icon3',
      children: [],
    };

    expect(compareMenuItems(item1, itemWithoutPriority)).toBeLessThan(0);
    expect(compareMenuItems(itemWithoutPriority, item1)).toBeGreaterThan(0);
  });

  it('should return 0 if both priorities are equal', () => {
    const item1: MenuItem = {
      name: 'item1',
      title: 'Item 1',
      icon: 'icon1',
      children: [],
      priority: 1,
    };
    const item2: MenuItem = {
      name: 'item2',
      title: 'Item 2',
      icon: 'icon2',
      children: [],
      priority: 1,
    };

    expect(compareMenuItems(item1, item2)).toBe(0);
  });

  it('should handle both items without priority', () => {
    const item1: MenuItem = {
      name: 'item1',
      title: 'Item 1',
      icon: 'icon1',
      children: [],
    };
    const item2: MenuItem = {
      name: 'item2',
      title: 'Item 2',
      icon: 'icon2',
      children: [],
    };

    expect(compareMenuItems(item1, item2)).toBe(0);
  });
});
