/* global google */
import React from 'react';
import moment from 'moment';
import 'moment-timezone';
import axios from 'axios';
import Map from './googleMap/Map';
import Main from "../Main"
import { Radio, Spin } from "antd";
import {googleMapsApiKey, roadBotVelocity, droneVelocity, loadingTime, apiServerOrigin, axiosConfig, timeZone, droneWeightLimit, roadBotWeightLimit} from "../constants";
import {calcDirectDist} from "./OrderUtil";

class AddOrder extends React.Component {
    constructor () {
        super();
        this.state = {
            option: 1,
            pickUpAddress: "",
            deliveryAddress: "",
            pickUpLoc: [],
            deliveryLoc: [],
            stations: [],
            numOfStations: 0,
            mapCenter: {lat: 37.789682766666665, lng: -122.40658496666667},
            step: 1, // 1: wait for pickUpAddress ; 2: wait for deliveryAddress ; 3: wait for description 4. wait for address confirmation 5. wait for place order 6. order submitted
            roadBotStationIdx: -1,
            droneStationIdx: -1,
            pickUpRoute: [],
            deliveryRoute: null,
            returnRoute: [],
            pickUpStraightLineDist: [],
            deliveryStraightLintDist: null,
            returnStraightLintDist: [],
            roadBotRequest: null,
            droneRequest: null,
            orderNumber: null,
            description: "",
            weight: 0,
            overWeighted: false,
            outOfPickUpRange: false,
            outOfDeliveryRange: false,
            path: [],
        }
        this.getStations();
    }

    componentDidMount () {
        this.props.handleLoggedOut(true)
    }

    getStations = () => {
        let data = [];
        const getAllStationsUrl = `${apiServerOrigin}/get_all_stations`;
        axios.get(getAllStationsUrl, axiosConfig)
        .then((response) => {
            if (response.status !== 200) {
                alert('There was an error at getting station information!');
            }
            else {
                data = []
                for (let i = 0; i < response.data.length; ++i) {
                    data = [...data, response.data[i].address]
                }
                this.getCoordinate(data, this.updateStations);
            }
        })
        .catch(error => {
            alert(`Error; ${error.message}`);
            console.error('There was an error at getting station information!!', error);
        });
    }

