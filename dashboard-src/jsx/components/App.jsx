"use strict";
import React, { Component } from "react";
import { Router, Route, IndexRoute } from "react-router";
import navConstants from "../constants/navConstants";
import navStore from "../stores/navStore";
import history from "../history/history";
// import components
import SideBar from "./SideBar";
import HeaderBar from "./HeaderBar";
import DashView from "./DashView";
import EventView from "./EventView";
import CreateEventView from "./Events";
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
    $(".dropdown-toggle").dropdown();
  }
  render(){
    return (
      <div id="page-wrapper" className={this.state.isOpen ? "open" : null}>
        <SideBar/>
        <div id="content-wrapper">
          <div className="page-content">
            <HeaderBar/>
            <div className="main-content">
              <Router history={history}>
                <Route path="/">
                  <IndexRoute component={DashView} />
                  <Route path="dash" component={DashView}/>
                  <Route path="tables" component={HeaderBar}/>
                  <Route path="event">
                    <IndexRoute component={EventView}/>
                    
                  </Route>
                  <Route path="create" component={CreateEventView}/>
                </Route>
              </Router>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
