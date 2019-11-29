import React, { Component } from "react";
// import { Reset16, PlayFilledAlt16 } from '@carbon/icons-react';
import DrawSignal from "./../drawsignal/DrawSignal"
// import { computeAccuracyGivenThreshold } from "./../helperfunctions/HelperFunctions"
// import * as _ from "lodash"
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


                <div>FAQ</div>
                <DrawSignal></DrawSignal>
            </div >
        );
    }
}

export default Faq;