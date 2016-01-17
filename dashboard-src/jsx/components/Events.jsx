"use strict";
import React, {Component} from "react";
import * as eventsActions from "../actions/eventsActions";
import eventsStore from "../stores/eventsStore";
import eventsConstants from "../constants/eventsConstants";
//initialize variables
var id = "string";  
var value = "sting";
var date = "string";
var location = "string";
export default class Events extends Component {
	constructor(props) {
		super(props);
    	this.state = { 
    		success : false,
    		event : {
    			title : null,
    			date : 0,
    			location : null,
    			private : false,
    			description : null,
    			image_url : null,
    			thumbnail_url : null
    		}
    	};
  	}
  	// after component successfully rendered
  	componentDidMount(){
  		eventsStore.addListener(eventsConstants.EVENT_CREATED, this.handleEventCreatedSuccessfully.bind(this));
  	}
  	handleEventCreatedSuccessfully(){
  		console.log("event successfully created");
  		var state = this.state;
  		state.success = true;
  		this.setState(state);
  	}
	handleChange(key) {
		console.log(key);
		return function(event){
			console.log(event.target.value);
			var state = this.state;
			state.event[key] = event.target.value;
			this.setState(state);
		}.bind(this);
	}

	//this should pass var to the Actions

	handleButtonClick(){
		console.log("handleButtonClick");

		eventsActions.createEvent(this.state.event);
	}


render(){
	var {event, success} = this.state;
	var value = null;
	var message;
	if(success){
		message = (
			<div>
			Event was created successfully!
			</div>
		);
	}
	return (
	//form with text boxes and button to submit
		<div>
			<form>
				<div>
				<label className ="form-title">title</label>
					<input type="text" value={event.title} onChange={this.handleChange("title")} />
				</div>
				<div>
				<label className= "form-date">date</label>
					<input type="text" value={event.date} onChange={this.handleChange("date")}/>
				</div>
				<div>
				<label className ="form-location">location</label>
					<input type="text" value={event.location} onChange={this.handleChange("location")} />
				</div>
				<div>
				<label className= "form-image">image_url</label>
					<input type="text" value={event.image_url}  onChange={this.handleChange("image_url")} />
				</div>
				<div>
				<label className ="form-private">pub</label>
					<input type="checkbox" value={event.private}  onChange={this.handleChange("private")} />
				</div>
				<div>
				<label className= "form-description">description</label>
					<input type="text" value={event.description}  onChange={this.handleChange("description")} />
				</div>
				<div>
				<label className = "form-submit"></label>
					<button type = "button"  onClick={this.handleButtonClick.bind(this)}>Submit</button>
				</div>
			</form>
			{message}
		</div>
		
		);
}
}