import React, { Component } from 'react'
// import { loadJSONData, abbreviateString } from "../helperfunctions/HelperFunctions"
import "./linechart.css"
import * as d3 from "d3"


class LineChart extends Component {
    constructor(props) {
        super(props)

        this.state = {
            data: this.props.data,
            predictedData: this.props.predictedData,
            color: this.props.color
        }



        this.minChartWidth = this.props.width
        this.minChartHeight = this.props.height

        // console.log(this.props);

        this.backgrounOpacity = "63"


    }

    componentDidMount() {
        // console.log("Line component mounted")
        this.drawGraph()

    }

    componentDidUpdate(prevProps, prevState) {
        // console.log(this.props.index, prevProps.index);

        if (this.props.lastUpdated !== prevProps.lastUpdated) {
            this.setState({ data: this.props.data })
            // console.log("stuff hass changed", this.props.data);
            this.updateGraph(this.props.data, this.props.predictedData)

        }

    }

    setupScalesAxes(data) {
        this.chartMargin = { top: 10, right: 5, bottom: 40, left: 20 }
        this.chartWidth = this.minChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.minChartHeight - this.chartMargin.top - this.chartMargin.bottom;

        // consolse.log(data);

        var n = data.length / 2;

        this.xScale = d3.scaleLinear()
            .domain([0, n - 1]) // input
            .range([0, this.chartWidth]); // output


        this.yScale = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)]) // input 
            .range([this.chartHeight, 0]); // output 

        this.xAxis = d3.axisBottom(this.xScale)
        this.yAxis = d3.axisRight(this.yScale)
            .tickSize(this.minChartWidth)

    }

    updateGraph(data, predictedData) {
        let self = this
        // console.log(data)
        this.setupScalesAxes(data.concat(predictedData))
        // Select the section we want to apply our changes to
        var svg = d3.select("div.linechartbox").transition();


        let jointData = []
        for (let i = 0; i < this.props.data.length; i++) {
            jointData.push({ data: this.props.data[i], predictedData: this.props.predictedData[i] })
        }

        // Make the changes
        svg.select(".line")   // change the line
            .duration(750)
            .attr("stroke", this.state.color)
            .attr("d", this.line(data));

        // Make the changes to predicted line
        svg.select(".predictedline")   // change the line
            .duration(750)
            .attr("stroke", this.props.predictedColor)
            .attr("d", this.line(predictedData));

        svg.select(".msearea")
            .duration(750)
            .attr("fill", this.props.predictedColor + this.backgrounOpacity)
            .attr("stroke", "none")
            .attr("d", this.msearea(jointData)
            );

        function customYAxis(g) {
            g.call(self.yAxis);
            svg.select(".domain").remove();
            g.selectAll(".tick line").attr("stroke", "rgba(172, 172, 172, 0.74)").attr("stroke-dasharray", "2,2");
            g.selectAll(".tick text").attr("x", -20).attr("y", -.01)
        }
        svg.select(".y.axis")
            .call(customYAxis).duration(5);
    }


    drawGraph() {
        let self = this
        this.setupScalesAxes(this.state.data.concat(this.state.predictedData))
        let width = this.chartWidth, height = this.chartHeight, margin = this.chartMargin

        let jointData = []
        for (let i = 0; i < this.props.data.length; i++) {
            jointData.push({ data: this.props.data[i], predictedData: this.props.predictedData[i] })
        }

        // 7. d3's line generator
        this.line = d3.line()
            .x(function (d, i) { return self.xScale(i); }) // set the x values for the line generator
            .y(function (d) { return self.yScale(d); }) // set the y values for the line generator 
        // .curve(d3.curveMonotoneX) // apply smoothing to the line

        this.msearea = d3.area()
            .x(function (d, i) { return self.xScale(i); })
            .y0(function (d) { return self.yScale(Math.min(d.data, d.predictedData)) })
            .y1(function (d) { return self.yScale(Math.max(d.data, d.predictedData)) })

        // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
        var dataset = this.state.data

        // console.log(this.state);


        // d3.range(n).map(function (d) { return { "y": d3.randomUniform(1)() } })

        function customYAxis(g) {
            g.call(self.yAxis);
            // g.select(".domain").remove();
            g.selectAll(".tick line").attr("stroke", "rgba(172, 172, 172, 0.74)").attr("stroke-dasharray", "2,2");
            g.selectAll(".tick text").attr("x", -20).attr("y", -.01)
        }

        function customXAxis(g) {
            g.call(self.xAxis);
            g.select(".domain").remove();
            g.selectAll(".tick line").attr("x", 100)
            g.selectAll(".tick text").attr("y", 15)
        }

        // 1. Add the SVG to the page and employ #2
        var svg = d3.select("div.linechartbox").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



        // 3. Call the x axis in a group tag
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(customXAxis); // Create an axis component with d3.axisBottom

        // 4. Call the y axis in a group tag
        svg.append("g")
            .attr("class", "y axis")
            .call(customYAxis); // Create an axis component with d3.axisLeft

        // 9. Append the path, bind the data, and call the line generator 
        svg.append("path")
            .datum(dataset) // 10. Binds data to the line 
            .attr("class", "line") // Assign a class for styling 
            .attr("stroke", this.state.color)
            .attr("d", this.line); // 11. Calls the line generator 

        svg.append("path")
            .datum(this.state.predictedData) // 10. Binds data to the line 
            .attr("class", "predictedline") // Assign a class for styling 
            .attr("stroke", this.props.predictedColor)
            .attr("d", this.line); // 11. Calls the line generator 

        svg.append("path")
            .datum(jointData)
            .attr("class", "msearea") // Assign a class for styling 
            .attr("fill", this.props.predictedColor + this.backgrounOpacity)
            .attr("stroke", "none")
            .attr("d", this.msearea
            )

        // // 12. Appends a circle for each datapoint 
        // svg.selectAll(".dot")
        //     .data(dataset)
        //     .enter().append("circle") // Uses the enter().append() method
        //     .attr("class", "dot") // Assign a class for styling
        //     .attr("cx", function (d, i) { return xScale(i) })
        //     .attr("cy", function (d) { return yScale(d) })
        //     .attr("r", 5)
        //     .on("mouseover", function (a, b, c) {
        //         console.log(a)
        //         // this.attr('class', 'focus')
        //     })
    }


    render() {



        return (
            <div className="positionrelative mainchartbox ">
                <div className="chartlegend legendbottomrightmod p5 mediumdesc ">
                    <div className="mb3 ">
                        <div className="legendcolorbox mr5  themeblue iblock"></div>
                        <div ref="trainlabel" className="iblock boldtext mr5"> Input  </div>
                        <div className="iblock "> </div>
                    </div>
                    <div className="mb3 ">
                        <div style={{ backgroundColor: this.props.predictedColor }} className="legendcolorbox mr5 iblock"></div>
                        <div ref="validationlabel" className="iblock boldtext mr5"> Prediction</div>
                        <div className="iblock "></div>
                    </div>
                    <div >
                        <div style={{ backgroundColor: this.props.predictedColor + this.backgrounOpacity }} className="legendcolorbox mr5  iblock"></div>
                        <div ref="trainlabel" className="iblock boldtext mr5"> Error  </div>
                        <div className="iblock "> </div>
                    </div>
                </div>



                <div className="linechartbox ">

                </div>

            </div>
        )
    }
}

export default LineChart