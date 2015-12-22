"use strict";
import React, { Component } from "react";

export default class HeaderBar extends Component {
  render(){
    return (
      <div className="row header">
        <div className="col-xs-12">
          <div className="user pull-right">
            <div className="item dropdown">
              <a href="javascript:void(0);" className="dropdown-toggle" data-toggle="dropdown">
                <img src="dist/img/avatar.jpg"/>
              </a>
              <ul className="dropdown-menu dropdown-menu-right">
                <li className="dropdown-header">User Name goes here</li>
                <li className="divider"></li>
                <li className="link"><a href="https://apps.mypurecloud.com/directory/">Profile</a></li>
                <li className="divider"></li>
                <li className="link"><a href="#">Logout</a></li>
              </ul>
            </div>
            <div className="item dropdown">
             <a href="javascript:void(0);" className="dropdown-toggle" data-toggle="dropdown">
                <i id="notification" className="fa fa-bell-o"></i>
              </a>
              <ul className="dropdown-menu dropdown-menu-right">
                <li className="dropdown-header">Notifications</li>
                <li className="divider"></li>
                <li><a href="javascript:void(0);">Server Down!</a></li>
              </ul>
            </div>
          </div>
          <div className="meta">
            <div className="page">
              Dashboard
            </div>
            <div className="breadcrumb-links">
              Home / Dashboard
            </div>
          </div>
        </div>
      </div>
    );
  }
}
