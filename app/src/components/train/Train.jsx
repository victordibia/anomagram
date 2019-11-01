import React, { Component } from "react";
import { Button } from "carbon-components-react"
import "./train.css"
import * as tf from '@tensorflow/tfjs';
import { loadJSONData } from "../helperfunctions/HelperFunctions"

import HistogramChart from "../histogram/HistogramChart"
import ScatterPlot from "../scatterplot/ScatterPlot"
import { buildModel } from "./models/ae"
// import 

const _ = require('lodash');
class Train extends Component {

    constructor(props) {
        super(props)

        this.state = {
            apptitle: "Anomagram",
            testData: [],
            trainData: [],
            mseData: [],
            createdModel: null,
            encodedData: [],
            selectedData: 0
        }

        this.numSteps = 3
        this.numEpochs = 20
        this.batchSize = 256
        this.currentSteps = 0

    }

    componentDidMount() {
        this.loadSavedModel()
        // this.loadTrainData()
    }

    createModel(xs) {
        //construct model
        let modelParams = {
            numFeatures: xs.shape[1],
            hiddenLayers: 2,
            latentDim: 2,
            hiddenDim: [15, 7],
            learningRate: 0.05,
            adamBeta1: 0.5,
            outputActivation: "sigmoid"
        }
        let model, encoder, decoder
        [model, encoder, decoder] = buildModel(modelParams)
        this.trainModel(model, xs)
        this.setState({ createModel: model })
    }

    trainModel(model, xs) {
        // for (let i = 0; i < this.numSteps; i++) {
        let startTime = new Date();
        model.fit(xs,
            xs, { epochs: this.numEpochs, verbose: 0, batchSize: this.batchSize }
        ).then(res => {
            let endTime = new Date();
            let elapsedTime = (endTime - startTime) / 1000
            console.log("Step loss", this.currentSteps, res.history.loss[0], elapsedTime);
            if (this.numSteps > this.currentSteps) {
                this.trainModel(model, xs)
                this.currentSteps++
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
            let trainEcg = []
            for (let row in ecgTrain) {
                let val = ecgTrain[row]
                if (val.target + "" === 1 + "") {
                    trainEcg.push(val)
                }
            }
            const xs = tf.tensor2d(trainEcg.map(item => item.data
            ), [trainEcg.length, trainEcg[0].data.length])
            console.log(trainEcg.length, xs.shape[1], "train size");
            self.createModel(xs)
        })
    }

    loadTestData() {
        let self = this
        let ecgDataPath = "data/ecg/test.json"

        loadJSONData(ecgDataPath).then(testEcg => {
            const xsTest = tf.tensor2d(testEcg.map(item => item.data
            ), [testEcg.length, testEcg[0].data.length])

            let yTest = testEcg.map(item => item.target + "" === 1 + "" ? 0 : 1)
            let pst = new Date()
            let preds = this.savedModel.predict(xsTest)
            let pend = new Date()
            console.log(xsTest.shape, (pend - pst) / 1000)
            let mse = tf.sub(preds, xsTest).square().mean(1) //tf.losses.meanSquaredError(preds, xsTest)
            let mseDataHolder = []
            mse.array().then(array => {
                array.forEach((element, i) => {
                    // console.log({ "mse": element, "label": yTest[i] });
                    mseDataHolder.push({ "mse": element, "label": yTest[i] })
                    // console.log(mseDataHolder.length)
                });
                // mseDataHolder = _.sortBy(mseDataHolder, 'mse');
                // console.log(mseDataHolder);
                self.setState({ mseData: mseDataHolder })
                // this.loadTestData()
            });


            // Generate encoder output 
            const encoder = tf.model({ inputs: this.savedModel.inputs, outputs: this.savedModel.getLayer("encoder").getOutputAt(1) });
            let encPreds = encoder.predict(xsTest)

            let encPredHolder = []
            encPreds.array().then(array => {
                array.forEach((element, i) => {
                    encPredHolder.push({ x: element[0], y: element[1], "label": yTest[i] })
                });
                self.setState({ encodedData: encPredHolder })
            })

        })
    }

    render() {
        return (
            <div>

                <div>
                    <Button> Train </Button>
                </div>
                {this.state.mseData.length > 0 &&
                    <HistogramChart
                        data={{
                            data: this.state.mseData,
                            chartWidth: 450,
                            chartHeight: 300
                        }}
                    ></HistogramChart>
                }
                {this.state.encodedData.length > 0 &&
                    <ScatterPlot
                        data={{
                            data: this.state.encodedData,
                            chartWidth: 450,
                            chartHeight: 300
                        }}

                    ></ScatterPlot>
                }
            </div>
        );
    }
}

export default Train;