import React, { Component } from "react";
import { Loading, Dropdown, Slider } from "carbon-components-react"
import "./train.css"
import * as tf from '@tensorflow/tfjs';
import { computeAccuracyGivenThreshold } from "../helperfunctions/HelperFunctions"
import ROCChart from "../rocchart/ROCChart"
// custom charts 
import HistogramChart from "../histogram/HistogramChart"
import ScatterPlot from "../scatterplot/ScatterPlot"
import LossChart from "../losschart/LossChart"
import ComposeModel from "../composemodel/ComposeModel"

import { Reset16, PlayFilledAlt16, PauseFilled16 } from '@carbon/icons-react';
import { buildModel } from "./models/ae"
import * as _ from "lodash"

// const _ = require('lodash');
class Train extends Component {

    constructor(props) {
        super(props)

        // Load sameple data
        this.testData = require("../../data/ecg/test.json")
        this.trainData = require("../../data/ecg/train.json")

        // Model update method passed to model composer component
        this.updateModelDims = this.updateModelDims.bind(this)

        this.stepOptions = [{ id: "opt1", text: "50", value: 50, type: "steps" }, { id: "opt2", text: "100", value: 100, type: "steps" }]
        this.batchSizeOptions = [{ id: "opt1", text: "64", value: 64, type: "batchsize" }, { id: "opt2", text: "128", value: 128, type: "batchsize" }, { id: "opt3", text: "256", value: 256, type: "batchsize" }, { id: "opt3", text: "512", value: 512, type: "batchsize" }, { id: "opt3", text: "1024", value: 1024, type: "batchsize" }]
        this.learningRateOptions = [{ id: "opt1", text: "0.01", value: 0.01, type: "learningrate" }, { id: "opt2", text: "0.001", value: 0.001, type: "learningrate" }, { id: "opt3", text: "0.0001", value: 0.0001, type: "learningrate" }]
        this.trainingDataOptions = [{ id: "opt1", text: "500", value: 500, type: "traindatasize" }, { id: "opt2", text: "1000", value: 1000, type: "traindatasize" }, { id: "opt3", text: "2000", value: 2000, type: "traindatasize" }]
        this.testDataOptions = [{ id: "opt1", text: "100", value: 100, type: "testdatasize" }, { id: "opt2", text: "200", value: 200, type: "testdatasize" }, { id: "opt3", text: "500", value: 500, type: "testdatasize" }]


        this.selectedTrainDataOption = 0
        this.selectedTestDataOption = 1

        this.trainMetricHolder = []
        this.CumulativeSteps = 0;

        this.state = {
            apptitle: "Anomagram",
            isTraining: false,
            trainDataShape: [0, 0],
            testDataShape: [0, 0],
            mseData: [],
            rocData: [],
            createdModel: null,
            encodedData: [],
            selectedData: 0,

            currentEpoch: 0,
            numFeatures: this.testData[0].data.length,
            hiddenLayers: 2,
            latentDim: 2,
            hiddenDim: [12, 10, 8, 6],
            learningRate: this.learningRateOptions[0].value,
            adamBeta1: 0.5,
            outputActivation: "sigmoid",
            batchSize: this.batchSizeOptions[3].value,
            numSteps: this.stepOptions[0].value,
            numEpochs: 1,


            trainMetrics: this.trainMetricHolder,
            CumulativeSteps: 0,
            trainDataSize: this.trainingDataOptions[this.selectedTrainDataOption].value,
            testDataSize: this.testDataOptions[this.selectedTestDataOption].value,

            modelStale: true,
            bestMetric: { acc: 0, fpr: 0, fnr: 0, tnr: 0, tpr: 0, threshold: 0 },
            minThreshold: 0,
            maxThreshold: 1,


            showRocChart: true,
            showLossChart: true,
            showBottleneckScatterPlot: true,
            showMseHistogram: true,
            validateOnStep: true,

            auc: 0
        }


        this.currentSteps = 0;

        this.xsTrain = []
        this.xsTest = []
        this.yTest = []

        this.trainDataPath = "data/ecg/train.json"
        this.testDataPath = "data/ecg/test.json"

        this.chartWidth = 350;
        this.chartHeight = 250;

        this.warmupSampleSize = 1


    }

