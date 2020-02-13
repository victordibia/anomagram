/**
 * @license
 * Copyright 2019 Victor Dibia. https://github.com/victordibia
 * Anomagram - Anomagram: Anomaly Detection with Autoencoders in the Browser.
 * Licensed under the MIT License (the "License"); 
 * =============================================================================
 */

import React, { Component } from "react";
import "./footer.css"

class Footer extends Component {
    render() {
        return (
            <div style={{ zIndex: 999000 }}>
                Made with <span className="redcolor">&#9829;</span> at <a href="https://experiments.fastforwardlabs.com/" target="blank">Cloudera Fast Forward Labs</a>.
            </div>
        );
    }
}

export default Footer;