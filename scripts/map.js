
let targetRoute;
let loc = 0;
let coordsLength;
let interval;
const scrollableElement = document.body; 
const coordsJumped = 10;

async function load_geojson() {
    let url = 'https://raw.githack.com/dpelissiry/jmt-flythrough/main/John_Muir_Trail.geojson';
    const response = await fetch(url)
    const json_obj = await response.json();
    return json_obj;
}

async function main(){
    const route = await load_geojson();
    return route;

}

// full geojson route


mapboxgl.accessToken = 'pk.eyJ1IjoiZHBlbGlzc2lyeSIsImEiOiJjbHlidnIwdDkwNjRoMmtvaTU4cnkyMGFoIn0.405uipSt3ODpBMP6TAVcvA';
const map = new mapboxgl.Map({
    container: 'map',
    zoom: 14,
    center: [ -118.292263, 36.578489 ],
    pitch: 60,
    bearing: 270,
    dragPan: false,
    dragRotate: false,
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/dpelissiry/clyc98z0x00ml01r4a0v1frr7'
});

map.on('style.load', () => {
    
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    
    
    main().then(route => {
        targetRoute = (route.features[0].geometry.coordinates);
        console.log(targetRoute);
        coordsLength = targetRoute.length;
        map.addSource('route', {
            type: 'geojson',
            data: {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': targetRoute
                }
            }
            });
        map.addLayer({
            'id': 'route-path',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#ff0000',
                'line-width': 6
            }
        });
    

        map.addSource('position', {
            type: 'geojson',
            // dynamic: true,
            data: {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": targetRoute[loc]
                }
                
            },
        

        });
        map.addLayer({
            'id': 'your-layer-id',
            'type': 'circle',
            'source': 'position',
            'layout': {
            },
             'paint':{
                'circle-radius':8,
                'circle-color': 'red',
                'circle-stroke-color': 'white',
                'circle-stroke-width': 5,
                'circle-pitch-alignment': 'map'
                // 'icon-pitch-alignment': 'map'
            }
    
        });
        // map.addLayer({
        //     'id': 'position-circle',
        //     'type': 'circle',
        //     'source':'position',
            // 'paint':{
            //     'circle-radius':8,
            //     'circle-color': 'red',
            //     'circle-stroke-color': 'white',
            //     'circle-stroke-width': 5
            // }
        // })
        // add the DEM source as a terrain layer with exaggerated height
    
    }).catch(error => {
        console.error('Error loading the GeoJSON:', error);
    });

    // map.setFog();
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.8 });
    map.scrollZoom.disable();
    map.keyboard.disable();
    // map.setLayoutProperty('road', 'visibility', 'none');
    // map.dragRotate.disable();
    // map.touchZoomRotate.disableRotation();

});


var isRotating = false;
var startMousePosition;
let startBearing;
let startPitch;

map.on("mousedown", (e) => {
  if (e.originalEvent.button === 0) {
    isRotating = true;
    startMousePosition = e.point;
    startBearing = map.getBearing();
    startPitch = map.getPitch()
  }
});

map.on("mousemove", (e) => {
  if (!isRotating) return;
  var xDifference = e.point.x - startMousePosition.x;
  var yDifference = e.point.y - startMousePosition.y;
  map.setBearing(startBearing + xDifference / 4);
  map.setPitch(startPitch - yDifference / 4);
  console.log(map.getBearing(), map.getPitch());
});

map.on("mouseup", (e) => {
  isRotating = false;
});

scrollableElement.addEventListener('wheel', checkScrollDirection);

function checkScrollDirection(event) {
    console.log("scrolled");
    if (checkScrollDirectionIsUp(event)) {
        if(loc < coordsLength){
            loc += coordsJumped;
            updatePosition(1);
        }
    } else {
        if (loc > 0){
            loc -= coordsJumped;
            updatePosition(-1);
        }
    }
}

function checkScrollDirectionIsUp(event) {
  if (event.wheelDelta) {
    return event.wheelDelta > 0;
  }
  return event.deltaY < 0;
}

