/**
 * @license
 * Copyright 2019 Victor Dibia. https://github.com/victordibia
 * Anomagram - Anomagram: Anomaly Detection with Autoencoders in the Browser.
 * Licensed under the MIT License (the "License"); 
 * =============================================================================
 */


import React, { Component } from 'react'
import { Loading, Button, Slider } from 'carbon-components-react'; 
import {PlayFilledAlt16, PauseFilled16 } from '@carbon/icons-react';
import "./viz.css"
import LineChart from "../linechart/LineChart"
import SmallLineChart from "../linechart/SmallLineChart"
import DrawSignal from "../drawsignal/DrawSignal"
import ComposeModel from "../composemodel/ComposeModel"
import HistogramChart from "../histogram/HistogramChart"
import { registerGAEvent, computeAccuracyGivenThreshold, percentToRGB } from "../helperfunctions/HelperFunctions" 
import * as _ from "lodash"
import * as tf from '@tensorflow/tfjs';
import * as d3 from "d3"

 
class Viz extends Component {
    constructor(props) {
        super(props)

        this.modelChartWidth = Math.min(390, window.innerWidth - 25)
        this.modelChartHeight = 270

        // Allow the draw signal component update current signal with drawn signal
        this.updateCurrentSignal = this.updateCurrentSignal.bind(this)
 

        // Define the composition and amount of test data shown
        let testData = require("../../data/ecg/test.json") 
        let maxTestData = 50
        this.testData = this.subsetTestData(testData, maxTestData)
        
        
        this.zeroArr = new Array(this.testData[0].data.length).fill(0);
        this.trainMse = {"threshold":[0]}

        //set state
        this.state = {
            apptitle: "Anomagram",
            trainData: [],
            selectedIndex: 0,
            selectedData: this.testData[0].data,
            showDrawData: false,
            drawSectionWidth: 350,
            drawSectionHeight: this.modelChartHeight ,
            isLoading: false,
            modelLoaded: false,
            threshold: 0.0075,
            predictedData: this.zeroArr,
            predictedMse: 0,
            selectedLegend: "All",
            showAutoEncoderViz: true,
            showMseViz:true,
            isDataTransormed: false,
            showBeforeTrainingHistogram: false,
            trainVizEpoch: 0,
            bestMetric: { acc: 0, fpr: 0, fnr: 0, tnr: 0, tpr: 0, threshold: 0, precision: 0, recall: 0 },
            minThreshold: 0,
            maxThreshold: 1,
            vizThresold: this.trainMse["threshold"][0],
            histPlaying: false ,
        }

        this.currentEpoch = 0
        // Hashmap storing test data legend metadata
        this.chartColorMap = {
            0: { color: "white", colornorm: "grey", name: "All" },
            1: { color: "#0062ff", colornorm: "#0062ff", name: "Normal" },
            2: { color: "orange", colornorm: "grey", name: "R-on-T Premature Ventricular Contraction" },
            3: { color: "violet", colornorm: "grey", name: "Ectopic Beat" },
            4: { color: "indigo", colornorm: "grey", name: "Premature Ventricular Contraction" },
            // 5: { color: "red", colornorm: "grey", name: "Unclassifiable Beat" },
        }

        this.maxSmallChart = 100
        this.modelDataLastUpdated = true


        this.hiddenDim = [7, 3]
        this.latentDim = [2]

       

        this.mseExplanations = {}
        this.mseExplanations["0"] = "Model is untrained, both normal and abnormal data have similar value range and overlapping distributions."
        this.mseExplanations["2"] = "Model is untrained, both normal and abnormal data have similar value range and overlapping distributions."
        this.mseExplanations["5"] = "Model is getting better at reconstructing normal data resulting in smaller MSE for normal data points."
        this.mseExplanations["25"] = "Both distributions are now separate. We can set a clear threshold that separates normal from abnormal data."
        

        this.smallChartHeight = 30
        this.smallChartWidth = 80

        this.smallChartxScale = d3.scaleLinear()
            .domain([0, this.testData[0].data.length - 1]) // input
            .range([0, this.smallChartWidth]); // output


        this.smallChartyScale = d3.scaleLinear()
            .domain([d3.min(this.testData[0].data), d3.max(this.testData[0].data)]) // input 
            .range([0, this.smallChartHeight]); // output
        
        
    }


    subsetTestData(testData, maxTestData) {
        let maxCategories = { 1: 15, 2: 10, 3: 15, 4: 15, 5:0 }
        let seenCategories = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        let result = []
        for (let i = 0; i < testData.length; i++) {  
            let el = testData[i]
            if (seenCategories[el.target] < maxCategories[el.target]) {
                seenCategories[el.target] += 1
                result.push(el)
            }
            if (result.length >= maxTestData) {
                break;
            }
        };
        return result
    }

    componentDidUpdate(prevProps, prevState) {


    }


    componentDidMount() { 

        this.setState({ drawSectionWidth: this.refs["datasection"].offsetWidth - 5 })
        this.drawSectionWidth = this.refs["datasection"].offsetWidth -5 

        // Load minmax data transformation parameters
        this.xMinArray = require("../../data/ecg/transform/xmin.json")
        this.xMaxArray = require("../../data/ecg/transform/xmax.json")
        this.featureRange = require("../../data/ecg/transform/range.json")
        
        this.sampleTestData = this.myStringify(this.applyTransform(this.testData[0].data.slice(0,50)))
        this.sampleTransformedTestData = this.myStringify(this.testData[0].data.slice(0, 50)) 
        
        
        this.trainMse = require("../../data/viz/mse.json")
        this.setState({vizThresold:this.trainMse["threshold"][0]})
        this.computeAccuracyMetrics(this.trainMse["mse"][49]) 
         
        this.componentLoadedTime = (new Date()).getTime()

        this.replayHistInterval = 200
    }

