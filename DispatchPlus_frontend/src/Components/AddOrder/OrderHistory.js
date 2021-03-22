import React from 'react';
import moment from 'moment';
import 'moment-timezone';
import axios from 'axios';
import Main from "../Main"
import { Spin } from 'antd';
import {apiServerOrigin, axiosConfig, timeZone} from "../constants";

function ListItem(props) {
    const {id, description, status, deliveryTime} = props.value;
    let t0 = "";
    if (deliveryTime) t0 = moment(deliveryTime * 1000).tz(timeZone).format('YYYY-MM-DD hh:mm:ss A');
    return (
        <div>
        <li className="historyOrder">
            <p>Order number: {id}</p>
            <p>Description: {description}</p>
            {
            (status >= 4)
            ?
            <p>Delivered on {t0} (PST)</p>
            :
            <p>Arriving on {t0} (PST)</p>
            }
        </li>
        <hr/>
        </div>
    );
}

function OrderList(props) {
    const orders = props.orders;
    const listItems = orders.map((order) => <ListItem key={order.id} value={order} /> );
    return (
      <ul className="historyOrders">
        {listItems}
      </ul>
    );
}

class OrderHistory extends React.Component{
    constructor() {
        super();
        this.state = {
            data: [],
            loggedStatus: false,
            dataLoaded: false
        }
        this.getOrderHistory();
    }

    getOrderHistory = () => {
        let data = [];
        const historyUrl = `${apiServerOrigin}/history`;
        axios.get(historyUrl, axiosConfig)
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
                this.state.dataLoaded && this.state.data.length === 0 &&
                <div type="text" className="noDataBox">
                    <p className="noDataTextBox">There is no order history!</p>
                </div>
                }
                {
                this.state.dataLoaded && this.state.data.length !== 0 &&
                <div className="historyBox">
                    OrderHistory
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

export default OrderHistory;