// Calculate bearing based on sliding window average
function calculateAvgCoord(direction){
    let avgLat = 0;
    let avgLng = 0;
    const numCoords = 10;

    if (loc < 30 && direction == -1){
        return targetRoute[loc];
    }
        
    else if ( loc > coordsLength-30 && direction == 1){
        return targetRoute[loc];
    }

    for (let i = 1; i <= 5; i ++){
        avgLat += targetRoute[loc + (direction*(5*i))][0];
        avgLng += targetRoute[loc + (direction*(5*i))][1];
    }
    avgLat /= 5;
    avgLng /= 5;
    console.log([avgLat, avgLng])
    return [avgLat, avgLng];
}


// map.on('wheel', () => {
function updatePosition(direction){

    const camera = map.getFreeCameraOptions();

    // console.log(camera)
    const bearingEnd = calculateAvgCoord(direction);
    map.easeTo({
        center: targetRoute[loc],
        zoom: 14,
        pitch: 50,
        //add sliding window averaging to prevent big shifts
        bearing: turf.bearing(
            turf.point(targetRoute[loc]), 
            turf.point(bearingEnd)
        ),
        speed: .2,
        curve: 1,
        duration: 1000,
        easing(t){
            return t;
        }
    });

    
    const originIndex = loc+((-1*direction)*coordsJumped);
    let circleStartIndex = originIndex;
    let circleEndIndex = (direction*1)+originIndex;

    let step = 0;
    if (interval !== null){
        clearInterval(interval);
    }

    interval = setInterval( () =>{
        if (step < 40) {
            map.getSource('position').setData({

                "type": "Feature",

                "geometry": {
                    "type": "Point",
                    "coordinates": [ (targetRoute[circleStartIndex][0] + (targetRoute[circleEndIndex][0] - targetRoute[circleStartIndex][0]) * ((step%4)/4)),
                                    (targetRoute[circleStartIndex][1] + (targetRoute[circleEndIndex][1] - targetRoute[circleStartIndex][1]) * ((step%4)/4))]
                                    
                }
            });
            step++;
            if(step % 4 == 0){
                console.log(circleStartIndex, circleEndIndex);
                circleStartIndex = circleEndIndex;
                circleEndIndex =(direction*(step/4))+originIndex + direction;
            }

            // console.log((circleStartPosition[1] + (targetRoute[loc][1] - circleStartPosition[1]) * (step/20)),
                                    // (circleStartPosition[0] + (targetRoute[loc][0] - circleStartPosition[0]) * (step/20)))
            // console.log(camPosition.lng + (targetRoute[loc][0] - camPosition.lng), (camPosition.lat + (targetRoute[loc][1] - camPosition.lat))) ;
        } else {
            console.log("clear");
            clearInterval(interval);
        }  
    } , 1);
        
        
    
    // console.log(map.getSource('position')._data.features[0].geometry.coordinates);

}
function updateCircle(direction){
    // Start and end will be one coordinate away
    const originIndex = loc+((-1*direction)*coordsJumped);
    let circleStartIndex = originIndex;
    let circleEndIndex = (direction*1)+originIndex;

    if (interval !== null){
        clearInterval(interval);
    }

    if (step < 20) {
        map.getSource('position').setData({

            "type": "Feature",

            "geometry": {
                "type": "Point",
                "coordinates": [ (targetRoute[circleStartIndex][0] + (targetRoute[circleEndIndex][0] - targetRoute[circleStartIndex][0]) * ((step%2)/2)),
                                (targetRoute[circleStartIndex][1] + (targetRoute[circleEndIndex][1] - targetRoute[circleStartIndex][1]) * ((step%2)/2))]
                                
            }
        });

        if(step % 2 == 0){
            console.log(circleStartIndex, circleEndIndex);
            circleStartIndex = circleEndIndex;
            circleEndIndex =(direction*(step/2))+originIndex;
        }
        console.log(step);

        step++;
        // console.log((circleStartPosition[1] + (targetRoute[loc][1] - circleStartPosition[1]) * (step/20)),
                                // (circleStartPosition[0] + (targetRoute[loc][0] - circleStartPosition[0]) * (step/20)))
        // console.log(camPosition.lng + (targetRoute[loc][0] - camPosition.lng), (camPosition.lat + (targetRoute[loc][1] - camPosition.lat))) ;
    } else {
        console.log("clear");
        clearInterval(interval);
    }
}