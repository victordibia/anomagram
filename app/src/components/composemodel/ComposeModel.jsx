/**
 * @license
 * Copyright 2019 Victor Dibia. https://github.com/victordibia
 * Anomagram - Anomagram: Anomaly Detection with Autoencoders in the Browser.
 * Licensed under the MIT License (the "License"); 
 * =============================================================================
 */

import React, { Component } from "react";
import { LeaderLine, animOptions } from "../helperfunctions/HelperFunctions"
import { Add16, Subtract16 } from '@carbon/icons-react';
import "./composemodel.css"
import * as _ from "lodash"

class ComposeModel extends Component {
    constructor(props) {
        super(props)

        this.state = {
            hiddenDims: this.props.hiddenDims,
            latentDim: this.props.latentDim,
            maxLayers: 10,
            minLayers: 1,
            maxUnits: 9,
            minUnits: 2,
            defaultLayerDim: 3,
            isTraining: this.props.isTraining,
            lineWidth: 1.5,
            latentLineWidth: 2.5,
            animationDuration: 350
        }

        this.lineHolder = []

        this.rightTopAnchor = { x: "100%", y: "5%" }
        this.rightBottomAnchor = { x: "100%", y: "95%" }
        this.leftTopAnchor = { x: 0, y: "5%" }
        this.leftBottomAnchor = { x: "0%", y: "95%" }
        this.rightMiddle = { x: "100%", y: "50%" }
        this.leftMiddle = { x: "0%", y: "50%" }


        this.blueColor = "rgba(0, 0, 255, 0.89)"
        this.greyColor = "grey"

        this.isUpdatable = this.props.isUpdatable
    }
    componentDidMount() {
        this.drawAllLines();
    }


    getElement(network, attributeName, attributeValue) {
        return document.querySelector("div." + network).querySelector("[" + attributeName + "=" + attributeValue + "]")
    }

