import React, { Component } from "react";
import {
    Header,
    HeaderName,
    HeaderNavigation,
    // Link,
    // HeaderMenuItem,
    HeaderGlobalBar,
    HeaderGlobalAction,
    SkipToContent,
} from 'carbon-components-react/lib/components/UIShell';
import {
    NavLink
} from "react-router-dom";

import "./header.css"
// import Notification20 from '@carbon/icons-react/lib/notification/20';
// import UserAvatar20 from '@carbon/icons-react/lib/user--avatar/20';
import AppSwitcher20 from '@carbon/icons-react/lib/app-switcher/20';

class AppHeader extends Component {
    constructor(props) {
        super(props)

        this.appName = "Anomagram"
        this.appDescription = "An interactive visualization for exploring deep learning models applied to the task of anomaly detection."


    }
    render() {
        return (
            <div>
                <Header aria-label={this.appDescription}>

                    <div className="container-fluid w100 headerrow pl10 ">

                        <div className="flex    h100">
                            <div className="h100   flex flexjustifycenter  ">
                                <img className="headericon" src="images/icon.png" alt="" />
                            </div>
                            <div className="h100   flex flexjustifycenter  mr10">
                                <div className="whitetext boldtext  iblock mr10">  {this.appName} </div>
                            </div>
                            <div className="h100   flex flexjustifycenter  navbarlinks ">
                                <NavLink exact to="/"> Introduction </NavLink>
                            </div>
                            <div className="h100   flex flexjustifycenter  navbarlinks mr10">
                                <NavLink exact to="/train"> Train a Model </NavLink>
                            </div>
                        </div>

                        {/* 
                        <div className="iblock " prefix="">
                            <div className="whitetext   iblock mr10">  {this.appName} </div>
                        </div>

                        <div className="h100 border  iblock aligntextcenter headericonbox  mr10">
                            <div tabIndex={0} className="navbarlinks "><NavLink exact to="/"> Introduction </NavLink></div>
                        </div> */}



                    </div>
                </Header>
                <div></div>
                <div className="headerboost">  </div>
            </div>

        );
    }
}

export default AppHeader;
