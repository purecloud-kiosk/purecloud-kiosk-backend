"use strict";
import React, { Component } from "react";

import * as dateConverter from "../utils/dateConverter";
import * as eventActions from "../actions/eventsActions";
import eventsStore from "../stores/eventsStore";
import eventsConstants from "../constants/eventsConstants";

export default class EventView extends Component {
  constructor(props){
    super(props);
    this.state = {event : eventsStore.getCurrentEvent()};
  }
  componentDidMount(){
    eventsStore.addListener(eventsConstants.CURRENT_EVENT_SET, this.updateEvent.bind(this));
  }
  updateEvent(){
    this.setState({event : eventsStore.getCurrentEvent()});
  }
  render(){
    var {event} = this.state;
    var view;
    var privacy = "public";
    if(event != null){
      if(event.private)
        privacy = "private"
      view = (
        <div>
          <div className="event-container">
            <img className="banner" src="http://lorempixel.com/1200/700/"></img>
            <div className="row">
              <div className="event-details-container">
                <div className="pull-left thumbnail-container">
                  <img className="thumbnail" src="http://lorempixel.com/500/500/"></img>
                </div>
                <div className="event-details">
                  <div className="title">
                    <h4>{event.title}</h4>
                    <p>Date: {dateConverter.convertMillisToDate(event.date)}</p>
                    <p>Location: {event.location}</p>
                    <p>This event is {privacy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="widget">
              <div className="widget-header">
                <i className="fa fa-user"></i>
                Description
                <a className="btn btn-primary btn-sm pull-right text-center">
                  <i className="fa fa-cog fa-lg"></i> Expand
                </a>
              </div>
              <div className="widget-body small no-padding">
                <div className="text-body">
                  <p>{event.description}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      );
    }
    return(
      <div>
        {view}
      </div>
    );
  }
}
