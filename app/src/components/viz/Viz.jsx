import React, { Component } from 'react'
import { Loading, Button, Slider } from 'carbon-components-react';
// import { loadJSONData } from "../helperfunctions/HelperFunctions"
import "./viz.css"
import LineChart from "../linechart/LineChart"
import SmallLineChart from "../linechart/SmallLineChart"
import DrawSignal from "../drawsignal/DrawSignal"
import ComposeModel from "../composemodel/ComposeModel"
import HistogramChart from "../histogram/HistogramChart"
// import "../../data" 
import * as tf from '@tensorflow/tfjs';

// let tf = null
class Viz extends Component {
    constructor(props) {
        super(props)

        this.modelChartWidth = Math.min(390, window.innerWidth - 25)
        this.modelChartHeight = 298

        // Allow the draw signal component update current signal with drawn signal
        this.updateCurrentSignal = this.updateCurrentSignal.bind(this)



        this.testData = require("../../data/ecg/test.json")
        this.testData = this.testData.slice(0, 70)

        this.zeroArr = new Array(this.testData[0].data.length).fill(0);


        this.state = {
            apptitle: "Anomagram",
            trainData: [],
            selectedIndex: 0,
            selectedData: this.testData[0].data,
            showDrawData: false,
            drawSectionWidth: 350,
            drawSectionHeight: this.modelChartHeight - 30,
            isLoading: false,
            modelLoaded: false,
            threshold: 0.010,
            predictedData: this.zeroArr,
            predictedMse: 0,
            selectedLegend: "All",
            showAutoEncoderViz: true,
            isDataTransormed: false,
            showBeforeTrainingHistogram: false,
            trainVizEpoch:0
        }


        // this.trainData = require("../../data/ecg/train.json")
        // console.log(this.testData.length, this.trainData.length)

        this.loadData()

        this.chartColorMap = {
            0: { color: "grey", colornorm: "grey", name: "All" },
            1: { color: "#0062ff", colornorm: "#0062ff", name: "Normal" },
            2: { color: "orange", colornorm: "grey", name: "R-on-T Premature Ventricular Contraction" },
            // 3: { color: "violet", colornorm: "grey", name: "Supraventricular Premature or Ectopic Beat" },
            4: { color: "indigo", colornorm: "grey", name: "Premature Ventricular Contraction" },
            5: { color: "red", colornorm: "grey", name: "Unclassifiable Beat" },
        }

        this.maxSmallChart = 100
        this.modelDataLastUpdated = true


        this.hiddenDim = [7, 3]
        this.latentDim = [2]

        this.trainMse = require("../../data/viz/mse.json")
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

        // window.addEventListener("resize", this.onWindowResize.bind(this))
        // console.log(this.refs["datasection"].offsetWidth)
        this.setState({ drawSectionWidth: this.refs["datasection"].offsetWidth - 5 })
        this.drawSectionWidth = this.refs["datasection"].offsetWidth

        // console.log(tf.memory());
        // setTimeout(() => {
        //     this.setState({ showAutoEncoderViz: true })
        // }, 2000);

        

        
        

        this.xMinArray = require("../../data/ecg/transform/xmin.json")
        this.xMaxArray = require("../../data/ecg/transform/xmax.json")
        this.featureRange = require("../../data/ecg/transform/range.json")
        
        this.sampleTestData = this.myStringify(this.applyTransform(this.testData[0].data.slice(0,50)))
        this.sampleTransformedTestData = this.myStringify(this.testData[0].data.slice(0,50)) 
         
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
        // df = ((df - xmin) / (xmax - xmin)) * (max_val - min_val) + min_val
        // real_output = data * (b - a) + a
        for (let i = 0; i < data.length; i++) {
            holder[i] = ((data[i] - this.featureRange["min"]) / (this.featureRange["max"] - this.featureRange["min"])) * (this.xMaxArray[i] - this.xMinArray[i]) + this.xMinArray[i]
        }
        return holder
    }




    loadModel() {
        this.setState({ isLoading: true }) 
        setTimeout(() => {
            let modelPath = "/webmodel/ecg/model.json"
            tf.loadLayersModel(modelPath).then((model) => {
                this.loadedModel = model
                this.setState({ modelLoaded: true, isLoading: false })
                this.getPrediction(this.state.selectedData)
            });
        }, 700);
    }


