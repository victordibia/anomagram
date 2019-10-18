import React, { Component } from "react";
import {
    Header,
    HeaderName,
    HeaderNavigation,
    //   HeaderMenuItem,
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

        this.appName = "Deep Anomaly Playground"
        this.appDescription = "An interactive visualization for exploring deep learning models applied to the task of anomaly detectiion."


    }
    render() {
        return (
            <div>
                <Header aria-label={this.appDescription}>
                    <SkipToContent />
                    <HeaderName prefix="">
                        {/* <div className="decornone "><NavLink exact to="/"> </NavLink></div> */}
                        <img className="headericon" src="images/icon.png" alt="" />
                        {this.appName}
                    </HeaderName>
                    <HeaderNavigation aria-label={this.appDescription}>
                        {/* <HeaderMenuItem element={Link} to="/" className="navbarlink "> Datasets </HeaderMenuItem> */}
                        {/* <HeaderMenuItem  element={Link} to="/models" className="navbarlink "> Models</HeaderMenuItem> */}
                        <div className="navbarlinks  "><NavLink exact to="/"> Action 1 </NavLink></div>
                        {/* <div className="navbarlinks "><NavLink to="/models"> Model Explorer </NavLink></div>
                        <div className="navbarlinks "><NavLink to="/faq"> FAQ </NavLink></div> */}
                        {/* <div className="navbarlinks "><NavLink to="/algebra"> Image Algebra </NavLink></div> */}
                        {/* <div className="navbarlinks "><NavLink to="/energy"> Energy Explorer </NavLink></div> */}
                    </HeaderNavigation>
                    <HeaderGlobalBar>
                        {/* <HeaderGlobalAction aria-label="Notifications">
                    <Notification20 />
                </HeaderGlobalAction>
                */}
                        {/* <HeaderGlobalAction aria-label="User Avatar">
                    <UserAvatar20 />
                </HeaderGlobalAction> */}
                        <HeaderGlobalAction aria-label="App Switcher">
                            <AppSwitcher20 />
                        </HeaderGlobalAction>
                    </HeaderGlobalBar>
                </Header>
                <div> <br /> <br />  <br />  <br /> </div>
            </div>

        );
    }
}

export default AppHeader;
