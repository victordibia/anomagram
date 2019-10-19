import React, { Component } from 'react'
import { InlineLoading, Button, Search, Modal, Tooltip } from 'carbon-components-react';
import { loadJSONData } from "../helperfunctions/HelperFunctions"
import "./viz.css"
import LineChart from "../linechart/LineChart"
import SmallLineChart from "../linechart/SmallLineChart"


class Viz extends Component {
    constructor(props) {
        super(props)

        this.state = {
            apptitle: "Deep Anomaly Playground",
            testData: [],
            trainData: [],
            selectedData: 0
        }

        // this.testData = require("../../data/ecg/test.json")
        // this.trainData = require("../../data/ecg/train.json")
        // console.log(this.testData.length, this.trainData.length)

        this.loadData()

    }

    loadData() {
        let testECGDataPath = process.env.PUBLIC_URL + "/data/ecg/test_small.json"
        let trainECGDataPath = process.env.PUBLIC_URL + "/data/ecg/train_small.json"
        loadJSONData(testECGDataPath).then(data => {
            this.setState({ testData: data })
            console.log("test data loaded", data.length)
        })

        loadJSONData(trainECGDataPath).then(data => {
            this.setState({ trainData: data })
        })

    }
    componentDidUpdate(prevProps, prevState) {


    }


    componentDidMount() {
        this.apptitle = "Amadioha"
    }

    clickDataPoint(e) {
        this.setState({ selectedData: e.target.getAttribute("indexvalue") })
        // console.log(this.state.testData[this.state.selectedData].data)
    }

    render() {


        let resultList = this.state.testData.map((data, index) => {
            return (
                <div onClick={this.clickDataPoint.bind(this)} key={"testrow" + index} className={"mb5 clickable ecgdatapoint rad3 iblock mr5" + (this.state.selectedData == index ? " active" : "")} indexvalue={index} >
                    <div indexvalue={index} className="boldtext unclickable iblock  mb5">
                        {data.target}
                        <SmallLineChart
                            data={{
                                data: this.state.testData[index],
                                index: index
                            }}
                        > </SmallLineChart>

                    </div>

                </div>
            )
        });

        return (
            <div>




                <div className="bold mt10 sectiontitle mb10">
                    Anomaly Detection

                </div>

                <div className=" lh10 mb10">
                    {this.state.apptitle} is an interactive visualization tool for exploring
                    deep learning models applied to the task of anomaly detection (on non-time series data).

                </div>

                {/* <div className="flex">
                    <div className="flexfull mr10">
                        <Search
                            ref="searchbox"
                            id="searchbox"
                            labelText="Search"
                            defaultValue="Who is the Minister for Health in Nigeria"
                            placeHolderText="Enter your question e.g. When is the Nigerian Independence Day"
                        // onKeyDown={this.searchKeyDown.bind(this)}
                        ></Search>
                    </div>
                    <div className="">
                        <Button
                        // onClick={this.submitSearch.bind(this)}
                        > Submit </Button>
                    </div>
                </div> */}

                <div className="bold mt10 sectiontitle mb10">
                    ECG Dataset
                </div>

                <div className="flex">
                    <div className="flexfull p10  ">
                        <div className="mb10 boldtext"> ECG {this.state.testData.length}</div>
                        <div className="ecgdatabox mb10">
                            {resultList}
                        </div>
                    </div>
                    {/* <div className="flex2 p10 ">
                        <div className="mb10 boldtext"> Model </div>
                    </div> */}
                    <div className=" p10 modeloutputbox rad5 ">
                        <div className="mb10 boldtext"> Model Output

                        </div>
                        <div>
                            {this.state.testData.length > 0 &&
                                <div>
                                    {this.state.testData[this.state.selectedData].index}
                                    <LineChart
                                        data={{
                                            chartdata: this.state.testData[this.state.selectedData],
                                            datatindex: this.state.testData[this.state.selectedData].index
                                        }}

                                    > </LineChart>
                                </div>
                            }
                            {/* {this.state.testData[0].index} */}
                        </div>
                    </div>
                </div>







            </div>
        )
    }
}

export default Viz