import React, { Component } from "react";
import "./scatterplot.css"
import * as d3 from "d3"


class ScatterPlot extends Component {
    constructor(props) {
        super(props)

        this.state = {
            chart: this.props.data
        }
        this.minChartWidth = this.props.data.chartWidth
        this.minChartHeight = this.props.data.chartHeight

        this.numTicks = 40
    }

    componentDidMount() {


        this.drawGraph(this.props.data.data)

        console.log(this.props.data);
    }
    setupScalesAxes(data) {
        // console.log(data);

        let self = this

        this.chartMargin = { top: 10, right: 5, bottom: 40, left: 20 }
        this.chartWidth = this.minChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.minChartHeight - this.chartMargin.top - this.chartMargin.bottom;


        this.xScale = d3.scaleLinear()
            .domain([d3.min(data, function (d) { return d.x }), d3.max(data, function (d) { return d.x })]) // input  
            .range([this.chartMargin.left, this.chartWidth - this.chartMargin.right])



        this.yScale = d3.scaleLinear()
            .domain([d3.min(data, function (d) { return d.y }), d3.max(data, function (d) { return d.y })]) // input  
            .range([this.chartHeight - this.chartMargin.bottom, this.chartMargin.top])

        this.xAxis = d3.axisBottom(this.xScale)
        this.yAxis = d3.axisRight(this.yScale)
            .tickSize(this.minChartWidth)



    }

    drawGraph(data) {
        let self = this
        this.setupScalesAxes(data)

        const svg = d3.select("div.scatterplotchart").append("svg")
            .attr("width", this.chartWidth + this.chartMargin.left + this.chartMargin.right)
            .attr("height", this.chartHeight + this.chartMargin.top + this.chartMargin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.chartMargin.left + "," + this.chartMargin.top + ")");


        svg.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return self.xScale(d.x); })
            .attr("cy", function (d) { return self.yScale(d.y); })
            .attr("r", 2.5)
            .attr("class", d => {
                if (d.label + "" === "0") {
                    return "normcolor"
                } else {
                    return "anormcolor"
                }
            })


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
        // 3. Call the x axis in a group tag
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (self.chartHeight - self.chartMargin.top - 20) + ")")
            .call(customXAxis); // Create an axis component with d3.axisBottom

        // 4. Call the y axis in a group tag
        svg.append("g")
            .attr("class", "y axis")
            .call(customYAxis); // Create an axis component with d3.axisLeft

    }
    render() {
        return (
            <div>
                VAE Dimension ScatterPlot
                 <div className="scatterplotchart"> </div>
            </div>

        );
    }
}

export default ScatterPlot;