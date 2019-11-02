import React, { Component } from "react";
import { Button } from "carbon-components-react"
import "./train.css"
import * as tf from '@tensorflow/tfjs';
import { loadJSONData, showToast } from "../helperfunctions/HelperFunctions"
import HistogramChart from "../histogram/HistogramChart"
import ScatterPlot from "../scatterplot/ScatterPlot"
import { buildModel } from "./models/ae"
// import 

// const _ = require('lodash');
class Train extends Component {

    constructor(props) {
        super(props)

        this.state = {
            apptitle: "Anomagram",
            testDataLoaded: false,
            trainDataLoaded: false,
            trainDataShape: [0, 0],
            testDataShape: [0, 0],
            mseData: [],
            createdModel: null,
            encodedData: [],
            selectedData: 0,

            currentEpoch: 0,
            numFeatures: 0,
            hiddenLayers: 2,
            latentDim: 2,
            hiddenDim: [15, 7],
            learningRate: 0.05,
            adamBeta1: 0.5,
            outputActivation: "sigmoid",
            batchSize: 512,
            numSteps: 15,
            numEpochs: 1
        }


        this.currentSteps = 0

        this.xsTrain = []
        this.xsTest = []
        this.yTest = []

    }

    componentDidMount() {
        // this.loadSavedModel()

        this.loadTestData()
        this.loadTrainData()

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
        let startTime = new Date();
        this.createdModel.fit(this.xsTrain,
            this.xsTrain, { epochs: this.state.numEpochs, verbose: 0, batchSize: this.state.batchSize }
        ).then(res => {
            let endTime = new Date();
            let elapsedTime = (endTime - startTime) / 1000
            console.log("Step loss", this.currentSteps, res.history.loss[0], elapsedTime);
            this.getPredictions()
            if (this.state.numSteps > this.currentSteps) {
                this.trainModel()
                this.currentSteps++
                this.setState({ currentEpoch: this.currentSteps })
            } else {
                this.currentSteps = 0
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

    loadTrainData() {
        // TODO .. launch loadning spinnr
        let self = this
        let ecgTrainDataPath = "data/ecg/train.json"
        loadJSONData(ecgTrainDataPath).then(ecgTrain => {
            showToast("success", "Train data loaded")
            let trainEcg = []
            for (let row in ecgTrain) {
                let val = ecgTrain[row]
                if (val.target + "" === 1 + "") {
                    trainEcg.push(val)
                }
            }
            this.setState({ trainDataLoaded: true })


            this.xsTrain = tf.tensor2d(trainEcg.map(item => item.data
            ), [trainEcg.length, trainEcg[0].data.length])

            this.setState({ trainDataShape: this.xsTrain.shape })

        })
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

    loadTestData() {
        let self = this
        let ecgDataPath = "data/ecg/test.json"

        loadJSONData(ecgDataPath).then(testEcg => {

            showToast("success", "Test data loaded")

            this.setState({ testDataLoaded: true })

            // Set numfeatures to size of input dataset 
            this.setState({ numFeatures: testEcg[0].data.length })

            // create test data TENSOR from test data json array 
            this.xsTest = tf.tensor2d(testEcg.map(item => item.data
            ), [testEcg.length, testEcg[0].data.length])

            this.setState({ testDataShape: this.xsTest.shape })

            // create yLabel Tensor
            this.yTest = testEcg.map(item => item.target + "" === 1 + "" ? 0 : 1)
            this.createModel()
        })
    }

    trainButtonClick(e) {
        console.log("traain click")
        showToast("info", "bingo", 6000)
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
                        disabled={this.state.testDataLoaded && this.state.trainDataLoaded ? false : true}
                        onClick={this.trainButtonClick.bind(this)}
                    > Train </Button>
                    <Button
                        className="mr5 iblock"
                        disabled={this.state.testDataLoaded > 0 ? false : true}
                        onClick={this.predictButtonClick.bind(this)}
                    > Predict </Button>
                </div>

                <div className="greyborder p10 mb10">
                    <div className="iblock mr10"> Epochs: {this.state.numEpochs}</div>
                    <div className="iblock mr10"> Batch Size: {this.state.batchSize}</div>
                    <div className="iblock mr10"> Learning Rate: {this.state.learningRate}</div>
                    <div className="iblock mr10"> Train: {this.state.trainDataShape[0]}</div>
                    <div className="iblock"> Test: {this.state.testDataShape[0]}</div>
                </div>

                <div>
                    <div className="iblock mr10">
                        {this.state.mseData.length > 0 &&
                            <HistogramChart
                                data={{
                                    data: this.state.mseData,
                                    chartWidth: 450,
                                    chartHeight: 300,
                                    epoch: this.state.currentEpoch
                                }}
                            ></HistogramChart>
                        }
                    </div>
                    <div className="iblock mr10">
                        {this.state.encodedData.length > 0 &&
                            <ScatterPlot
                                data={{
                                    data: this.state.encodedData,
                                    chartWidth: 450,
                                    chartHeight: 300,
                                    epoch: this.state.currentEpoch
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