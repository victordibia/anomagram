import React, { Component } from "react";
import "./drawsignal.css"
import * as d3 from "d3"
// import * as _ from "lodash"
import { Button } from "carbon-components-react"

class DrawSignal extends Component {
    constructor(props) {
        super(props)

        this.state = {
            signalExtracted: false
        }


        this.axisOffset = 20
        this.chartWidth = this.props.width - this.axisOffset
        // this.chartWidth = 450
        this.chartHeight = this.props.height

        // console.log(this.props, this.chartHeight, this.chartWidth);

        this.smallChartWidth = 150
        this.smallChartHeight = 40

        this.prevX = 0
        this.currX = 0
        this.prevY = 0
        this.currY = 0
        this.dot_flag = false;

        this.strokeColor = "black"
        this.lineWidth = 2
        this.flag = false

        this.drawMap = new Map()
        this.signalCount = 140
        this.pointColors = []

        this.scaleRange = [2, -5]
        this.yaxisList = [2, 1, 0, -1, -2, -3, -4]
        this.xaxisList = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]

    }

    componentDidUpdate(prevProps, prevState) {
        // console.log("props changing", this.props);

        // console.log(prevProps.data.epoch, this.props.data.epoch)
        if ((this.props.width !== prevProps.width)) {
            // console.log("props updated");
            this.chartWidth = this.props.width - this.axisOffset
            this.setUpCanvasSize()
        }

    }

    componentDidMount() {


        this.refs.drawsignaloutcanvas.width = this.smallChartWidth
        this.refs.drawsignaloutcanvas.height = this.smallChartHeight
        this.smallChartContext = this.refs.drawsignaloutcanvas.getContext('2d')

        // console.log("Line component mounted")
        this.largeChartCanvas = this.refs.drawsignalcanvas
        this.setUpCanvasSize()
        this.largeChartContext = this.largeChartCanvas.getContext('2d')

        this.largeChartCanvas.addEventListener("mousedown", this.mouseDownEvent.bind(this))
        this.largeChartCanvas.addEventListener("mouseup", this.mouseUpEvent.bind(this))
        this.largeChartCanvas.addEventListener("mousemove", this.mouseMoveEvent.bind(this))
        this.largeChartCanvas.addEventListener("mouseout", this.mouseOutEvent.bind(this))

        this.largeChartCanvas.addEventListener("touchend", this.touchEndEvent.bind(this))
        this.largeChartCanvas.addEventListener("touchstart", this.touchStartEvent.bind(this), { passive: true })
        this.largeChartCanvas.addEventListener("touchmove", this.touchMoveEvent.bind(this), { passive: true })


        // Set up scales 
        this.xScale = d3.scaleLinear()
            .domain([0, this.signalCount - 1]) // input
            .range([0, this.smallChartWidth]); // output


        this.yScale = d3.scaleLinear()
            .domain([0, this.chartHeight]) // input 
            .range([0, this.smallChartHeight]); // output


        this.ynScale = d3.scaleLinear()
            .domain([0, this.chartHeight]) // input 
            .range(this.scaleRange); // output


        this.zeroArr = new Array(this.signalCount).fill(0);
        // this.zeroArr[0] = 2
        // this.zeroArr[this.signalCount - 1] = -5

    }

    setUpCanvasSize() {
        this.largeChartCanvas.width = this.chartWidth
        this.largeChartCanvas.height = this.chartHeight;
    }


    draw() {


        this.largeChartContext.beginPath();
        this.largeChartContext.moveTo(this.prevX, this.prevY);
        this.largeChartContext.lineTo(this.currX, this.currY);
        this.largeChartContext.strokeStyle = this.strokeColor;
        this.largeChartContext.lineWidth = this.lineWidth;
        this.largeChartContext.stroke();
        this.largeChartContext.closePath();
        // console.log(this.currX, this.currY);

        if (!this.drawMap.has(this.currX)) {
            this.drawMap.set(this.currX, this.currY)

        }

    }



    findxy(res, e) {
        if (res === 'down') {
            this.flag = true;
            this.dot_flag = true;
            if (this.dot_flag) {
                this.largeChartContext.beginPath();
                this.largeChartContext.fillStyle = this.strokeColor;
                this.largeChartContext.fillRect(this.currX, this.currY, 2, 2);
                this.largeChartContext.closePath();
                this.dot_flag = false;
            }
        }
        if (res === 'up') {
            this.flag = false;
            this.miniGraph()
        }
        if (res === "out") {
            this.flag = false;
        }
        if (res === 'move') {

        }
    }

    limitValues(x, min, max) {
        x = x < min ? min : x
        x = x > max ? max : x
        return x
    }

    setXYCoords(xPos, yPos) {
        // console.log(xPos, yPos);

        xPos = this.limitValues(xPos, 0, this.chartWidth)
        yPos = this.limitValues(yPos, 0, this.chartHeight)

        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = xPos
        this.currY = yPos
    }

    updateMove(xPos, yPos) {
        if (this.flag) {
            this.setXYCoords(xPos, yPos)
            this.draw();
        }
    }

    touchStartEvent(e) {
        console.log(e.changedTouches[0].pageY);
        this.setXYCoords(e.changedTouches[0].pageX - this.largeChartCanvas.offsetLeft, e.changedTouches[0].pageY - this.largeChartCanvas.offsetTop)
        this.findxy('down', e)
    }

    touchEndEvent(e) {
        this.findxy('up', e)
    }
    touchMoveEvent(e) {
        console.log(e.changedTouches.length);
        for (let i = 0; i < e.changedTouches.length; i++) {
            console.log("touchpoint[" + i + "].pageX = " + e.changedTouches[i].pageX);
            console.log("touchpoint[" + i + "].pageY = " + e.changedTouches[i].pageY);
            this.updateMove(e.changedTouches[i].pageX - this.largeChartCanvas.offsetLeft, e.changedTouches[i].pageY - this.largeChartCanvas.offsetTop)
        }
    }


    mouseDownEvent(e) {
        this.setXYCoords(e.pageX - this.largeChartCanvas.offsetLeft, e.pageY - this.largeChartCanvas.offsetTop)
        this.findxy('down', e)
    }
    mouseUpEvent(e) {
        this.findxy('up', e)
    }
    mouseMoveEvent(e) {
        this.updateMove(e.pageX - this.largeChartCanvas.offsetLeft, e.pageY - this.largeChartCanvas.offsetTop)
    }
    mouseOutEvent(e) {
        this.findxy('out', e)
    }



    componentWillUnmount() {
        this.largeChartCanvas.removeEventListener("mousedown", this.mouseDownEvent)
        this.largeChartCanvas.removeEventListener("mouseup", this.mouseUpEvent)
        this.largeChartCanvas.removeEventListener("mouseover", this.mouseMoveEvent)
        this.largeChartCanvas.removeEventListener("mouseout", this.mouseOutEvent)


        this.largeChartCanvas.removeEventListener("touchend", this.touchEndEvent)
        this.largeChartCanvas.removeEventListener("touchstart", this.touchStartEvent)
        this.largeChartCanvas.removeEventListener("touchmove", this.touchMoveEvent)


    }

    miniGraph() {
        if (this.drawMap.size > 0) {
            this.drawGraph(this.drawMap)

        }
    }

    clearDrawing() {

        this.largeChartContext.clearRect(0, 0, this.chartWidth, this.chartHeight);
        this.smallChartContext.clearRect(0, 0, this.smallChartWidth, this.smallChartHeight);

        this.drawMap = new Map()
        this.setState({ signalExtracted: false })

        this.props.updateCurrentSignal(this.zeroArr)
    }

    rangeMean(i, start, end, prevMean, data) {
        let sum = 0
        let count = 0
        for (let i = start; i <= end; i++) {
            if (data.get(i * 1)) {
                sum += data.get(i * 1)
                count++
            }
        }

        let rangeMean = sum / count
        this.pointColors[i] = "blue"
        if (count === 0) {
            rangeMean = prevMean
            this.pointColors[i] = "orange"
        }

        // console.log(start, end, sum, count, rangeMean);
        return rangeMean
    }
    drawGraph(data) {

        let canv = this.refs.drawsignaloutcanvas
        let context = canv.getContext("2d")

        this.smallChartContext.clearRect(0, 0, this.chartWidth, this.chartWidth);

        // context.translate(0, this.chartHeight);
        // context.scale(1, -1);

        let prevMean = data.values().next().value
        let curMean = 0
        let signalHolder = []
        let signalHolderScaled = []

        let step = (this.chartWidth / this.signalCount)
        for (let i = 0; i < this.signalCount; i++) {
            curMean = this.rangeMean(i, Math.floor(i * step), Math.floor(i * step + step), prevMean, data)
            signalHolder[i] = curMean
            signalHolderScaled[i] = this.ynScale(curMean)
            prevMean = curMean
        }
        this.setState({ signalExtracted: true })
        this.props.updateCurrentSignal(signalHolderScaled)


        // console.log(signalHolder);
        let prevX = 0, prevY = signalHolder[0]
        let currX = 0, currY = 0
        for (let i = 1; i < signalHolder.length; i++) {
            currX = i
            currY = signalHolder[i] || signalHolder[i - 1]
            context.beginPath();
            context.moveTo(this.xScale(prevX), this.yScale(prevY));
            context.lineTo(this.xScale(currX), this.yScale(currY));
            context.strokeStyle = this.pointColors[i]
            context.lineWidth = this.lineWidth;
            context.stroke();
            context.closePath();
            prevX = currX
            prevY = currY

        }
    }

    drawSample() {

    }


    render() {
        console.log();

        let xaxis = this.yaxisList.map((data) => {
            return (
                <div style={{ height: this.chartHeight / this.yaxisList.length }} key={"axisbox" + data} className="axiscell ">
                    <div className="axiscelltext mediumdesc">   {data}</div>
                </div>
            )
        })

        let yaxis = this.xaxisList.map((data) => {
            return (
                <div style={{ width: (this.props.width - this.axisOffset) / this.xaxisList.length }} key={"xaxisbox" + data} className="xaxiscell iblock ">
                    <div className="xaxiscelltext mediumdesc">   {data}</div>
                </div>
            )
        })
        return (
            // <div style={{ width: this.chartWidth + 25 }} className="mt2 border p10">
            <div className=" w100 " >

                <div className="mb10 flex">
                    <div className="pb10 flexfull  mediumdesc">
                        <div className="h100 pt5 lhmedium ">  Click and drag to draw a signal. Please draw within the box.</div>
                    </div>

                    <div className="iblock mr5">
                        <Button
                            size={"small"}
                            renderIcon={null}
                            onClick={this.clearDrawing.bind(this)}
                        > Clear Drawing </Button>
                    </div >
                    {/* <div className="iblock">
                            <Button
                                size={"field"}
                                renderIcon={null}
                                onClick={this.drawSample.bind(this)}
                            > Draw Sample </Button>
                        </div> */}
                </div>
                <div>
                    <div className=" w100 flex">
                        <div className=" axisbox mr5 iblock">
                            {xaxis}
                        </div>
                        <div className="flexfull  iblock">

                            <div className={"unclickable positionabsolute  smallchartbox " + (this.state.signalExtracted ? " " : " displaynone")} >
                                <canvas className="smallchart" ref="drawsignaloutcanvas" id="smallsignalcanvas"></canvas>
                                <div className={"smalldesc extractedsignal " + (this.state.signalExtracted ? " " : " displaynone")}> Extracted signal </div>
                                {/* <div className={"smalldesc pt5 " + (this.state.signalExtracted ? " " : " displaynone")}> draw signal </div> */}
                            </div>
                            <div style={{ height: this.chartHeight }} className="">

                                <canvas className="border iblock largechart" ref="drawsignalcanvas" id="drawsignalcanvas"></canvas>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: this.props.width - this.axisOffset + 5 }} className="horizontalaxis  ">{yaxis}</div>


                </div>
            </div>
        )
    }
}

export default DrawSignal