    componentDidMount() {
        // this.loadSavedModel()

        this.generateDataTensors()


        this.createModel()

    }

    componentDidUpdate(prevProps, prevState) {
        if ((prevState.isTraining !== this.state.isTraining) && this.state.isTraining === false) {
            // console.log("training ended"); 
        }

        if (this.currentSteps === 0 && prevState.mseData[0] !== this.state.mseData[0]) {
            // console.log("mse updated at 0");
            this.computeAccuracyMetrics(this.state.mseData)
        }

        if (this.state.CumulativeSteps !== prevState.CumulativeSteps) {
            // console.log(this.state.CumulativeSteps);
            this.computeAccuracyMetrics(this.state.mseData)
        }

        // if train or test size updated, regenerate tensors
        if (this.state.trainDataSize !== prevState.trainDataSize || this.state.testDataSize !== prevState.testDataSize) {
            this.generateDataTensors()
        }
    }


    disposeModelTensors() {
        if (this.createdModel) {
            // this.encoder.dispose()
            this.createdModel.dispose()
            this.optimizer.dispose()

        }
    }

    componentWillUnmount() {
        this.disposeModelTensors()
        this.xsTest.dispose()
        this.xsTrain.dispose()
        // this.xsWarmup.dispose()
        // console.log(tf.memory());

    }
    createModel() {

        // dispose of existing model to release tensors from memory
        this.disposeModelTensors()
        //construct model
        this.optimizer = tf.train.adam(this.state.learningRate, this.state.adamBeta1)
        let modelParams = {
            numFeatures: this.state.numFeatures,
            hiddenLayers: this.state.hiddenLayers,
            latentDim: this.state.latentDim,
            hiddenDim: this.state.hiddenDim,
            optimizer: this.optimizer,
            outputActivation: "sigmoid"
        }

        this.createdModel = buildModel(modelParams)
        this.setState({ modelStale: false })
        this.getPredictions()


        // this.createdModel.summary()

        // setTimeout(() => {
        // this.modelWarmUp()
        // }, 5000);

        // showToast("success", "Model successfully created")
        // console.log(tf.memory());
    }

    // modelWarmUp() {
    //     let startTime = new Date();
    //     this.createdModel.fit(this.xsWarmup,
    //         this.xsWarmup, { epochs: 1, verbose: 0, batchSize: this.warmupSampleSize }
    //     ).then(res => {
    //         let endTime = new Date();
    //         let elapsedTime = (endTime - startTime) / 1000
    //         console.log("Warmup done", elapsedTime);
    //     });

    // }
    trainModel() {
        // for (let i = 0; i < this.numSteps; i++) {

        this.currentSteps++;
        //update progresssbar
        // let progress = Math.floor((this.currentSteps / this.state.numSteps) * 100) + "%"
        // this.refs["glowbar"].style.width = progress;



        this.CumulativeSteps++;
        this.setState({ CumulativeSteps: this.CumulativeSteps });
        // 
        let startTime = new Date();
        this.createdModel.fit(this.xsTrain,
            this.xsTrain, { epochs: this.state.numEpochs, verbose: 0, batchSize: this.state.batchSize, validationData: [this.xsTest, this.xsTest] }
        ).then(res => {
            let endTime = new Date();
            let elapsedTime = (endTime - startTime) / 1000
            // console.log(elapsedTime);

            let metricRow = { epoch: this.CumulativeSteps, loss: res.history.loss[0], val_loss: res.history.val_loss[0], traintime: elapsedTime }
            this.trainMetricHolder.push(metricRow)
            // this.setState({ trainMetrics: this.trainMetricHolder });
            // console.log("Step loss", this.currentSteps, this.CumulativeSteps, res.history.loss[0], elapsedTime);
            this.getPredictions();

            // console.log(this.state.numSteps);

            if (this.state.numSteps > this.currentSteps && this.state.isTraining) {
                this.setState({ currentEpoch: this.currentSteps })
                this.trainModel()
            } else {
                this.currentSteps = 0
                this.setState({ isTraining: false })
            }
        });
    }

