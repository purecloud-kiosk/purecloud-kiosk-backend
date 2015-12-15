"use strict";
import React, { Component } from "react";

import navConstants from "../constants/navConstants";
import navStore from "../stores/navStore.jsx";
// import components
import SideBar from "./SideBar.jsx";
import HeaderBar from "./HeaderBar.jsx";

export default class App extends Component{
  constructor(props){
    super(props);
    this.state = {
      isOpen : navStore.sideBarIsOpen()
    };
  }
  updateToggle(){
    console.log("listener called");
    console.log(navStore.sideBarIsOpen());
    this.setState({
      isOpen : navStore.sideBarIsOpen()
    });
  }
  componentDidMount(){

    navStore.addListener(navConstants.SIDEBAR_TOGGLED, this.updateToggle.bind(this));
  }
  render(){
    return (
      <div id="page-wrapper" className={this.state.isOpen ? "open" : null}>
        <SideBar/>
        <div id="content-wrapper">
          <div className="page-content">
            <HeaderBar/>
          </div>
        </div>
      </div>
    );
  }
}
