import React, { Component } from "react";
import { Loading, Dropdown, Slider, Checkbox } from "carbon-components-react"
import "./train.css"
import * as tf from '@tensorflow/tfjs';
import { computeAccuracyGivenThreshold, percentToRGB } from "../helperfunctions/HelperFunctions"
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
        this.regularizerOptions = [{ id: "opt1", text: "None", value: "none", type: "regularizer" }, { id: "opt1", text: "l1", value: "l1", type: "regularizer" }, { id: "opt2", text: "l2", value: "l2", type: "regularizer" }, { id: "opt2", text: "l1l2", value: "l1l2", type: "regularizer" }]
        this.batchSizeOptions = [{ id: "opt1", text: "64", value: 64, type: "batchsize" }, { id: "opt2", text: "128", value: 128, type: "batchsize" }, { id: "opt3", text: "256", value: 256, type: "batchsize" }, { id: "opt3", text: "512", value: 512, type: "batchsize" }, { id: "opt3", text: "1024", value: 1024, type: "batchsize" }]
        this.learningRateOptions = [{ id: "opt1", text: "0.01", value: 0.01, type: "learningrate" }, { id: "opt2", text: "0.001", value: 0.001, type: "learningrate" }, { id: "opt3", text: "0.0001", value: 0.0001, type: "learningrate" }]
        this.trainingDataOptions = [{ id: "opt1", text: "500", value: 500, type: "traindatasize" }, { id: "opt2", text: "1000", value: 1000, type: "traindatasize" }, { id: "opt3", text: "2000", value: 2000, type: "traindatasize" }]
        this.testDataOptions = [{ id: "opt1", text: "100", value: 100, type: "testdatasize" }, { id: "opt2", text: "200", value: 200, type: "testdatasize" }, { id: "opt3", text: "500", value: 500, type: "testdatasize" }]



        this.selectedTrainDataOption = 0
        this.selectedTestDataOption = 1

        this.selectedRegularizer = 0

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
            hiddenDim: [12, 3],
            learningRate: this.learningRateOptions[0].value,
            regularizer: this.regularizerOptions[this.selectedRegularizer].value,
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


            showModelComposer: true,
            showRocChart: true,
            showLossChart: true,
            showBottleneckScatterPlot: true,
            showMseHistogram: true,
            showModelEvaluationMetrics: true,


            validateOnStep: true,
            auc: 0
        }

        this.showOptions = [
            { label: "Model Composer", action: "composer", checked: this.state.showModelComposer },
            { label: "Training Loss", action: "loss", checked: this.state.showLossChart },
            { label: "Error Histogram", action: "histogram", checked: this.state.showMseHistogram },
            { label: "ROC Curve", action: "roc", checked: this.state.showRocChart },
            { label: "Bottleneck Scatterplot", action: "bottleneck", checked: this.state.showBottleneckScatterPlot },
            { label: "Evaluation Metrics", action: "evaluation", checked: this.state.showModelEvaluationMetrics },

        ]


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
        this.setState({ isTraining: false })
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
            outputActivation: "sigmoid",
            regularizer: this.state.regularizer,
            regularizationRate: this.state.learningRate
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
            // rocSum += (prevMetric.tpr) * (metric.fpr - prevMetric.fpr)
            rocSum += ((prevMetric.tpr + metric.tpr) / 2) * (metric.fpr - prevMetric.fpr)
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

        //Add only positive normal ECG (target==1) to train json array
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

        // Create train tensor from json array
        this.xsTrain = tf.tensor2d(trainEcg.map(item => item.data
        ), [trainEcg.length, trainEcg[0].data.length])
        this.setState({ trainDataShape: this.xsTrain.shape })


        // Create test data TENSOR from test data json array 
        let testData = this.testData.slice(0, this.state.testDataSize)
        this.xsTest = tf.tensor2d(testData.map(item => item.data
        ), [testData.length, testData[0].data.length])

        // Create yLabel Tensor
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
                this.setState({ modelStale: true })
                break
            case "traindatasize":
                this.setState({ trainDataSize: e.selectedItem.value })

                break
            case "testdatasize":
                this.setState({ testDataSize: e.selectedItem.value })
                break
            case "regularizer":
                this.setState({ regularizer: e.selectedItem.value })
                this.setState({ modelStale: true })
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

    showOptionsClick(e) {
        // console.log(e.target.checked, e.target.getAttribute("action"));
        switch (e.target.getAttribute("action")) {
            case "histogram":
                this.setState({ showMseHistogram: e.target.checked })
                break
            case "loss":
                this.setState({ showLossChart: e.target.checked })
                break
            case "composer":
                this.setState({ showModelComposer: e.target.checked })
                break
            case "bottleneck":
                this.setState({ showBottleneckScatterPlot: e.target.checked })
                break
            case "roc":
                this.setState({ showRocChart: e.target.checked })
                break
            case "evaluation":
                this.setState({ showModelEvaluationMetrics: e.target.checked })
                break
            default:
                break
        }

    }

    render() {
        // console.log(this.state.minThreshold, this.state.maxThreshold);



        let showCheckBoxes = this.showOptions.map((data) => {
            return (
                <div key={data.label + "checkbox"} className="mediumdesc iblock mr10">
                    <Checkbox
                        defaultChecked={data.checked}
                        wrapperClassName={"mediumdesc"}
                        className={"mediumdesc"}
                        labelText={data.label}
                        id={data.label + "checkboxid"}
                        action={data.action}
                        onClick={this.showOptionsClick.bind(this)}
                    ></Checkbox>
                </div>
            )
        })

        return (
            <div>

                <div className="">
                    <div className="flex h100">
                        <div className="flex5  h100">
                            <div className="mynotif   h100 lh10  lightbluehightlight maxh16  mr10">
                                <div className="boldtext"> Model Architecture</div>
                                <div>
                                    Use the model composer below to modify the parameters of the model
                                    (number of layers, number of units in each layer)
                                    </div>
                            </div>
                        </div>
                        <div className="flex5 greyhighlight p10 rad4 mb5 ">
                            <div className="boldtext pb5 iblock mr10"> Advanced Options </div>
                            {showCheckBoxes}
                        </div>
                    </div>
                </div>
                {/* start of top bar */}
                <div className="topbar flex">
                    <div className="flexfull modelconfigbar ">
                        <div className="flex displaynone">
                            <div className="flex35 mr10">
                                <div className="mynotif  lh10  lightbluehightlight maxh16  mb10">
                                    <div className="boldtext"> Training Parameters</div>
                                    <div>
                                        Set model parameters
                                         (training steps, batchsize, learning rate, dataset size etc).
                                    </div>
                                </div>

                            </div>
                            <div className="flex35 mr10">
                                <div className="mynotif  lh10  lightbluehightlight maxh16  mb10">
                                    <div className="boldtext"> Model Architecture</div>
                                    <div>
                                        Use the model composer below to modify the parameters of the model
                                        (number of layers, number of units in each layer)
                                    </div>
                                </div>

                            </div>
                            <div className="flex3 ">
                                <div className="mynotif  lh10  lightbluehightlight maxh16  mb10">
                                    <div className="boldtext"> Train and Evaluate </div>
                                    <div>
                                        Use the traiining loss chart, histogram of erorrs chart, receiver
                                         chart etc to evaluate model quality!.
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="modelconfigbar flex  ">
                            <div className=" mr10 greyhighlight rad4 p10 iblock flex flexcolumn">
                                <div className="flexfull textaligncenter">{this.state.CumulativeSteps}</div>
                                <div> Total train steps</div>
                            </div>
                            <div className="flex flexfull greyhighlight   pl10 rad3  ">
                                <div className="  flex flexjustifycenter pt10 ">
                                    <div className=" iblock ">
                                        <div
                                            onClick={this.trainButtonClick.bind(this)}
                                            className={("iblock circlelarge circlebutton mr5 flexcolumn flex flexjustifycenter clickable ") + (this.state.modelStale ? " disabled" : "")}>
                                            {!this.state.isTraining && <PlayFilledAlt16 style={{ fill: "white" }} className="unselectable unclickable" />}
                                            {this.state.isTraining && <PauseFilled16 style={{ fill: "white" }} className="unselectable unclickable" />}
                                        </div>
                                        <div className="smalldesc textaligncenter pt5 pb5 "> Train &nbsp; </div>
                                    </div>
                                    <div className="iblock h100 ">
                                        <div className="  flex flexjustifycenter h100  ">
                                            <div className="">
                                                <div
                                                    onClick={this.resetModelButtonClick.bind(this)}
                                                    className={" circlesmall circlebutton mr5 flex flexjustifycenter clickable" + (this.state.isTraining ? "  disabled" : "")}>
                                                    <Reset16 style={{ fill: "white" }} className="unselectable unclickable" />

                                                </div>
                                                <div className=" displayblock smalldesc textaligncenter pt5 "> Reset &nbsp; </div>
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
                                            <div className="mediumdesc pb7 pt5"> Steps {this.state.numSteps} - {this.state.CumulativeSteps} </div>
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
                                            <div className="mediumdesc pb7 pt5"> Batchsize {this.state.batchSize} </div>
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
                                            <div className="mediumdesc pb7 pt5"> Learning Rate {this.state.learningRate} </div>
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
                                            <div className="mediumdesc pb7 pt5"> Regularlizer {this.state.regularizer} </div>
                                            <Dropdown
                                                id="regularizeerdropdown"
                                                label="Regularizer"
                                                items={this.regularizerOptions}
                                                itemToString={item => (item ? item.text : "")}
                                                initialSelectedItem={this.regularizerOptions[this.selectedRegularizer]}
                                                onChange={this.updateModelParam.bind(this)}
                                            />
                                        </div>

                                        <div className="iblock mr10">
                                            <div className="mediumdesc pb7 pt5">Train Size {this.state.trainDataShape[0]} </div>
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
                                            <div className="mediumdesc pb7 pt5">Test Size {this.state.testDataShape[0]} </div>
                                            <Dropdown
                                                id="testdatadropdown"
                                                label="Test Data"
                                                items={this.testDataOptions}
                                                itemToString={item => (item ? item.text : "")}
                                                initialSelectedItem={this.testDataOptions[this.selectedTestDataOption]}
                                                onChange={this.updateModelParam.bind(this)}
                                            />
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                        <div ref="glowbar" className={"glowbar w0 "} style={{ width: Math.floor((this.currentSteps / this.state.numSteps) * 100) + "%" }}></div>

                    </div>
                </div>




                {/* end of top bar */}



                {/* <div className={"mb5 " + (this.state.isTraining ? " rainbowbar" : " displaynone")}></div> */}


                {/* // Model Composer  */}
                <div className="flex mt10 mb10 h100">
                    {this.state.showModelComposer &&
                        <div className="flex7 mr10 ">
                            <ComposeModel
                                hiddenDims={this.state.hiddenDim}
                                latentDim={[this.state.latentDim]}
                                isTraining={this.state.isTraining}
                                updateModelDims={this.updateModelDims}
                            />
                        </div>}

                    {(this.state.bestMetric && this.state.showModelEvaluationMetrics) &&

                        < div className={"iblock  flex3 perfmetrics " + (this.state.isTraining ? " disabled " : " ")}>
                            <div className="boldtext pb10 pt10 ">
                                Model Evaluation Metrics
                            </div>
                            <div className="mb10 greyhighlight rad4 p10">
                                <Slider
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
                                <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.acc * 100)) }} className="metricguage mb10 p5 greyhighlight rad4 textaligncenter mr10 flex5" >
                                    <div className="metricvalue textaligncenter  rad4"> {(this.state.bestMetric.acc * 100).toFixed(2)}  %</div>
                                    <div className="metricdesc mediumdesc p5"> Best Accuracy </div>
                                </div>
                                <div style={{ borderLeftColor: percentToRGB((this.state.auc * 100)) }} className="metricguage mb10 p5 greyhighlight rad4 textaligncenter flex5" >
                                    <div className="metricvalue textaligncenter  rad4"> {(this.state.auc).toFixed(2)} </div>
                                    <div className="metricdesc mediumdesc p5"> AUC </div>
                                </div>
                            </div>
                            <div className="mb10 flex">

                                <div style={{ borderLeftColor: percentToRGB(100 - (this.state.bestMetric.fpr * 100)) }} className="metricguage flex5 mr10 p10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue textaligncenter"> {(this.state.bestMetric.fpr * 100).toFixed(2)}  % </div>
                                    <div className="metricdesc mediumdesc p5"> False Positive Rate </div>
                                </div>
                                <div style={{ borderLeftColor: percentToRGB(100 - (this.state.bestMetric.fnr * 100)) }} className="metricguage flex5  p10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.fnr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc displayblock mediumdesc p5"> False Negative Rate </div>
                                </div>

                            </div>
                            <div className="flex">
                                <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.tpr * 100)) }} className="metricguage flex5 p10 mr10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.tpr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc mr10 mediumdesc p5"> True Positive Rate </div>
                                </div>
                                <div style={{ borderLeftColor: percentToRGB((this.state.bestMetric.tnr * 100)) }} className="metricguage flex5 p10 greyhighlight rad4 textaligncenter">
                                    <div className="metricvalue"> {(this.state.bestMetric.tnr * 100).toFixed(2)} % </div>
                                    <div className="metricdesc mediumdesc p5"> True Negative Rate </div>
                                </div>
                            </div>

                        </div>}

                </div>

                {
                    true &&
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
                                        epoch: this.state.CumulativeSteps,
                                        threshold: this.state.bestMetric.threshold
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

            </div >
        );
    }
}

export default Train;