    async loadSavedModel() {
        // TODO .. launch loadning spinnr
        let modelPath = "/webmodel/ecg/model.json"
        this.savedModel = await tf.loadLayersModel(modelPath);
        console.log("model loaded");
        this.loadTestData()

    }


    computeAccuracyMetrics(data) {

        let uniqueMse = _.uniq(_.map(data, 'mse'))

        uniqueMse = _(uniqueMse).sortBy().value()
        uniqueMse.reverse()




        let rocMetricHolder = []
        let rocSum = 0
        let prevMetric = { fpr: 0, tpr: 0 }

        uniqueMse.forEach((each, i) => {
            let metric = computeAccuracyGivenThreshold(data, each)

            rocMetricHolder.push(metric)
            // if (i < uniqueMse.length) {
            rocSum += (prevMetric.tpr) * (metric.fpr - prevMetric.fpr)
            // rocSum += ((prevMetric.tpr + metric.tpr) / 2) * (metric.fpr - prevMetric.fpr)
            // console.log(i, rocSum);
            // }
            prevMetric = metric

        });

        // Add point (1,1) to compute AUC
        // use trapezium area rule to calculate area
        if (prevMetric.fpr !== 1) {
            rocMetricHolder.push({ fpr: 1, tpr: prevMetric.tpr })
            rocSum += ((prevMetric.tpr + 1) / 2) * (1 - prevMetric.fpr)
            // rocSum += prevMetric.tpr * (1 - prevMetric.fpr)
        }


        // console.log(rocSum, " Region under curve");
        // console.log(rocMetricHolder);


        this.setState({ rocData: rocMetricHolder })
        this.setState({ auc: rocSum })
        // console.log("mse initial", _.min(uniqueMse), _.max(uniqueMse));

        let bestMetric = _.maxBy(rocMetricHolder, "acc")
        this.setState({ bestMetric: bestMetric })
        this.setState({ minThreshold: _.min(uniqueMse) })
        this.setState({ maxThreshold: _.max(uniqueMse) })


    }


    getPredictions() {
        let self = this;

        // Get predictions 
        // let startTime = new Date()
        let preds = this.createdModel.predict(this.xsTest, { batchSize: this.state.batchSize })
        // let elapsedTime = (new Date() - startTime) / 1000
        // console.log("prediction time", elapsedTime);


        //With large batchsize - 0.001, defualt batchsize .. 0.015
        // Compute mean squared error difference between predictions and ground truth
        const mse = tf.tidy(() => {
            return tf.sub(preds, this.xsTest).square().mean(1)
        })
        // let mse = tf.sub(preds, this.xsTest).square().mean(1) //tf.losses.meanSquaredError(preds, xsTest)
        let mseDataHolder = []
        mse.array().then(array => {
            array.forEach((element, i) => {
                // console.log({ "mse": element, "label": yTest[i] });
                mseDataHolder.push({ "mse": element, "label": this.yTest[i] })
                // console.log(mseDataHolder.length)
            });
            self.setState({ mseData: mseDataHolder })
        });



        // Generate encoder output 
        this.encoder = tf.model({ inputs: this.createdModel.inputs, outputs: this.createdModel.getLayer("encoder").getOutputAt(1) });
        let encoderPredictions = this.encoder.predict(this.xsTest)


        let encPredHolder = []
        encoderPredictions.array().then(array => {
            array.forEach((element, i) => {
                encPredHolder.push({ x: element[0], y: element[1], "label": this.yTest[i] })
            });
            self.setState({ encodedData: encPredHolder })
        })


        preds.dispose()
        encoderPredictions.dispose()
        mse.dispose()
        // console.log(tf.memory());

    }

    updateModelDims(hiddenDims, latentDim) {
        // console.log(hiddenDims, latentDim);
        this.setState({ hiddenDim: hiddenDims })
        this.setState({ latentDim: latentDim[0] })
        this.setState({ modelStale: true })

    }

