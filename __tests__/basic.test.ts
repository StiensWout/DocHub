/**
 * Basic Test Suite
 * Simple tests to verify testing setup is working correctly
 */

describe('Basic Test Suite', () => {
  test('should run basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
    expect(10 - 5).toBe(5);
  });

  test('should handle string operations', () => {
    const str = 'Hello, World!';
    expect(str.length).toBe(13);
    expect(str.toUpperCase()).toBe('HELLO, WORLD!');
    expect(str.includes('World')).toBe(true);
  });

  test('should work with arrays', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr.length).toBe(5);
    expect(arr.includes(3)).toBe(true);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6, 8, 10]);
  });

  test('should work with objects', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
    expect(Object.keys(obj)).toEqual(['name', 'value']);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('resolved');
    const result = await promise;
    expect(result).toBe('resolved');
  });

  test('should handle errors', () => {
    expect(() => {
      throw new Error('Test error');
    }).toThrow('Test error');
  });
});

