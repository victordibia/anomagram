import React, { Component } from "react";
import "./histogram.css"
import * as d3 from "d3"

class HistogramChart extends Component {

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

        // console.log(this.props.data); 
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.data.epoch !== this.props.data.epoch) {
            // console.log("props updated");
            this.updateGraph(this.props.data.data)
        }

    }


    setupScalesAxes(data) {
        // console.log(data);

        let self = this

        this.chartMargin = { top: 10, right: 5, bottom: 40, left: 20 }
        this.chartWidth = this.minChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.minChartHeight - this.chartMargin.top - this.chartMargin.bottom;



        this.xScale = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d.mse })).nice()
            .range([this.chartMargin.left, this.chartWidth - this.chartMargin.right])

        // All Bins
        this.bins = d3.histogram()
            .value(function (d) { return d.mse })
            .domain(this.xScale.domain())
            .thresholds(this.xScale.ticks(self.numTicks))(data)

        // Normal Bins
        this.binNorm = d3.histogram()
            .value(function (d) {
                if (d.label + "" === "0") {
                    return d.mse
                };
            })
            .domain(this.xScale.domain())
            .thresholds(this.xScale.ticks(self.numTicks))(data)

        // Abnormal Bins
        this.binsAnorm = d3.histogram()
            .value(function (d) {
                if (d.label + "" === "1") {
                    return d.mse
                };
            })
            .domain(this.xScale.domain())
            .thresholds(this.xScale.ticks(self.numTicks))(data)

        // this.xScale = d3.scaleLinear()
        //     .domain([0, n - 1]) // input
        //     .range([0, this.chartWidth]); // output

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(self.bins, d => d.length)]).nice()
            .range([this.chartHeight - this.chartMargin.bottom, this.chartMargin.top])

        this.xAxis = d3.axisBottom(this.xScale)
        this.yAxis = d3.axisRight(this.yScale)
            .tickSize(this.minChartWidth)



    }

    updateGraph(data) {
        let self = this
        // console.log(data[0]);


        this.setupScalesAxes(data)

        let svg = d3.select("div.histogramchart") //.transition();
        // console.log(svg);

        // // Abnormal Bins
        svg.select(".normcolor")
            .selectAll("rect")
            .data(self.binNorm)
            .join("rect")
            .attr("x", d => self.xScale(d.x0) + 1)
            .attr("width", d => Math.max(0, self.xScale(d.x1) - self.xScale(d.x0) - 1))
            .attr("y", d => self.yScale(d.length))
            .attr("height", d => self.yScale(0) - self.yScale(d.length))
        // .transition();

        svg.select(".anormcolor")
            .selectAll("rect")
            .data(self.binsAnorm)
            .join("rect")
            .attr("x", d => self.xScale(d.x0) + 1)
            .attr("width", d => Math.max(0, self.xScale(d.x1) - self.xScale(d.x0) - 1))
            .attr("y", d => self.yScale(d.length))
            .attr("height", d => self.yScale(0) - self.yScale(d.length))

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

        svg.select(".y.axis")
            .call(customYAxis);

        svg.select(".x.axis")
            .call(customXAxis);


    }


    drawGraph(data) {
        let self = this
        this.setupScalesAxes(data)
        // console.log(data[0]);

        const svg = d3.select("div.histogramchart").append("svg")
            .attr("width", this.chartWidth + this.chartMargin.left + this.chartMargin.right)
            .attr("height", this.chartHeight + this.chartMargin.top + this.chartMargin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.chartMargin.left + "," + this.chartMargin.top + ")");


        svg.append("g")
            .attr("class", "normcolor")
            .selectAll("rect")
            .data(self.binNorm)
            .join("rect")
            .attr("x", d => self.xScale(d.x0) + 1)
            .attr("width", d => Math.max(0, self.xScale(d.x1) - self.xScale(d.x0) - 1))
            .attr("y", d => self.yScale(d.length))
            .attr("height", d => self.yScale(0) - self.yScale(d.length));

        svg.append("g")
            .attr("class", "anormcolor")
            .selectAll("rect")
            .data(self.binsAnorm)
            .join("rect")
            .attr("x", d => self.xScale(d.x0) + 1)
            .attr("width", d => Math.max(0, self.xScale(d.x1) - self.xScale(d.x0) - 1))
            .attr("y", d => self.yScale(d.length))
            .attr("height", d => self.yScale(0) - self.yScale(d.length));

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
            <div className="positionrelative ">
                <div className="chartlegend p5 mediumdesc">
                    <div className="mb3"> <div className="legendcolorbox mr5  themeblue iblock"></div> Normal </div>
                    <div> <div className="legendcolorbox mr5 themeorange iblock"></div> Abnormal </div>
                </div>
                Histogram of Mean Square Error
                <div className="histogramchart"></div>
            </div>
        );
    }
}

export default HistogramChart;