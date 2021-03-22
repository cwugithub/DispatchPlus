import React from 'react';
import axios from 'axios';
import Main from "../Main"
import { Spin } from 'antd';
import TrackOrderItem from "./TrackOrderItem"
import {apiServerOrigin, axiosConfig} from "../constants";

function OrderList(props) {
    const orders = props.orders;
    const listItems = orders.map((order) => <TrackOrderItem key={order.id} value={order} /> );
    return (
      <div className="trackOrders">
        {listItems}
      </div>
    );
}


class TrackOrder extends React.Component{
    constructor() {
        super();
        this.state = {
            data: [],
            loggedStatus: false,
            dataLoaded: false
        }
        this.getTrackOrder();
    }

    getTrackOrder = () => {
        let data = [];
        const trackUrl = `${apiServerOrigin}/track`;
        axios.get(trackUrl, axiosConfig)
        .then((response) => {
            if (response.status !== 200) {
                alert('There was an error!');
            }
            else {
                data = response.data;
                this.setState(preState => {
                    return {
                        data: data,
                        loggedStatus: true,
                        dataLoaded: true
                    }
                })
            }
        })
        .catch(error => {
            alert(`Error; ${error.message}`);
            console.error('There was an error!', error);
        });
    }

    render() {
        return (
            <div>
                <Main />
                {
                !this.state.dataLoaded &&
                <div className="spinBox">
                    <Spin className="spinBox" tip="Loading..." size="large" />  
                </div>
                }
                {
                (this.state.dataLoaded && this.state.data.length === 0) ?
                <div type="text" className="allDeliveredBox">
                    <p className="allDeliveredTextBox">All packages were delivered!</p>
                </div>
                :
                <div className="trackBox">
                    <OrderList orders={this.state.data}/>
                </div>
                }
            </div>
        );
    }
    componentDidMount () {
        this.props.handleLoggedOut(true)
    }
}

export default TrackOrder;