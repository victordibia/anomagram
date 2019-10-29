import React, { Component } from "react";
import "./train.css"
import * as tf from '@tensorflow/tfjs';
import { loadJSONData } from "../helperfunctions/HelperFunctions"

import HistogramChart from "../histogram/HistogramChart"
import ScatterPlot from "../scatterplot/ScatterPlot"

const _ = require('lodash');
class Train extends Component {

    constructor(props) {
        super(props)

        this.state = {
            apptitle: "Anomagram",
            testData: [],
            trainData: [],
            mseData: [],
            encodedData: [],
            selectedData: 0
        }
    }


    componentDidMount() {


        this.loadSavedModel()
    }

    async loadSavedModel() {
        let modelPath = "/webmodel/ecg/model.json"
        this.model = await tf.loadLayersModel(modelPath);
        console.log("model loaded");
        this.loadTestData()

    }

    loadTestData() {
        let self = this
        let ecgDataPath = "data/ecg/test_small_scaled.json"

        loadJSONData(ecgDataPath).then(testEcg => {
            const xsTest = tf.tensor2d(testEcg.map(item => item.data
            ), [testEcg.length, testEcg[0].data.length])

            let yTest = testEcg.map(item => item.target + "" === 1 + "" ? 0 : 1)

            let preds = this.model.predict(xsTest)
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
            });


            // Generate encoder output 
            const encoder = tf.model({ inputs: this.model.inputs, outputs: this.model.getLayer("encoder").getOutputAt(1) });
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