import React from 'react';
import axios from 'axios';
import Main from "../Main"
import { Spin } from 'antd';
import {apiServerOrigin, axiosConfig} from "../constants";

class UserInfo extends React.Component{
    constructor() {
        super();
        this.state = {
            data: {}
        }
        this.getInfo();
    }   

    getInfo = () => {
        let data = {};
        const userInfoUrl = `${apiServerOrigin}/customer_info`;
        axios.get(userInfoUrl, axiosConfig)
        .then((response) => {
            if (response.status !== 200) {
                alert('There was an error!');
            }
            else {
                data = response.data;
                this.setState({data: data})
            }
        })
        .catch(error => {
            alert(`Error; ${error.message}`);
            console.error('There was an error!', error);
        });
    }
    render() {
        //console.log(this.props.loggedIn)
        //console.log(this.state.data);
        const {firstName, lastName, customerPhone, billingAddress } = this.state.data;
        if (!billingAddress) {
            return (
                <div>
                <Main />
                <div className="spinBox">
                    <Spin className="spinBox" tip="Loading..." size="large" />  
                </div>
                </div>
            );
        }
        const {address, city, state, zipcode, country} = billingAddress;
        return (
            <div>
                <Main />
                <div className="userInfoTop">
                    <p className="userInfomation">Name: {firstName} {lastName} </p>
                    <p className="userInfomation">Phone numeber: {customerPhone}</p>
                    <p className="userInfomation">Address: {address}, {city}, {state} {zipcode}, {country}</p>
                </div>
            </div>
        );
    }
    componentDidMount () {
        this.props.handleLoggedOut(true)
    }
}

export default UserInfo;