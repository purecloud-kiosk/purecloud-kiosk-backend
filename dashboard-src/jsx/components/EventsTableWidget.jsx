"use strict";
import React, { Component } from "react";
import * as navActions from "../actions/navActions";
import * as eventsActions from "../actions/eventsActions";
import * as dateConverter from "../utils/dateConverter";
export default class EventsTable extends Component {
  constructor(props){
    super(props);
  }
  componentDidMount(){
     $('[data-toggle="tooltip"]').tooltip();
  }
  handleRowClick(eventNum){
    console.log("handleRowClick");
    console.log(eventNum);
    console.log(this.props.events[eventNum]);
    eventsActions.setCurrentEvent(this.props.events[eventNum]);
    navActions.routeToPage("event");
  }
  render(){
    var {title, events, faIcon} = this.props;
    var rows = [];
    for(var i = 0; i < events.length; i++){
      rows.push(
        <tr key={events[i].title} onClick={this.handleRowClick.bind(this, i)}>
          <td>{events[i].title}</td>
          <td>{dateConverter.convertMillisToDate(events[i].date)}</td>
          <td>{events[i].location}</td>
        </tr>
      );
    }
    return(
      <div className="event-table">
        <div className="widget">
          <div className="widget-header">
            <i className={"fa " + faIcon}></i>
            {title}
            <a className="btn btn-primary btn-sm pull-right text-center" data-toggle="tooltip" title="manage events" href="#">
              <i className="fa fa-cog fa-lg"></i>
            </a>
          </div>
          <div className="widget-body medium no-padding">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {rows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