    getCoordinate = (data, updateCallBackFn) => {
        const geocoder = new google.maps.Geocoder();
        for (let i = 0; i < data.length; ++i) {
            geocoder.geocode( { 'address': data[i]}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    let coordinate = {
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()
                    }
                    updateCallBackFn(coordinate);
                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
              });
        }
    }

    updateStations = (coordinate) => {
        const n = this.state.numOfStations;
        const x = (this.state.mapCenter.lat * n + coordinate.lat) / (n + 1);
        const y = (this.state.mapCenter.lng * n + coordinate.lng) / (n + 1);
        this.setState(preState => {
            return {
                numOfStations: n + 1,
                mapCenter: {lat: x, lng: y},
                stations: [...preState.stations, coordinate]
            };
        });
    }

    updatePickUpRoute = (result, idx, idxEnd) => {
        const curDistance = result.routes[0].legs[0].distance.value;
        const roadBotStationIdx = this.state.roadBotStationIdx;
        let prePickUpRoute = this.state.pickUpRoute;
        prePickUpRoute[idx] = result;
        if (roadBotStationIdx === -1 || curDistance < this.state.pickUpRoute[roadBotStationIdx].routes[0].legs[0].distance.value) {
            this.setState(preState => {
                return {
                    roadBotStationIdx: idx,
                    deliveryRoute: null,
                    returnRoute: [],
                }
            });
        }
        this.setState(preState => {
            return {
                pickUpRoute: prePickUpRoute,
            }
        });
    }
    // pickUpAddress functions
    updatePickUpLoc = (coordinate) => {
        const stations = this.state.stations;
        const n = stations.length;
        let distances = new Array(n); for (let i=0; i<n; ++i) distances[i] = 0;
        let minDIdx = -1;
        let minD = 32000; // set to a long distance (20miles = 32000m)
        // calculate distances from stations to pick-up location
        for (let i = 0; i < n; ++i) {
            distances[i] = calcDirectDist(stations[i], coordinate);
            if (distances[i] < minD) {
                minD = distances[i];
                minDIdx = i;
            }
        }
        // max range = 1.5miles = 2400m
        if (minD > 2400) {
            this.setState(preState => {
                return {
                    outOfPickUpRange: true,
                    pickUpLoc: [],
                };
            });
        }
        else {
            // update pickUpRoute
            for (let i = 0; i < n; ++i) {
                this.getRoute(stations, [coordinate], i, 0, this.updatePickUpRoute);
            }
            this.setState(preState => {
                return {
                    droneStationIdx: minDIdx,
                    pickUpStraightLineDist: distances,
                    pickUpLoc: [coordinate],
                    step: 2,
                    outOfPickUpRange: false,
                };
            });
        }
    }

    changePickUpAddress = (e) => {
        this.setState({pickUpAddress: e.target.value});
    }

    handlePickUpAddress = () => {
        // reset stationIdx and pickUpRoute
        const n = this.state.stations.length;
        let arr = new Array(n); for (let i=0; i<n; ++i) arr[i] = 0;
        this.setState(preState => {
            return {
                roadBotStationIdx: -1,
                pickUpRoute: arr
            }
        });
        this.getCoordinate([this.state.pickUpAddress], this.updatePickUpLoc);
    }

    // deliveryAddress functions
    updateDeliveryRoute = (result, idx) => {
        this.setState(preState => {
            return {
                deliveryRoute: result,
            }
        });
    }
    updateReturnRoute = (result, idxStart, idx) => {
        const roadBotStationIdx = this.state.roadBotStationIdx;
        if (roadBotStationIdx === -1) {
            this.setState(preState => {
                return {
                    roadBotStationIdx: idx,
                }
            });
        }
        else {
            const bestPickUpDistance = this.state.pickUpRoute[roadBotStationIdx].routes[0].legs[0].distance.value;
            const bestReturnDistance = this.state.returnRoute[roadBotStationIdx].routes[0].legs[0].distance.value;
            const bestDistance = bestPickUpDistance + bestReturnDistance;

            const curPickUpDistance = this.state.pickUpRoute[idx].routes[0].legs[0].distance.value;
            const curReturnDistance = result.routes[0].legs[0].distance.value;
            const curDistance = curPickUpDistance + curReturnDistance;
            if (curDistance < bestDistance) {
                this.setState(preState => {
                    return {
                        roadBotStationIdx: idx,
                    }
                });
            }
        }
        let preReturnRoute = this.state.returnRoute;
        preReturnRoute[idx] = result;
        this.setState(preState => {
            return {
                returnRoute: preReturnRoute,
            }
        });
    }
    updateDeliveryLoc = (coordinate) => {
        const stations = this.state.stations;
        const n = stations.length;
        let distances = new Array(n); for (let i=0; i<n; ++i) distances[i] = 0;
        let minDIdx = -1;
        let minD = 32000; // set to a long distance (20miles = 32000m)
        // calculate distances from stations to delivery location
        for (let i = 0; i < n; ++i) {
            distances[i] = calcDirectDist(stations[i], coordinate);
            if (distances[i] < minD) {
                minD = distances[i];
                minDIdx = i;
            }
        }
        // max range = 1.5miles = 2400m
        if (minD > 2400) {
            this.setState(preState => {
                return {
                    outOfDeliveryRange: true,
                    deliveryLoc: [],
                };
            });
        }
        else {
            // reset 
            minDIdx = -1;
            minD = 32000;
            // update pickUpRoute and returnRoute together
            for (let i = 0; i < n; ++i) {
                this.getRoute([coordinate], stations, 0, i, this.updateReturnRoute);
                let curDistance = distances[i] + this.state.pickUpStraightLineDist[i];
                if (curDistance < minD) {
                    minDIdx = i;
                    minD = curDistance;
                }
            }
            this.getRoute(this.state.pickUpLoc, [coordinate], 0, 0, this.updateDeliveryRoute);
            const pickUpToDeliveryDistance = calcDirectDist(this.state.pickUpLoc[0], coordinate);
            this.setState(preState => {
                return {
                    deliveryLoc: [coordinate],
                    step: 3,
                    outOfDeliveryRange: false,
                    returnStraightLintDist: distances,
                    deliveryStraightLintDist: pickUpToDeliveryDistance,
                    droneStationIdx: minDIdx,
                };
            });
        }
    }

    changeDeliveryAddress = (e) => {
        this.setState({deliveryAddress: e.target.value});
    }

    handleDeliveryAddress = () => {
        // need reset stationIdx and returnRoute for finding min total distance
        const n = this.state.stations.length;
        let arr = new Array(n); for (let i=0; i<n; ++i) arr[i] = 0;
        this.setState(preState => {
            return {
                roadBotStationIdx: -1,
                droneStationIdx: -1,
                returnRoute: arr
            }
        });
        this.getCoordinate([this.state.deliveryAddress], this.updateDeliveryLoc);
    }

    // weight and description functions
    changeWeight = (e) => {
        this.setState({weight: e.target.value});
    }

    changeDescription = (e) => {
        this.setState({description: e.target.value});
    }

    handleWeightDescription= () => {
        if (this.state.weight > roadBotWeightLimit) {
            this.setState(preState => {
                return {
                    overWeighted: true
                }
            });
        }
        else {
            this.setState(preState => {
                return {
                    step: 4,
                    overWeighted: false
                }
            });
        }
    }

    // confirm address
    onConfirmAddress = () => {
        const {pickUpRoute, deliveryRoute, returnRoute, roadBotStationIdx} = this.state;
        const {pickUpAddress, deliveryAddress, description, stations, pickUpLoc, deliveryLoc} = this.state;
        const pickUpPath = pickUpRoute[roadBotStationIdx].routes[0].overview_path;
        const n = pickUpPath.length;
        let path = [stations[roadBotStationIdx]];
        for (let i = 0; i < n; ++i) {
            path.push({lat: pickUpPath[i].lat(), lng: pickUpPath[i].lng()});
        }
        path.push(pickUpLoc[0])
        const deliveryPath = deliveryRoute.routes[0].overview_path;
        for (let i = 0; i < deliveryPath.length; ++i) {
            path.push({lat: deliveryPath[i].lat(), lng: deliveryPath[i].lng()});
        }
        path.push(deliveryLoc[0]);
        let totalD = 0;
        for (let i = 2; i < path.length - 1; ++i) {
            totalD += calcDirectDist(path[i - 1], path[i]);
        }
        this.setState(preState => {
            return {
                path: path
            }
        });
        // calculate time for road robot
        const curTime = new Date();
        // device departures in 1 minute after pickUp address is submitted
        //const t0 = new Date(curTime.setMinutes(curTime.getMinutes() + 1));
        // device departures in 30 seconds after pickUp address is submitted
        const t0 = Math.floor(new Date(curTime.setSeconds(curTime.getSeconds() + 30)).getTime() / 1000); // seconds
        // assume loading package time takes 1 minute
        const tPickUpRoute = Math.ceil((pickUpRoute[roadBotStationIdx].routes[0].legs[0].distance.value / roadBotVelocity + loadingTime) * 60);
        const t1 = t0 + tPickUpRoute; // seconds
        // assume unloading package time takes 1 minute
        const tDeliveryRoute = Math.ceil((deliveryRoute.routes[0].legs[0].distance.value / roadBotVelocity + loadingTime) * 60);
        const t2 = t1 + tDeliveryRoute;
        const tReturn = Math.ceil(returnRoute[roadBotStationIdx].routes[0].legs[0].distance.value / roadBotVelocity * 60);
        const t3 = t2 + tReturn;
        const departureTime = t0;
        const pickUpTime = t1;
        const deliveryTime = t2;
        const arriveTime = t3;
        const totalTime = t3 - t0; // duration that decvice is occupied in seconds
        const request = {
            status: 0,
            departureTime: departureTime,
            pickUpTime: pickUpTime,
            deliveryTime: deliveryTime,
            arriveTime: arriveTime,
            pickUpAddress: pickUpAddress,
            deliveryAddress: deliveryAddress,
            price: totalTime / 100,
            deviceType: 0,
            description: description,
            path: JSON.stringify(path),
            stationMarkers: JSON.stringify(stations),
            pickUpMarker: JSON.stringify(pickUpLoc),
            deliveryMarker: JSON.stringify(deliveryLoc),
            StationIdx: roadBotStationIdx,
            devOption: 1
        };

        // calculate time for drone
        const {pickUpStraightLineDist, returnStraightLintDist, droneStationIdx, deliveryStraightLintDist} = this.state;
        const tPicUpDrone = Math.ceil((pickUpStraightLineDist[droneStationIdx] / droneVelocity + loadingTime) * 60);
        const t1Drone = t0 + tPicUpDrone; // seconds
        const tDeliveryDrone = Math.ceil((deliveryStraightLintDist / droneVelocity + loadingTime) * 60);
        const t2Drone = t1Drone + tDeliveryDrone;
        const tReturnDrone = Math.ceil(returnStraightLintDist[droneStationIdx] / droneVelocity * 60);
        const t3Drone = t2Drone + tReturnDrone;
        const departureTimeDrone = t0;
        const pickUpTimeDrone = t1Drone;
        const deliveryTimeDrone = t2Drone;
        const arriveTimeDrone = t3Drone;
        const totalTimeDrone = t3Drone - t0; // duration that decvice is occupied in seconds
        const pathDrone = [stations[droneStationIdx], pickUpLoc[0], deliveryLoc[0]]
        const requestDrone = {
            status: 0,
            departureTime: departureTimeDrone,
            pickUpTime: pickUpTimeDrone,
            deliveryTime: deliveryTimeDrone,
            arriveTime: arriveTimeDrone,
            pickUpAddress: pickUpAddress,
            deliveryAddress: deliveryAddress,
            price: totalTimeDrone / 100 * 2,
            deviceType: 1,
            description: description,
            path: JSON.stringify(pathDrone),
            stationMarkers: JSON.stringify(stations),
            pickUpMarker: JSON.stringify(pickUpLoc),
            deliveryMarker: JSON.stringify(deliveryLoc),
            StationIdx: droneStationIdx,
            devOption: 2
        };
        this.setState(preState => {
            return {
                step: 5,
                roadBotRequest: request,
                droneRequest: requestDrone
            }
        }); 
    }

    dateToString = (d) => {
        let year = d.getFullYear();
        let month = (d.getMonth()+1);
        if (month < 10) {
            month = '0' + month;
        }
        let day = d.getDate();
        if (day < 10) {
            day = '0' + day;
        }
        let hour = d.getHours();
        if (hour < 10) {
            hour = '0' + hour;
        }
        let minute = d.getMinutes();
        if (minute < 10) {
            minute = '0' + minute;
        }
        let second = d.getSeconds();
        if (second < 10) {
            second = '0' + second;
        }
        const s =  year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
        return s;
    }
    // step back function
    stepBack = () => {
        this.setState((preState) => ({step: preState.step - 1}));
    }

    // goole map route api
    getRoute = (startPoint, endPoint, idxStart, idxEnd, updateCallBackFn) => {
        let places = [startPoint[idxStart], endPoint[idxEnd]];
        const waypoints = places.map(p =>({
            location: {lat: p.lat, lng:p.lng},
            stopover: false
        }))
        const origin = waypoints.shift().location;
        const destination = waypoints.pop().location;
        
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
            //waypoints: waypoints
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              updateCallBackFn(result, idxStart, idxEnd);
            } else {
              console.error(`error fetching directions ${result}`);
            }
          }
        );
    }

    // place order
    placeOrder = () => {
        const option = this.state.option;
        let requestBody = "";
        if (option === 1) {
            requestBody = JSON.stringify(this.state.roadBotRequest);
        }
        else if (option == 2) {
            requestBody = JSON.stringify(this.state.droneRequest);
        }
        this.setState(preState => {
            return {
                step: 6
            }
        });
        let data = {};
        const addOrderUrl = `${apiServerOrigin}/add_order`;
        axios.post(addOrderUrl, requestBody, axiosConfig)
        .then((response) => {
            if (response.status !== 201) {
                alert('There was an error at placing order!');
            }
            else {
                data = response.data;
                if (data) {
                    this.setState(preState => {
                        return {
                            orderNumber: data.id,
                            step: 7
                        }
                    });
                }
            }
        })
        .catch(error => {
            alert(`Error; ${error.message}`);
            console.error('There was an error at submitting order!', error);
        });
    }

    // option change function
    onChange = e => {
        this.setState({
          option: e.target.value,
        });
    };

    render = () => {
        const {
            loadingElement,
            containerElement,
            mapElement,
            defaultCenter,
            defaultZoom} = this.props;
        
        const roadBotStationIdx = this.state.roadBotStationIdx;
        let roadBotDeliveryTime = 0;
        let droneDeliveryTime = 0;
        if (this.state.roadBotRequest && this.state.droneRequest) {
            roadBotDeliveryTime = moment(this.state.roadBotRequest.deliveryTime * 1000).tz(timeZone).format('YYYY-MM-DD hh:mm:ss A');
            droneDeliveryTime = moment(this.state.droneRequest.deliveryTime * 1000).tz(timeZone).format('YYYY-MM-DD hh:mm:ss A');
        }
        return (
            <div>
                <Main />
                {
                this.state.step == 1 &&
                <div className="addOrderBox">
                    <span className="pickUpAddressSpan" type="text" >
                    Pick-up address:
                    </span>
                    <input 
                        className="inputBox"
                        value={this.state.pickUpAddress}
                        type="text"
                        onChange={this.changePickUpAddress}/>
                    {
                    this.state.outOfPickUpRange &&
                    <div type="text" style={{color: "red", marginLeft: "180px"}}>
                        Out of range. Max range is 1.5 miles.
                    </div>
                    }
                    <div className="buttonBox">
                        <div>
                            
                        </div>
                        <button className="button2" onClick={this.handlePickUpAddress}>
                            next
                        </button>
                    </div>
                </div>
                }
                {
                this.state.step == 2 &&
                <div className="addOrderBox">
                    <span type="text" style={{fontSize: "15px", fontWeight: "bold", marginRight: "5px"}}>
                    Delivery Address:
                    </span>
                    <input 
                        className="inputBox"
                        value={this.state.deliveryAddress}
                        type="text"
                        onChange={this.changeDeliveryAddress}/>
                    {
                    this.state.outOfDeliveryRange &&
                    <div type="text" style={{color: "red", marginLeft: "180px"}}>
                        Out of range. Max range is 1.5 miles.
                    </div>
                    }
                    <div className="buttonBox">
                        <button className="button1" onClick={this.stepBack}>
                            back
                        </button>
                        <button className="button2" onClick={this.handleDeliveryAddress}>
                            next
                        </button>
                    </div>
                </div>
                }
                {
                this.state.step == 3 &&
                <div className="addOrderBox">
                    <div>
                        <span className="weightSpanBox" type="text" >
                            Weight:
                        </span>
                        <input 
                            className="weightInputBox"
                            value={this.state.weight}
                            type="text"
                            onChange={this.changeWeight}>
                        </input>
                        <span type="text" style={{fontSize: "15px", fontWeight: "bold", marginRight: "5px"}}>
                            lb.
                        </span>
                        {
                        this.state.overWeighted &&
                        <span type="text" style={{color: "red", marginLeft: "20px"}}>
                            Over weight limit (= {roadBotWeightLimit}lb ).
                        </span>
                        }
                    </div>
                    <div>
                        <span className="descriptionSpanBox" type="text">
                            Description:
                        </span>
                        <input 
                            className="descriptionInputBox"
                            value={this.state.description}
                            type="text"
                            onChange={this.changeDescription}>
                        </input>
                    </div>
                    <div className="buttonBox">
                        <button className="button1" onClick={this.stepBack}>
                            back
                        </button>
                        <button className="button2" onClick={this.handleWeightDescription}>
                            next
                        </button>
                    </div>
                </div>
                }
                {
                this.state.step == 4 &&
                <div className="addOrderBox">
                    <div className="textBox" type="text" >
                        Pick-up Address: {this.state.pickUpAddress}
                    </div>
                    <div className="textBox" type="text" >
                        Delivery Address: {this.state.deliveryAddress}
                    </div>
                    <div className="buttonBox">
                        <button className="button1" onClick={this.stepBack}>
                            back
                        </button>
                        <button className="button2" onClick={this.onConfirmAddress}>
                            confirm
                        </button>
                    </div>
                </div>
                }
                {
                this.state.step == 5 &&
                <div className="addOrderBox">
                    <Radio.Group onChange={this.onChange} value={this.state.option}>
                    <div>
                    <Radio className="droneRobotOption" value={1}>
                        Road robot: costs ${this.state.roadBotRequest.price} and will deliver on {roadBotDeliveryTime} (PST)
                    </Radio>
                    </div>
                    <div>
                    { this.state.weight <= droneWeightLimit ?
                    <Radio className="droneRobotOption" value={2}>
                        Drone: costs ${this.state.droneRequest.price} and will deliver on {droneDeliveryTime} (PST)
                    </Radio>
                    :
                    <Radio className="droneRobotOption" value={2} disabled={true} >
                        Drone: package weight is over drone's limit ({droneWeightLimit} lb.) 
                    </Radio>
                    }
                    </div>
                    </Radio.Group>
                    <div className="buttonBox">
                        <button className="button1" onClick={this.stepBack}>
                            back
                        </button>
                        <button className="button2" onClick={this.placeOrder}>
                            submit
                        </button>
                    </div>
                </div>
                }
                {
                this.state.step == 6 &&
                <div className="addOrderSpinBox">
                    <Spin className="addOrderSpinBox" tip="Processing..." size="large" />  
                </div>
                }
                {
                this.state.step == 7 &&
                <div className="addOrderBox" style={{width: "500px", alignItems: "center", margin: "0 auto"}}>
                    <div type="text" style={{textAlign: "center", fontSize: "15px", fontWeight: "bold"}}>
                        Your order has been submitted successfully!
                    </div>
                    <div type="text" style={{textAlign: "center",fontSize: "15px", fontWeight: "bold"}}>
                        Order number is {this.state.orderNumber}.
                    </div>
                </div>
                }
                <Map
                    className="mapBox"
                    googleMapURL={
                        'https://maps.googleapis.com/maps/api/js?key=' +
                        googleMapsApiKey +
                        '&libraries=geometry,drawing,places'
                    }
                    pickUpRoute={this.state.pickUpRoute[roadBotStationIdx]}
                    deliveryRoute={this.state.deliveryRoute}
                    returnRoute={this.state.returnRoute[roadBotStationIdx]}
                    stationMarkers={this.state.stations}
                    pickUpMarker={this.state.pickUpLoc}
                    deliveryMarker={this.state.deliveryLoc}
                    droneStationIdx={this.state.droneStationIdx}
                    option={this.state.option}
                    path={[]}
                    loadingElement={loadingElement || <div style={{height: `100%`}}/>}
                    containerElement={containerElement || <div style={{width: "60vw", height: "70vh", margin: "0 auto", paddingBottom: "0px"}}/>}
                    mapElement={mapElement || <div style={{height: `100%`}}/>}
                    defaultCenter={defaultCenter || this.state.mapCenter}
                    defaultZoom={defaultZoom || 16}
                />
            </div>
        )
    }
}

export default AddOrder;
