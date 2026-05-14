import L from 'leaflet'
import { wgs84ToGcj02, wgs84ToWgs84 } from './coordTransform'

export type MapProvider = 'osm' | 'gaode' | 'tianditu'

export interface ProviderMeta {
  label: string
  icon: string
  coordSystem: string
  coordTransform: (lat: number, lng: number) => [number, number]
}

export const PROVIDER_META: Record<MapProvider, ProviderMeta> = {
  osm: {
    label: 'OpenStreetMap',
    icon: '🌍',
    coordSystem: 'WGS-84',
    coordTransform: wgs84ToWgs84,
  },
  gaode: {
    label: '高德地图',
    icon: '📍',
    coordSystem: 'GCJ-02',
    coordTransform: wgs84ToGcj02,
  },
  tianditu: {
    label: '天地图',
    icon: '🗺️',
    coordSystem: 'WGS-84（需 API Key）',
    coordTransform: wgs84ToWgs84,
  },
}

// ─── Layer factory ─────────────────────────────────────────────────────────────
export interface LayerResult {
  base: L.TileLayer
  label?: L.TileLayer
}

export function createTileLayer(provider: MapProvider): LayerResult {
  const tdKey = import.meta.env.VITE_TIANDITU_KEY ?? ''

  switch (provider) {
    case 'osm':
      return {
        base: L.tileLayer(
          "https://c.tile.geofabrik.de/5f33d2afc5074c6da1a5c2a8a960d501/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        ),
      };

    case 'gaode':
      return {
        base: L.tileLayer(
          'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          { subdomains: '1234', maxZoom: 18, attribution: '© 高德地图' },
        ),
      }

    case 'tianditu': {
      const tk = tdKey
      return {
        base: L.tileLayer(
          `https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`,
          { subdomains: '01234567', maxZoom: 18, attribution: '© 天地图' },
        ),
        label: L.tileLayer(
          `https://t{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`,
          { subdomains: '01234567', maxZoom: 18, attribution: '' },
        ),
      }
    }

  }
}
