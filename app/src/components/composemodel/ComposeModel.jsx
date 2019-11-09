import React, { Component } from "react";
// import { Button } from "carbon-components-react"
import { LeaderLine, animOptions } from "../helperfunctions/HelperFunctions"
import { Add16, Subtract16 } from '@carbon/icons-react';
import "./composemodel.css"
import * as _ from "lodash"

class ComposeModel extends Component {
    constructor(props) {
        super(props)

        this.state = {
            encoderDims: [8, 7, 6, 5, 3],
            decoderDims: [7, 15],
            latentDim: [2],
            maxLayers: 10,
            minLayers: 2,
            maxUnits: 12,
            minUnits: 2,
            defaultLayerDim: 3
        }

        this.lineHolder = []

        this.rightTopAnchor = { x: "100%", y: "5%" }
        this.rightBottomAnchor = { x: "100%", y: "95%" }
        this.leftTopAnchor = { x: 0, y: "5%" }
        this.leftBottomAnchor = { x: "0%", y: "95%" }
        this.rightMiddle = { x: "100%", y: "50%" }
        this.leftMiddle = { x: "0%", y: "50%" }
    }
    componentDidMount() {
        this.drawAllLines();
    }

    getElement(network, attributeName, attributeValue) {
        return document.querySelector("div." + network).querySelector("[" + attributeName + "=" + attributeValue + "]")
    }

    addLayerLines(network, layer) {
        if ((layer * 1) !== (this.state.encoderDims.length - 1)) {
            let startId = "layerdiv" + layer;
            let endId = "layerdiv" + (layer * 1 + 1);
            let startEl = this.getElement(network, "layerdiv", startId)
            let endEl = this.getElement(network, "layerdiv", endId)
            // console.log(startEl, endEl);
            let params = { pathType: "straight", startId: startId, endId: endId, network: network }
            this.drawLeaderLine(startEl, endEl, network === "encoder" ? this.rightTopAnchor : this.leftTopAnchor, network === "encoder" ? this.leftTopAnchor : this.rightTopAnchor, params)
            this.drawLeaderLine(startEl, endEl, network === "encoder" ? this.rightTopAnchor : this.leftTopAnchor, network === "encoder" ? this.leftBottomAnchor : this.rightBottomAnchor, params)
            this.drawLeaderLine(startEl, endEl, network === "encoder" ? this.rightBottomAnchor : this.leftBottomAnchor, network === "encoder" ? this.leftTopAnchor : this.rightTopAnchor, params)
            this.drawLeaderLine(startEl, endEl, network === "encoder" ? this.rightBottomAnchor : this.leftBottomAnchor, network === "encoder" ? this.leftBottomAnchor : this.rightBottomAnchor, params)
        } else {
            let startId = "layerdiv" + layer;
            let startEl = this.getElement(network, "layerdiv", startId)
            let encoderDiv = document.getElementById("mainencoderdiv")
            let latentDiv = document.getElementById("latentdiv")
            let decoderDiv = document.getElementById("maindecoderdiv")

            let params = { pathType: "arc", startId: startId, endId: "latent", network: network }
            this.drawLeaderLine(startEl, latentDiv, network === "encoder" ? this.rightMiddle : this.leftMiddle, network === "encoder" ? this.leftMiddle : this.rightMiddle, params)

        }
    }
    addEncDecLines(layer) {
        this.addLayerLines("encoder", layer)
        this.addLayerLines("decoder", layer)
    }
    drawAllLines() {
        // Add connector lines for encoder decoder 
        for (const layer in this.state.encoderDims) {
            this.addEncDecLines(layer)

        }
    }


    removeLayerLines(lineId) {

        // Remove lines associated with a deleted layer
        // Remove it from the DOM and also from the holder array 


        let toRemove = new Map()
        this.lineHolder.forEach(function (each, i) {
            if (each.startId === lineId || each.endId === lineId) {
                each.line.remove()
                toRemove.set(i, "dot")
            } else {
                each.line.position()
            }
        })

        // Remove lines queed up for deletion
        let newHolder = []
        this.lineHolder.forEach(function (each, i) {
            if (toRemove.get(i) == null) {
                newHolder.push(each)
            }
        });


        // console.log("old", this.lineHolder.length, newHolder.length);
        this.lineHolder = newHolder


    }


