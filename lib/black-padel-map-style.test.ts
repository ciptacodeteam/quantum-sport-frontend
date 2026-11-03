import { afterEach, expect, it, vi } from 'vitest';
import {
  featureFilter,
  validateStyleMin,
  type FilterSpecification,
  type StyleSpecification
} from '@maplibre/maplibre-gl-style-spec';
import style from '@/public/assets/maps/black-padel.json';

afterEach(() => vi.restoreAllMocks());
it('keeps a valid map style and safely filters road labels with missing or malformed lengths', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(validateStyleMin(style as StyleSpecification)).toEqual([]);
  const networks = {
    'highway-shield-non-us': 'id-national',
    'highway-shield-us-interstate': 'us-interstate',
    road_shield_us: 'us-highway'
  };
  for (const [id, network] of Object.entries(networks)) {
    const layer = style.layers.find((layer) => layer.id === id)!;
    const compiled = featureFilter(layer.filter as FilterSpecification, `layers[${id}].filter`);
    for (const [length, expected] of [
      [undefined, false],
      [null, false],
      ['bad', false],
      [3, true],
      ['3', true],
      [7, false]
    ] as const) {
      expect(
        compiled.filter({ zoom: 15 }, { type: 2, properties: { network, ref_length: length } })
      ).toBe(expected);
    }
  }
  expect(warn).not.toHaveBeenCalled();
});
