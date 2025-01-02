import { describe, test, expect } from 'vitest';
import { useVM } from '../useVM';
import { renderHook } from '@testing-library/react';
import { DIProvider } from '../../providers/DIProvider';

const container: any = {
  get: (diInstance: string) => {
    return diInstance;
  },
};
describe('useVM', () => {
  test('should throw an error if DIContext is not available', () => {
    const diInstance = 'someOtherVM';

    expect(() => {
      renderHook(() => useVM(diInstance));
    }).toThrow('DI Container context not initialized');
  });

  test('should return view model', () => {
    const diInstance = 'someVM';
    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    const { result } = renderHook(() => useVM(diInstance), { wrapper });

    expect(result.current).toBe(diInstance);
  });
});
