"use strict";
import React, { Component } from "react";

export default class HeaderBar extends Component {
  render(){
    return (
      <div className="row header">
        <div className="col-xs-12">
          <div className="user pull-right">
            <div className="item dropdown" uib-dropdown>
              <a href="#" uib-dropdown-toggle>
                <img src="dist/img/avatar.jpg"/>
              </a>
              <ul className="dropdown-menu dropdown-menu-right">
                <li className="dropdown-header">
                  User Name goes here
                </li>
                <li className="divider"></li>
                <li className="link">
                  <a href="#">
                    Profile
                  </a>
                </li>
                <li className="link">
                  <a href="#">
                    Menu Item
                  </a>
                </li>
                <li className="link">
                  <a href="#">
                    Menu Item
                  </a>
                </li>
                <li className="divider"></li>
                <li className="link">
                  <a href="#">
                    Logout
                  </a>
                </li>
              </ul>
            </div>
            <div className="item dropdown" uib-dropdown>
             <a href="#" uib-dropdown-toggle>
                <i className="fa fa-bell-o"></i>
              </a>
              <ul className="dropdown-menu dropdown-menu-right">
                <li className="dropdown-header">
                  Notifications
                </li>
                <li className="divider"></li>
                <li>
                  <a href="#">Server Down!</a>
                </li>
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
