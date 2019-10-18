
import React from "react";
import ReactDOM from "react-dom";
import Main from "./components/Main";
import * as serviceWorker from './serviceWorker';

import "./components/template.scss"
// import 'bootstrap/dist/css/bootstrap.css';

ReactDOM.render(
    <Main />,
    document.getElementById("root")
);

serviceWorker.register()