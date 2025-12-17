import { findSegment } from '../utils';
import { type IMenuItem } from '@platform/core';

describe('findSegment', () => {
  const mockMenu: IMenuItem[] = [
    {
      id: '0',
      text: 'Home',
      path: 'home',
      children: [
        {
          id: '1',
          text: 'About',
          path: 'about',
          children: [
            {
              id: '2',
              text: 'Contact',
              path: 'contact',
              children: [],
            },
          ],
        },
        {
          id: '3',
          text: 'Services',
          path: 'services',
          children: [],
        },
        {
          id: '4',
          text: 'Products',
          path: 'products',
          children: [],
        },
      ],
    },
    {
      id: '5',
      text: 'Blog',
      path: 'blog',
      children: [
        {
          id: '6',
          text: 'Posts',
          path: 'post',
          children: [],
        },
      ],
    },
  ];

  it('должен возвращать пустой массив, если сегмент не найден', () => {
    const result = findSegment(mockMenu, ['nonexistent']);
    expect(result).toEqual([]);
  });

  it('должен возвращать правильный сегмент, если он существует', () => {
    const result = findSegment(mockMenu, ['home']);
    expect(result).toEqual(['0']);
  });

  it('должен возвращать правильный вложенный сегмент, если он существует', () => {
    const result = findSegment(mockMenu, ['home', 'about']);
    expect(result).toEqual(['0', '0']);
  });

  it('должен возвращать правильный вложенный сегмент, если он существует и имеет дочерние элементы', () => {
    const result = findSegment(mockMenu, ['home', 'about', 'contact']);
    expect(result).toEqual(['0', '0', '0']);
  });
  it('должен возвращать правильный вложенный сегмент, если он существует и имеет дочерние элементы', () => {
    const result = findSegment(mockMenu, ['blog', 'post']);
    expect(result).toEqual(['1', '0']);
  });
});
