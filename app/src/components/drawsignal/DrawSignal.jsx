import React, { Component } from "react";
import "./drawsignal.css"
import * as d3 from "d3"
import SmallLineChart from "../linechart/SmallLineChart"

class DrawSignal extends Component {
    constructor(props) {
        super(props)

        this.state = {
            chart: this.props.data
        }

        this.miniChartWidth = 500
        this.miniChartHeight = 300

    }

    componentDidMount() {
        // console.log("Line component mounted")
        let canvas = this.refs.drawsignalcanvas
        canvas.width = this.miniChartWidth
        canvas.height = this.miniChartHeight;
        this.drawGraph()

    }

    componentDidUpdate(prevProps, prevState) {


    }



    drawGraph() {
        let data = [
            -0.061890481,
            -1.1859918,
            -2.0182673,
            -2.6855688,
            -2.9749925,
            -3.0396642,
            -2.7666434,
            -2.5333227,
            -2.0501557,
            -1.3106435,
            -0.82608144,
            -0.71168537,
            -0.54312789,
            -0.13469772,
            0.12186513,
            0.25044693,
            0.26747326,
            0.21779432,
            0.24616302,
            0.24210975,
            0.27998442,
            0.31511054,
            0.36620019,
            0.25836747,
            0.17568993,
            0.33755869,
            0.27596128,
            0.2189405,
            0.36487228,
            0.33168507,
            0.27998442,
            0.20908104,
            0.19928085,
            0.29617314,
            0.2588112,
            0.19387987,
            0.17040347,
            0.16488879,
            0.17998841,
            0.15827841,
            0.15932269,
            0.14204956,
            0.12643053,
            0.088562874,
            0.088976922,
            0.10041036,
            0.05734738,
            0.0050239015,
            0.0053301039,
            0.018013956,
            0.018550672,
            0.026436487,
            -0.070003758,
            -0.045417453,
            -0.016435943,
            -0.051399179,
            0.016367302,
            0.032317201,
            -0.0035588462,
            0.049196946,
            0.11910211,
            0.11891977,
            0.17515655,
            0.27254393,
            0.27454949,
            0.31903674,
            0.37846321,
            0.38997826,
            0.45830557,
            0.48038365,
            0.4810873,
            0.50206874,
            0.50919153,
            0.58903633,
            0.56860992,
            0.49614817,
            0.55149626,
            0.51887183,
            0.51500433,
            0.56115307,
            0.54141817,
            0.56780458,
            0.45721676,
            0.49540375,
            0.58940252,
            0.57442013,
            0.58544048,
            0.54575849,
            0.52140759,
            0.54633513,
            0.58163875,
            0.59965381,
            0.62060391,
            0.63211174,
            0.66483089,
            0.64651348,
            0.65596413,
            0.65217653,
            0.65660513,
            0.7484241,
            0.70230048,
            0.6780928,
            0.71973819,
            0.72210399,
            0.74082294,
            0.7970055,
            0.83723486,
            0.84221025,
            0.81754814,
            0.82887226,
            0.88329307,
            0.85169415,
            0.78860358,
            0.81273705,
            0.90124477,
            0.8689718,
            0.7936592,
            0.67034655,
            0.55131086,
            0.58829718,
            0.62185932,
            0.61332035,
            0.44509414,
            0.3286933,
            0.27972438,
            0.10699168,
            0.17715795,
            0.30924934,
            0.064964986,
            -0.25738393,
            -0.66519913,
            -1.2774843,
            -1.8224328,
            -2.2827792,
            -3.0015251,
            -3.3925907,
            -3.7136869,
            -3.0372423,
            -2.3131423,
            -1.0276945
        ]
        this.chartMargin = { top: 0, right: 0, bottom: 0, left: 0 }
        this.chartWidth = this.miniChartWidth - this.chartMargin.left - this.chartMargin.right
        this.chartHeight = this.miniChartHeight - this.chartMargin.top - this.chartMargin.bottom;


        // let data = this.state.chart.data.data
        var n = data.length;
        console.log(data, n);


        this.xScale = d3.scaleLinear()
            .domain([0, n - 1]) // input
            .range([0, this.chartWidth]); // output


        this.yScale = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)]) // input 
            .range([0, this.chartHeight]); // output

        // console.log(data);


        let canvas = this.refs.drawsignalcanvas,
            context = canvas.getContext('2d')



        context.translate(0, this.chartHeight);
        context.scale(1, -1);

        context.strokeStyle = "green";
        // console.log(this.state.chart.color);


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
            context.lineWidth = 1.6;
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
            <div className="iblock mt2 border p10">
                <canvas ref="drawsignalcanvas" id="drawsignalcanvas"></canvas>
            </div>
        )
    }
}

export default DrawSignal