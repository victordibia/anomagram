/**
 * @license
 * Copyright 2019 Victor Dibia. https://github.com/victordibia
 * Anomagram - Anomagram: Anomaly Detection with Autoencoders in the Browser.
 * Licensed under the MIT License (the "License"); 
 * =============================================================================
 */

// load and return ecg data used to train model

const getEcgData = function () {
    let ecgTrain = require("./../../app/src/data/ecg/train_scaled.json")
    let testEcg = require("./../../app/src/data/ecg/test_scaled.json")
    let trainEcg = []

    // Only usse normal data (target == 1) for training.
    for (row in ecgTrain) {
        let val = ecgTrain[row]
        if (val.target + "" === 1 + "") {
            trainEcg.push(val)
        }
    }
    console.log("inliers", trainEcg.length, testEcg.length);
    return [trainEcg, testEcg]

}

module.exports = {
    getEcgData: getEcgData
}