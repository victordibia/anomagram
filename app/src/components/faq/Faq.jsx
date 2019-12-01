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

                <br />
                <br />
                <div> FAQ </div>

                <div> Training Parameters </div>
                <div> All trainining parameters are selected as specified.
                    For regularization, kernel regularization (reduces the size of the weights) is implemented (vs activity regularization)
                    This is applied to all layers in the model.
                    The regularization rate is set as same as the learning rate.

                </div>
            </div >
        );
    }
}

export default Faq;