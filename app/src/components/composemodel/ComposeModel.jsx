import React, { Component } from "react";
import { Button } from "carbon-components-react"
import { Add16, Subtract16, PlayFilled16, CaretDown16, CaretUp16 } from '@carbon/icons-react';
import "./composemodel.css"
import * as _ from "lodash"
import { Add } from "@tensorflow/tfjs-layers/dist/layers/merge";

class ComposeModel extends Component {
    constructor(props) {
        super(props)

        this.state = {
            encoderDims: [8, 4, 3],
            decoderDims: [7, 15],
            latentDim: 2,
            maxLayers: 6,
            minLayers: 2,
            maxUnits: 8,
            minUnits: 3,
            defaultLayerDim: 3
        }
    }
    componentDidMount() {

    }

    addEncoderLayerClick(e) {

        if (this.state.encoderDims.length + 1 <= this.state.maxLayers) {
            let currentDims = this.state.encoderDims
            currentDims.push(this.state.defaultLayerDim)
            this.setState({ encoderDims: currentDims })
        }

    }


    removeEncoderLayerClick(e) {

        if (this.state.encoderDims.length - 1 >= this.state.minLayers) {
            let currentDims = this.state.encoderDims
            currentDims.pop()
            this.setState({ encoderDims: currentDims })
        }


        // }

    }

    setStateVal(varGroup, newDims) {


        if (varGroup + "" === "encoder") {
            this.setState({ encoderDims: newDims })
        } else {
            this.setState({ decoderDims: newDims })
        }
    }

    updateLayerClick(e) {
        let currentDims = e.target.getAttribute("layergroup") === "encoder" ? this.state.encoderDims : this.state.decoderDims

        if (e.target.getAttribute("buttonaction") === "add") {

            if (currentDims.length + 1 <= this.state.maxLayers) {
                currentDims.push(this.state.defaultLayerDim)
                this.setStateVal(e.target.getAttribute("layergroup"), currentDims)
            }

        } else {

            if (currentDims.length - 1 >= this.state.minLayers) {
                currentDims.pop()
                this.setStateVal(e.target.getAttribute("layergroup"), currentDims)
            }

        }
    }

    updateUnits(e) {

        let currentDims = e.target.getAttribute("layergroup") === "encoder" ? this.state.encoderDims : this.state.decoderDims
        let currentUnit = currentDims[e.target.getAttribute("unitindex") * 1]
        // console.log(e.target.getAttribute("unitindex"), currentUnit);
        if (e.target.getAttribute("buttonaction") === "add") {

            if (currentUnit + 1 <= this.state.maxUnits) {
                currentDims[e.target.getAttribute("unitindex") * 1] = currentUnit + 1
                this.setStateVal(e.target.getAttribute("layergroup"), currentDims)
            }

        } else {

            if (currentUnit - 1 >= this.state.minUnits) {
                currentDims[e.target.getAttribute("unitindex") * 1] = currentUnit - 1
                this.setStateVal(e.target.getAttribute("layergroup"), currentDims)
            }

        }



    }

    render() {

        let encLayers = this.state.encoderDims.map((data, index) => {
            let eachLayer = _.range(data).map((data, index) => {
                return (
                    <div className="eachlayerbox mb5" key={"eachlayer" + index}>
                        {/* {index} */}
                    </div>
                )
            })
            return (
                <div key={"enclayer" + index} className="iblock mr10 flexfull ">
                    <div className="iblock  ">
                        <div>
                            {/* <div>{data}</div> */}
                            <div
                                layergroup="encoder"
                                unitindex={index}
                                buttonaction="add"
                                onClick={this.updateUnits.bind(this)}
                                className="updatebutton mb5 clickable">
                                <Add16 className="unclickable"></Add16>
                            </div>
                            <div>{eachLayer}</div>
                            <div
                                layergroup="encoder"
                                unitindex={index}
                                buttonaction="subtract"
                                onClick={this.updateUnits.bind(this)}
                                className="updatebutton  clickable">
                                <Subtract16 className="unclickable"></Subtract16>
                            </div>

                        </div>
                    </div>
                </div>
            )
        })

        return (
            <div>
                <div className="flex">
                    <div className="encoder flex4 mr10">
                        <div className="buttonbar mb10">
                            <div
                                layergroup="encoder"
                                buttonaction="add"
                                onClick={this.updateLayerClick.bind(this)}
                                className="updatebutton mr5 clickable">
                                <Add16 className="unclickable"></Add16>
                            </div>
                            <div
                                layergroup="encoder"
                                buttonaction="subtract"
                                onClick={this.updateLayerClick.bind(this)}
                                className="updatebutton mr5 clickable">
                                <Subtract16 className="unclickable"></Subtract16>
                            </div>
                            {/* <Button
                                buttonaction="add"
                                className="mr5 iblock"
                                onClick={this.addEncoderLayerClick.bind(this)}
                                renderIcon={Add16}
                                size="small"
                                tooltipPosition="top"
                                tooltipAlignment="start"
                                iconDescription="+"
                                // disabled={(!this.state.isTraining) ? false : true}
                                hasIconOnly
                            ></Button>
                            <Button
                                buttonaction="subtract"
                                className="mr5 iblock"
                                renderIcon={Subtract16}
                                size="small"
                                tooltipPosition="top"
                                tooltipAlignment="start"
                                iconDescription="-"
                                onClick={this.removeEncoderLayerClick.bind(this)}
                                // disabled={(!this.state.isTraining) ? false : true}
                                hasIconOnly
                            ></Button> */}
                        </div>

                        <div className="layerbar flex  flexjustifycenter">
                            {encLayers}
                        </div>

                    </div>
                    <div className="bottlneck border flex2 mr10">

                    </div>
                    <div className="decoder border flex4">

                    </div>

                </div>

            </div>
        );
    }
}

export default ComposeModel;