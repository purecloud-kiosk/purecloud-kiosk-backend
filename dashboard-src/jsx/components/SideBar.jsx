"use strict";
import React, {Component} from "react";
import * as navActions from "../actions/navActions";

export default class SideBar extends Component{
  handleClick(){
    console.log("clicked");
    navActions.toggleSideBar();
  }
  render(){
    return (
      <div id="sidebar-wrapper">
        <ul className="sidebar">
          <li className="sidebar-main">
            <a onClick={this.handleClick}>
              Dashboard
              <span className="menu-icon glyphicon glyphicon-transfer"></span>
            </a>
          </li>
          <li className="sidebar-title"><span>NAVIGATION</span></li>
          <li className="sidebar-list">
            <a href="#/">Dashboard <span className="menu-icon fa fa-tachometer"></span></a>
          </li>
          <li className="sidebar-list">
            <a href="#/tables">Tables <span className="menu-icon fa fa-table"></span></a>
          </li>
        </ul>
        <div class="sidebar-footer">
          <div class="col-xs-6">
            <a href="https://github.com/charlieduong94/purecloud-kiosk">
              Github
            </a>
          </div>
          <div class="col-xs-6">
            <a href="http://www.inin.com/solutions/pages/cloud-contact-center-purecloud.aspx">
              Support
            </a>
          </div>
        </div>
      </div>
    );
  }
}
