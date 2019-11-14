import React, { Component } from "react";
import "./losschart.css"
import * as d3 from "d3"


class LossChart extends Component {

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
            this.refs["trainlabel"].innerHTML = this.props.data.data[this.props.data.data.length - 1].loss.toFixed(4)
            this.refs["validationlabel"].innerHTML = this.props.data.data[this.props.data.data.length - 1].val_loss.toFixed(4)
            // console.log(this.props.data.data[0].loss, this.refs["trainlabel"]);

        }
    }

    updateGraph(data) {
        let self = this

        // d3.select("div.losschart").selectAll(".lossline").remove();
        // d3.select("div.losschart").selectAll(".pointdot").remove();

        this.setupScalesAxes(data)
        let svg = d3.select("div.losschart").transition();

        svg.select(".losstraincolor")
            .duration(self.animationDuration)
            .attr("d", this.trainLine(data)); // 11. Calls the line generator 

        svg.select(".lossvalcolor")
            .duration(self.animationDuration)
            .attr("d", this.valLine(data)); // 11. Calls the line generator  

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
            .domain([0, n - 1]) // input
            .range([0, this.chartWidth]); // output


        this.yScale = d3.scaleLinear()
            .domain([d3.min(data, function (d) {
                // console.log(Math.min(d.loss, d.val_loss))
                return Math.min(d.loss, d.val_loss)
            }), d3.max(data, function (d) {
                return Math.max(d.loss, d.val_loss)
            })]) // input 
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

        svg.append("path")
            .datum(data) // 10. Binds data to the line 
            .attr("class", "lossline lossvalcolor") // Assign a class for styling  
            .attr("d", this.valLine); // 11. Calls the line generator 

    }

    drawGraph(data) {
        let self = this


        // data = [{ epoch: 1, loss: 0.9578104019165039, val_loss: 0.9471035003662109, traintime: 2.247 },
        // { epoch: 2, loss: 0.7673317790031433, val_loss: 0.8629779815673828, traintime: 0.146 },
        // { epoch: 3, loss: 0.749285876750946, val_loss: 0.8709790110588074, traintime: 0.152 },
        // { epoch: 4, loss: 0.7410370707511902, val_loss: 0.8575628995895386, traintime: 0.11 }]
        // data = [{ epoch: this.CumulativeSteps, loss: 0, val_loss: 0, traintime: 0 }]

        this.setupScalesAxes(data)

        this.trainLine = d3.line()
            .x(function (d, i) { return self.xScale(i); }) // set the x values for the line generator
            .y(function (d) { return self.yScale(d.loss); }) // set the y values for the line generator 
            .curve(d3.curveMonotoneX) // apply smoothing to the line

        this.valLine = d3.line()
            .x(function (d, i) { return self.xScale(i); }) // set the x values for the line generator
            .y(function (d) { return self.yScale(d.val_loss); }) // set the y values for the line generator 
            .curve(d3.curveMonotoneX) // apply smoothing to the line



        const svg = d3.select("div.losschart").append("svg")
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
            .call(customXAxis); // Create an axis component with d3.axisBottom

        // 4. Call the y axis in a group tag
        svg.append("g")
            .attr("class", "y axis")
            .call(customYAxis); // Create an axis component with d3.axisLeft

    }
    render() {
        // console.log(this.props.data.data[his.props.data.data].loss.toFixed(2));

        return (
            <div className="positionrelative  ">
                <div className="chartlegend p5 mediumdesc">
                    <div className="mb3">
                        <div className="legendcolorbox mr5  themeblue iblock"></div>
                        <div ref="trainlabel" className="iblock boldtext mr5">0.0</div>
                        <div className="iblock ">Train Loss</div>
                    </div>
                    <div>
                        <div className="legendcolorbox mr5 themeorange iblock"></div>
                        <div ref="validationlabel" className="iblock boldtext mr5">0.0</div>
                        <div className="iblock ">Validation Loss</div>
                    </div>
                </div>
                <div className="charttitle">  Training Loss Chart</div>

                <div className="losschart borders"> </div>
            </div>

        );
    }
}

export default LossChart;    