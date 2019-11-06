import React, { Component } from "react";
import "./composemodel.css"

class ComposeModel extends Component {
    constructor(props) {
        super(props)

        this.state = {
            encoderDims: [15, 7],
            decoderDims: [7, 15],
            latentDim: 2
        }
    }
    componentDidMount() {

    }

    render() {
        return (
            <div>

            </div>
        );
    }
}

export default ComposeModel;