    addLayerLines(network, layer) {
        if ((layer * 1) !== (this.state.hiddenDims.length - 1)) {
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
            // let encoderDiv = document.getElementById("mainencoderdiv")
            let latentDiv = document.getElementById("latentdiv")
            // let decoderDiv = document.getElementById("maindecoderdiv")

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
        for (const layer in this.state.hiddenDims) {
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

        // Remove lines queued up for deletion
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

        let lineColor = this.state.isTraining ? "grey" : "rgba(0, 0, 255, 0.89)"
        let lineWidth = this.state.lineWidth
        let plugType = "disc"

        let line = new LeaderLine(
            LeaderLine.pointAnchor(startElement, startAnchor),
            LeaderLine.pointAnchor(endElement, endAnchor), {
            color: lineColor,
            startPlug: plugType,
            endPlug: plugType,
            startPlugColor: lineColor,
            path: params.pathType,
            size: lineWidth,
            hide: true,
            // dash: { gap: 2, animation: params.endId === "latent" ? this.state.isTraining : false }
            dash: { gap: 3 }
        });
        // document.querySelector('.leader-line').style.zIndex = -100
        animOptions.duration = this.state.animationDuration
        line.show("draw", animOptions)
        this.lineHolder.push({ line: line, startId: params.startId, endId: params.endId, network: params.network })
    }


    removeAllLines(line) {
        this.lineHolder.forEach(function (each) {
            each.line.remove()
        })
        this.lineHolder = []
    }

    redrawAllLines() {
        this.lineHolder.forEach(function (each) {
            each.line.position();
        })
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

    animateLines() {
        // let self = this
        let color = this.state.isTraining ? this.greyColor : this.blueColor
        // console.log(self.props.isTraining);
        let opt = {
            color: color,
            startPlugColor: color
        }

        this.lineHolder.forEach(function (each) {
            each.line.setOptions(opt)
        })
    }

    componentDidUpdate(prevProps, prevState) {

        // Handle addition of a new node/unit in a layer 
        for (const i in this.state.hiddenDims) {
            if (this.state.hiddenDims[i] !== prevState.hiddenDims[i]) {
                this.redrawLine("layerdiv" + i)
                this.props.updateModelDims(this.state.hiddenDims, this.state.latentDim)

            }
        }

        // Handle layer addition or removal 
        if (this.state.hiddenDims.length > prevState.hiddenDims.length) {
            this.removeLayerLines("latent")
            this.addEncDecLines(this.state.hiddenDims.length - 2)
            this.addEncDecLines(this.state.hiddenDims.length - 1)
        } else if (this.state.hiddenDims.length < prevState.hiddenDims.length) {
            this.removeLayerLines("layerdiv" + this.state.hiddenDims.length)
            this.addEncDecLines(this.state.hiddenDims.length - 1)

        }


        if (prevState.isTraining !== this.props.isTraining) {
            // console.log("training toggled");
            this.setState({ isTraining: this.props.isTraining })
            this.animateLines()

        }

        // Update parent state once dims change
        if (this.state.hiddenDims.length !== prevState.hiddenDims.length || this.state.latentDim[0] !== prevState.latentDim[0]) {
            // console.log("latent or hidden changed");

            this.props.updateModelDims(this.state.hiddenDims, this.state.latentDim)
        }


        if (prevProps.adv !== this.props.adv) {
            this.redrawAllLines();
        }

    }

    componentWillUnmount() {
        this.removeAllLines()
    }



    setStateVal(varGroup, newDims) {
        if (varGroup + "" === "encoder") {
            this.setState({ hiddenDims: newDims })
        } else if (varGroup + "" === "decoder") {
            this.setState({ decoderDims: newDims })
        } else if (varGroup + "" === "latent") {
            this.setState({ latentDim: newDims })
        }
    }

    getDims(dimType) {
        switch (dimType) {
            case "encoder":
                return this.state.hiddenDims.slice()
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
                    <div className={"eachunitbox " + (this.state.isTraining ? " unitgrey" : " unitblue")} key={"eachunit" + unitindex}>
                        {/* {index} */}
                    </div>
                )
            })
            return (
                <div key={"latentlayer" + layerindex} className=" h100 flex flexfull flexjustifycenter ">
                    <div className=" mwc flex flexjustifycenter mb5 mt5 ">
                        <div className="" >
                            <div className="smalldesc mb3 unselectable latentunittitle">{data} units</div>
                            <div
                                layergroup="latent"
                                unitindex={layerindex}
                                buttonaction="add"
                                onClick={this.updateUnits.bind(this)}
                                className={"updatebutton unselectable mb3 clickable " + ((data === this.state.maxUnits || !this.isUpdatable) ? " disabled unclickable " : "")}>
                                <Add16 className="unclickable"></Add16>
                            </div>
                            <div id="latentdiv" className="layerdiv  pt3 mb3">{eachLayer}</div>
                            <div
                                layergroup="latent"
                                unitindex={layerindex}
                                buttonaction="subtract"
                                onClick={this.updateUnits.bind(this)}
                                className={"updatebutton unselectable  clickable " + ((data === this.state.minUnits || !this.isUpdatable) ? " disabled unclickable " : "")}>
                                <Subtract16 className="unclickable"></Subtract16>
                            </div>
                        </div>
                    </div>

                </div>
            )
        })

