import React, { Component } from 'react'
// import { loadJSONData, abbreviateString } from "../helperfunctions/HelperFunctions"
import "./linechart.css"
import * as d3 from "d3"


class LineChart extends Component {
    constructor(props) {
        super(props)

        this.state = {
            chart: this.props.data
        }



        this.minChartWidth = this.props.data.chartWidth
        this.minChartHeight = this.props.data.chartHeight




    }

    componentDidMount() {
        // console.log("Line component mounted")
        this.drawGraph()

    }

    componentDidUpdate(prevProps, prevState) {
        // console.log(this.props.data.chartdata.index, prevProps.data.chartdata.index);

        if (this.props.data.data.index !== prevProps.data.data.index) {
            this.setState({ chart: this.props.data.chart })
            // console.log("stuff hass changed", this.props.data.data);
            this.updateGraph(this.props.data)

        }

    }

    setupScalesAxes(data) {
        this.chartMargin = { top: 10, right: 5, bottom: 40, left: 20 }
        this.chartWidth = this.minChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.minChartHeight - this.chartMargin.top - this.chartMargin.bottom;

        var n = data.length;

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

    updateGraph(chart) {
        let self = this
        let data = chart.data.data
        // console.log(chart.color)
        this.setupScalesAxes(data)
        // Select the section we want to apply our changes to
        var svg = d3.select("div.linechartbox").transition();


        // Make the changes
        svg.select(".line")   // change the line
            .duration(750)
            .attr("stroke", chart.color)
            .attr("d", this.line(data));
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
        this.setupScalesAxes(this.state.chart.data.data)
        let width = this.chartWidth, height = this.chartHeight, margin = this.chartMargin


        // 7. d3's line generator
        this.line = d3.line()
            .x(function (d, i) { return self.xScale(i); }) // set the x values for the line generator
            .y(function (d) { return self.yScale(d); }) // set the y values for the line generator 
        // .curve(d3.curveMonotoneX) // apply smoothing to the line

        // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
        var dataset = this.state.chart.data.data


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
            .attr("stroke", this.state.chart.color)
            .attr("d", this.line); // 11. Calls the line generator 

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
            <div>

                <div className="linechartbox ">

                </div>

            </div>
        )
    }
}

export default LineChart