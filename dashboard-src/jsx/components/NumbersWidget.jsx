"use strict";
import React, { Component } from "react";

export default class Widget extends Component {
  constructor(props){
    super(props);
  }
  render(){
    var {value, text, faIcon, color} = this.props;
    return(
      <div className="widget">
        <div className="widget-body">
          <div className={"widget-icon pull-left " + color}>
            <i className={"fa " + faIcon}></i>
          </div>
          <div className="title">{value}</div>
          <div className="comment">{text}</div>
        </div>
      </div>
    );
  }
}
