import React, { Component } from "react";
import "./train.css"
import * as tf from '@tensorflow/tfjs';
import { loadJSONData } from "../helperfunctions/HelperFunctions"
import * as d3 from "d3"


const _ = require('lodash');
class Train extends Component {

    async loadSavedModel() {
        let modelPath = "/webmodel/ecg/model.json"
        this.model = await tf.loadLayersModel(modelPath);
        console.log("model loaded");
        this.loadTestData()
    }

    componentDidMount() {
        // this.loadSavedModel()
        let data = [{ mse: 18.332530975341797, label: 0 },
        { mse: 19.321346282958984, label: 0 },
        { mse: 20.688814163208008, label: 1 },
        { mse: 20.891155242919922, label: 0 },
        { mse: 21.140560150146484, label: 1 },
        { mse: 21.535856246948242, label: 0 },
        { mse: 21.76593589782715, label: 1 },
        { mse: 20.688814163208008, label: 1 },
        { mse: 20.891155242919922, label: 0 },
        { mse: 21.140560150146484, label: 1 },
        { mse: 21.535856246948242, label: 0 },
        { mse: 21.76593589782715, label: 1 },
        { mse: 20.688814163208008, label: 1 },
        { mse: 20.891155242919922, label: 0 },
        { mse: 21.140560150146484, label: 1 },
        { mse: 21.535856246948242, label: 0 },
        { mse: 21.76593589782715, label: 1 },
        { mse: 22.02683448791504, label: 0 },
        { mse: 22.37567710876465, label: 0 }]


        this.minChartWidth = 450
        this.minChartHeight = 450
        this.drawGraph(data)
    }

    setupScalesAxes(data) {
        // console.log(data);

        let self = this

        this.chartMargin = { top: 10, right: 5, bottom: 40, left: 20 }
        this.chartWidth = this.minChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.minChartHeight - this.chartMargin.top - this.chartMargin.bottom;

        var n = data.length;



        this.xScale = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d.mse })).nice()
            .range([this.chartMargin.left, this.chartWidth - this.chartMargin.right])

        this.bins = d3.histogram()
            .value(function (d) { return d.mse; })
            .domain(this.xScale.domain())
            .thresholds(this.xScale.ticks(10))
            (data)

        // this.xScale = d3.scaleLinear()
        //     .domain([0, n - 1]) // input
        //     .range([0, this.chartWidth]); // output

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(self.bins, d => d.length)]).nice()
            .range([this.chartHeight - this.chartMargin.bottom, this.chartMargin.top])

        // this.yScale = d3.scaleLinear()
        //     .domain([d3.min(data, function (d) { return d.mse }), d3.max(data, function (d) { return d.mse })]) // input 
        //     .range([this.chartHeight, 0]); // output 

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


    drawGraph(data) {
        let self = this
        this.setupScalesAxes(data)
        let width = this.chartWidth, height = this.chartHeight, margin = this.chartMargin


        // // 7. d3's line generator
        // this.line = d3.line()
        //     .x(function (d, i) { return self.xScale(i); }) // set the x values for the line generator
        //     .y(function (d) { return self.yScale(d.mse); }) // set the y values for the line generator 
        // // .curve(d3.curveMonotoneX) // apply smoothing to the line

        // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
        // var dataset = data


        // d3.range(n).map(function (d) { return { "y": d3.randomUniform(1)() } })

        function customYAxis(g) {
            g.call(self.yAxis);
            g.select(".domain").remove();
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


        svg.append("g")
            .attr("fill", "steelblue")
            .selectAll("rect")
            .data(self.bins)
            .join("rect")
            .attr("x", d => self.xScale(d.x0) + 1)
            .attr("transform", function (d) {
                return "translate(" + self.xScale(d.x0) + "," + self.yScale(d.length) + ")";
            })
            .attr("width", d => Math.max(0, self.xScale(d.x1) - self.xScale(d.x0) - 1))
            // .attr("y", d => {
            //     console.log(self.yScale(d));
            //     self.yScale(d.length)
            // })

            .attr("height", d => {
                return self.yScale(0) - self.yScale(d.length)
            });
        // 3. Call the x axis in a group tag
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(customXAxis); // Create an axis component with d3.axisBottom

        // 4. Call the y axis in a group tag
        svg.append("g")
            .attr("class", "y axis")
            .call(customYAxis); // Create an axis component with d3.axisLeft






    }


    loadTestData() {
        let self = this
        let ecgDataPath = "data/ecg/test_small_scaled.json"

        loadJSONData(ecgDataPath).then(testEcg => {
            const xsTest = tf.tensor2d(testEcg.map(item => item.data
            ), [testEcg.length, testEcg[0].data.length])

            let yTest = testEcg.map(item => item.target + "" === 1 + "" ? 0 : 1)

            let preds = this.model.predict(xsTest)
            console.log(xsTest.shape, preds.shape)
            let mse = tf.sub(preds, xsTest).square().mean(1).mul(1000) //tf.losses.meanSquaredError(preds, xsTest)
            let out_hold = []
            mse.array().then(array => {
                array.forEach((element, i) => {
                    // console.log({ "mse": element, "label": yTest[i] });
                    out_hold.push({ "mse": element, "label": yTest[i] })
                    // console.log(out_hold.length)
                });
                out_hold = _.sortBy(out_hold, 'mse');
                console.log(out_hold);
                self.drawGraph(out_hold)
            });


        })
    }

    createHistogram() {

    }
    render() {
        return (
            <div>
                Train a model
                <div className="linechartbox"></div>
            </div>
        );
    }
}

export default Train;