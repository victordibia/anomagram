import React, { Component } from 'react'
// import { loadJSONData, abbreviateString } from "../helperfunctions/HelperFunctions"
import "./linechart.css"
import * as d3 from "d3"

class SmallLineChart extends Component {
    constructor(props) {
        super(props)

        this.state = {
            chart: this.props.data
        }

        this.miniChartWidth = 40
        this.miniChartHeight = 35

    }

    componentDidMount() {
        // console.log("Line component mounted")
        let canvas = this.refs.canvas
        canvas.width = this.miniChartWidth
        canvas.height = this.miniChartHeight;
        this.drawGraph()

    }

    componentDidUpdate(prevProps, prevState) {


    }



    drawGraph() {
        this.chartMargin = { top: 0, right: 0, bottom: 0, left: 0 }
        this.chartWidth = this.miniChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.miniChartHeight - this.chartMargin.top - this.chartMargin.bottom;


        let data = this.state.chart.data.data
        var n = data.length;

        this.xScale = d3.scaleLinear()
            .domain([0, n - 1]) // input
            .range([0, this.chartWidth]); // output


        this.yScale = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)]) // input 
            .range([0, this.chartHeight]); // output

        // console.log(data);


        let canvas = this.refs.canvas,
            context = canvas.getContext('2d')



        context.translate(0, this.chartHeight);
        context.scale(1, -1);

        // context.fillStyle = '#f6f6f6';
        // context.fillRect(0, 0, this.chartWidth, this.chartHeight);

        var left = 0,
            prev_stat = data[0],
            move_left_by = this.chartWidth / data.length;

        for (let stat in data) {
            // console.log(data[stat], this.yScale(data[stat]));

            let the_stat = this.yScale(data[stat]);

            context.beginPath();
            context.moveTo(left, prev_stat);
            context.lineTo(left + move_left_by, the_stat);
            context.lineWidth = 1;
            context.lineCap = 'round';
            /*
                if(the_stat < stats[stat-1]) {
                    context.strokeStyle = '#c0392b';
                } else {
                    context.strokeStyle = '#3b3b3b';
                }
                */
            context.stroke();

            prev_stat = the_stat;
            left += move_left_by;

        }
    }


    render() {



        return (
            <div className="iblock  ">
                <canvas ref="canvas" id="canvas"></canvas>
            </div>
        )
    }
}

export default SmallLineChart