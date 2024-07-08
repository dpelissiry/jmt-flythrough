mapboxgl.accessToken = 'pk.eyJ1IjoiZHBlbGlzc2lyeSIsImEiOiJjbHlidnIwdDkwNjRoMmtvaTU4cnkyMGFoIn0.405uipSt3ODpBMP6TAVcvA';
const map = new mapboxgl.Map({
    container: 'map',
    zoom: 14,
    center: [ -118.292263, 36.578489 ],
    pitch: 80,
    bearing: 41,
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/satellite-streets-v12'
});

map.on('style.load', () => {
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    map.addSource('route', {
            'type': 'geojson',
            'data': 'https://raw.githack.com/dpelissiry/jmt.geojson/'
            });
        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#ff0000',
                'line-width': 10
            }
        });

    // add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
});