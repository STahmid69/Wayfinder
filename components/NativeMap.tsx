import React, { forwardRef, useImperativeHandle, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';

// ─── WebView-based OpenStreetMap (no API key needed) ──────────────────────────

const LEAFLET_HTML = (isDark: boolean, lat: number, lng: number, zoom: number) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; }
  html,body,#map { width:100%; height:100%; }
  .leaflet-control-zoom { display:none !important; }
  .leaflet-control-attribution { font-size:8px !important; opacity:0.6; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:false}).setView([${lat},${lng}],${zoom});
  var tileUrl = ${isDark
    ? "'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'"
    : "'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"};
  L.tileLayer(tileUrl,{maxZoom:19}).addTo(map);

  var markers = {};
  var polyline = null;
  var routeGlow = null;

  function handleMessage(data) {
    try {
      var msg = JSON.parse(data);
      switch(msg.type) {
        case 'setView':
          map.flyTo([msg.lat,msg.lng], msg.zoom || map.getZoom(), {duration:0.8});
          break;
        case 'fitBounds':
          map.fitBounds([[msg.sw[0],msg.sw[1]],[msg.ne[0],msg.ne[1]]], {padding:[50,50],maxZoom:15});
          break;
        case 'addMarker':
          if(markers[msg.id]) map.removeLayer(markers[msg.id]);
          var icon = L.divIcon({className:'',iconSize:[110,50],iconAnchor:[55,50],html:msg.html});
          markers[msg.id] = L.marker([msg.lat,msg.lng],{icon:icon}).addTo(map);
          break;
        case 'removeMarker':
          if(markers[msg.id]){map.removeLayer(markers[msg.id]);delete markers[msg.id];}
          break;
        case 'clearMarkers':
          for(var k in markers){map.removeLayer(markers[k]);}
          markers={};
          break;
        case 'setPolyline':
          if(polyline) map.removeLayer(polyline);
          if(routeGlow) map.removeLayer(routeGlow);
          if(msg.positions && msg.positions.length >= 2) {
            var latlngs = msg.positions.map(function(p){return [p[0],p[1]];});
            routeGlow = L.polyline(latlngs,{color:msg.color||'#FF6A00',weight:(msg.weight||5)+4,opacity:(msg.opacity||0.85)*0.3,lineCap:'round',lineJoin:'round'}).addTo(map);
            polyline = L.polyline(latlngs,{color:msg.color||'#FF6A00',weight:msg.weight||5,opacity:msg.opacity||0.85,lineCap:'round',lineJoin:'round'}).addTo(map);
          }
          break;
        case 'clearPolyline':
          if(polyline){map.removeLayer(polyline);polyline=null;}
          if(routeGlow){map.removeLayer(routeGlow);routeGlow=null;}
          break;
      }
    } catch(e){}
  }

  // Listen for messages from React Native
  document.addEventListener('message', function(e){ handleMessage(e.data); });
  window.addEventListener('message', function(e){ handleMessage(e.data); });

  // Send map click events back to React Native
  map.on('click', function(e) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
      type:'mapClick', lat:e.latlng.lat, lng:e.latlng.lng
    }));
  });
