/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { isHtmlTarget } from './events';

describe('Event Utils', () => {
  describe('isHtmlElement', () => {
    it('Returns true when necessary', () => {
      const el = document.createElement('a');
      expect(isHtmlTarget(el)).toBeTruthy();
    });

    it('Returns false when expected', () => {
      const notEl = false;
      expect(isHtmlTarget(notEl)).toBeFalsy();
    });

    it('Works everywhere', () => {
      expect(isHtmlTarget(null)).toBeFalsy();
      expect(isHtmlTarget(document.createElement('div'))).toBeTruthy();
      expect(isHtmlTarget(new Text())).toBeFalsy();
      expect(isHtmlTarget(undefined)).toBeFalsy();
    });
  });
});