    // Get predictions for a selected datapoint
    getPrediction(data) {

        if (!this.state.modelLoaded) {
            this.setState({ selectedData: data })
            this.loadModel()
        } else {
            this.setState({ isLoading: true })

            let transformedData = this.applyTransform(data)
            // let revTrans = this.applyReverseTransform(transformedData)
            // console.log(data.slice(0, 5), revTrans.slice(0, 5));


            // Get predictions  
            const [mse, preds] = tf.tidy(() => {
                let dataTensor = tf.tensor2d(transformedData, [1, 140])
                let preds = this.loadedModel.predict(dataTensor, { batchSize: 8 })
                return [tf.sub(preds, dataTensor).square().mean(1), preds]
            })

            mse.array().then(array => {
                // console.log(array);
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



    updateCurrentSignal(data) {
        this.getPrediction(data)
    }


    clickDataPoint(e) {

        let selectedData = this.testData[e.target.getAttribute("indexvalue")].data
        // set data and get predictions on click 
        this.setSelectedData(e.target.getAttribute("indexvalue"), selectedData)

    }

    setSelectedData(index, data) {

        this.setState({ selectedIndex: index }, () => {
            this.getPrediction(data)
        })
    }

    onWindowResize() {
        console.log(this.refs["datasection"].offsetWidth);

        this.setState({ drawSectionWidth: this.refs["datasection"].offsetWidth - 5 })
    }


    toggleDataOptions(e) {
        this.setState({ showDrawData: e })

    }
    setDatasetDraw(e) {
        this.setState({ showDrawData: true })
        // this.setState({ drawSectionWidth: this.refs["datasection"].offsetWidth })
        // console.log(this.refs["datasection"].offsetWidth);

    }
    setDatasetECG(e) {
        this.setState({ showDrawData: false })

        this.setSelectedData(0, this.testData[0].data)

    }

    clickLegend(e) {
        // console.log(e.target);
        // this.state.selectedLegend = e.target.getAttribute("action")
        this.setState({ selectedLegend: e.target.getAttribute("action") })
    }
    toggelTransform(e) {
        this.setState({isDataTransormed: !this.state.isDataTransormed})
    }

    // toggleTrainingMseViz(e) { 
    //     this.setState({showBeforeTrainingHistogram: !this.state.showBeforeTrainingHistogram})
    // }

    updateTrainVizEpoch(e) { 
        this.setState({trainVizEpoch: e.value})
    }

    render() {


        let dataLegend = Object.entries(this.chartColorMap).map((data, index) => {
            let color = data[1].color
            let name = data[1].name
            // console.log(name); 
            return (
                <div action={name} onClick={this.clickLegend.bind(this)} className={"iblock mr5 mb5 legendrow clickable" + (this.state.selectedLegend === name ? " active" : " ")} key={"legendrow" + index}>
                    <div style={{ background: color }} className="unclickable indicatorcircle iblock mr5"></div>
                    <div className="iblock unclickable legendtext pl4 mediumdesc"> {name}</div>


                </div>
            )
        });

        let dataPoints = this.testData.slice(0, this.maxSmallChart).map((data, index) => {
            // console.log(this.testData[index].target);
            if (this.testData[index].target + "" !== "3") {
                let isVisible = (this.state.selectedLegend === this.chartColorMap[this.testData[index].target].name) || this.state.selectedLegend === "All"

                console.log();

                return (
                    <div onClick={this.clickDataPoint.bind(this)} key={"testrow" + index} className={"mb5 p5 clickable  ecgdatapoint rad3 iblock mr5" + (isVisible ? " " : " displaynone ") + (this.state.selectedIndex + "" === index + "" ? " active " : "")} indexvalue={index} targetval={data.target} >
                        <div indexvalue={index} className="boldtext  unclickable iblock ">
                            <div className="positionrelative">
                                <div className="p3 indicatoroutrcircle  positionabsolute bottomright">
                                    <div style={{ background: this.chartColorMap[this.testData[index].target].color }} className="indicatorcircle "></div>
                                </div>
                                <SmallLineChart
                                    data={{
                                        data: this.testData[index],
                                        index: index,
                                        color: this.chartColorMap[this.testData[index].target].colornorm,
                                        chartWidth: 72,
                                        chartHeight: 30
                                    }}
                                > </SmallLineChart>
                            </div>

                        </div>

                    </div>
                )
            }
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
                                {this.state.predictedMse == 0 &&
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
                {/* <div className="bold mt10 sectiontitle mb10">
                    A Gentle Introduction to Anomaly Detection with Deep Learning (in the Browser!)
                </div> */}

                <div className="mynotif mt10 h100 lh10  lightbluehightlight maxh16  mb10">
                    <div className="boldtext mb5">  A Gentle Introduction to Anomaly Detection with Autoencoders</div>
                    {this.state.apptitle} is an interactive visualization tool for exploring
                    how a deep learning model can be applied to the task of anomaly detection (on stationary data).
                    Given an ECG signal sample, an autoencoder model (running live in your browser) can predict if it is
                     normal or abnormal. To try it out, you can select any of the test ECG signals from the ECG5000 dataset below,
                    or better still, you can draw a signal to see the model's prediction!
                    <div className=" mediumdesc boldtext">
                        <span className=""> Disclaimer: </span> This prototype is built for demonstration purposes only 
                        and is not intended for use in any medical setting.
                    </div>
                </div>


                <div className="mediumdesc pb5 "> Select  Data source</div>

                <div className="mb10 lowerbar">
                    <div onClick={this.setDatasetECG.bind(this)} className={"datasettab clickable iblock mr5 " + (this.state.showDrawData ? "" : " active")}> ECG5000 Dataset</div>
                    <div onClick={this.setDatasetDraw.bind(this)} className={"datasettab clickable iblock mr10 " + (this.state.showDrawData ? " active" : " ")}> Draw your ECG data</div>


                </div>

                <div className="flex flexwrap ">

                    <div ref="datasection" className=" flexwrapitem  flex20 mr10 " >
                        {<div ref="datasetexamplebox" className={" " + (this.state.showDrawData ? " displaynone" : " ")}>
                            {datasetExamples}
                        </div>}
                        {<div className={" " + (!this.state.showDrawData ? " displaynone" : " ")}>
                            {dataSketchPad}
                        </div>}
                    </div>

                    {/* <div style={{width: "200px"}} className="flexwrapitem h100 p10 border">
                             Threshold gauge etc
                     </div>
                    */}
                    <div className="flexwrapitem ">
                        {modelOutput}
                    </div>
                </div>

                <div className="lh10 lightgreyback mt5 p10">
                    {/* <div className="boldtext mb5"> .. detecting abnormal ecg signals </div> */}
                   The autoencoder is trained on only normal ECG signals. It has never seen any of the test signals above, but it is able to correcly predict (most of the time) 
                    if this signal is normal or abnormal. So, how does the autoencoder figure out what a normal signal is?
                      Why is  mean squared error a useful metric?
                      What is the threshold and how is it set? Read on to learn more!
                     
                    {/* In the use case above, the task is to detect abnormal ECG signals, given an ECG sample which corresponds to a heart beat.
                    This task is valuable because abnormal ECG readings are frequently indicative of underlying medical conditions.
                    Each time, a signal is selected or drawn <div className="legendcolorbox  themeblue colortransition5s iblock"></div>, it is processed by an
                    autoencoder which outputs a reconstruction <div style={{ backgroundColor: barColor }} className="legendcolorbox colortransition5s iblock"></div>) of the signal.
                    The reconstruction error (mean squared error <strong>mse</strong> <div style={{ backgroundColor: barColor + "63" }} className="legendcolorbox colortransition5s iblock"></div> between the input and reconstructed output is also visualized.
                Based on a threshold which we set ( <span className="boldtext">{this.state.threshold}</span>  ), we then flag the signal as  abnormal if the reconstruction error is greater than the threshold. */}
                </div>



                {
                    <div className=" ">

                        <div className="">
                            <div className="flex">
                                <div className="flex20  lh10 mb10 ">
                                    {this.state.showAutoEncoderViz && <div className="pt10 pl10 floatright autoencodervizbox  flex6"  >

                                        <ComposeModel
                                            hiddenDims={this.hiddenDim}
                                            latentDim={[this.latentDim]}
                                            isTraining={false}
                                            isUpdatable={false}
                                            updateModelDims={null}
                                            adv={"track" + this.state.showDrawData}
                                        />

                                        <div className="smalldesc lhmedium p5 "> Example of a two layer autoencoder. Click the <span className="italics">train a model</span> tab to train one from scratch.</div>
                                    </div>}


                                    <div className="sectiontitle mt10 mb5"> How does the Autoencoder work? </div>

                                    An <a href="https://en.wikipedia.org/wiki/Autoencoder" target="_blank" rel="noopener noreferrer">Autoencoder</a> is a type of
                                    artificial neural network used to learn efficient (low dimensional) data representations in an unsupervised manner.
                                    It is typically comprised of two components
                                    - an <strong>encoder</strong> that learns to map input data to a low dimension representation ( <strong>also called a bottleneck, denoted by z</strong> )
                                    and a <strong>decoder</strong> that learns to reconstruct the original signal from the
                                    low dimension representation.
                                    The training objective for the autoencoder model is to minimize the difference the reconstruction
                                    error - the difference between the input data and the reconstructed output.
                                    While autoencoder models have been widely applied for dimensionality reduction, they can also be used for anomaly detection.
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

                                    <br /> 
                                    Click the <a href="/#/train" target="_blank" rel="noopener noreferrer"> Train a Model </a> tab to
                                    interactively build an autoencoder, train and evaluate its performance and visualize the histogram of errors for normal and abnormal test data.

                                </div>


                            </div>

                        </div>


                        <div className="sectiontitle mt10 mb5"> The Dataset  </div>
                        <div className="mb10 lh10">
                            This prototype uses the   <a href="http://www.timeseriesclassification.com/description.php?Dataset=ECG5000" target="_blank" rel="noopener noreferrer"> ECG5000 dataset </a> which contains 
                            5000 examples of ECG signals from a patient. Each sample (which has been sliced into 140 points corresponding to an extracted heartbeat) has been labelled  
                            as normal or being indicative of a heart condition related to congestive heart failure.

                        </div>
                        <div className="">
                            <div className="flex lh10 flexwrap">
                                <div className="flex40 flexwrapitem  mb10 pr10">
                                    <div className="pb5 boldtext"> Data Transformation  </div>
                                    Prior to training the autoencoder, we first apply a minmax scaling transform to the input data 
                                    which converts it from its original range (2 to -5) to a range of  0 -1  
                                    This is done for two main reasons. First, existing research shows that neural networks in general train better when input values have 
                                    zero mean and unit variance and lie between 0 and 1. Secondly, scaling the data supports the learning objective 
                                    for the autoencoder (minimizing reconstruction error) and makes the results more interpretable. 
                                    In general, the range of output values from the autoencoder is dependent on the type of activation function used in the output layer.
                                    For example, the tanh activation function outputs values in the range of -1 and 1, sigmoid outputs values in the range of 0 - 1 
                                    In the example above, we use the sigmoid activation function in the output layer of 
                                    the autoencoder, allowing us directly compare the transformed input signal to the output data when computing the means square error metric during training.
                                    In addition, having both input and output in the same range allows us to visualize the differences that contribute to the anomaly classification.
                                    
                                    <br />
                                    <strong className="greycolor"> Note:</strong> 
                                    The parameters of the scaling transform should be <a href=" https://sebastianraschka.com/faq/docs/scale-training-test.html" target="_blank" rel="noopener noreferrer"> computed only on train data</a> and 
                                    and then <span className="italics"> applied </span> to test data. 
                                    

                            </div>
                                <div className=" flex20 flexwrapitem ">
                                    
                                    <div className="flexfull lh10 p10 overflowhidden  greyborder">
                                     
                                        <div className="mediumdesc pb5">
                                            Example data <span className="italics">{this.state.isDataTransormed ? "after " : "before"}</span> minmax (0,1) scaling transformation.
                                        </div>
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
                                    
                                    
                                    {/* Most approaches to anomaly detection (and there are many) begin by constructing a model of
                                        normal behaviour and then exploit this model to identify deviations from normal (anomalies or abnormal data).
                                    Here is how we can use an autoencoder to model normal behaviour. If you recall, an autoencoder learns to compress
                                    and reconstruct data. Notably this learned mapping is specific to the data type/distribution distribution of the training data.
                                    In other words an autoencoder trained using 15 px images of dogs is unlikely to correctly reconstruct 20px images of the surface
                                    of the moon. */}
                                </div>


                                <div className="border displaynone rad4 p10 " style={{ width: "300px", height: "300px" }}>
                                    Interactive replay of training run visualization
                            </div>
                            </div>
                             

                        </div>

                        <div className="sectiontitle mt10 mb5"> Model Implementation and Traininig </div>
                        <div className="">
                            <div className="flex flexwrap">
                                <div className="flex40 flexwrapitem lh10 mb10 ">
                                  The autoencoder in this prototype (visualized above) has two layers in its encoder and decoder respectively.
                                  It is implemented using the Tensorflow.js layers api (similar to the keras api). The encoder/decoder are specified 
                                  using dense layers, relu activation function, and the Adam optimizer (lr = 0.01) is used for training.  
                                      As training progresses, the model's weights are updated to minimize the difference between the encoder input 
                                      and decoder output for the training data (normal samples).  
                                    <br/>
                                    To illustrate the relevance of the training process to the anomaly detection task, we can visualize the 
                                    the histrogram of reconstruction error generated by the model (see figure to the right). At initialization (epoch=0), the untrained autoencoder 
                                    has not learned to reconstruct normal data and hence makes fairly random guesses in its attempt
                                    to reconstruct any input data - thus we see a similar distribution of errors for both normal and abnormal data.
                                    As training progresses, the model gets better at reconstructing normal data, and its reconstruction error markedly 
                                    becomes smaller for normal samples leading to a distinct distribution for normal compared to abnormal data.

                                    As both distributions <span className="italics">diverge</span>, we can set a threshold or cutoff point; any data point 
                                    with error above this threshold is termed an anomaly and any point below this is termed normal. 
                                    Using labelled test data (and some domain expertise), we can automatically determmine this threshold as the point that yields the best 
                                    anomaly classification accuracy. But is accuracy enough?
                                  
                              
                            </div>

                                <div className="  p10 flexwrapitem  floatright">

                                    <div className="flex"> 

                                        <div className="iblock thresholdbox flex flexjustifycenter mr5 pl10 pr10 pt5 pb5">
                                            <div>
                                            <div style={{fontSize:"18px"}} className="mediumdesc textaligncenter boldtext thresholdtext">{this.state.trainVizEpoch}</div>
                                            <div className="smalldesc textaligncenter mt5">Epoch</div>
                                            </div>
                                        </div>

                                        <div className="flexfull">
                                        <Slider
                                        className=" border"
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
                                    
                                     <HistogramChart
                                            data={{
                                                data: this.trainMse["mse"][this.state.trainVizEpoch],
                                                chartWidth: 350,
                                                chartHeight: 240,
                                                epoch: 2 + this.state.showBeforeTrainingHistogram,
                                                threshold: this.trainMse["threshold"][this.state.trainVizEpoch]
                                            }}
                                        ></HistogramChart>

                                    {/* <div className="">

                                    <Button
                                            className="bwidthtransform"
                                            size={"small"}
                                            renderIcon={null}
                                            onClick={this.toggleTrainingMseViz.bind(this)}
                                        > {this.state.showBeforeTrainingHistogram?  "After Training": "Before Training"} </Button>
                
                                    </div> */}
                            </div>
                            </div>

                        </div>


                        <div className="sectiontitle mt10 mb5"> Model Evaluation: Accuracy is NOT Enough </div>
                        <div className="">
                            <div className="flex">
                                <div className="flex6 lh10 mb10 pr10">
                                    For most anomaly detection problems, data is usually imbalanced - the number of labelled normal samples vastly outnumbers
                                    abnormal samples. For example, for every 100 patients who take an
                                    ECG test, <a target="_blank" rel="noopener noreferrer" href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3319226/">less than 23 are likely</a> to have 
                                    some type of abnormal reading. This sort of data imbalance introduces issues that make accuracy 
                                    an inssufficient metric. Consider a naive model (actually a really bad model) 
                                    that simply flagged every sample as normal, given our ECG scenario above, it would would have an accuracy <strong>77%</strong> despite being a really unskilled model. 
                                    Clearly, using just the accuracy metric does not 
                                    tell the complete story i.e. how often does the model flag an ECG as abnormal when it is indeed
                                     abnormal (<strong>true positive</strong>), abnormal when it is normal (<strong>false positive</strong>)
                                    normal when it is abnormal (<strong>false negative</strong>) and normal when it is indeed normal (<strong>true negative</strong>). 
                                     
                                    Two important metrics can be applied to address these issues -  <strong>precision</strong> (true positive / true positive + false positive )
                                    and <strong>recall</strong> (true positive / true positive + false negative).
                                
                                    <br/>
                                    
                                    Depending on the use case, it may be desirable to optimize a model's performance for high precision or high recall. This can be 
                                    manipulated by the selection of a threshold. The receiver operating characteristics (ROC) curve provides a visual assessment of a model's skill
                                    and achieved by plotting the true positive rate against the false positive rate at various values of the threshold.
                                    {/* In addition to the fact that anomalies can vary widely and evolve with time, this data imbalance problem 
                                    makes it hard to treat anomaly detection as a classification problem */}

                            </div>

                                <div className="border rad4 p10 flex4" style={{ height: "200px" }}>
                                    ROC curve and some metrics
                            </div>
                            </div>

                        </div>

                        <div className="sectiontitle mt10 mb10"> Insights on the Effect of Model Parameters </div>
                        Some interesting insights that can be observed while modifying the training parameters for the model 
                        are highlighted below.
                        <div className="flex flexwrap">

                            <div className="flex3 flexwrapitem mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                    <div className="pb5 boldtext"> Learning Rate </div>
                                    As expected, the choice of learning rate and optimizer can significant impact how fast and 
                                    how effective the model training process progresses.
                                    For example, using the Adam training results in fast and accurate convergence even with a high learning rate,
                                    while Rmsprop is more likely to get stuck in 
                                </div>


                            </div>

                            <div className="flex3 flexwrapitem  mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                    <div className="pb5 boldtext"> Regularization </div>
                                    Neural networks can approximate complex functions and can likely overfit in the presence of limited data.
                                    With a few samples (2500 normal samples), we can observe signs of overfitting (train loss less than validation loss).
                                    Regularization (l1 and l2) can be an effective way to address this.
                                    In the interactive panel, activation regularization is applied with regularization rate set to learning rate.

                                </div>


                            </div>

                            {/* <div className="flex4 flexwrapitem  mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                    <div className="pb5 boldtext"> Batch Size </div>
                                     Larger batch sizes lead to faster training. 
                                </div>
                            </div> */}

                            <div className="flex4 flexwrapitem  mr10">
                                <div className="flex6 lh10 mb10 pr10">
                                    <div className="pb5 boldtext"> Abnormal Percentage </div>
                                     The interactive panel allows you to include abnormal samples as a percentage of the total number of 
                                   datapoints used to train the autoencoder model. We see that with 0% abnormal data the model AUC is ~96%.
                                    At 30%, AUC drops to ~93%. At 50% abnormal datapoints, there is just not enough information in the data 
                                    that allows the model learn a patter or normal and its performance is slightly above random chance (AUC of 56%)
                                </div>
                            </div>
                        </div>


                        <div className="sectiontitle mt10 mb5"> Closing Notes </div>
                        <div className="">
                            <div className="flex">
                                <div className="flexfull lh10 mb10 pr10">
                                    In this prototype, we have considered the task of detecting anomalies in ECG data.
                                    We used an autoencoder the results look good. The autoencoder does a decent job of learning a model of 
                                    normal data (in the presence of some abnormal points) However, it is important to note that a deep learning model
                                    is not always the best tool for the job. Particularly, for univariate data,
                                     models such as KMeans Clustering, PCA etc 
                            </div>

                                {/* <div className="border rad4 p10 flex4" style={{ height: "200px" }}>
                                    ROC curve and some metrics
                            </div> */}
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