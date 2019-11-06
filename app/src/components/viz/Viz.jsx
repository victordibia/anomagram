import React, { Component } from 'react'
// import { InlineLoading, Button, Search, Modal, Tooltip } from 'carbon-components-react';
import { loadJSONData } from "../helperfunctions/HelperFunctions"
import "./viz.css"
import LineChart from "../linechart/LineChart"
import SmallLineChart from "../linechart/SmallLineChart"
// import "../../data" 


class Viz extends Component {
    constructor(props) {
        super(props)


        this.testData = require("../../data/ecg/test.json")

        this.state = {
            apptitle: "Anomagram",
            testData: this.testData,
            trainData: [],
            selectedData: 0
        }


        // this.trainData = require("../../data/ecg/train.json")
        // console.log(this.testData.length, this.trainData.length)

        this.loadData()

        this.chartColorMap = {
            1: { color: "#0062ff", colornorm: "#0062ff", name: "Normal" },
            2: { color: "#ffa32c", colornorm: "grey", name: "R-on-T Premature Ventricular Contraction" },
            3: { color: "violet", colornorm: "grey", name: "Supraventricular Premature or Ectopic Beat " },
            4: { color: "orange", colornorm: "grey", name: "Premature Ventricular Contraction" },
            5: { color: "red", colornorm: "grey", name: "Unclassifiable Beat" },
        }

        this.maxSmallChart = 100

    }

    loadData() {
        // let testECGDataPath = process.env.PUBLIC_URL + "/data/ecg/test_small.json"
        // let trainECGDataPath = process.env.PUBLIC_URL + "/data/ecg/train_small.json"
        // loadJSONData(testECGDataPath).then(data => {
        //     this.setState({ testData: data })
        //     // console.log("test data loaded", data.length)
        // })

        // loadJSONData(trainECGDataPath).then(data => {
        //     this.setState({ trainData: data })
        // })

    }
    componentDidUpdate(prevProps, prevState) {


    }


    componentDidMount() {
        this.apptitle = "Amadioha"
    }

    clickDataPoint(e) {
        this.setState({ selectedData: e.target.getAttribute("indexvalue") })

        let colorAttrr = e.target.getAttribute("targetval") + "" === "1" ? "green" : "red"
        console.log(e.target.getAttribute("targetval"), colorAttrr)
        this.refs.labelcolordiv.style.backgroundColor = colorAttrr
        this.refs.predictioncolordiv.style.backgroundColor = colorAttrr
    }

    render() {


        let dataLegend = Object.entries(this.chartColorMap).map((data, index) => {
            let color = data[1].color
            let name = data[1].name
            return (
                <div className="iblock mr10 mb5" key={"legendrow" + index}>
                    <div style={{ background: color }} className="indicatorcircle iblock mr5"></div>
                    <div className="iblock legendtext pl4 mediumdesc"> {name}</div>
                    <div className="iblock"></div>

                </div>
            )
        });

        let dataPoints = this.state.testData.slice(0, this.maxSmallChart).map((data, index) => {
            return (
                <div onClick={this.clickDataPoint.bind(this)} key={"testrow" + index} className={"mb5 p5 clickable ecgdatapoint rad3 iblock mr5" + (this.state.selectedData + "" === (index + "") ? " active" : "")} indexvalue={index} targetval={data.target} >
                    <div indexvalue={index} className="boldtext  unclickable iblock ">

                        <div className="positionrelative">
                            <div className="p3 indicatoroutrcircle  positionabsolute bottomright">
                                <div style={{ background: this.chartColorMap[this.state.testData[index].target].color }} className="indicatorcircle "></div>
                            </div>
                            <SmallLineChart
                                data={{
                                    data: this.state.testData[index],
                                    index: index,
                                    color: this.chartColorMap[this.state.testData[index].target].colornorm,
                                    chartWidth: 72,
                                    chartHeight: 30
                                }}
                            > </SmallLineChart>
                        </div>

                    </div>

                </div>
            )
        });

        return (
            <div>




                <div className="bold mt10 sectiontitle mb10">
                    Anomaly Detection with Deep Learning in the Browser!

                </div>

                <div className="mynotif h100 lh10  lightbluehightlight maxh16  mb10">
                    {this.state.apptitle} is an interactive visualization tool for exploring
                    deep learning models applied to the task of anomaly detection (on non-time series data).

                </div>




                <div className="bold mt10 sectiontitle mb10">
                    {/* ECG Dataset */}
                </div>



                <div className="flex">
                    <div className="flexfull p10  ">
                        <div className="mb10 boldtext">
                            ECG {this.state.testData.length}
                        </div>
                        <div className="mb5">
                            {dataLegend}
                        </div>
                        <div className="ecgdatabox mb10">
                            {dataPoints}
                        </div>
                    </div>
                    {/* <div className="flex2 p10 ">
                        <div className="mb10 boldtext"> Model </div>
                    </div> */}
                    <div className=" p10 modeloutputbox rad5 ">
                        <div className="mb10 boldtext"> Model Output

                        </div>
                        <div>

                            {this.state.testData.length > 0 &&
                                <div>
                                    <div className="flex mediumdesc mb5 displaynone">
                                        <div className="mr10 boldtext">
                                            Label
                                        </div>
                                        <div ref="labelcolordiv" className="flexfull colorbox greenbox">

                                        </div>
                                        {/* <span className="boldtext"> </span>: {this.chartColorMap[this.state.testData[this.state.selectedData].target].name} */}
                                    </div>
                                    <div className="flex mediumdesc mb5">
                                        <div className="mr10 boldtext">
                                            {this.state.testData[this.state.selectedData].target + "" === "1" ? "NORMAL" : "ABNORMAL"}
                                        </div>
                                        <div ref="predictioncolordiv" className="flexfull colorbox redbox">

                                        </div>
                                        {/* <span className="boldtext"> </span>: {this.chartColorMap[this.state.testData[this.state.selectedData].target].name} */}
                                    </div>

                                    <div className="iblock">
                                        {/* {this.state.testData[this.state.selectedData].index} */}
                                        <LineChart
                                            data={{
                                                data: this.state.testData[this.state.selectedData],
                                                index: this.state.testData[this.state.selectedData].index,
                                                color: this.chartColorMap[this.state.testData[this.state.selectedData].target].colornorm,
                                                chartWidth: 390,
                                                chartHeight: 370
                                            }}

                                        > </LineChart>
                                    </div>

                                </div>

                            }
                            {/* {this.state.testData[0].index} */}
                        </div>
                    </div>
                </div>


                <div>
                    {/* A VAE (an extension of an AE) can allow us generate sampled data without */}
                </div>






            </div>
        )
    }
}

export default Viz