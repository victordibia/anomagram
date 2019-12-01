import React, { Component } from "react";
import "./drawsignal.css"
import * as d3 from "d3"
import SmallLineChart from "../linechart/SmallLineChart"
import * as _ from "lodash"

class DrawSignal extends Component {
    constructor(props) {
        super(props)

        this.state = {
            chart: this.props.data,
            rows: 30,
            columns: 140,
            chartWidth: 600,
            chartHeight: 300,
        }

        this.miniChartWidth = 500
        this.miniChartHeight = 300

        this.prevX = 0
        this.currX = 0
        this.prevY = 0
        this.currY = 0
        this.dot_flag = false;

        this.strokeColor = "black"
        this.lineWidth = 2
        this.flag = false

        this.drawMap = new Map()

    }

    componentDidMount() {

        this.refs.drawsignaloutcanvas.width = this.miniChartWidth
        this.refs.drawsignaloutcanvas.height = this.miniChartHeight
        // console.log("Line component mounted")
        this.canvas = this.refs.drawsignalcanvas
        this.canvas.width = this.miniChartWidth
        this.canvas.height = this.miniChartHeight;
        this.context = this.canvas.getContext('2d')

        this.canvas.addEventListener("mousedown", this.mouseDownEvent.bind(this))
        this.canvas.addEventListener("mouseup", this.mouseUpEvent.bind(this))
        this.canvas.addEventListener("mousemove", this.mouseMoveEvent.bind(this))
        this.canvas.addEventListener("mouseout", this.mouseOutEvent.bind(this))

    }

    draw() {
        this.context.beginPath();
        this.context.moveTo(this.prevX, this.prevY);
        this.context.lineTo(this.currX, this.currY);
        this.context.strokeStyle = this.strokeColor;
        this.context.lineWidth = this.lineWidth;
        this.context.stroke();
        this.context.closePath();
        // console.log(this.currX, this.currY);

        if (!this.drawMap.has(this.currX)) {
            this.drawMap.set(this.currX, this.currY)
        }

    }

    clearDrawing() {
        console.log(this.drawMap.size);
        this.drawMap = new Map()

        this.context.clearRect(0, 0, this.miniChartWidth, this.miniChartWidth);
    }

    findxy(res, e) {
        if (res == 'down') {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = e.clientX - this.canvas.offsetLeft;
            this.currY = e.clientY - this.canvas.offsetTop;

            this.flag = true;
            this.dot_flag = true;
            if (this.dot_flag) {
                this.context.beginPath();
                this.context.fillStyle = this.strokeColor;
                this.context.fillRect(this.currX, this.currY, 2, 2);
                this.context.closePath();
                this.dot_flag = false;
            }
        }
        if (res == 'up' || res == "out") {
            this.flag = false;
        }
        if (res == 'move') {
            if (this.flag) {
                this.prevX = this.currX;
                this.prevY = this.currY;
                this.currX = e.clientX - this.canvas.offsetLeft;
                this.currY = e.clientY - this.canvas.offsetTop;
                this.draw();
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {


    }

    mouseDownEvent(e) {
        this.findxy('down', e)
    }
    mouseUpEvent(e) {
        this.findxy('up', e)
    }
    mouseMoveEvent(e) {
        this.findxy('move', e)
    }
    mouseOutEvent(e) {
        this.findxy('out', e)
    }


    componentWillUnmount() {
        this.canvas.removeEventListener("mousedown", this.mouseDownEvent)
        this.canvas.removeEventListener("mouseup", this.mouseUpEvent)
        this.canvas.removeEventListener("mouseover", this.mouseMoveEvent)
        this.canvas.removeEventListener("mouseout", this.mouseOutEvent)
    }



    drawGraph() {

    }


    render() {

        let gridWidth = this.state.chartWidth / this.state.columns
        let gridHeight = this.state.chartHeight / this.state.rows

        let grid = _.range(this.state.rows).map((row) => {
            let cols = _.range(this.state.columns).map((column) => {
                return (
                    <div style={{ width: gridWidth + "px", height: gridHeight + "px" }} className="gridcell iblock" key={"gridcolumns" + row + column}>

                    </div>
                )
            })

            return (
                <div style={{ height: gridHeight }} className="gridrow" key={"gridrow" + row}>
                    {cols}
                </div>
            )
        })

        return (
            <div className="iblock mt2 border p10">
                <div>
                    <canvas className="border iblock mr10" ref="drawsignalcanvas" id="drawsignalcanvas"></canvas>
                    <canvas className="border iblock" ref="drawsignaloutcanvas" id="drawsignalcanvas"></canvas>
                </div>
                <div> size {this.miniChartWidth + " - " + this.miniChartHeight}
                    <button className="" onClick={this.clearDrawing.bind(this)}> Clear Drawing </button>
                </div>
                <div>
                    Click and drag to draw a signal. Please draw within the box.
                </div>
            </div>
        )
    }
}

export default DrawSignal