    drawLeaderLine(startElement, endElement, startAnchor, endAnchor, params) {

        let blueColor = "rgba(0, 0, 255, 0.589)"
        let lineWidth = 1.5
        let plugType = "disc"

        let line = new LeaderLine(
            LeaderLine.pointAnchor(startElement, startAnchor),
            LeaderLine.pointAnchor(endElement, endAnchor), {
            color: blueColor,
            startPlug: plugType,
            endPlug: plugType,
            startPlugColor: blueColor,
            path: params.pathType,
            size: lineWidth,
            hide: true,
            dash: { gap: 2 }

        });
        // document.querySelector('.leader-line').style.zIndex = -100
        animOptions.duration = 400
        line.show("draw", animOptions)
        this.lineHolder.push({ line: line, startId: params.startId, endId: params.endId, network: params.network })
    }


    removeAllLines(line) {
        this.lineHolder.forEach(function (each) {
            each.line.remove()
        })
        this.lineHolder = []
    }


    redrawLine(lineId) {
        this.lineHolder.forEach(function (each) {
            if (each.startId === lineId || each.endId === lineId) {
                // each.line.color = "red"
                each.line.hide("none")
                each.line.show("draw", animOptions)
                each.line.position();
            } else {
                each.line.position();
            }
        })
    }

    componentDidUpdate(prevProps, prevState) {
        // Handle addition of a new node/unit in a layer 
        for (const i in this.state.encoderDims) {
            if (this.state.encoderDims[i] !== prevState.encoderDims[i]) {
                this.redrawLine("layerdiv" + i)
            }
        }

        // Handle layer addition or removal 
        if (this.state.encoderDims.length > prevState.encoderDims.length) {
            this.removeLayerLines("latent")
            this.addEncDecLines(this.state.encoderDims.length - 2)
            this.addEncDecLines(this.state.encoderDims.length - 1)


        } else if (this.state.encoderDims.length < prevState.encoderDims.length) {
            this.removeLayerLines("layerdiv" + this.state.encoderDims.length)
            this.addEncDecLines(this.state.encoderDims.length - 1)

        }

        // console.log(this.lineHolder.length);



    }

    componentWillUnmount() {
        this.removeAllLines()
    }



    setStateVal(varGroup, newDims) {
        if (varGroup + "" === "encoder") {
            this.setState({ encoderDims: newDims })
        } else if (varGroup + "" === "decoder") {
            this.setState({ decoderDims: newDims })
        } else if (varGroup + "" === "latent") {
            this.setState({ latentDim: newDims })
        }
    }

    getDims(dimType) {
        switch (dimType) {
            case "encoder":
                return this.state.encoderDims.slice()
            case "decoder":
                return this.state.decoderDims.slice()
            case "latent":
                return this.state.latentDim.slice()
            default:
                break
        }
    }