    // visualizeMSE(mse)
    generateDataTensors() {
        //shuffle data
        this.trainData = _.shuffle(this.trainData)
        this.testData = _.shuffle(this.testData)

        //train tensor
        let trainEcg = []
        for (let row in this.trainData) {
            let val = this.trainData[row]
            if (val.target + "" === 1 + "") {
                trainEcg.push(val)
                if (trainEcg.length === this.state.trainDataSize) {
                    break;
                }
            }
        }


        this.xsTrain = tf.tensor2d(trainEcg.map(item => item.data
        ), [trainEcg.length, trainEcg[0].data.length])
        this.setState({ trainDataShape: this.xsTrain.shape })


        // this.xsWarmup = tf.tensor2d(trainEcg.slice(0, this.warmupSampleSize).map(item => item.data
        // ), [this.warmupSampleSize, trainEcg[0].data.length])

        // test tensor  
        // create test data TENSOR from test data json array 
        let testData = this.testData.slice(0, this.state.testDataSize)
        this.xsTest = tf.tensor2d(testData.map(item => item.data
        ), [testData.length, testData[0].data.length])

        // create yLabel Tensor
        this.yTest = testData.map(item => item.target + "" === 1 + "" ? 0 : 1)

        this.setState({ testDataShape: this.xsTest.shape })

    }

    trainButtonClick(e) {
        if (this.state.isTraining) {
            this.setState({ isTraining: false })
        } else {
            this.setState({ isTraining: true })
            this.trainModel()
        }
    }

    resetModelButtonClick(e) {
        this.setState({ isTraining: false })
        this.CumulativeSteps = 0
        this.setState({ CumulativeSteps: 0 })
        // this.setState({ mseData: [] })
        this.trainMetricHolder = []
        this.setState({ trainMetrics: this.trainMetricHolder })
        this.createModel()
    }

    updateModelParam(e) {
        // console.log(e);
        switch (e.selectedItem.type) {
            case "steps":
                this.setState({ numSteps: e.selectedItem.value })
                break
            case "batchsize":
                this.setState({ batchSize: e.selectedItem.value })

                break
            case "learningrate":
                this.setState({ learningRate: e.selectedItem.value })
                break
            case "traindatasize":
                this.setState({ trainDataSize: e.selectedItem.value })

                break
            case "testdatasize":
                this.setState({ testDataSize: e.selectedItem.value })
                break
            default:
                break
        }


    }


    updateThreshold(e) {
        let threshVal = this.state.minThreshold + (e.value / 100) * (this.state.maxThreshold - this.state.minThreshold)
        let bestMetric = computeAccuracyGivenThreshold(this.state.mseData, threshVal)
        // console.log(e.value, threshVal); 
        this.setState({ bestMetric: bestMetric })

    }


