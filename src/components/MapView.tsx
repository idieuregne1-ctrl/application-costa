import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MergedPlace } from '../core'
import type { Coords } from '../store/useAppStore'
import { TIER_COLOR } from '../lib/format'

/**
 * Vue carte (Leaflet + tuiles OpenStreetMap, sans clé), synchronisée avec la liste :
 * cliquer un pin sélectionne le lieu ; la sélection recentre/agrandit le pin.
 */

/** Marqueur HTML coloré par palier (évite le bug d'icônes Leaflet sous bundler). */
function pinIcon(color: string, selected: boolean): L.DivIcon {
 const size = selected ? 30 : 22
 return L.divIcon({
 className: 'creme-pin',
 html: `<div style="
 width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
 background:${color};transform:rotate(-45deg);
 border:2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.6)'};
 box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
 iconSize: [size, size],
 iconAnchor: [size / 2, size],
 })
}

/** Cadre la carte sur les marqueurs et recentre sur le lieu sélectionné. */
function MapController({
 center,
 places,
 selected,
}: {
 center: Coords
 places: MergedPlace[]
 selected: MergedPlace | null
}) {
 const map = useMap()

 // Cadrage sur l'ensemble des marqueurs quand les résultats / le centre changent.
 useEffect(() => {
 map.invalidateSize()
 if (places.length > 0) {
 const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]))
 map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
 } else {
 map.setView([center.lat, center.lng], 14)
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [places, center.lat, center.lng])

 // Zoom sur le lieu sélectionné depuis la liste.
 useEffect(() => {
 if (selected) {
 map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
 }
 }, [selected, map])

 return null
}

interface MapViewProps {
 places: MergedPlace[]
 center: Coords
 selectedId: string | null
 onSelect: (place: MergedPlace) => void
}

export default function MapView({ places, center, selectedId, onSelect }: MapViewProps) {
 const selected = useMemo(
 () => places.find((p) => p.id === selectedId) ?? null,
 [places, selectedId],
 )

 return (
 <div className="h-[60vh] overflow-hidden rounded-2xl border border-line">
 <MapContainer
 center={[center.lat, center.lng]}
 zoom={14}
 scrollWheelZoom
 className="h-full w-full"
 style={{ background: '#faf7f1' }}
 >
 <TileLayer
 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
 />
 <MapController center={center} places={places} selected={selected} />
 {places.map((place) => {
 const isSel = place.id === selectedId
 return (
 <Marker
 key={place.id}
 position={[place.lat, place.lng]}
 icon={pinIcon(TIER_COLOR[place.tier ?? 'default'], isSel)}
 zIndexOffset={isSel ? 1000 : 0}
 eventHandlers={{ click: () => onSelect(place) }}
 >
 <Tooltip direction="top" offset={[0, -24]} opacity={1}>
 <span className="text-xs font-medium">{place.name}</span>
 </Tooltip>
 </Marker>
 )
 })}
 </MapContainer>
 </div>
 )
}
