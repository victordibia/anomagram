import React, { Component } from 'react'
// import * as LeaderLine from 'leader-line'
import "./test.css"
import * as _ from 'lodash'
import { InlineLoading } from 'carbon-components-react';
import { loadJSONData } from "../helperfunctions/HelperFunctions"
import * as d3 from "d3"

class Test extends Component {
    constructor(props) {
        super(props)

        const modelDetails = require('../../assets/semsearch/details.json');
        this.datasetdictionary = require('../../assets/semsearch/datasetdictionary.json');



        this.state = {
            modelsList: modelDetails["models"],
            loadingCompare: true
        }

        this.layerScores = { data: [], maxindex: 0 }
        this.miniChartWidth = this.props.data.chartWidth
        this.miniChartHeight = this.props.data.chartHeight
    }



    genGraphData(data, layer, model) {
        let simArr = data.slice(1, this.props.data.topx + 1)
        let allDictionary = this.datasetdictionary.dictionary[this.props.data.dataset]
        let selectedCat = allDictionary[this.props.data.selectedimage]
        let [modelScore, totalScore] = [0, 0]
        for (var i in simArr) {
            if (selectedCat == allDictionary[simArr[i][0]]) {
                modelScore += (this.props.data.topx - i) / this.props.data.topx
            }
            totalScore += (this.props.data.topx - i) / this.props.data.topx
        }
        let weightedScore = ((modelScore / totalScore) * 100).toFixed(1)

        if (this.layerScores[model] == undefined) {
            this.layerScores[model] = { data: [], maxindex: 0 }
        }


        this.layerScores[model].data.push({ layer: layer.name, index: layer.layer_index, score: weightedScore * 1 })
        if (this.layerScores[model].data.length == this.props.data.numLayers) {
            this.layerScores[model].data = _.sortBy(this.layerScores[model].data, 'index');
            let maxVal = _.maxBy(this.layerScores[model].data, "score")

            this.layerScores[model].maxindex = this.layerScores[model].data.indexOf(maxVal)
            this.layerScores[model].maxvalue = maxVal.score
            this.layerScores[model].model = model
            // console.log("all data in", this.layerScores[model])

            this.drawChart(this.layerScores[model])

            // console.log("Total", Object.keys(this.layerScores).length);
            if (Object.keys(this.layerScores).length == this.props.data.numModels) {
                console.log("All models have been computed");
                this.setState({ loadingCompare: false })
            }
        }


    }


    compareModels() {
        let self = this
        // let selectedNum = Math.round(Math.random() * 200) 

        this.layerScores = {}

        this.state.modelsList.forEach((model, i) => {
            let layers = this.state.modelsList[i].layers
            layers.forEach(layer => {

                let similarityPath = process.env.PUBLIC_URL + "/assets/semsearch/similarity/" + self.props.data.dataset + "/" + model.name + "/" + self.props.data.metric + "/" + layer.name + ".json"
                let loadedJSON = loadJSONData(similarityPath)
                loadedJSON.then(function (data) {
                    if (data) {
                        // console.log(self.props.data.selectedimage + "")
                        self.genGraphData(data[self.props.data.selectedimage + ""], layer, model.name)
                    }
                })
            });
        });



    }

    drawChart(layerScores) {
        let self = this
        let data = layerScores.data
        // const data = [12, 5, 6, 6, 9, 10];
        // const data = [{ sales: 10, salesperson: "lenny" }, { sales: 8.4, salesperson: "harper" }, { sales: 4.5, salesperson: "crass" }, { sales: 2, salesperson: "lago" }];
        var margin = { top: 20, right: 20, bottom: 40, left: 50 },
            width = this.miniChartWidth - margin.left - margin.right,
            height = this.miniChartHeight - margin.top - margin.bottom;

        // set the ranges
        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
        var y = d3.scaleLinear()
            .range([height, 0]);

        // append the svg object to the body of the page
        // append a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = d3.select("div.d3").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
        x.domain(data.map(function (d) { return d.index; }));
        y.domain([0, d3.max(data, function (d) { return d.score; })]);

        // append the rectangles for the bar chart
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) { return x(d.index); })
            .attr("width", x.bandwidth())
            .attr("y", function (d) { return y(d.score); })
            .attr("height", function (d) { return height - y(d.score); })
            .attr("fill", function (d, i) {
                let color = i == layerScores.maxindex ? "green" : "#CDCDCD";
                // console.log(layerScores.maxindex, d.score, color)
                return color
            });

        // add the x Axis
        var xAxis = d3.axisBottom(x)
        // svg.append("g")
        //     .attr("transform", "translate(0," + height + ")")
        //     .call(d3.axisBottom(x));
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(customXAxis);


        let yAxis = d3.axisRight(y)
            .tickSize(this.miniChartWidth)
        // add the y Axis
        svg.append("g")
            .call(customYAxis);

        svg.append("text")
            .attr("x", self.miniChartWidth / 2 - 20)
            .attr("y", -8)
            .style("text-anchor", "middle")
            .attr("class", "boldtext")
            .text(layerScores.model);

        // xaxis label
        svg.append("text")
            .attr("x", self.miniChartWidth / 2 - 20)
            .attr("y", self.miniChartHeight - margin.bottom + 10)
            .style("text-anchor", "middle")
            .attr("class", "smalldesc")
            .text("layer index");

        //yaxis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (self.miniChartHeight / 2) + (margin.top + margin.bottom) / 2)
            .attr("dy", "2em")
            .style("text-anchor", "middle")
            .attr("class", "smalldesc")
            .text("Search score");


        function customYAxis(g) {
            g.call(yAxis);
            g.select(".domain").remove();
            g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "#777").attr("stroke-dasharray", "2,2");
            g.selectAll(".tick text").attr("x", -20).attr("y", -.01)
        }

        function customXAxis(g) {
            g.call(xAxis);
            g.select(".domain").remove();
        }
    }


    componentDidMount() {

        // this.drawLines()

        // console.log(document.querySelector('.leader-line').style.zIndex)
        this.compareModels()
        // this.drawChart()
    }

    render() {


        return (
            <div>
                test
                <button onClick={this.compareModels.bind(this)}> Launch Stuff</button>
                <div> Selected Image {this.props.data.selectedimage}</div>
                <div className="d3 ">
                    {this.state.loadingCompare &&
                        <InlineLoading
                            description="Comparing scores for all models .."
                        >

                        </InlineLoading>
                    }
                </div>
            </div >

        )
    }

}

export default Test;