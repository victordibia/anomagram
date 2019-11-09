import React, { Component } from "react";
import { Button, Loading } from "carbon-components-react"
import "./train.css"
import * as tf from '@tensorflow/tfjs';
// import { showToast } from "../helperfunctions/HelperFunctions"

// custom charts 
import HistogramChart from "../histogram/HistogramChart"
import ScatterPlot from "../scatterplot/ScatterPlot"
import LossChart from "../losschart/LossChart"
import ComposeModel from "../composemodel/ComposeModel"

import { Reset16, PlayFilled16, PauseFilled16 } from '@carbon/icons-react';
import { buildModel } from "./models/ae"
// import 

// const _ = require('lodash');
class Train extends Component {

    constructor(props) {
        super(props)

        this.testData = require("../../data/ecg/test.json")
        this.trainData = require("../../data/ecg/train.json")

        this.trainMetricHolder = []
        this.CumulativeSteps = 0;

        this.state = {
            apptitle: "Anomagram",
            isTraining: false,
            trainDataShape: [0, 0],
            testDataShape: [0, 0],
            mseData: [],
            createdModel: null,
            encodedData: [],
            selectedData: 0,

            currentEpoch: 0,
            numFeatures: this.testData[0].data.length,
            hiddenLayers: 2,
            latentDim: 2,
            hiddenDim: [7, 5],
            learningRate: 0.005,
            adamBeta1: 0.5,
            outputActivation: "sigmoid",
            batchSize: 512,
            numSteps: 6,
            numEpochs: 1,

            trainMetrics: this.trainMetricHolder,
            CumulativeSteps: 0
        }


        this.currentSteps = 0;



        this.xsTrain = []
        this.xsTest = []
        this.yTest = []

        this.trainDataPath = "data/ecg/train.json"
        this.testDataPath = "data/ecg/test.json"

        this.chartWidth = 350;
        this.chartHeight = 250;

    }

    componentDidMount() {
        // this.loadSavedModel()

        this.generateDataTensors()


        this.createModel()

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
        this.getPredictions()

        // showToast("success", "Model successfully created")
        // console.log(tf.memory());
    }

    trainModel() {
        // for (let i = 0; i < this.numSteps; i++) {


        this.currentSteps++;
        this.CumulativeSteps++;
        this.setState({ CumulativeSteps: this.CumulativeSteps });
        // 
        let startTime = new Date();
        this.createdModel.fit(this.xsTrain,
            this.xsTrain, { epochs: this.state.numEpochs, verbose: 0, batchSize: this.state.batchSize, validationData: [this.xsTest, this.xsTest] }
        ).then(res => {
            let endTime = new Date();
            let elapsedTime = (endTime - startTime) / 1000

            let metricRow = { epoch: this.CumulativeSteps, loss: res.history.loss[0], val_loss: res.history.val_loss[0], traintime: elapsedTime }
            this.trainMetricHolder.push(metricRow)


            // this.setState({ trainMetrics: this.trainMetricHolder });
            // console.log("Step loss", this.currentSteps, this.CumulativeSteps, res.history.loss[0], elapsedTime);
            this.getPredictions()
            if (this.state.numSteps > this.currentSteps && this.state.isTraining) {
                this.setState({ currentEpoch: this.currentSteps })

                this.trainModel()
            } else {
                this.currentSteps = 0
                this.setState({ isTraining: false })

                // console.log(this.trainMetricHolder);

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



    getPredictions() {
        let self = this;

        // Get predictions 
        // let startTime = new Date()
        let preds = this.createdModel.predict(this.xsTest)
        // let elapsedTime = (new Date() - startTime) / 1000

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

    // visualizeMSE(mse)
    generateDataTensors() {
        //train tensor
        let trainEcg = []
        for (let row in this.trainData) {
            let val = this.trainData[row]
            if (val.target + "" === 1 + "") {
                trainEcg.push(val)
            }
        }

        this.xsTrain = tf.tensor2d(trainEcg.map(item => item.data
        ), [trainEcg.length, trainEcg[0].data.length])
        this.setState({ trainDataShape: this.xsTrain.shape })


        // test tensor  
        // create test data TENSOR from test data json array 
        this.xsTest = tf.tensor2d(this.testData.map(item => item.data
        ), [this.testData.length, this.testData[0].data.length])

        // create yLabel Tensor
        this.yTest = this.testData.map(item => item.target + "" === 1 + "" ? 0 : 1)

        this.setState({ testDataShape: this.xsTest.shape })

    }

    trainButtonClick(e) {
        // console.log("traain click")
        // showToast("info", "Training model ", 6000)
        if (this.state.isTraining) {
            this.setState({ isTraining: false })
        } else {
            this.setState({ isTraining: true })
            this.trainModel()
        }

    }

    resetModelButtonClick(e) {
        this.setState({ isTraining: false })
        this.setState({ CumulativeSteps: 0 })
        // this.setState({ mseData: [] })
        this.trainMetricHolder = []
        this.setState({ trainMetrics: this.trainMetricHolder })
        this.createModel()
    }
    render() {
        return (
            <div>



                {/* <div className={"mb5 " + (this.state.isTraining ? " rainbowbar" : " displaynone")}></div> */}
                <div className="greyborder p10 mb10">
                    <div className="iblock mr10"> Epochs: {this.state.CumulativeSteps}</div>
                    <div className="iblock mr10"> Batch Size: {this.state.batchSize}</div>
                    <div className="iblock mr10"> Learning Rate: {this.state.learningRate}</div>
                    <div className="iblock mr10"> Train: {this.state.trainDataShape[0]}</div>
                    <div className="iblock"> Test: {this.state.testDataShape[0]}</div>
                </div>

                {/* // Model Composer  */}
                <div className="flex mb10 ">
                    <div className="flex7 mr10 border p10 rad4"> <ComposeModel></ComposeModel></div>
                    <div className="flex3 flex h100   ">
                        <div className="mb10">
                            <Button
                                className="mr5 iblock"
                                renderIcon={this.state.isTraining ? PauseFilled16 : PlayFilled16}
                                // disabled={(!this.state.isTraining) ? false : true}
                                onClick={this.trainButtonClick.bind(this)}
                            > {this.state.isTraining ? "Pause" : "Train"}
                            </Button>

                            <Button
                                className="mr5 iblock displaynone"
                                renderIcon={Reset16}
                                disabled={(!this.state.isTraining) ? false : true}
                                onClick={this.resetModelButtonClick.bind(this)}
                            > Reset </Button>

                            <Loading
                                className="iblock mt10"
                                active={(!this.state.isTraining) ? false : true}
                                small={true}
                                withOverlay={false}
                            >

                            </Loading>

                        </div>

                    </div>
                </div>

                {true &&
                    <div>
                        <div className="iblock mr10  h100 " >
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
                        </div>

                        <div className="iblock mr10 ">
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
                        </div>
                        <div className="iblock mr10  ">
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
                        </div>
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