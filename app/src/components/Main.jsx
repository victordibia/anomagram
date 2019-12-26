/**
 * @license
 * Copyright 2019 Victor Dibia. https://github.com/victordibia
 * Anomagram - Anomagram: Anomaly Detection with Autoencoders in the Browser.
 * Licensed under the MIT License (the "License"); 
 * =============================================================================
 */


import React, { Component } from "react";
import {
    Route,
    HashRouter,

} from "react-router-dom";

// import { InlineNotification } from 'carbon-components-react';


import "./template.css"

// import Sidebar from "./Sidebar";
import AppHeader from "./header/AppHeader";
import Footer from "./footer/Footer";
import Viz from "./viz/Viz";
import Train from "./train/Train"
import ComposeModel from "./composemodel/ComposeModel"
import Faq from "./faq/Faq"

import { createBrowserHistory } from 'history';


// ReactGA.initialize("UA-131578973-1")
const history = createBrowserHistory({
    basename: "", // The base URL of the app (see below)
    forceRefresh: false, // Set true to force full page refreshes
    keyLength: 6, // The length of location.key
    // A function to use to confirm navigation with the user (see below)
    getUserConfirmation: (message, callback) => callback(window.confirm(message))
});
// history.listen(location => {
//     ReactGA.set({ page: location.hash })
//     ReactGA.pageview(location.hash)
//     // console.log(location.pathname, location.hash)
// })

let linkHolder = {}

function updateLh(location) {

    if (location.hash in linkHolder) {
        linkHolder[location.hash] = linkHolder[location.hash] + 1
    } else {
        linkHolder[location.hash] = 0
    }

}

history.listen(location => {
    updateLh(location)
});


class Main extends Component {

    constructor(props) {
        super(props);

        this.state = {
        }

        // console.log(window.location)
        updateLh(window.location)
    }

    componentDidMount() {
        // ReactGA.pageview(window.location.hash)
        // document.title = "Image Analysis Explorer | Explore Convolutional Neural Nets for Imagee Analysis";
    }






    render() {
        const Composer = (props) => {
            return (
                <ComposeModel
                    hiddenDims={[6, 5, 4, 3]}
                    latentDim={[4]}
                    isTraining={false}

                />
            );
        }

        return (
            <HashRouter>
                <AppHeader></AppHeader>

                <div className="container-fluid p10">
                    <Route exact path="/" component={Viz} />
                    <Route exact path="/train" component={Train} />
                    <Route exact path="/compose" component={Composer} />
                    <Route exact path="/faq" component={Faq} />

                    <div id="notificatiionbox" className="notificationtopright p5  ">

                    </div>
                </div>
                <div id="footer"> <Footer /> </div>
            </HashRouter>

        );
    }
}

export default Main;