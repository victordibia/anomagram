import React, { Component } from "react";
import "./rocchart.css"
import * as d3 from "d3"


class ROCChart extends Component {

    constructor(props) {
        super(props)

        this.state = {
            chart: this.props.data
        }
        this.minChartWidth = this.props.data.chartWidth
        this.minChartHeight = this.props.data.chartHeight

        this.numTicks = 40
        this.dotRadius = 3.5
    }

    componentDidMount() {
        this.drawGraph(this.props.data.data)
    }

    componentDidUpdate(prevProps, prevState) {
        if ((prevProps.data.epoch !== this.props.data.epoch) && this.props.data.data.length > 0) {
            // console.log("props updated");
            this.updateGraph(this.props.data.data)

        }
    }

    updateGraph(data) {
        let self = this

        // d3.select("div.ROCChart").selectAll(".lossline").remove();
        // d3.select("div.ROCChart").selectAll(".pointdot").remove();

        this.setupScalesAxes(data)
        let svg = d3.select("div.ROCChart").transition();

        svg.select(".losstraincolor")
            .duration(self.animationDuration)
            .attr("d", this.trainLine); // 11. Calls the line generator 

        svg.select(".lossvalcolor")
            .duration(self.animationDuration)
            .attr("d", this.valLine); // 11. Calls the line generator  

        function customYAxis(g) {
            g.call(self.yAxis);
            // g.select(".domain").remove();
            g.selectAll(".tick line").attr("stroke", "rgba(172, 172, 172, 0.74)").attr("stroke-dasharray", "2,2");
            g.selectAll(".tick text").attr("x", -30).attr("y", -.01)
        }

        function customXAxis(g) {
            g.call(self.xAxis);
            // g.select(".domain").remove();
            g.selectAll(".tick line").attr("x", 100)
            g.selectAll(".tick text").attr("y", 15)
        }

        svg.select(".y.axis")
            .call(customYAxis);

        svg.select(".x.axis")
            .call(customXAxis);

    }
    setupScalesAxes(data) {
        // console.log(data);

        // let self = this 
        this.chartMargin = { top: 10, right: 10, bottom: 40, left: 30 }
        this.chartWidth = this.minChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.minChartHeight - this.chartMargin.top - this.chartMargin.bottom;

        var n = data.length;

        this.xScale = d3.scaleLinear()
            .domain([d3.min(data, function (d) { return d.fpr }),
            d3.max(data, function (d) { return d.fpr })]) // input 
            .range([0, this.chartWidth]); // output


        this.yScale = d3.scaleLinear()
            .domain([d3.min(data, function (d) { return d.tpr }),
            d3.max(data, function (d) { return d.tpr })]) // input 
            .range([this.chartHeight, 0])

        this.xAxis = d3.axisBottom(this.xScale)
        this.yAxis = d3.axisRight(this.yScale)
            .tickSize(this.minChartWidth)
    }
    drawLines(svg, data) {


        svg.append("path")
            .datum(data) // 10. Binds data to the line 
            .attr("class", "lossline losstraincolor") // Assign a class for styling  
            .attr("d", this.trainLine); // 11. Calls the line generator 

    }

