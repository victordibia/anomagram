import React, { Component } from "react";
import "./footer.css"

class Footer extends Component {
    render() {
        return (
            <div style={{ zIndex: 999000 }}>
                Made with <span className="redcolor">&#9829;</span> by <a href="https://twitter.com/vykthur" target="blank">Victor Dibia</a>.
            </div>
        );
    }
}

export default Footer;