</script>
</body>
</html>
`;

export const PROVIDER_DEFAULT = null;

export const MapView = forwardRef<any, any>(
  ({ initialRegion, children, customMapStyle, onMapClick, style, ...rest }, ref) => {
    const isDark = useColorScheme() === 'dark';
    const webViewRef = useRef<WebView>(null);
    const lat = initialRegion?.latitude ?? 3.139;
    const lng = initialRegion?.longitude ?? 101.6869;
    const [isReady, setIsReady] = useState(false);

    // Collect children data for markers
    const childData = useRef<Map<string, any>>(new Map());

    const sendMessage = useCallback((msg: any) => {
      if (webViewRef.current && isReady) {
        webViewRef.current.postMessage(JSON.stringify(msg));
      }
    }, [isReady]);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number }) => {
        const zoom = region.latitudeDelta ? Math.round(Math.log2(360 / region.latitudeDelta)) : undefined;
        sendMessage({ type: 'setView', lat: region.latitude, lng: region.longitude, zoom });
      },
      fitBounds: (bounds: [[number, number], [number, number]]) => {
        sendMessage({ type: 'fitBounds', sw: bounds[0], ne: bounds[1] });
      },
    }));

    const handleWebViewMessage = useCallback((event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapClick' && onMapClick) {
          onMapClick({ lat: data.lat, lng: data.lng });
        }
      } catch (e) {}
    }, [onMapClick]);

    const html = LEAFLET_HTML(isDark, lat, lng, 14);

    return (
      <View style={[StyleSheet.absoluteFill, style]}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={StyleSheet.absoluteFill}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => setIsReady(true)}
          onMessage={handleWebViewMessage}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          androidLayerType="hardware"
        />
        {/* Render children so they can communicate with WebView */}
        <MarkerContext.Provider value={{ sendMessage, isReady }}>
          <View style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
            {children}
          </View>
        </MarkerContext.Provider>
      </View>
    );
  }
);

MapView.displayName = 'MapView';

// ─── Context for children to communicate with WebView ─────────────────────────
const MarkerContext = React.createContext<{
  sendMessage: (msg: any) => void;
  isReady: boolean;
}>({ sendMessage: () => {}, isReady: false });

// ─── Marker Component ─────────────────────────────────────────────────────────
export function Marker({ coordinate, markerColor = '#FF6A00', markerLabel = '', children }: any) {
  const { sendMessage, isReady } = React.useContext(MarkerContext);
  const idRef = useRef(`marker_${Math.random().toString(36).slice(2, 9)}`);

  React.useEffect(() => {
    if (!isReady || !coordinate) return;

    const html = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
        <div style="
          background:${markerColor};
          padding:3px 8px;
          border-radius:12px;
          font-size:10px;
          font-weight:900;
          color:black;
          white-space:nowrap;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
          font-family:-apple-system,sans-serif;
          letter-spacing:0.3px;
          max-width:110px;
          overflow:hidden;
          text-overflow:ellipsis;
        ">${markerLabel}</div>
        <div style="
          width:28px;
          height:28px;
          background:${markerColor};
          border-radius:50%;
          border:2.5px solid white;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 3px 8px rgba(0,0,0,0.4);
          font-size:15px;
        ">🚗</div>
      </div>
    `;

    sendMessage({
      type: 'addMarker',
      id: idRef.current,
      lat: coordinate.latitude,
      lng: coordinate.longitude,
      html,
    });

    return () => {
      sendMessage({ type: 'removeMarker', id: idRef.current });
    };
  }, [isReady, coordinate?.latitude, coordinate?.longitude, markerColor, markerLabel, sendMessage]);

  return null;
}

// ─── Route Polyline ───────────────────────────────────────────────────────────
export function RoutePolyline({ positions, color = '#FF6A00', weight = 5, opacity = 0.85 }: {
  positions: { lat: number; lng: number }[];
  color?: string;
  weight?: number;
  opacity?: number;
}) {
  const { sendMessage, isReady } = React.useContext(MarkerContext);

  React.useEffect(() => {
    if (!isReady || !positions || positions.length < 2) return;

    sendMessage({
      type: 'setPolyline',
      positions: positions.map(p => [p.lat, p.lng]),
      color,
      weight,
      opacity,
    });

    return () => {
      sendMessage({ type: 'clearPolyline' });
    };
  }, [isReady, positions, color, weight, opacity, sendMessage]);

  return null;
}

// ─── Route Marker (Origin / Destination) ──────────────────────────────────────
export function RouteMarker({ coordinate, type, label }: {
  coordinate: { latitude: number; longitude: number };
  type: 'origin' | 'destination';
  label?: string;
}) {
  const { sendMessage, isReady } = React.useContext(MarkerContext);
  const idRef = useRef(`route_${type}_${Math.random().toString(36).slice(2, 9)}`);

  React.useEffect(() => {
    if (!isReady || !coordinate) return;

    const isOrigin = type === 'origin';
    const bgColor = isOrigin ? '#00FF66' : '#FF3366';
    const letter = isOrigin ? 'A' : 'B';
    const displayLabel = label || (isOrigin ? 'Start' : 'Destination');

    const html = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="
          background:#1C1C1E;
          border:2px solid ${bgColor};
          padding:3px 10px;
          border-radius:12px;
          font-size:10px;
          font-weight:900;
          color:${bgColor};
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
          font-family:-apple-system,sans-serif;
          letter-spacing:0.5px;
          max-width:120px;
          overflow:hidden;
          text-overflow:ellipsis;
        ">${displayLabel}</div>
        <div style="
          width:32px;
          height:32px;
          background:${bgColor};
          border-radius:50%;
          border:3px solid white;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 3px 10px rgba(0,0,0,0.5);
          font-size:14px;
          font-weight:900;
          color:${isOrigin ? 'black' : 'white'};
          font-family:-apple-system,sans-serif;
        ">${letter}</div>
      </div>
    `;

    sendMessage({
      type: 'addMarker',
      id: idRef.current,
      lat: coordinate.latitude,
      lng: coordinate.longitude,
      html,
    });

    return () => {
      sendMessage({ type: 'removeMarker', id: idRef.current });
    };
  }, [isReady, coordinate?.latitude, coordinate?.longitude, type, label, sendMessage]);

  return null;
}
