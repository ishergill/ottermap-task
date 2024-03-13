'use client'
import React, { useEffect, useState, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Draw from "ol/interaction/Draw";
import Translate from "ol/interaction/Translate";
import { apply } from "ol-mapbox-style";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Icon, Style } from "ol/style";
import * as ol from "ol";
import Overlay from "ol/Overlay";
import Polygon from "ol/geom/Polygon";

const MapComponent: React.FC = () => {
  const [mapMode, setMapMode] = useState<"draw" | "placeMarker">("draw");
  const [drawnPolygon, setDrawnPolygon] = useState<Polygon | null>(null);
  const [polygonArea, setPolygonArea] = useState<number | null>(null);
  const [markerCoordinates, setMarkerCoordinates] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const map = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);
  const draw = useRef<Draw | null>(null);
  const translate = useRef<Translate | null>(null);

  useEffect(() => {
    const styleJson = `https://tiles-staging.locationiq.com/v3/streets/vector.json?key=${`pk.aa7f5d0539c5675b7f3429402939d8fa`}`;

    map.current = new Map({
      target: "map",
      view: new View({
        center: fromLonLat([-122.42, 37.779]),
        zoom: 12,
      }),
    });

    vectorSource.current = new VectorSource({});
    const vectorLayer = new VectorLayer({
      source: vectorSource.current!,
      zIndex: 1,
    });

    map.current.addLayer(vectorLayer);

    const handleMapClick = (e: any) => {
      if (mapMode === "placeMarker") {
        const coordinate = e.coordinate;
        const lngLat = toLonLat(coordinate);
        setMarkerCoordinates({ longitude: lngLat[0], latitude: lngLat[1] });

        const marker = new Feature({
          geometry: new Point(fromLonLat(lngLat)),
        });
        marker.setStyle(
          new Style({
            image: new Icon({
              scale: 0.25,
              src: "https://tiles.locationiq.com/static/images/marker.png",
            }),
          })
        );
        vectorSource.current!.addFeature(marker);
      }
    };

    map.current.on("click", handleMapClick);

    apply(map.current, styleJson);

    return () => {
      map.current!.setTarget(undefined);
    };
  }, [mapMode]);

  useEffect(() => {
    if (map.current && vectorSource.current) {
      if (mapMode === "draw") {
        addDrawInteraction();
      } else if (mapMode === "placeMarker") {
        addTranslateInteraction();
      }

      return () => {
        if (draw.current) {
          map.current!.removeInteraction(draw.current);
        }
        if (translate.current) {
          map.current!.removeInteraction(translate.current);
        }
      };
    }
  }, [mapMode]);

  const addDrawInteraction = () => {
    draw.current = new Draw({
      source: vectorSource.current!,
      type: "Polygon",
    });

    draw.current.on("drawend", (event: any) => {
      const polygon = event.feature.getGeometry() as Polygon;
      const coordinates = polygon.getCoordinates()[0];
      let totalLength = 0;

      coordinates.slice(1).forEach((coord, index) => {
        const prevCoord = coordinates[index];
        const lineLength = Math.sqrt(
          Math.pow(coord[0] - prevCoord[0], 2) + Math.pow(coord[1] - prevCoord[1], 2)
        );
        totalLength += lineLength;

        const midpoint = [(coord[0] + prevCoord[0]) / 2, (coord[1] + prevCoord[1]) / 2];

        const overlayElement = document.createElement("div");
        overlayElement.innerText = `${lineLength.toFixed(2)} m`;
        const overlay = new Overlay({
          position: midpoint,
          element: overlayElement,
          positioning: "center-center",
          offset: [0, -15],
        });

        overlayElement.style.cssText = `
          font-weight: bold;
          background: rgba(255, 255, 255, 0.8);
          padding: 1px 1px;
          border-radius: 1px;
          border: 1px solid #333;
          transform: translate(-50%, -50%);
        `;

        map.current!.addOverlay(overlay);
      });

      console.log("Total length:", totalLength.toFixed(2));

      const area = polygon.getArea();
      setPolygonArea(area);
      setDrawnPolygon(polygon);
    });

    map.current!.addInteraction(draw.current);
  };

  const addTranslateInteraction = () => {
    if (translate.current) {
      map.current!.removeInteraction(translate.current);
    }
    translate.current = new Translate({
      features: new ol.Collection(vectorSource.current!.getFeatures()),
    });
    map.current!.addInteraction(translate.current);
  };

  return (
    <div className="map__wrapper">
      <div id="map" className="map_main">
        {polygonArea && (
          <div className="area_calculation">
            Area: {polygonArea.toFixed(2)} square meters
          </div>
        )}
        {markerCoordinates && mapMode === "placeMarker" && (
          <div className="coords-display">
            Coordinates: {markerCoordinates.latitude.toFixed(5)},{" "}
            {markerCoordinates.longitude.toFixed(5)}
          </div>
        )}
        <div className="controls">
          <button
            className="control__btn"
            style={{
              background: mapMode === "draw" ? "#007bff" : "black",
            }}
            onClick={() => {
              setMapMode("draw");
            }}
          >
            Draw Polygon
          </button>
          <button
            className="control__btn"
            style={{
              background: mapMode === "placeMarker" ? "#007bff" : "black",
            }}
            onClick={() => {
              setMapMode("placeMarker");
              setPolygonArea(null);
            }}
          >
            Place Marker
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
