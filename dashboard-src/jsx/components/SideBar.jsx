"use strict";
import React, {Component} from "react";
import * as navActions from "../actions/navActions";

export default class SideBar extends Component{
  handleToggleBarClick(){
    console.log("clicked");
    navActions.toggleSideBar();
  }
  handleLinkClick(page){
    navActions.routeToPage(page);
  }
  render(){
    return (
      <div id="sidebar-wrapper">
        <ul className="sidebar">
          <li className="sidebar-main">
            <a onClick={this.handleToggleBarClick}>
              PureCloud Kiosk
              <span className="menu-icon glyphicon glyphicon-transfer"></span>
            </a>
          </li>
          <li className="sidebar-title"><span>NAVIGATION</span></li>
          <li className="sidebar-list">
            <a href="javascript:void(0);" onClick={this.handleLinkClick.bind(this, "dash")}>
              Dashboard <span className="menu-icon fa fa-tachometer"></span>
            </a>
          </li>
          <li className="sidebar-list">
            <a href="javascript:void(0);" onClick={this.handleLinkClick.bind(this, "tables")}>
              Tables <span className="menu-icon fa fa-table"></span>
            </a>
          </li>
          <li className="sidebar-list">
            <a href="javascript:void(0);" onClick={this.handleLinkClick.bind(this, "create")}>
              Tables <span className="menu-icon fa fa-table"></span>
            </a>
          </li>
        </ul>
        <div className="sidebar-footer">
          <div className="col-xs-6">
            <a href="https://github.com/charlieduong94/purecloud-kiosk">
              Github
            </a>
          </div>
          <div className="col-xs-6">
            <a href="http://www.inin.com/solutions/pages/cloud-contact-center-purecloud.aspx">
              Support
            </a>
          </div>
        </div>
      </div>
    );
  }
}
