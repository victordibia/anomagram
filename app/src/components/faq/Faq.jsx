import React, { Component } from "react";
import { Reset16, PlayFilledAlt16 } from '@carbon/icons-react';
import ROCChart from "./../rocchart/ROCChart"
import { computeAccuracyGivenThreshold } from "./../helperfunctions/HelperFunctions"
import * as _ from "lodash"
import "./faq.css"

class Faq extends Component {

    constructor(props) {
        super(props)


        this.state = {
            metricData: []
        }
    }



    componentDidMount() {




    }
    render() {





        return (
            <div>


                FAQ
            </div >
        );
    }
}

export default Faq;