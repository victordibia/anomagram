import React, { Component } from "react";
import { Reset16, PlayFilledAlt16 } from '@carbon/icons-react';
import ROCChart from "./../rocchart/ROCChart"
import { computeAccuracyGivenThreshold } from "./../helperfunctions/HelperFunctions"
import * as _ from "lodash"
import "./faq.css"

class Faq extends Component {

    constructor(props) {
        super(props)

        this.mseData = [{ mse: 1.2428572177886963, label: 0 },
        { mse: 1.2, label: 0 },
        { mse: 1.3, label: 0 },
        { mse: 1.9, label: 0 },
        { mse: 1.2, label: 0 },
        { mse: 1.3, label: 0 },
        { mse: 1.25, label: 0 },
        { mse: 1.8, label: 1 },
        { mse: 1.75, label: 1 },
        { mse: 1.2428570985794067, label: 0 }]
        this.state = {
            metricData: []
        }
    }



    componentDidMount() {

        let uniqueMse = _.uniq(_.map(this.mseData, 'mse'))
        uniqueMse = _(uniqueMse).sortBy().value()
        console.log(uniqueMse);

        let metricHolder = []
        uniqueMse.forEach(each => {
            metricHolder.push(computeAccuracyGivenThreshold(this.mseData, each))
        });
        this.setState({ metricData: metricHolder })
        console.log(JSON.stringify(metricHolder));


    }
    render() {





        return (
            <div>
                <div className="border  p10">
                    <div className="border iblock  p10">
                        <div
                            className={("iblock border circlebutton mr5 flexcolumn flex flexjustifycenter clickable ")}>
                            {<PlayFilledAlt16 style={{ fill: "white" }} className="unselectable unclickable" />}

                        </div>
                    </div>
                    <div className="iblock">
                        <div className="border iblock  flex flexjustifycenter  p10">
                            <div
                                className={"iblock border circlesmall circlebutton mr5 flex flexjustifycenter clickable"}>
                                <Reset16 style={{ fill: "white" }} className="unselectable unclickable" />
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p10">
                    {this.state.metricData.length > 0 &&
                        <ROCChart
                            data={{
                                chartWidth: 350,
                                chartHeight: 250,
                                data: this.state.metricData
                            }}

                        ></ROCChart>}
                </div>
            </div >
        );
    }
}

export default Faq;