    render() {
        // console.log(this.state.minThreshold, this.state.maxThreshold);

        return (
            <div>

                <div className="flex greyhighlight  pl10 rad3  ">
                    <div className="  flex flexjustifycenter ">
                        <div className=" iblock ">
                            <div
                                onClick={this.trainButtonClick.bind(this)}
                                className={("iblock circlelarge circlebutton mr5 flexcolumn flex flexjustifycenter clickable ") + (this.state.modelStale ? " disabled" : "")}>
                                {!this.state.isTraining && <PlayFilledAlt16 style={{ fill: "white" }} className="unselectable unclickable" />}
                                {this.state.isTraining && <PauseFilled16 style={{ fill: "white" }} className="unselectable unclickable" />}
                            </div>
                        </div>
                        <div className="iblock">
                            <div className="iblock  flex flexjustifycenter  ">
                                <div
                                    onClick={this.resetModelButtonClick.bind(this)}
                                    className={"iblock circlesmall circlebutton mr5 flex flexjustifycenter clickable" + (this.state.isTraining ? "  disabled" : "")}>
                                    <Reset16 style={{ fill: "white" }} className="unselectable unclickable" />

                                </div>
                            </div>

                        </div>
                    </div>



                    <div className="flex  flexjustifycenter ">
                        <div ref="activeloaderdiv" >
                            <Loading
                                className=" "
                                active={this.state.isTraining ? true : false}
                                small={true}
                                withOverlay={false}
                            > </Loading>
                        </div>

                    </div>
                    <div className="flexfull unselectable  flex flexjustifyleft flexjustifycenter ">
                        <div className=" p10   iblock">
                            <div className="iblock mr10">
                                <div className="mediumdesc pb7"> Steps {this.state.numSteps} - {this.state.CumulativeSteps} </div>
                                <Dropdown
                                    id="epochsdropdown"
                                    label="Steps"
                                    items={this.stepOptions}
                                    initialSelectedItem={this.stepOptions[0]}
                                    itemToString={item => (item ? item.text : "")}
                                    onChange={this.updateModelParam.bind(this)}
                                />
                            </div>

                            <div className="iblock mr10">
                                <div className="mediumdesc pb7"> Batchsize {this.state.batchSize} </div>
                                <Dropdown
                                    id="batchsizedropdown"
                                    label="Batch Size"
                                    items={this.batchSizeOptions}
                                    initialSelectedItem={this.batchSizeOptions[3]}
                                    itemToString={item => (item ? item.text : "")}
                                    onChange={this.updateModelParam.bind(this)}
                                />
                            </div>

                            <div className="iblock mr10">
                                <div className="mediumdesc pb7"> Learning Rate {this.state.learningRate} </div>
                                <Dropdown
                                    id="learningratedropdown"
                                    label="Learning Rate"
                                    items={this.learningRateOptions}
                                    itemToString={item => (item ? item.text : "")}
                                    initialSelectedItem={this.learningRateOptions[0]}
                                    onChange={this.updateModelParam.bind(this)}
                                />
                            </div>

                            <div className="iblock mr10">
                                <div className="mediumdesc pb7">Training Data Size {this.state.trainDataShape[0]} </div>
                                <Dropdown
                                    id="trainingdatadropdown"
                                    label="Training Data"
                                    items={this.trainingDataOptions}
                                    initialSelectedItem={this.trainingDataOptions[this.selectedTrainDataOption]}
                                    itemToString={item => (item ? item.text : "")}
                                    onChange={this.updateModelParam.bind(this)}
                                />
                            </div>

                            <div className="iblock mr10">
                                <div className="mediumdesc pb7">Test Data Size {this.state.testDataShape[0]} </div>
                                <Dropdown
                                    id="testdatadropdown"
                                    label="Test Data"
                                    items={this.testDataOptions}
                                    itemToString={item => (item ? item.text : "")}
                                    initialSelectedItem={this.testDataOptions[this.selectedTestDataOption]}
                                    onChange={this.updateModelParam.bind(this)}
                                />
                            </div>



                            <div>  </div>
                        </div>
                    </div>

                </div>

                <div ref="glowbar" className={"glowbar w0 "} style={{ width: Math.floor((this.currentSteps / this.state.numSteps) * 100) + "%" }}></div>


                {/* <div className={"mb5 " + (this.state.isTraining ? " rainbowbar" : " displaynone")}></div> */}


                {/* // Model Composer  */}
                <div className="flex mt10 mb10 h100">
                    <div className="flexfull mr10 ">
                        <ComposeModel
                            hiddenDims={this.state.hiddenDim}
                            latentDim={[this.state.latentDim]}
                            isTraining={this.state.isTraining}
                            updateModelDims={this.updateModelDims}
                        />
                    </div>

                    {this.state.bestMetric &&

                        <div className={"iblock  flex3 perfmetrics " + (this.state.isTraining ? " disabled " : " ")}>
                            <div className="boldtext pb10 pt10 ">
                                Model Evaluation Metrics
                            </div>
                            <div className="mb10 greyhighlight rad4 p10">
                                <Slider
                                    min={0} //{(this.state.minThreshold.toFixed(4) * 1)}
                                    max={100}//{(this.state.maxThreshold.toFixed(4) * 1)}
                                    step={5}
                                    minLabel={"%"}
                                    maxLabel={"%"}
                                    value={((this.state.bestMetric.threshold - this.state.minThreshold) / (this.state.maxThreshold - this.state.minThreshold)) * 100}
                                    stepMuliplier={10}
                                    disabled={this.state.isTraining ? true : false}
                                    labelText={"Threshold " + (this.state.bestMetric.threshold).toFixed(5) + "[ " + ((this.state.bestMetric.threshold - this.state.minThreshold) / (this.state.maxThreshold - this.state.minThreshold)) * 100 + " % ] "}
                                    hideTextInput={true}
                                    onChange={this.updateThreshold.bind(this)}
                                />
                            </div>
                            <div className="flex">
                                <div className=" mb10 p5 greyhighlight rad4 textaligncenter mr10 flex5" >
                                    <div className="metricvalue textaligncenter  rad4"> {(this.state.bestMetric.acc * 100).toFixed(2)}  %</div>
                                    <div className="metricdesc mediumdesc p5"> Best Accuracy </div>
                                </div>
                                <div className=" mb10 p5 greyhighlight rad4 textaligncenter flex5" >
                                    <div className="metricvalue textaligncenter  rad4"> {(this.state.auc).toFixed(2)} </div>
                                    <div className="metricdesc mediumdesc p5"> AUC </div>
                                </div>
                            </div>
                            <div className="mb10 flex">

                                <div className="flex5 mr10 p10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue textaligncenter"> {(this.state.bestMetric.fpr * 100).toFixed(2)}  % </div>
                                    <div className="metricdesc mediumdesc p5"> False Positive Rate </div>
                                </div>
                                <div className="flex5  p10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.fnr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc displayblock mediumdesc p5"> False Negative Rate </div>
                                </div>

                            </div>
                            <div className="flex">
                                <div className="flex5 p10 mr10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.tpr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc mr10 mediumdesc p5"> True Positive Rate </div>
                                </div>
                                <div className="flex5 p10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.tnr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc mediumdesc p5"> True Negative Rate </div>
                                </div>
                            </div>

                        </div>}

                </div>

                {true &&
                    <div>


                        {this.state.showLossChart && <div className="iblock mr10  h100 " >
                            <div className={"positionrelative h100 " + (this.state.trainMetrics.length <= 0 ? " " : "")} style={{ width: this.chartWidth, height: this.chartHeight }}>
                                {this.state.trainMetrics.length <= 0 &&
                                    <div className="notrainingdata">  No training loss data yet </div>
                                }
                                {this.state.trainMetrics.length > 0 &&
                                    <LossChart
                                        data={{
                                            data: this.state.trainMetrics,
                                            chartWidth: this.chartWidth,
                                            chartHeight: this.chartHeight,
                                            epoch: this.state.CumulativeSteps
                                        }}

                                    ></LossChart>
                                }

                            </div>
                        </div>}

                        {this.state.showRocChart && <div className="iblock p10">
                            {this.state.rocData.length > 0 &&
                                <ROCChart
                                    data={{
                                        chartWidth: 350,
                                        chartHeight: 250,
                                        data: this.state.rocData,
                                        isTraining: this.state.isTraining,
                                        epoch: this.state.CumulativeSteps,
                                        auc: this.state.auc

                                    }}

                                ></ROCChart>}
                        </div>}



                        {this.state.showMseHistogram && <div className="iblock mr10 ">
                            {this.state.mseData.length > 0 &&
                                <HistogramChart
                                    data={{
                                        data: this.state.mseData,
                                        chartWidth: this.chartWidth,
                                        chartHeight: this.chartHeight,
                                        epoch: this.state.CumulativeSteps
                                    }}
                                ></HistogramChart>
                            }
                        </div>}


                        {this.state.showBottleneckScatterPlot && <div className="iblock mr10  ">
                            {this.state.encodedData.length > 0 &&
                                <ScatterPlot
                                    data={{
                                        data: this.state.encodedData,
                                        chartWidth: this.chartWidth,
                                        chartHeight: this.chartHeight,
                                        epoch: this.state.CumulativeSteps
                                    }}

                                ></ScatterPlot>
                            }
                        </div>}



                    </div>
                }
                <br />
                <br />
                <br />

            </div>
        );
    }
}

export default Train;