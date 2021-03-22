/* global google */
import React from 'react';
import moment from 'moment';
import 'moment-timezone';
import Map from './googleMap/Map';
import {googleMapsApiKey, roadBotVelocity, droneVelocity, loadingTime, timeZone} from "../constants";
import {calcDirectDist} from "./OrderUtil";

class TrackOrderItem extends React.Component {
    state = {
        trackEnable: false,
        mapPath: [],
        mapCenter: {lat: 37.789682766666665, lng: -122.40658496666667},
        status: this.props.value.status,
    };
    // start track test
    startTrack = () => {
        if (!this.state.trackEnable) {
            this.timer = setInterval(this.updateTrackPath, 1000 * 1);
        }
        else {
            clearInterval(this.timer);
        }
        this.setState(preState => {
            return {
                trackEnable: !preState.trackEnable
            }
        });
    };

    updateTrackPath = () => {
        const curTime = Math.floor(new Date().getTime() / 1000);
        let curStatus = 1;
        const {departureTime, pickUpTime, deliveryTime, option} = this.props.value;
        // t1 = pickUpTime - loadingTime
        const t1 = pickUpTime - loadingTime * 60;
        let travelT = 0;
        if (curTime >= departureTime) {
            curStatus = 2;
        }
        if (curTime <= t1) {
            travelT = curTime - departureTime;
        }
        else if (t1 < curTime && curTime <= pickUpTime) {
            travelT = t1 - departureTime;
        }
        else {
            travelT = (t1 - departureTime) + (curTime - pickUpTime);
            curStatus = 3;
        }
        const speed = (option === 1) ? roadBotVelocity / 60 : droneVelocity / 60; // meter / second
        let trackPath = [];
        const travelD = travelT * speed;
        const path = JSON.parse(this.props.value.path);
        let sum = 0;
        let found = false;
        for (let i = 1; i < path.length; ++i) {
            let cur = calcDirectDist(path[i - 1], path[i])
            sum += cur;
            if (sum > travelD) {
                if (!found && travelD > 0) {
                    let ratio = (sum - travelD) / cur;
                    let x = path[i].lat - (path[i].lat - path[i - 1].lat) * ratio;
                    let y = path[i].lng - (path[i].lng - path[i - 1].lng) * ratio;
                    const point = {lat: x, lng: y};
                    trackPath.push(point);
                    found = true;
                }
                else {
                    trackPath.push(path[i - 1]);
                }
                if (i == path.length - 1) {
                    trackPath.push(path[i]);
                }
            }
            
        }
        const n = trackPath.length;
        let coordinateSum = [0, 0];
        for (let i = 0; i < n; ++i) {
            coordinateSum[0] += trackPath[i].lat;
            coordinateSum[1] += trackPath[i].lng;
        }
        const pathCenter = {lat: coordinateSum[0] / n, lng: coordinateSum[1] / n};
        if (sum <= travelD) {
            clearInterval(this.timer);
        }
        this.setState(preState => {
            return {
                mapPath: trackPath,
                mapCenter: pathCenter,
                status: curStatus,
            }
        });
        if (curTime >= deliveryTime) {
            clearInterval(this.timer);
        }
    };

    render = () => {
        const {value}  = this.props;
        const {id, description, deliveryTime, departureTime, pickUpTime, path, stationMarkers, pickUpMarker, deliveryMarker, devOption} = value;
        const status = this.state.status;
        let t0 = "";
        let t1 = "";
        let t2 = "";
        if (departureTime) t0 = moment(departureTime * 1000).tz(timeZone).format('YYYY-MM-DD hh:mm:ss A');
        if (pickUpTime) t1 = moment(pickUpTime * 1000).tz(timeZone).format('YYYY-MM-DD hh:mm:ss A');
        if (deliveryTime) t2 = moment(deliveryTime * 1000).tz(timeZone).format('YYYY-MM-DD hh:mm:ss A');
        return (
            <div className="itemMapBox">
            <div className="buttonBox">
                <button className="trackButton" style={{textAlign: "left"}} onClick={this.startTrack}>
                    <li className="trackOrder">
                        <p>Order number: {id}</p>
                        <p>Description: {description}</p>
                        <p>Expect to be delivered by</p>
                        <p className="deliveryTime">{t2} (PST)</p>
                        <p className="transitText">In Transit</p>
                        {
                            status == 1 && <p className="statusText">Device will departure on {t0} (PST)</p>
                        }
                        {
                            status == 2 && <p className="statusText">Device will pick up package on {t1} (PST)</p>
                        }
                        {
                            status == 3 && <p className="statusText">Package was picked up on {t1} (PST)</p>
                        }
                    </li>
                </button>
            </div>
            {this.state.mapPath.length != 0 && this.state.trackEnable &&
                <Map
                className="mapBox"
                googleMapURL={
                    'https://maps.googleapis.com/maps/api/js?key=' +
                    googleMapsApiKey +
                    '&libraries=geometry,drawing,places'
                }
                pickUpRoute={null}
                deliveryRoute={null}
                returnRoute={null}
                stationMarkers={JSON.parse(stationMarkers)}
                pickUpMarker={JSON.parse(pickUpMarker)}
                deliveryMarker={JSON.parse(deliveryMarker)}
                droneStationIdx={-1}
                option={devOption}
                path={this.state.mapPath}
                loadingElement={<div style={{height: `100%`}}/>}
                containerElement={<div style={{width: "60vw", height: "70vh", margin: "0 auto", paddingBottom: "0px"}}/>}
                mapElement={<div style={{height: `100%`}}/>}
                defaultCenter={this.state.mapCenter}
                defaultZoom={16}
                />
            }
            </div>
        );
    }
}
export default TrackOrderItem;