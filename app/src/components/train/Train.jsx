import React, { Component } from "react";
import { Button } from "carbon-components-react"
import "./train.css"
import * as tf from '@tensorflow/tfjs';
import { loadJSONData, showToast } from "../helperfunctions/HelperFunctions"
import HistogramChart from "../histogram/HistogramChart"
import ScatterPlot from "../scatterplot/ScatterPlot"
import LossChart from "../losschart/LossChart"
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
            hiddenDim: [10, 7],
            learningRate: 0.05,
            adamBeta1: 0.5,
            outputActivation: "sigmoid",
            batchSize: 512,
            numSteps: 40,
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

    }

    componentDidMount() {
        // this.loadSavedModel()

        this.generateDataTensors()
        this.createModel()

    }

    createModel(xsTest, yTest) {
        //construct model
        let modelParams = {
            numFeatures: this.state.numFeatures,
            hiddenLayers: this.state.hiddenLayers,
            latentDim: this.state.latentDim,
            hiddenDim: this.state.hiddenDim,
            learningRate: this.state.learningRate,
            adamBeta1: this.state.adamBeta1,
            outputActivation: "sigmoid"
        }
        let model = buildModel(modelParams)
        // this.trainModel(model, xs)
        this.createdModel = model
        this.getPredictions(xsTest, yTest)
        showToast("success", "Model successfully created")
    }

    trainModel() {
        // for (let i = 0; i < this.numSteps; i++) {
        this.setState({ isTraining: true })

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
            // console.log(metricRow);

            // console.log("Step loss", this.currentSteps, this.CumulativeSteps, res.history.loss[0], elapsedTime);
            this.getPredictions()
            if (this.state.numSteps > this.currentSteps) {
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
        let startTime = new Date()
        let preds = this.createdModel.predict(this.xsTest)
        let elapsedTime = (new Date() - startTime) / 1000




        // Compute mean squared error difference between predictions and ground truth
        let mse = tf.sub(preds, this.xsTest).square().mean(1) //tf.losses.meanSquaredError(preds, xsTest)
        let mseDataHolder = []
        mse.array().then(array => {
            array.forEach((element, i) => {
                // console.log({ "mse": element, "label": yTest[i] });
                mseDataHolder.push({ "mse": element, "label": this.yTest[i] })
                // console.log(mseDataHolder.length)
            });
            // mseDataHolder = _.sortBy(mseDataHolder, 'mse');
            // console.log("mse updated");
            self.setState({ mseData: mseDataHolder })
            // this.loadTestData()
            // console.log("getting preds", mseDataHolder[0]);
        });



        // Generate encoder output 
        const encoder = tf.model({ inputs: this.createdModel.inputs, outputs: this.createdModel.getLayer("encoder").getOutputAt(1) });
        let encPreds = encoder.predict(this.xsTest)

        let encPredHolder = []
        encPreds.array().then(array => {
            array.forEach((element, i) => {
                encPredHolder.push({ x: element[0], y: element[1], "label": this.yTest[i] })
            });
            self.setState({ encodedData: encPredHolder })
        })
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
        this.trainModel()
    }

    predictButtonClick(e) {
        console.log("predict click")
    }
    render() {
        return (
            <div>

                <div className="mb10">
                    <Button
                        className="mr5 iblock"
                        disabled={(!this.state.isTraining) ? false : true}
                        onClick={this.trainButtonClick.bind(this)}
                    > Train </Button>
                    <Button
                        className="mr5 iblock displaynone"
                        disabled={(!this.state.isTraining) ? false : true}
                        onClick={this.predictButtonClick.bind(this)}
                    > Predict </Button>
                </div>

                {/* <div className={"mb5 " + (this.state.isTraining ? " rainbowbar" : " displaynone")}></div> */}
                <div className="greyborder p10 mb10">
                    <div className="iblock mr10"> Epochs: {this.state.CumulativeSteps}</div>
                    <div className="iblock mr10"> Batch Size: {this.state.batchSize}</div>
                    <div className="iblock mr10"> Learning Rate: {this.state.learningRate}</div>
                    <div className="iblock mr10"> Train: {this.state.trainDataShape[0]}</div>
                    <div className="iblock"> Test: {this.state.testDataShape[0]}</div>
                </div>



                <div>
                    <div className="iblock mr10">
                        {this.state.mseData.length > 0 &&
                            <LossChart
                                data={{
                                    data: this.state.trainMetrics,
                                    chartWidth: 450,
                                    chartHeight: 300,
                                    epoch: this.state.CumulativeSteps
                                }}

                            ></LossChart>
                        }
                    </div>

                    <div className="iblock mr10 ">
                        {this.state.mseData.length > 0 &&
                            <HistogramChart
                                data={{
                                    data: this.state.mseData,
                                    chartWidth: 450,
                                    chartHeight: 300,
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
                                    chartWidth: 450,
                                    chartHeight: 300,
                                    epoch: this.state.CumulativeSteps
                                }}

                            ></ScatterPlot>
                        }
                    </div>


                </div>


            </div>
        );
    }
}

export default Train;