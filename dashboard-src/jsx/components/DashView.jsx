"use strict";
import React, { Component } from "react";

import * as statsActions from "../actions/statsActions";
import statsStore from "../stores/statsStore";
import statsConstants from "../constants/statsConstants";

import Widget from "./Widget";
import EventsTable from "./EventsTable";

export default class Dash extends Component {
  constructor(props){
    super(props);
    this.state = {stats : null, eventsManaging : [], publicEvents : [], privateEvents : []};
  }
  updateStats(){
    this.setState({stats : statsStore.getStats(), eventsManaging : this.state.eventsManaging});
  }
  updateEventsManaging(){
    // to do
  }
  updatePublicEvents(){
    // to do
  }
  updatePrivateEvents(){
    // to do
  }
  componentDidMount(){
    console.log("dash mounted");
    statsStore.addListener(statsConstants.STATS_RETRIEVED, this.updateStats.bind(this));
    statsActions.getStats();
  }
  render(){
    var {stats, eventsManaging, publicEvents, privateEvents} = this.state;
    var widgets, eventsManagingTable, publicEventsTable, privateEventsTable;
    if(stats != null){
      widgets = (
        <div className="row">
          <div className="col-sm-6 col-md-3">
            <Widget color="blue" faIcon="fa-unlock" value={stats.totalPublicEventsAvailable}
              text="Total Public Events Available"></Widget>
          </div>
          <div className="col-sm-6 col-md-3">
            <Widget color="red" faIcon="fa-lock" value={stats.totalPrivateEventsAvailable}
              text="Total Private Events Available"></Widget>
          </div>
          <div className="col-sm-6 col-md-3">
            <Widget color="green" faIcon="fa-check-square" value={stats.publicEventsCheckedIn}
              text="Public Events Checked Into"></Widget>
          </div>
          <div className="col-sm-6 col-md-3">
            <Widget color="orange" faIcon="fa-check-circle" value={stats.privateEventsCheckedIn}
              text="Private Events Checked Into"></Widget>
          </div>
        </div>
      );
    }
    eventsManagingTable = (
      <div className="col-md-6">
        <EventsTable title="Events Managing" faIcon="fa-user" events={eventsManaging}/>
      </div>
    );
    publicEventsTable = (
      <div className="col-md-6">
        <EventsTable title="All Public Events" faIcon="fa-users" events={publicEvents}/>
      </div>
    );
    privateEventsTable = (
      <div className="col-md-6">
        <EventsTable title="My Private Events" faIcon="fa-user-secret" events={privateEvents}/>
      </div>
    );
    return(
      <div>
        <div className="widgets">
          {widgets}
        </div>
        <div className="tables">
          {eventsManagingTable}
          {publicEventsTable}
          {privateEventsTable}
        </div>
      </div>
    );
  }
}