    updateLayerClick(e) {


        let currentDims = this.getDims(e.target.getAttribute("layergroup"));

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

        // Update state variables for dimension units
        let currentDims = this.getDims(e.target.getAttribute("layergroup"));
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

    nodeHover(e) {
        console.log(e.target.getAttribute("nodeunit"));

    }


    render() {

        let latentLayers = this.state.latentDim.map((data, layerindex) => {
            let eachLayer = _.range(data).map((unitindex) => {
                return (
                    <div className="eachunitbox " key={"eachunit" + unitindex}>
                        {/* {index} */}
                    </div>
                )
            })
            return (
                <div key={"latentlayer" + layerindex} className=" h100 flex flexfull flexjustifycenter ">
                    <div className=" mb5 mt5 ">
                        <div className="" >
                            <div className="smalldesc mb3 unselectable">{data} units</div>
                            <div
                                layergroup="latent"
                                unitindex={layerindex}
                                buttonaction="add"
                                onClick={this.updateUnits.bind(this)}
                                className="updatebutton unselectable mb3 clickable">
                                <Add16 className="unclickable"></Add16>
                            </div>
                            <div id="latentdiv" className="layerdiv  pt3 mb3">{eachLayer}</div>
                            <div
                                layergroup="latent"
                                unitindex={layerindex}
                                buttonaction="subtract"
                                onClick={this.updateUnits.bind(this)}
                                className="updatebutton unselectable  clickable">
                                <Subtract16 className="unclickable"></Subtract16>
                            </div>
                        </div>
                    </div>

                </div>
            )
        })

        let encLayers = this.state.encoderDims.map((data, layerindex) => {

            let eachLayer = _.range(data).map((unitindex) => {
                // console.log("layerunit" + layerindex + unitindex)
                return (
                    <div nodeunit={"layerunit" + layerindex + unitindex} ref={"layerunit" + layerindex + unitindex} className="eachunitbox " key={"eachunit" + unitindex}></div>
                )
            })
            return (
                <div key={"enclayer" + layerindex} className="iblock  mr10 flex flexfull flexjustifycenter ">
                    <div className="iblock  mb5 mt5">
                        <div>
                            <div className="smalldesc mb3 unselectable">{data} units</div>
                            <div
                                layergroup="encoder"
                                unitindex={layerindex}
                                buttonaction="add"
                                onClick={this.updateUnits.bind(this)}
                                className="updatebutton unselectable mb3 clickable">
                                <Add16 className="unclickable"></Add16>
                            </div>
                            <div layerdiv={"layerdiv" + layerindex} className="layerdiv  pt3 mb3">{eachLayer}</div>
                            <div
                                layergroup="encoder"
                                unitindex={layerindex}
                                buttonaction="subtract"
                                onClick={this.updateUnits.bind(this)}
                                className="updatebutton unselectable  clickable">
                                <Subtract16 className="unclickable"></Subtract16>
                            </div>

                        </div>
                    </div>
                </div>
            )
        })

        // console.log(encLayers.length);
        let decLayers = _.reverse(_.clone(encLayers));

        return (
            <div className="mb10 ">

                {/* Layer controls */}

                <div className="flex w100 mb5 ">
                    {/* <div className="mediumdesc mb5 mt5 mr10"> * we map the same configuration for both encoder and decoder </div> */}
                    <div className="flex5 "></div>
                    <div className="buttonbar ">
                        <div
                            layergroup="encoder"
                            buttonaction="add"
                            onClick={this.updateLayerClick.bind(this)}
                            className="updatebutton unselectable mr5 clickable">
                            <Add16 className="unclickable"></Add16>
                        </div>
                        <div
                            layergroup="encoder"
                            buttonaction="subtract"
                            onClick={this.updateLayerClick.bind(this)}
                            className="updatebutton unselectable mr5 clickable">
                            <Subtract16 className="unclickable"></Subtract16>
                        </div>
                    </div>
                    <div className="unselectable flex5 iblock  pt5">
                        {this.state.encoderDims.length} Layers
                    </div>
                </div>

                {/* Section titles */}
                <div className="flex mb10 displaynone">
                    <div className="flex4 textaligncenter mediumdesc boldtext"> Encoder </div>
                    <div className="flex2 textaligncenter  mediumdesc boldtext"> Bottleneck </div>
                    <div className="flex4 textaligncenter  mediumdesc boldtext"> Decoder </div>
                </div>
                {/* Encoder, bottleneck, Decoder  */}
                <div className="flex">
                    <div className="iotextdata mr10 p5 ">
                        Input Data
                    </div>
                    <div id="mainencoderdiv" ref="encoderbox" className="encoder greyhighlight rad4 pl5 flex5 mr10 ">
                        <div className="layerbar flex  flexjustifycenter pb10 pt10">
                            {encLayers}
                        </div>

                    </div>
                    <div ref="latentbox" className="bottlneck  mr10 ">
                        <div className="layerbar  h100  flex  flexjustifycenter  ">
                            {latentLayers}
                        </div>
                    </div>
                    <div id="maindecoderdiv" ref="decoderbox" className="decoder greyhighlight rad4 pl5 flex5 ">
                        <div className="layerbar flex   flexjustifycenter  pb10 pt10">
                            {decLayers}
                        </div>
                    </div>

                    <div className="iotextdata ml10 p5 ">
                        Output Data
                    </div>

                </div>

            </div>
        );
    }
}

export default ComposeModel;