    myStringify(data) {
        let result = ""
        data.forEach(el => {
            result += " " + el.toFixed(2) + ",  "; 
        });
        return result
    }

    componentWillUnmount() {
        // window.removeEventListener("resize", this.onWindowResize)
        if (this.loadedModel) {
            this.loadedModel.dispose()
        }
    }

    applyTransform(data) {
        let holder = []
        for (let i = 0; i < data.length; i++) {
            holder[i] = ((data[i] - this.xMinArray[i]) / (this.xMaxArray[i] - this.xMinArray[i])) * (this.featureRange["max"] - this.featureRange["min"]) + this.featureRange["min"]
        }
        return holder
    }

    applyReverseTransform(data) {
        let holder = []
        for (let i = 0; i < data.length; i++) {
            holder[i] = ((data[i] - this.featureRange["min"]) / (this.featureRange["max"] - this.featureRange["min"])) * (this.xMaxArray[i] - this.xMinArray[i]) + this.xMinArray[i]
        }
        return holder
    }




    loadModel() {
        this.setState({ isLoading: true }) 
        setTimeout(() => {
            let modelPath = process.env.PUBLIC_URL + "/webmodel/ecg/model.json"
            tf.loadLayersModel(modelPath).then((model) => {
                this.loadedModel = model
                this.setState({ modelLoaded: true, isLoading: false })
                this.getPrediction(this.state.selectedData)
            });
        }, 700);
    }


    // Get predictions for a selected data point
    getPrediction(data) {

        if (!this.state.modelLoaded) {
            this.setState({ selectedData: data })
            this.loadModel()
        } else {
            this.setState({ isLoading: true })

            let transformedData = this.applyTransform(data) 

            // Get predictions  
            const [mse, preds] = tf.tidy(() => {
                let dataTensor = tf.tensor2d(transformedData, [1, 140])
                let preds = this.loadedModel.predict(dataTensor, { batchSize: 8 })
                return [tf.sub(preds, dataTensor).square().mean(1), preds]
            })

            mse.array().then(array => { 
                this.setState({ isLoading: false, predictedMse: array[0] })
            });

            preds.array().then(array => {
                this.modelDataLastUpdated = !this.modelDataLastUpdated
                this.setState({ selectedData: data, predictedData: this.applyReverseTransform(array[0]) }, () => {

                })
            });

            mse.dispose()
            preds.dispose()
        }



    }

    computeAccuracyMetrics(data) { 
        let uniqueMse = _.uniq(_.map(data, 'mse'))   

        let rocMetricHolder = [] 

        uniqueMse.forEach((each, i) => {
            let metric = computeAccuracyGivenThreshold(data, each) 
            rocMetricHolder.push(metric)  
        }); 
 

        let bestMetric = _.maxBy(rocMetricHolder, "acc")  
        this.setState({ bestMetric: bestMetric })
        this.setState({ minThreshold: _.min(uniqueMse) })
        this.setState({ maxThreshold: _.max(uniqueMse) }) 
        
    }

    updateThreshold(e) { 
            let threshVal = this.state.minThreshold + (e.value / 100) * (this.state.maxThreshold - this.state.minThreshold)
            let bestMetric = computeAccuracyGivenThreshold(this.trainMse["mse"][49] , threshVal)
             
        this.setState({ bestMetric: bestMetric }) 
        this.setState({ vizThresold: threshVal })
        
        if (this.state.trainVizEpoch !== 49) {

            this.setState({ trainVizEpoch: 49 , histPlaying:false})
            
        }

    }



    updateCurrentSignal(data) {
        this.getPrediction(data)
    }


    clickDataPoint(e) {

        registerGAEvent("introduction", "ecgdatapointclick",  e.target.getAttribute("indexvalue"), this.componentLoadedTime)
        
        this.lastclicked = "model"
        let selectedData = this.testData[e.target.getAttribute("indexvalue")].data
        // set data and get predictions on click 
        this.setSelectedData(e.target.getAttribute("indexvalue"), selectedData)

    }

    setSelectedData(index, data) {

        this.setState({ selectedIndex: index }, () => {
            this.getPrediction(data)
        })
    }

      
    setDatasetDraw(e) {
        this.setState({ showDrawData: true })
        this.setState({ drawSectionWidth: Math.max(this.refs["datasetexamplebox"].offsetWidth -5 , 350)})
        // console.log(this.refs["datasetexamplebox"].offsetWidth); 
        registerGAEvent("introduction", "showdraw",  "showdraw", this.componentLoadedTime)
        
    }
    setDatasetECG(e) {
        this.setState({ showDrawData: false })
        registerGAEvent("introduction", "showdataset",  "showdataset", this.componentLoadedTime)
        // this.setSelectedData(0, this.testData[0].data) 
    }

    clickLegend(e) { 
        this.setState({ selectedLegend: e.target.getAttribute("action") })
    }

    toggelTransform(e) {
        this.setState({ isDataTransormed: !this.state.isDataTransormed })
        registerGAEvent("introduction", "transformdata",  !this.state.isDataTransormed.toString(), this.componentLoadedTime)
    }
 