        let encLayers = this.state.hiddenDims.map((data, layerindex) => {

            let eachLayer = _.range(data).map((unitindex) => {
                // console.log("layerunit" + layerindex + unitindex)
                return (
                    <div nodeunit={"layerunit" + layerindex + unitindex} ref={"layerunit" + layerindex + unitindex} className={"eachunitbox " + (this.state.isTraining ? " unitgrey" : " unitblue")} key={"eachunit" + unitindex}></div>
                )
            })
            return (
                <div key={"enclayer" + layerindex} className="iblock encdecbox  mr10 flex flexfull flexjustifycenter ">
                    <div className="iblock    mb5 mt5">
                        <div className="smalldesc mb3 unselectable ">{data} units</div>
                        <div
                            layergroup="encoder"
                            unitindex={layerindex}
                            buttonaction="add"
                            onClick={this.updateUnits.bind(this)}
                            className={"updatebutton unselectable mb3 clickable " + ((data === this.state.maxUnits || !this.isUpdatable) ? " disabled unclickable " : "")}>
                            <Add16 className="unclickable"> </Add16>
                        </div>
                        <div layerdiv={"layerdiv" + layerindex} className="layerdiv  pt3 mb3">{eachLayer}</div>
                        <div
                            layergroup="encoder"
                            unitindex={layerindex}
                            buttonaction="subtract"
                            onClick={this.updateUnits.bind(this)}
                            className={"updatebutton unselectable mb3 clickable " + ((data === this.state.minUnits || !this.isUpdatable) ? " disabled unclickable " : "")}>
                            <Subtract16 className="unclickable"></Subtract16>
                        </div>


                    </div>
                </div >
            )
        })

        // console.log(encLayers.length);
        let decLayers = _.reverse(_.clone(encLayers));

        return (
            <div className="mb10 ">

                {/* Layer controls */}

                <div className="flex w100 mb5 ">
                    {/* <div className="mediumdesc mb5 mt5 mr10"> * we map the same configuration for both encoder and decoder </div> */}
                    <div className="flex5 ">
                        <div className="smalldesc networktitle  p5"> Encoder {this.state.hiddenDims.length} Layers </div>
                    </div>
                    {this.props.isUpdatable && <div className="buttonbar mr10 ml10 ">
                        <div
                            layergroup="encoder"
                            buttonaction="add"
                            onClick={this.updateLayerClick.bind(this)}
                            className={"updatebutton unselectable mr5 clickable " + (this.state.hiddenDims.length === this.state.maxLayers || !this.isUpdatable ? " disabled unclickable " : "")}>
                            <Add16 className="unclickable"></Add16>
                        </div>
                        <div
                            layergroup="encoder"
                            buttonaction="subtract"
                            onClick={this.updateLayerClick.bind(this)}
                            className={"updatebutton unselectable  clickable " + (this.state.hiddenDims.length === this.state.minLayers || !this.isUpdatable ? " disabled unclickable " : "")}>
                            <Subtract16 className="unclickable"></Subtract16>
                        </div>
                    </div>}
                    {!this.props.isUpdatable && <div> z </div>}
                    <div className="unselectable flex5     ">
                        <div className="flex p5 networktitle  mediumdesc ">
                            <div className="flex flexjustifyleft "> </div>
                            <div className="flex flexfull flexjustifycenter   "></div>
                            <div className="smalldesc"> Decoder {this.state.hiddenDims.length} Layers </div>
                        </div>
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
                    <div className="iotextdata unselectable mr10 p5  ">
                        input [140 units]
                    </div>
                    <div id="mainencoderdiv" ref="encoderbox" className="encoder greyhighlight  pl5 flex5 mr10 ">
                        <div className="layerbar flex  flexjustifycenter pb10 pt10">
                            {encLayers}
                        </div>

                    </div>
                    <div ref="latentbox" className="bottlneck pr5 pl5   mr10 ">
                        <div className="layerbar  h100  flex  flexjustifycenter  ">
                            {latentLayers}
                        </div>
                    </div>
                    <div id="maindecoderdiv" ref="decoderbox" className="decoder greyhighlight  pl5 flex5 ">
                        <div className="layerbar flex   flexjustifycenter  pb10 pt10">
                            {decLayers}
                        </div>
                    </div>

                    <div className="iotextdata unselectable ml10 p5  ">
                        output [140 units]
                    </div>

                </div>

            </div>
        );
    }
}

export default ComposeModel;