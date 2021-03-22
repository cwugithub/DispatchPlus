/* global google */
import React from "react";
import {
  withGoogleMap,
  GoogleMap,
  withScriptjs,
  Marker,
  DirectionsRenderer,
  Polyline
} from "react-google-maps";
import stationPin from "../../Images/station_pin.png"
import startPin from "../../Images/start_pin.png"
import targetPin from "../../Images/target_pin.png"
import deliveryRobot from "../../Images/deliveryRobot.png"
import deliveryDrone from "../../Images/deliveryDrone.png"

const stationIcon = {
  url: stationPin,
  scaledSize: new google.maps.Size(25, 43),
  labelOrigin: new google.maps.Point(11, 50),
};

const pickUpIcon = {
  url: startPin,
  scaledSize: new google.maps.Size(25, 43),
};

const deliveryIcon = {
  url: targetPin,
  scaledSize: new google.maps.Size(25, 43),
};

const deliveryRobotIcon = {
  url: deliveryRobot,
  scaledSize: new google.maps.Size(75, 100),
};

const deliveryDroneIcon = {
  url: deliveryDrone,
  scaledSize: new google.maps.Size(75, 100),
};

class MapDirectionsRenderer extends React.Component {
  state = {
    error: null
  };

  render() {
    if (this.state.error) {
      return <h1>{this.state.error}</h1>;
    }
    const {route, color} = this.props
    return (route && 
            <DirectionsRenderer 
              directions={route}
              options={{
                polylineOptions: {
                  strokeOpacity: 0.5,
                  strokeColor: color,
                  strokeWeight: 7
                },
                markerOptions: {
                  visible: false
                }
              }}
            />
           );
  }
}

const Map = 
  withGoogleMap(props => {
    const trackIcon = props.option == 1 ? deliveryRobotIcon : deliveryDroneIcon;
    return (
    <GoogleMap
      center={props.defaultCenter}
      defaultZoom={props.defaultZoom}
    >

      {props.stationMarkers.map((marker, index) => {
        const position = { lat: marker.lat, lng: marker.lng };
        const label = {
          color: 'black',
          fontWeight: 'bold',
          fontSize: '20px',
          text: `station ${index}`,
        }
        return <Marker key={index} position={position} icon={stationIcon} label={label}/>;
      })}

      {props.pickUpMarker.map((marker, index) => {
        const position = { lat: marker.lat, lng: marker.lng };
        return <Marker key={index} position={position} icon={pickUpIcon}/>;
      })}

      {props.deliveryMarker.map((marker, index) => {
        const position = { lat: marker.lat, lng: marker.lng };
        return <Marker key={index} position={position} icon={deliveryIcon}/>;
      })}
      {
      props.pickUpRoute && props.option === 1 &&
      <MapDirectionsRenderer
        route={props.pickUpRoute}
        color="royalblue"
      />
      }
      {
      props.deliveryRoute && props.option === 1 &&
      <MapDirectionsRenderer
        route={props.deliveryRoute}
        color="green"
      />
      }
      {
      props.returnRoute && props.option === 1 &&
      <MapDirectionsRenderer
        route={props.returnRoute}
        color="red"
      />
      }
      {
      props.droneStationIdx != -1 && props.option === 2 &&
      <Polyline
        path={[props.stationMarkers[props.droneStationIdx], props.pickUpMarker[0]]}
        options={{
          geodesic: true,
          strokeColor: "royalblue",
          strokeOpacity: 0.5,
          strokeWeight: 6,
        }}
      />
      }
      {
      props.droneStationIdx != -1 && props.option === 2 &&
      <Polyline
        path={[props.pickUpMarker[0], props.deliveryMarker[0]]}
        options={{
          geodesic: true,
          strokeColor: "green",
          strokeOpacity: 0.5,
          strokeWeight: 6,
        }}
      />
      }
      {
      props.droneStationIdx != -1 && props.option === 2 &&
      <Polyline
        path={[props.deliveryMarker[0], props.stationMarkers[props.droneStationIdx]]}
        options={{
          geodesic: true,
          strokeColor: "red",
          strokeOpacity: 0.5,
          strokeWeight: 6,
        }}
      />
      }
      {
      props.path.length != 0 &&
      <Polyline
        path={props.path}
        options={{
          geodesic: true,
          strokeColor: "royalblue",
          strokeOpacity: 0.5,
          strokeWeight: 6,
        }}
      />
      }
      
      {
      props.path.length != 0 &&
      [props.path[0]].map((marker, index) => {
        const position = { lat: marker.lat, lng: marker.lng };
        return <Marker key={index} position={position} icon={trackIcon}/>;
      })
      }
    </GoogleMap>
  )});

export default Map;