    updateTrainVizEpoch(e) {
        this.setState({ trainVizEpoch: e.value, vizThresold: this.trainMse["threshold"][e.value] })
    }

    replayUpdater() {
        setTimeout(() => {
            // this.currentEpoch  =  (this.currentEpoch + 1) % 49
            // console.log(this.state.trainVizEpoch);
            
            if (this.state.histPlaying && this.state.trainVizEpoch < 49) {
                this.setState({ trainVizEpoch: this.state.trainVizEpoch +1 , vizThresold: this.trainMse["threshold"][this.state.trainVizEpoch +1]   })
                this.replayUpdater()
            } else {
                this.setState({ histPlaying:false  })
            }
        }, this.replayHistInterval);
    }

    toggleVizHistPlaying(e) {
        if (!this.state.histPlaying) {
            this.setState({trainVizEpoch:0}, () =>{
                this.replayUpdater()
            })
           
        }
        this.setState({histPlaying: !this.state.histPlaying})
    }

    render() {


        let dataLegend = Object.entries(this.chartColorMap).map((data, index) => {
            let color = data[1].color
            let name = data[1].name
            // console.log(name); 
            return (
                <div action={name} onClick={this.clickLegend.bind(this)} className={"iblock mr5 mb5 unselectable legendrow clickable" + (this.state.selectedLegend === name ? " active" : " ")} key={"legendrow" + index}>
                    <div style={{ background: color }} className="unclickable indicatorcircle iblock mr5"></div>
                    <div className="iblock unclickable legendtext pl4 mediumdesc"> {name}</div> 
                </div>
            )
        });

        let dataLegendSmall = Object.entries(this.chartColorMap).map((data, index) => {
            let color = data[1].color
            let name =  data[1].name
            // console.log(name); 
            return (
                <div action={name}  className={"iblock mr5  unselectable " + (data[1].name === "All" || data[1].name === "Normal"  ? " displaynone" : "") } key={"legendsmallrow" + index}>
                    <div style={{ background: color }} className="unclickable indicatorcircle iblock mr5"></div>
                    <div className="iblock unclickable legendtext mediumdesc"> {name}</div> 
                </div>
            )
        });

        let dataPoints = this.testData.slice(0, this.maxSmallChart)
            .map((data, index) => {  
                let isVisible = (this.state.selectedLegend === this.chartColorMap[this.testData[index].target].name) || this.state.selectedLegend === "All"
                return (
                    <div  indexvalue={index} onClick={this.clickDataPoint.bind(this)} key={"testrow" + index} className={"mb5 p5 clickable  ecgdatapoint rad3 iblock mr5" + (isVisible ? " " : " displaynone ") + (this.state.selectedIndex + "" === index + "" ? " active " : "")}  targetval={data.target} >
                        {/* <div  className="boldtext  unclickable iblock "> */}
                            <div  indexvalue={index}  className="unclickable positionrelative">
                                <div className="p3 indicatoroutrcircle  positionabsolute bottomright">
                                    <div style={{ background: this.chartColorMap[this.testData[index].target].color }} className="indicatorcircle "></div>
                                </div>
                                <SmallLineChart
                                    data={{
                                        data: this.testData[index],
                                        index: index,
                                        color: this.chartColorMap[this.testData[index].target].colornorm,
                                        chartWidth: this.smallChartWidth,
                                        chartHeight: this.smallChartHeight,
                                        xScale: this.smallChartxScale,
                                        yScale: this.smallChartyScale
                                    }}
                                > </SmallLineChart>
                            </div> 
                        {/* </div>  */}
                    </div>
                ) 
        });

        let datasetExamples = (
            <div className="flex">
                <div className="flex20 mr10">
                    <div className="mb5">
                        {dataLegend}
                    </div>
                    <div className="ecgdatabox scrollwindow">
                        {dataPoints}
                    </div>
                </div>
                <div className="p10 greyhighlight displaynone">
                    Threshold ring implementation
                </div>
            </div>
        )

        let dataSketchPad = (
            <div >
                <DrawSignal
                    width={this.state.drawSectionWidth}
                    height={this.state.drawSectionHeight}
                    updateCurrentSignal={this.updateCurrentSignal}
                ></DrawSignal>
            </div>
        )
        let barColor = this.state.predictedMse ? this.state.predictedMse > this.state.threshold ? "#ff0000" : "#008000" : "#808080"
        let modelOutput = (
            <div className="  modeloutputbox rad5 ">
                {/* <div className="mb10 boldtext"> Model Prediction</div> */}
                <div className="flex  ">
                    <div className="iblock ">
                        <div ref="" className="resetbox vizloadingbox" style={{ opacity: (this.state.isLoading) ? 1 : 0, width: (this.state.isLoading) ? "34px" : "0px" }} >
                            <Loading
                                className=" mr10"
                                active={true}
                                small={true}
                                withOverlay={false}
                            > </Loading>
                        </div>
                    </div>
                    <div className="iblock thresholdbox flex flexjustifycenter mr5 pl10 pr10 pt5 pb5">
                        <div>
                        <div style={{fontSize:"18px"}} className="mediumdesc textaligncenter boldtext thresholdtext">{this.state.predictedMse.toFixed(3) }</div>
                        <div className="smalldesc textaligncenter mt5">mse</div>
                        </div>
                    </div>
                    <div className="flexfull  ">
                        {this.testData.length > 0 &&
                            <div className="mt5 mediumdesc ">
                                {this.state.predictedMse !== 0 &&
                                    <div className="mr10  ">
                                        <div className="mr10 boldtext ">
                                        MODEL PREDICTION :
                                        
                                        &nbsp;
                                        {this.state.predictedMse > this.state.threshold ? "ABNORMAL" : "NORMAL"}
                                            </div>

                                        <div className="pt5 mediumdesc">  Explanation:   [mse = {this.state.predictedMse.toFixed(3)}]  is 
                                        <strong>{this.state.predictedMse > this.state.threshold ? " above " : " below"}</strong> the <strong> {this.state.threshold.toFixed(3)}</strong> threshold 
                                    </div>
                                    </div>
                                }
                                {this.state.predictedMse === 0 &&
                                <div className="mr10  ">
                                        <div className=" boldtext ">
                                        MODEL PREDICTION 
                                        </div> 
                                        <div className="pt5 mediumdesc">
                                        Select a signal or draw one!
                                        </div>
                                    </div>
                            }
                                <div style={{ backgroundColor: barColor }} ref="predictioncolordiv" className="mt5  colorbox redbox"></div>
                            

                            </div>
                        }
                    </div>
                </div>
                <div className="iblock ">
                    <LineChart
                        data={this.state.selectedData}
                        predictedData={this.state.predictedData}
                        predictedColor={barColor}
                        index={this.state.selectedIndex}
                        lastUpdated={this.modelDataLastUpdated}
                        color={this.chartColorMap[this.testData[this.state.selectedIndex].target].colornorm}
                        width={this.modelChartWidth}
                        height={this.modelChartHeight}
                    > </LineChart>
                </div>
            </div>
        )

        // if (this.refs["datasetexamplebox"]) {
        //     console.log(this.refs["datasetexamplebox"].offsetWidth);
        // } 
        
        

        return (
            <div>  
                <div className="mynotif mt10 h100 lh10  lightbluehightlight maxh16  mb10">
                    <div className="boldtext mb5">  A Gentle Introduction to Anomaly Detection with Autoencoders</div>
                    {this.state.apptitle} is an interactive visualization tool for exploring
                    how a deep learning model can be applied to the task of anomaly detection (on stationary data).
                    Given an ECG signal sample, an autoencoder model (running live in your browser) can predict if it is
                     normal or abnormal. To try it out, <strong>click</strong> any of the test ECG signals from the ECG5000 dataset below,
                    or better still, draw a signal to see the model's prediction!
                    <div className=" mediumdesc boldtext">
                        <span className=""> Disclaimer: </span> This prototype is built for demonstration purposes only 
                        and is not intended for use in any medical setting.
                    </div>
                </div>


                {!this.state.showDrawData && < div className="mediumdesc pb10 "> <strong>Click</strong> on a data sample below to see the prediction of a trained autoencoder. </div>}
                {this.state.showDrawData &&  <div className="mediumdesc pb10 "> <strong>Draw</strong> a signal and view the autoencoders prediction. What types of signal shapes is it sensitive to? </div>}

                <div className="mb10 lowerbar">
                    <div onClick={this.setDatasetECG.bind(this)} className={"datasettab clickable iblock mr5 " + (this.state.showDrawData ? "" : " active")}> ECG5000 Dataset</div>
                    <div onClick={this.setDatasetDraw.bind(this)} className={"datasettab clickable iblock mr10 " + (this.state.showDrawData ? " active" : " ")}> Draw your ECG data</div>
 
                </div>

                <div className="flex flexwrap ">

                    <div ref="datasection" className=" flexwrapitem  flex40 mr10 " >
                        {<div ref="datasetexamplebox" className={" " + (this.state.showDrawData ? " displaynone" : " ")}>
                            {datasetExamples}
                        </div>}
                        {<div className={" " + (!this.state.showDrawData ? " displaynone" : " ")}>
                            {dataSketchPad}
                        </div>}
                    </div>
 
                    <div className="flexwrapitem flex20 flex  ">
                       <div > {modelOutput}</div>
                        <div className="flex20 flexpushout "></div>
                    </div>
                </div>

                <div className="lh10 lightgreyback mt5 p10 ">
                     
                   The autoencoder is trained using normal ECG data samples. It has never seen any of the test signals above, 
                    but correcly predicts (most of the time) if a given signal is normal or abnormal. So, how does the autoencoder 
                    identify anomalies? Why is  <span className="italics">mean squared error</span> a useful metric?
                    What is the <span className="italics">threshold</span>   and how is it set? Read on to learn more!
                       
                </div>



                {
                    <div className=" ">

                        <div className="">
                            <div className="flex">
                                <div className="flex20  lh10 mb10 ">
                                    <div className="sectiontitle mt10 mb5"> How does the Autoencoder work? </div>
                                    
                                    {this.state.showAutoEncoderViz &&
                                        
                                        <div className=" pl10 floatright autoencodervizbox  "  >
                                        
                                        <div className="vizcaption w380 mediumdesc lhmedium pb5">
                                        Example below shows the architecture of a two layer autoencoder with 7 and 3 units respectively.
                                        Click the <span className="italics">train a model</span> tab to build and train one from scratch.
                                        </div>

                                        <ComposeModel
                                            hiddenDims={this.hiddenDim}
                                            latentDim={[this.latentDim]}
                                            isTraining={false}
                                            isUpdatable={false}
                                            updateModelDims={null}
                                            adv={"track" + this.state.showDrawData}
                                        />

                                       
                                    </div>}


                                   

                                    An <a href="https://en.wikipedia.org/wiki/Autoencoder" target="_blank" rel="noopener noreferrer">Autoencoder</a> [1] is a type of
                                    artificial neural network used to learn efficient (low dimensional) data representations in an unsupervised manner.
                                    It is typically comprised of two components
                                    - an <strong>encoder</strong> that learns to map input data to a low dimension representation ( <strong>also called a bottleneck, denoted by z</strong> )
                                    and a <strong>decoder</strong> that learns to reconstruct the original signal from the
                                    low dimension representation.
                                    The training objective for the autoencoder model is to minimize the reconstruction
                                    error - the difference between the input data and the reconstructed output.
                                    
                                    <div className="boldtext  pt5"> Applying Autoencoders for Anomaly Detection</div>
                                    
                                    <div className="lh10  p10 "> 
                                        An anomaly (outlier, abnormality) is defined as “an observation which deviates so much from 
                                        other observations as to arouse suspicions that it was generated by a different mechanism” - Hawkins 1980.
                                    </div>
                                    
                                    While autoencoder models have been widely applied for dimensionality reduction (similar to techniques such as PCA), 
                                    they can also be used for anomaly detection.
                                    If we train the model on normal data (or data with very few abnormal samples), it learns a reconstruction function that works 
                                    well for <span className="italics"> normal looking data  </span>(low reconstruction error)
                                    and works poorly for abnormal data (high reconstruction error).
                                    We can then use reconstruction error as a signal for anomaly detection.
                                    <br />
                                    In particular, if we visualize a histrogram of reconstruction errors generated by a trained autoencoder, we hopefully
                                    will observe that the distribution of errors for normal samples is overall smaller and
                                    markedly separate from the distribution of errors for abnormal data.
                                    
                                    <br />
                                    <strong className="greycolor"> Note</strong>: We may not always have labelled data, but we can can assume (given the rare nature of anomalies) that the majority of data points for most
                                    anomaly detection use cases are normal. See the section below that discusses the impact of data composition (% of abnormal data) on model performance.

                              
                                    Click the <a className="italics" href="#train" rel="noopener noreferrer">train a model</a> tab to
                                    interactively build and train an autoencoder,  evaluate its performance and visualize the histogram of errors for normal and abnormal test data.

                                </div>


                            </div>

                        </div>


                        <div className="sectiontitle mt10 mb5"> The Dataset  </div>
                        <div className="mb10 lh10">
                            This prototype uses the   <a href="http://www.timeseriesclassification.com/description.php?Dataset=ECG5000" target="_blank" rel="noopener noreferrer"> ECG5000 dataset</a> which
                            contains 5000 examples of ECG signals from a patient. Each data sample (corresponds to an extracted heartbeat containing 140 points) has been labelled as normal 
                            or being indicative of heart conditions related to congestive heart failure - {dataLegendSmall}.

                        </div>
                        <div className="">
                            <div className="flex lh10 flexwrap">
                                <div className="flex40 flexwrapitem  mb10 pr10">
                                    <div className="pb5 boldtext"> Data Transformation  </div>
                                    Prior to training the autoencoder, we first apply a minmax scaling transform to the input data 
                                    which converts it from its original range (-5 to 2) to a range of  (0 to 1)  
                                    This is done for two main reasons. First, <a href="https://www.jeremyjordan.me/batch-normalization/" target="_blank" rel="noopener noreferrer">existing   research</a>  suggests that neural networks in general train better when input values  
                                     lie between 0 and 1 (or have zero mean and unit variance).  Secondly, scaling the data supports the learning objective 
                                    for the autoencoder (minimizing reconstruction error) and makes the results more interpretable. 
                                    In general, the range of output values from the autoencoder is dependent on the type of activation function used in the output layer.
                                    For example, the tanh activation function outputs values in the range of -1 and 1, sigmoid outputs values in the range of 0 - 1 
                                    In the example above, we use the sigmoid activation function in the output layer of 
                                    the autoencoder, allowing us directly compare the transformed input signal to the output data when computing the means square error metric during training.
                                    In addition, having both input and output in the same range allows us to visualize the differences that contribute to the anomaly classification.
                                    
                                    <br />
                                    <strong className="greycolor"> Note:</strong> 
                                    The parameters of the scaling transform should be <a href=" https://sebastianraschka.com/faq/docs/scale-training-test.html" target="_blank" rel="noopener noreferrer"> computed only on train data</a> and 
                                     then <span className="italics"> applied </span> to test data. 
                                    

                            </div>
                                <div className=" flex20 flexwrapitem ">
                                   <div className="vizcaption lhmedium pt10  mediumdesc pb10">
                                            Example below shows sample ECG data <span className="italics">{this.state.isDataTransormed ? "after " : "before"}</span> minmax (0,1) scaling transformation.
                                        </div>
                                    <div className="flexfull  lh10 p10 overflowhidden  greyborder">
                                     
                                        
                                    {this.state.isDataTransormed ?  this.sampleTestData + " ...": this.sampleTransformedTestData + " ..." }
                                
                                        <div className = "mt5 mr10">
                                            <Button
                                                className="bwidthtransform"
                                            size={"small"}
                                            renderIcon={null}
                                            onClick={this.toggelTransform.bind(this)}
                                        > {this.state.isDataTransormed ?  "Inverse Transform": "Transform"} </Button>

                                        </div>
                                    
                                    </div> 
                                </div>


                                <div className="border displaynone rad4 p10 " style={{ width: "300px", height: "300px" }}>
                                    Interactive replay of training run visualization
                            </div>
                            </div>
                             

                        </div>

                        <div className="sectiontitle mt10 mb5"> Model Implementation and Training </div>
                        <div className="">
                            <div className="flex flexwrap8">
                                <div className="flex40 flexwrapitem8 lh10 mb10 ">
                                  The autoencoder in this prototype (visualized above) has two layers in its encoder and decoder respectively.
                                  It is implemented using the <a href="https://www.tensorflow.org/js/guide/layers_for_keras_users" target="_blank" rel="noopener noreferrer">Tensorflow.js layers api </a> (similar to the keras api). The encoder/decoder are specified 
                                    using dense layers, relu activation function, and the Adam optimizer (lr = 0.01) is used for training.  
                                      
                                  <div className=" mt10 mb10 lh10  lightbluehightlight maxh16  mb10">
                                    Tensorflow.js code for <a href="https://github.com/victordibia/anomagram/blob/master/app/src/components/train/models/ae.jsx" target="_blank" rel="noopener noreferrer">specifying the autoencoder</a> can be found in the project repository on <a href="https://github.com/victordibia/anomagram/" target="_blank" rel="noopener noreferrer">Github</a>. 
                                  </div>
                                      As training progresses, the model's weights are updated to minimize the difference between the encoder input 
                                      and decoder output for the training data (normal samples).  
                                    <br/>
                                    To illustrate the relevance of the training process to the anomaly detection task, we can visualize the 
                                    the histogram of reconstruction error generated by the model (see figure to the right). At initialization (epoch 0), the untrained autoencoder 
                                    has not learned to reconstruct normal data and hence makes fairly random guesses in its attempt
                                    to reconstruct any input data - thus we see a similar distribution of errors for both normal and abnormal data.
                                    As training progresses, the model gets better at reconstructing normal data, and its reconstruction error markedly 
                                    becomes smaller for normal samples leading to a distinct distribution for normal compared to abnormal data.

                                    As both distributions <span className="italics">diverge</span>, we can set a threshold or cutoff point; any data point 
                                    with error above this threshold is termed an anomaly and any point below this is termed normal. 
                                    Using labelled test data (and some domain expertise), we can automatically determine this threshold as the point that yields the best 
                                    anomaly classification accuracy. 
                                    {/* For example, in the visualization on the right, the threshold is automatically set as the point */}
                                    But is accuracy enough?
                                  
                              
                            </div>

                                {this.state.showMseViz &&
                                    <div className="  pl10 flexwrapitem8  floatright">

                                    <div className="flex ">  
                                        <div className="flexfull"> 
                                            <div className="flex mb10">
                                                <div className=" mr5"> 
                                                    <div className="epochvalue textaligncenter">
                                                     {this.state.trainVizEpoch}
                                                    </div>
                                                    <div className="textaligncenter smalldesc">
                                                        Epoch
                                                    </div>

                                                </div>
                                                <div className="flexfull ">
                                                    <div className="mediumdesc w350   lhmedium" > 
                                                            <span> Example below shows the histogram of errors during training epochs. At</span>
                                                            <span className="boldtext"> Epoch {this.state.trainVizEpoch}</span>, 
                                                            <span className="italics" ref="mseexplanation"> {this.mseExplanations[this.state.trainVizEpoch + ""] ? this.mseExplanations[this.state.trainVizEpoch + ""] : this.refs["mseexplanation"].textContent}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            
                                            <div className="greyhighlight pl10 mb10 pt10 flex pb5"> 
                                                
                                                <div className=" iblock ">
                                                    <div
                                                        onClick={this.toggleVizHistPlaying.bind(this)}
                                                        className={("iblock circlemedium circlebutton ml10 mr5 flexcolumn flex flexjustifycenter clickable ") }>
                                                        {!this.state.histPlaying && <PlayFilledAlt16 style={{ fill: "white" }} className="unselectable unclickable" />}
                                                        {this.state.histPlaying && <PauseFilled16 style={{ fill: "white" }} className="unselectable unclickable" />}
                                                    </div>
                                                    <div className="smalldesc textaligncenter pt10 pb5 replaylabelbox">  {this.state.histPlaying ? "Pause Replay" : "Replay Training"} </div>
                                                </div>
                                                    
                                                    <Slider
                                                    className="flexfull touchnoscroll border"
                                                    min={0} //{(this.state.minThreshold.toFixed(4) * 1)}
                                                    max={49}//{(this.state.maxThreshold.toFixed(4) * 1)}
                                                    step={1}
                                                    minLabel={""}
                                                    maxLabel={""}
                                                    value={this.state.trainVizEpoch}
                                                    stepMuliplier={10}
                                                    // disabled={this.state.isTraining ? true : false}
                                                    labelText={"Move slider to view mse histogram at each epoch. "}
                                                    hideTextInput={true}
                                                    onChange={this.updateTrainVizEpoch.bind(this)}
                                                    />
                                                
                                            </div>
                                           
                                             
                                        </div>

                                    </div>
                                    
                                    
                                    
                                    {this.trainMse["mse"] && <HistogramChart
                                        data={{
                                            data: this.trainMse["mse"][this.state.trainVizEpoch],
                                            chartWidth: 380,
                                            chartHeight: 240,
                                            epoch: 2 + this.state.trainVizEpoch,
                                            threshold: this.state.vizThresold
                                        }}
                                    ></HistogramChart>}
                                     
                            </div>}
                            </div>

                        </div>


                        <div className="sectiontitle mt10 mb5"> Model Evaluation: Accuracy is NOT Enough </div>
                        <div className="">
                            <div className="flex flexwrap">
                                <div className="flex40  flexwrapitem lh10 mb10 pr10">
                                    For most anomaly detection problems, data is usually imbalanced - the number of labelled normal samples vastly out number
                                    abnormal samples. For example, for every 100 patients who take an
                                    ECG test, <a target="_blank" rel="noopener noreferrer" href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3319226/">less than 23 are likely</a> to have 
                                    some type of abnormal reading. This sort of data imbalance introduces issues that make accuracy 
                                    an inssufficient metric. Consider a naive model (actually a really bad model) 
                                    that simply flags every sample as normal. Given our ECG scenario above, it would have an accuracy of <strong> > 77%</strong> despite being a really unskilled model. 
                                    Clearly, accuracy alone does not 
                                    tell the complete story i.e. how often does the model flag an ECG as abnormal when it is indeed
                                     abnormal (<strong>true positive</strong>), abnormal when it is normal (<strong>false positive</strong>)
                                    normal when it is abnormal (<strong>false negative</strong>) and normal when it is indeed normal (<strong>true negative</strong>). 
                                     
                                    Two important metrics can be applied to address these issues - precision aand recall. <strong>Precision</strong> expresses 
                                    the percentage of positive predictions that are correct
                                    and is calculated as   (true positive / true positive + false positive ). <strong>Recall</strong> expresses the 
                                    proportion of actual positives that were corrected predicted (true positive / true positive + false negative).
                                
                                    <br/>
                                    
                                    Depending on the use case, it may be desirable to optimize a model's performance for high precision or high recall. 
                                    This tradeoff between precision and recall can be 
                                    adjusted by the selection of a threshold (e.g. a low enough threshold will yield excellent recall but reduced precision). 
                                    In addition, the Receiver Operating Characteristics (ROC) curve provides a visual assessment of a model's skill (area under the curve - AUC)
                                    and is achieved by plotting the true positive rate against the false positive rate at various values of the threshold.
                                     

                            </div>

                                <div className=" p10 flex20 flexwrapitem" >
                                    

                                    

                                <div className={"iblock perfmetrics w100 " + (this.state.isTraining ? " disabled " : " ")}>
                            
                                        <div className="mediumdesc lhmedium pb10">
                                            Example below the performance of a trained autoencoder model. 
                                            Move the slider to see how threshold choices impact precision recall metrics. 
                                            
                                        </div>
                                        

                                        

                            <div className="mb5 greyhighlight p10 touchnoscroll">
                                <Slider
                                    className="w100 border"
                                    min={0} //{(this.state.minThreshold.toFixed(4) * 1)}
                                    max={100}//{(this.state.maxThreshold.toFixed(4) * 1)}
                                    step={2}
                                    minLabel={"%"}
                                    maxLabel={"%"}
                                    value={((this.state.bestMetric.threshold - this.state.minThreshold) / (this.state.maxThreshold - this.state.minThreshold)) * 100}
                                    stepMuliplier={10}
                                    disabled={this.state.isTraining ? true : false}
                                    labelText={"Threshold " + (this.state.bestMetric.threshold).toFixed(4) + " [ " + (((this.state.bestMetric.threshold - this.state.minThreshold) / (this.state.maxThreshold - this.state.minThreshold)) * 100).toFixed(0) + " % ] "}
                                    hideTextInput={true}
                                    onChange={this.updateThreshold.bind(this)}
                                />
                            </div>
                            <div className="flex">
                                <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.acc * 100)) }} className="metricguage mb5  greyhighlight accuracybox  textaligncenter mr5 flex5" >
                                    <div className="metricvalue textaligncenter  rad4"> {(this.state.bestMetric.acc * 100).toFixed(2)}  %</div>
                                    <div className="metricdesc mediumdesc p5"> Accuracy </div>
                                </div>
                                 

                                <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.precision * 100)) }} className="metricguage mb5 greyhighlight  textaligncenter flex5" >
                                    <div className="metricvalue textaligncenter  rad4"> {(this.state.bestMetric.precision ).toFixed(2)} </div>
                                    <div className="metricdesc mediumdesc p5"> Precision </div>
                        </div>
                        
                        <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.recall * 100)) }} className="metricguage mb5 greyhighlight  textaligncenter flex5" >
                                    <div className="metricvalue textaligncenter  rad4"> {(this.state.bestMetric.recall).toFixed(2)} </div>
                                    <div className="metricdesc mediumdesc p5"> Recall </div>
                                </div>

                            </div>
                            <div className="mb5 flex">

                                <div style={{ borderLeftColor: percentToRGB(100 - (this.state.bestMetric.fpr * 100)) }} className="metricguage flex5 mr5  greyhighlight  textaligncenter">
                                    <div className="metricvalue textaligncenter"> {(this.state.bestMetric.fpr * 100).toFixed(2)}  % </div>
                                    <div className="metricdesc mediumdesc p5"> False Positive Rate </div>
                                </div>
                                <div style={{ borderLeftColor: percentToRGB(100 - (this.state.bestMetric.fnr * 100)) }} className="metricguage flex5   greyhighlight  textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.fnr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc displayblock mediumdesc p5"> False Negative Rate </div>
                                </div>

                            </div>
                            <div className="flex">
                                <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.tpr * 100)) }} className="metricguage flex5  mr5 greyhighlight  textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.tpr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc mr10 mediumdesc p5"> True Positive Rate </div>
                                </div>
                                <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.tnr * 100)) }} className="metricguage flex5  greyhighlight  textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.tnr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc mediumdesc p5"> True Negative Rate </div>
                                </div>
                            </div>

                        </div>
                            </div>
                            </div>

                        </div>

                        <div className="sectiontitle mt10 mb10"> Some Insights on the Effect of Model/Training Parameters </div>
                        <div className="mb10 lh10">
                        Some interesting insights that can be observed while modifying the training parameters for the model 
                        are highlighted below. You can explore them via the <span className="italics"> train a model</span> interactive tab.
                        </div>
                        <div className="flex flexwrap">
 

                            <div className="flex20 flexwrapitem  mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                    <div className="pb5 boldtext"> Regularization, Optimizer, Batch Size </div>
                                    Neural networks can approximate complex functions. They are also likely overfit, given limited data.
                                    In this prototype, we have relatively few samples (2500 normal samples), and we can observe 
                                    signs of overfitting (train loss is less than validation loss). 
                                    Regularization (l1 and l2) can be an effective way to address this.
                                    In addition, the choice of learning rate and optimizer can affect the speed and effectiveness 
                                    (time to peak performance) of training. For example using Adam reaches peak accuracy within fewer epochs compared to optimizers like rmsprop and good old sgd.
                                    In the <span className="italics"> train a model</span> interactive section, you can apply activation regularization - l1, l2 and l1l2 (regularization rate is set to learning rate) and observe its impact!
                                    You can also try out 6 different optimizers (Adam, Adamax, Adadelta, Rmsprop,Momentum, Sgd), with various learning rates.
                                </div>


                            </div>

                           

                            <div className="flex20 flexwrapitem  mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                    <div className="pb5 boldtext"> Abnormal Percentage </div>
                                    We may not always have labelled normal data to train a model.
                                    However, given the rarity of anomalies (and domain expertise), we can assume that unlabelled data is mostly  
                                    comprised of normal samples. Does model performance degrade with an changes in the percentage of abnormal samples in the dataset? 
                                    

                                    The <span className="italics"> train a model</span>  section, you can specify the percentage of abnormal samples  to include when 
                                    training the autoencoder model. We see that with <strong>0%</strong> abnormal data, the model AUC is <strong>~96%</strong>.
                                   At <strong>30%</strong> abnormal sample composition, AUC drops to <strong>~93%</strong>. 
                                    At 50% abnormal datapoints, there is just not enough information in the data 
                                    that allows the model learn a pattern of normal behaviour. It essentially learns to reconstruct normal and abnormal data well and mse is no longer a good measure of anomaly.
                                    At this point, model performance is only slightly above random chance (AUC of 56%).
 
                                </div>
                            </div>
                        </div>


                        <div className="sectiontitle mt10 mb5"> Closing Notes </div>
                        <div className="">
                            <div className="flex">
                                <div className="flexfull lh10 mb10 pr10">
                                    In this prototype, we have considered the task of detecting anomalies in ECG data.
                                    We used an autoencoder and demonstrate some fairly good results with minimal tuning. 
                                    We have also explored how and why it works. This and other 
                                    neural approaches (Sequence to Sequence Models, Variational Autoencoders, BiGANs etc) can be particularly 
                                    effective for anomaly detection with multivariate or high dimensional datasets 
                                    such as images (think convolutional layers instead of dense layers).
                                    <br />
                                    <strong className="greycolor"> Note</strong>: A deep learning model
                                    is not always the best tool for the job. Particularly, for univariate data (and low dimension data ) , autoregressive linear models 
                                    (linear regression, ARIMA family of models for time series), Clustering (PCA etc, KMeans), Nearest Neighbour (KNNs) can be very effective. 
                                    It is also important to note that the data used here is stationary (mean and variance do not change with time), and has been 
                                    discretized (a typical ECG time series chunked into <span className="italics">slices</span> of 140 readings, where each slice constitutes
                                    a sample in the dataset).
                                    To apply an autoencoder (and other deep learning models) for anomaly detection it is often
                                     necessary  to first handle stationarity (if it exists) and construct an appropriate dataset based on domain knowledge (chunk/discretize your data).
                                    Interested in learning more about other deep learning approaches to anomaly detection? My colleagues and I cover additional details on this
                                    topic in the upcoming <a href="http://experiments.fastforwardlabs.com/" target="_blank" rel="noopener noreferrer">Fast Forward Labs</a>  2020 report
                                     on <a href="https://www.cloudera.com/products/fast-forward-labs-research.html" target="_blank" rel="noopener noreferrer"> Deep Learning for Anomaly Detection.</a>  
                                    
                            </div> 
                            </div>

                        </div>

                        <div className="sectiontitle mt10 mb5"> Further Reading </div>
                        <div className="flex">
                                <div className=" lh10 mb10 pr10">
                                 [1] Goodfellow, Ian, Yoshua Bengio, and Aaron Courville. MIT Press 2016 <a href="http://www.deeplearningbook.org/contents/autoencoders.html" target="_blank" rel="noopener noreferrer">Deep learning. Chapter 14, Autoencoders</a>  
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
                <br />
            </div>
        )
    }
}

export default Viz