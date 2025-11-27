import '@testing-library/jest-dom';
import 'reflect-metadata';
import { vi, beforeEach } from 'vitest';
import 'vitest-canvas-mock';

global.vi = vi;

beforeEach(() => {
  process.env.NODE_ENV = 'test';
});