    drawGraph(data) {
        let self = this

        // data = [
        //     { "acc": 0.7, "threshold": 1.2428572177886963, "tp": 3, "tn": 4, "fp": 3, "fn": 0, "ton": 7, "top": 3, "tpr": 1, "fpr": 0.42857142857142855, "fnr": 0, "tnr": 0.5714285714285714 },
        //     { "acc": 0.5, "threshold": 1.2, "tp": 3, "tn": 2, "fp": 5, "fn": 0, "ton": 7, "top": 3, "tpr": 1, "fpr": 0.7142857142857143, "fnr": 0, "tnr": 0.2857142857142857 },
        //     { "acc": 1, "threshold": 1.3, "tp": 3, "tn": 7, "fp": 0, "fn": 0, "ton": 7, "top": 3, "tpr": 1, "fpr": 0, "fnr": 0, "tnr": 1 },
        //     { "acc": 0.7, "threshold": 1.9, "tp": 0, "tn": 7, "fp": 0, "fn": 3, "ton": 7, "top": 3, "tpr": 0, "fpr": 0, "fnr": 1, "tnr": 1 },
        //     { "acc": 0.8, "threshold": 1.25, "tp": 3, "tn": 5, "fp": 2, "fn": 0, "ton": 7, "top": 3, "tpr": 1, "fpr": 0.2857142857142857, "fnr": 0, "tnr": 0.7142857142857143 },
        //     { "acc": 0.8, "threshold": 1.8, "tp": 1, "tn": 7, "fp": 0, "fn": 2, "ton": 7, "top": 3, "tpr": 0.3333333333333333, "fpr": 0, "fnr": 0.6666666666666666, "tnr": 1 },
        //     { "acc": 0.9, "threshold": 1.75, "tp": 2, "tn": 7, "fp": 0, "fn": 1, "ton": 7, "top": 3, "tpr": 0.6666666666666666, "fpr": 0, "fnr": 0.3333333333333333, "tnr": 1 },
        //     { "acc": 0.6, "threshold": 1.2428570985794067, "tp": 3, "tn": 3, "fp": 4, "fn": 0, "ton": 7, "top": 3, "tpr": 1, "fpr": 0.5714285714285714, "fnr": 0, "tnr": 0.42857142857142855 }]


        this.setupScalesAxes(data)

        this.trainLine = d3.line()
            .x(function (d, i) { return self.xScale(d.fpr); }) // set the x values for the line generator
            .y(function (d) { return self.yScale(d.tpr); }) // set the y values for the line generator 
        // .curve(d3.curveMonotoneX) // apply smoothing to the line


        const svg = d3.select("div.ROCChart").append("svg")
            .attr("width", this.chartWidth + this.chartMargin.left + this.chartMargin.right)
            .attr("height", this.chartHeight + this.chartMargin.top + this.chartMargin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.chartMargin.left + "," + this.chartMargin.top + ")");

        this.drawLines(svg, data)

        function customYAxis(g) {
            g.call(self.yAxis);
            // g.select(".domain").remove();
            g.selectAll(".tick line").attr("stroke", "rgba(172, 172, 172, 0.74)").attr("stroke-dasharray", "2,2");
            g.selectAll(".tick text").attr("x", -20).attr("y", -.01)
        }

        function customXAxis(g) {
            g.call(self.xAxis);
            // g.select(".domain").remove();
            g.selectAll(".tick line").attr("x", 100)
            g.selectAll(".tick text").attr("y", 15)
        }
        // 3. Call the x axis in a group tag
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (self.chartHeight + 10) + ")")
            .call(customXAxis);
        // Create an axis component with d3.axisBottom

        // 4. Call the y axis in a group tag
        svg.append("g")
            .attr("class", "y axis")
            .call(customYAxis); // Create an axis component with d3.axisLeft

    }
    render() {
        // console.log(this.props.data.data[his.props.data.data].loss.toFixed(2));

        return (
            <div className="positionrelative mainchartbox  ">
                <div className="chartlegend p5 mediumdesc displaynone">
                    <div className="mb3 ">
                        <div className="legendcolorbox mr5  themeblue iblock"></div>
                        <div ref="trainlabel" className="iblock boldtext mr5">0.0</div>
                        <div className="iblock ">ROC Curve</div>
                    </div>
                    <div>
                        <div className="legendcolorbox mr5 themeorange iblock"></div>
                        <div ref="validationlabel" className="iblock boldtext mr5">0.0</div>
                        <div className="iblock ">Validation Loss</div>
                    </div>
                </div>
                <div className="charttitle">  ROC Curve Chart</div>

                <div className="ROCChart"> </div>
            </div>

        );
    }
}

export default ROCChart;    