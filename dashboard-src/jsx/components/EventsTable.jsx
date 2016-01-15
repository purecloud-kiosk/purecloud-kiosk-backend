"use strict";
import React, { Component } from "react";

export default class EventsTable extends Component {
  constructor(props){
    super(props);
  }
  render(){
    var {title, events, faIcon} = this.props;
    var rows;
    for(var i = 0; i < events.length; i++){
      rows += (
        <tr>
          <td>events[i].title</td>
          <td>events[i].date</td>
          <td>events[i].location</td>
        </tr>
      )
    }
    return(
      <div className="event-table">
        <div className="widget">
          <div className="widget-header">
            <i className={"fa " + faIcon}></i>
            {title}
            <button className="pull-right btn btn-primary">Manage</button>
          </div>
          <div className="widget-body medium no-padding">
            <div className="table-responsive">
              <table className="table">
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
