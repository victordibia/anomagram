import React, { Component } from 'react'
// import { InlineLoading, Button, Search, Modal, Tooltip } from 'carbon-components-react';
// import { loadJSONData } from "../helperfunctions/HelperFunctions"
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
                    deep learning models applied to the task of anomaly detection (on stationary data).

                </div>




                <div className="bold mt10 sectiontitle mb10">
                    {/* ECG Dataset */}
                </div>



                <div className="flex  " >
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
                        <div className="">

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

                        <div>
                            

                        </div>


                    </div>


                </div>
                <div className="lh10 p10">
                    We have trained a two layer autoencoder with 2600 samples of normal ECG signal data.
                    Each ECG signal contains 140 recordings of the electrical signal of the heart, corresponding to a heartbeat.
                    Our test set (above) contains both normal and abormal ECG signals, and our model is tasked with distinguishing normal from abnormal signal.

                </div>


                { 
                <div className="displaynone"> 
                    <div className="sectiontitle mt10 mb5"> An Introduction to Autoencoders </div>
                    <div className="">
                        <div className="flex">
                            <div className="flex6 lh10 mb10 pr10">
                            An autoencoder is a neural network that learns to map input data to a low dimension representation
                                and then reconstruct the original input from this low dimension representation. The part of the network which learn the input to 
                                low dimension mapping is termed an encoder, while the section that maps from low dimension back to original input is termed the decoder.
                            This capability of producing a low dimension representation is reminiscent dimensionality reduction approaches (e.g. PCA), and indeed
                            Autoencoders have been typically used for dimensionbality reduction and compression use cases. For an indepth treatment of autoencoders, please see ... 
                            
                            However, while 
                            </div>

                            <div className="border rad4 p10 flex4" style={{ height:"200px"}}>
                                small autoencoder viz
                            </div>
                        </div>

                    </div>


                    <div className="sectiontitle mt10 mb5"> Modeling Normal Data  </div>
                    <div className="">
                        <div className="flex">
                            <div className="flex6 lh10 mb10 pr10">
                                <div className="flex">
                                    <div className="flex5 mr10">
                                    <div className="pb5 boldtext"> Data Standardization  </div>
                                    Most approaches to anomaly detection (and there are many) begin by constructing a model of 
                                normal behaviour and then exploit this model to identify deviations from normal (anomalies or abnormal data).
                            Here is how we can use an autoencoder to model normal behaviour. If you recall, an autoencoder learns to compress 
                            and reconstruct data. Notably this learned mapping is specific to the data type/distribution distribution of the training data.
                            In other words an autoencoder trained using 15 px images of dogs is unlikely to correctly reconstruct 20px images of the surface 
                            of the moon.
                                    </div>
                                    
                                    <div className="flex5 mr10">
                                    <div className="pb5 boldtext"> Model Training </div>
                                    Most approaches to anomaly detection (and there are many) begin by constructing a model of 
                            normal behaviour and then exploit this model to identify deviations from normal (anomalies or abnormal data).
                        Here is how we can use an autoencoder to model normal behaviour. If you recall, an autoencoder learns to compress 
                        and reconstruct data. Notably this learned mapping is specific to the data type/distribution distribution of the training data.
                        In other words an autoencoder trained using 15 px images of dogs is unlikely to correctly reconstruct 20px images of the surface 
                        of the moon.
                                    </div>
                            </div>
                            </div>

                            <div className="border rad4 p10 flex4" style={{ height:"200px"}}>
                                small histogram viz
                            </div>
                        </div>

                    </div>

                    <div className="sectiontitle mt10 mb5"> Model Evaluation: Accuracy is NOT Enough </div>
                    <div className="">
                        <div className="flex">
                            <div className="flex6 lh10 mb10 pr10">
                            Data for this problem is likely imbalanced. The number of anomalies we encounter is likely to be much smaller than normal data.
                            Consider we have a bad classifiier that simply flags all our data points as normal, it would still have a high accuracy value. 

                            </div>

                            <div className="border rad4 p10 flex4" style={{ height:"200px"}}>
                                ROC curve and some metrics
                            </div>
                        </div>

                    </div>

                    <div className="sectiontitle mt10 mb10"> Effect of Model Parameters </div>
                    <div className="flex">
                            <div className="flex3 mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                    <div className="pb5 boldtext"> Learning Rate </div>
                                Data for this problem is likely imbalanced. The number of anomalies we encounter is likely to be much smaller than normal data.
                                Consider we have a bad classifiier that simply flags all our data points as normal, it would still have a high accuracy value. 

                                </div>

                                
                            </div>
                            
                            <div className="flex3 mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                <div className="pb5 boldtext"> Regularization </div>
                                Data for this problem is likely imbalanced. The number of anomalies we encounter is likely to be much smaller than normal data.
                                Consider we have a bad classifiier that simply flags all our data points as normal, it would still have a high accuracy value. 

                                </div>

                                
                            </div>
                            
                            <div className="flex4 mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                <div className="pb5 boldtext"> Batch Size </div>
                                Data for this problem is likely imbalanced. The number of anomalies we encounter is likely to be much smaller than normal data.
                                Consider we have a bad classifiier that simply flags all our data points as normal, it would still have a high accuracy value. 

                                </div> 
                            </div> 
                    </div>
                </div>
                }
                                
                                 
                 
                
                
                
                <div>
                    {/* A VAE (an extension of an AE) can allow us generate sampled data without */}
                </div>





                <br />
                <br />
                <br />
                <br/>
            </div>
        )
    }
}

export default Viz