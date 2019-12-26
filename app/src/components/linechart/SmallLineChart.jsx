import React, { Component } from 'react'
import "./linechart.css"

class SmallLineChart extends Component {
    constructor(props) {
        super(props)

        this.state = {
            chart: this.props.data
        }

        this.xScale = this.props.data.xScale
        this.yScale = this.props.data.yScale
    }

    componentDidMount() {
        let canvas = this.refs.smalllinecanvas
        canvas.width = this.props.data.chartWidth
        canvas.height = this.props.data.chartHeight
        this.drawGraph()
    }

    componentDidUpdate(prevProps, prevState) {


    }
    drawGraph() {

        let data = this.state.chart.data.data

        let canvas = this.refs.smalllinecanvas,
            context = canvas.getContext('2d')



        context.translate(0, this.props.data.chartHeight);
        context.scale(1, -1);

        context.strokeStyle = this.state.chart.color;

        var left = 0,
            prev_stat = data[0],
            move_left_by = this.props.data.chartWidth / data.length;

        for (let stat in data) {

            let the_stat = this.yScale(data[stat]);

            context.beginPath();
            context.moveTo(left, prev_stat);
            context.lineTo(left + move_left_by, the_stat);
            context.lineWidth = 1.6;
            context.lineCap = 'round';

            context.stroke();

            prev_stat = the_stat;
            left += move_left_by;

        }
    }

    render() {

        return (
            <canvas ref="smalllinecanvas" ></canvas>
        )
    }
}

export default SmallLineChart